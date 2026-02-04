export interface PatientOutcome {
  patientId: string;
  baselineSeizurePerMonth: number;
  latestSeizurePerMonth: number;
  zincSupplementation: boolean;
  baselineZincLevel?: number | null; // ベースライン時の血清亜鉛値
  hasZincDeficiency?: boolean; // 亜鉛欠乏（< 80μg/dL）
}

export interface ResponderResult {
  patientId: string;
  baselineSeizurePerMonth: number;
  latestSeizurePerMonth: number;
  zincSupplementation: boolean;
  baselineZincLevel?: number | null;
  hasZincDeficiency?: boolean;
  changeRate: number;
  isResponder: boolean;
}

export interface GroupStats {
  total: number;
  responders: number;
  rate: number | null;
  meanSeizureChange: number | null;
  medianSeizureChange: number | null;
}

export interface ResponderRateResult {
  overall: GroupStats;
  zincGroup: GroupStats; // 亜鉛補充あり
  controlGroup: GroupStats; // 亜鉛補充なし
  zincDeficientGroup: GroupStats; // 亜鉛欠乏あり（< 80）
  zincNormalGroup: GroupStats; // 亜鉛正常（>= 80）
  patientDetails: ResponderResult[];
}

function calculateGroupStats(results: ResponderResult[]): GroupStats {
  if (results.length === 0) {
    return { total: 0, responders: 0, rate: null, meanSeizureChange: null, medianSeizureChange: null };
  }

  const responders = results.filter((r) => r.isResponder).length;
  const changeRates = results.map((r) => r.changeRate * 100);
  const sorted = [...changeRates].sort((a, b) => a - b);
  const mean = changeRates.reduce((a, b) => a + b, 0) / changeRates.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  return {
    total: results.length,
    responders,
    rate: responders / results.length,
    meanSeizureChange: mean,
    medianSeizureChange: median,
  };
}

export function calculate50PercentResponderRate(
  patients: PatientOutcome[]
): ResponderRateResult {
  const results: ResponderResult[] = patients.map((p) => {
    const changeRate =
      p.baselineSeizurePerMonth > 0
        ? (p.baselineSeizurePerMonth - p.latestSeizurePerMonth) / p.baselineSeizurePerMonth
        : 0;
    return {
      ...p,
      changeRate,
      isResponder: changeRate >= 0.5,
    };
  });

  const zincGroup = results.filter((r) => r.zincSupplementation);
  const controlGroup = results.filter((r) => !r.zincSupplementation);
  const zincDeficientGroup = results.filter((r) => r.hasZincDeficiency === true);
  const zincNormalGroup = results.filter((r) => r.hasZincDeficiency === false);

  return {
    overall: calculateGroupStats(results),
    zincGroup: calculateGroupStats(zincGroup),
    controlGroup: calculateGroupStats(controlGroup),
    zincDeficientGroup: calculateGroupStats(zincDeficientGroup),
    zincNormalGroup: calculateGroupStats(zincNormalGroup),
    patientDetails: results,
  };
}

// Mann-Whitney U検定（Wilcoxon順位和検定）の近似計算
export function calculateMannWhitneyU(group1: number[], group2: number[]): {
  u: number;
  z: number;
  p: number;
} | null {
  if (group1.length < 2 || group2.length < 2) return null;

  const n1 = group1.length;
  const n2 = group2.length;

  // 全データを結合してランク付け
  const combined = [
    ...group1.map((v) => ({ value: v, group: 1 })),
    ...group2.map((v) => ({ value: v, group: 2 })),
  ].sort((a, b) => a.value - b.value);

  // ランクを割り当て（同順位は平均ランク）
  const ranks: number[] = [];
  let i = 0;
  while (i < combined.length) {
    let j = i;
    while (j < combined.length && combined[j].value === combined[i].value) {
      j++;
    }
    const avgRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[k] = avgRank;
    }
    i = j;
  }

  // グループ1のランク和を計算
  let R1 = 0;
  for (let k = 0; k < combined.length; k++) {
    if (combined[k].group === 1) {
      R1 += ranks[k];
    }
  }

  // U統計量
  const U1 = R1 - (n1 * (n1 + 1)) / 2;
  const U2 = n1 * n2 - U1;
  const U = Math.min(U1, U2);

  // 正規近似
  const meanU = (n1 * n2) / 2;
  const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = (U - meanU) / stdU;

  // p値の近似計算（両側検定）
  const p = 2 * (1 - normalCDF(Math.abs(z)));

  return { u: U, z, p };
}

// 標準正規分布の累積分布関数（近似）
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

export interface SeizureChangeStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
}

export function calculateSeizureChangeStats(
  patients: PatientOutcome[]
): SeizureChangeStats | null {
  if (patients.length === 0) return null;

  const changeRates = patients.map((p) =>
    p.baselineSeizurePerMonth > 0
      ? ((p.baselineSeizurePerMonth - p.latestSeizurePerMonth) / p.baselineSeizurePerMonth) * 100
      : 0
  );

  const sorted = [...changeRates].sort((a, b) => a - b);
  const mean = changeRates.reduce((a, b) => a + b, 0) / changeRates.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const squaredDiffs = changeRates.map((rate) => Math.pow(rate - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / changeRates.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    mean,
    median,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    standardDeviation,
  };
}
