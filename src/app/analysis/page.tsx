'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientsByFacility, getSeizureLogs, getLabResults } from '@/lib/firebase/firestore';
import {
  calculate50PercentResponderRate,
  calculateSeizureChangeStats,
  calculateMannWhitneyU,
  PatientOutcome,
} from '@/lib/analysis/responderRate';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Patient, SeizureLog, LabResult } from '@/types';

// Dynamic import for recharts to avoid SSR issues
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b'];

export default function AnalysisPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientOutcomes, setPatientOutcomes] = useState<PatientOutcome[]>([]);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    }
  }, [authLoading, userData, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!userData) return;

      try {
        const patientsData = await getPatientsByFacility(userData.facilityId);
        setPatients(patientsData);

        // Load seizure logs and lab results for each patient
        const outcomes: PatientOutcome[] = [];

        for (const patient of patientsData) {
          const [seizureLogs, labResults] = await Promise.all([
            getSeizureLogs(patient.id),
            getLabResults(patient.id),
          ]);

          if (seizureLogs.length >= 2) {
            const sortedLogs = [...seizureLogs].sort(
              (a, b) => `${a.year}-${a.month}`.localeCompare(`${b.year}-${b.month}`)
            );
            const baseline = sortedLogs[0];
            const latest = sortedLogs[sortedLogs.length - 1];

            // Check if patient has zinc supplementation
            const hasZincSupplementation = labResults.some((l) => l.zincSupplementation);

            // Get baseline zinc level (first lab result with zinc value)
            const sortedLabs = [...labResults].sort((a, b) =>
              a.date.toMillis() - b.date.toMillis()
            );
            const baselineLab = sortedLabs.find((l) => l.serumZinc !== null);
            const baselineZincLevel = baselineLab?.serumZinc ?? null;
            const hasZincDeficiency = baselineZincLevel !== null ? baselineZincLevel < 80 : undefined;

            outcomes.push({
              patientId: patient.id,
              baselineSeizurePerMonth: baseline.seizureCount,
              latestSeizurePerMonth: latest.seizureCount,
              zincSupplementation: hasZincSupplementation,
              baselineZincLevel,
              hasZincDeficiency,
            });
          }
        }

        setPatientOutcomes(outcomes);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      loadData();
    }
  }, [userData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const responderResult = calculate50PercentResponderRate(patientOutcomes);
  const seizureStats = calculateSeizureChangeStats(patientOutcomes);

  // 統計検定：亜鉛補充群 vs 対照群
  const zincGroupChanges = responderResult.patientDetails
    .filter((p) => p.zincSupplementation)
    .map((p) => p.changeRate * 100);
  const controlGroupChanges = responderResult.patientDetails
    .filter((p) => !p.zincSupplementation)
    .map((p) => p.changeRate * 100);
  const supplementationTest = calculateMannWhitneyU(zincGroupChanges, controlGroupChanges);

  // 統計検定：亜鉛欠乏群 vs 正常群
  const deficientGroupChanges = responderResult.patientDetails
    .filter((p) => p.hasZincDeficiency === true)
    .map((p) => p.changeRate * 100);
  const normalGroupChanges = responderResult.patientDetails
    .filter((p) => p.hasZincDeficiency === false)
    .map((p) => p.changeRate * 100);
  const deficiencyTest = calculateMannWhitneyU(deficientGroupChanges, normalGroupChanges);

  const responderChartData = [
    {
      name: '全体',
      responders: responderResult.overall.responders,
      nonResponders: responderResult.overall.total - responderResult.overall.responders,
    },
    {
      name: '亜鉛補充群',
      responders: responderResult.zincGroup.responders,
      nonResponders: responderResult.zincGroup.total - responderResult.zincGroup.responders,
    },
    {
      name: '対照群',
      responders: responderResult.controlGroup.responders,
      nonResponders: responderResult.controlGroup.total - responderResult.controlGroup.responders,
    },
  ];

  const deficiencyChartData = [
    {
      name: '亜鉛欠乏群',
      responders: responderResult.zincDeficientGroup.responders,
      nonResponders: responderResult.zincDeficientGroup.total - responderResult.zincDeficientGroup.responders,
    },
    {
      name: '亜鉛正常群',
      responders: responderResult.zincNormalGroup.responders,
      nonResponders: responderResult.zincNormalGroup.total - responderResult.zincNormalGroup.responders,
    },
  ];

  const pieData = [
    { name: 'Responders', value: responderResult.overall.responders },
    { name: 'Non-responders', value: responderResult.overall.total - responderResult.overall.responders },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">データ分析</h1>
          <p className="text-gray-600 mt-2">
            登録患者のデータを分析します
          </p>
        </div>

        {/* サマリーカード */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>解析対象患者</CardDescription>
              <CardTitle className="text-4xl">{patientOutcomes.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                全登録患者: {patients.length}名
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>50% Responder Rate (全体)</CardDescription>
              <CardTitle className="text-4xl text-blue-600">
                {responderResult.overall.rate !== null
                  ? `${(responderResult.overall.rate * 100).toFixed(1)}%`
                  : '-'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {responderResult.overall.responders}/{responderResult.overall.total}名
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>亜鉛補充群</CardDescription>
              <CardTitle className="text-4xl text-green-600">
                {responderResult.zincGroup.rate !== null
                  ? `${(responderResult.zincGroup.rate * 100).toFixed(1)}%`
                  : '-'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {responderResult.zincGroup.responders}/{responderResult.zincGroup.total}名
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>対照群</CardDescription>
              <CardTitle className="text-4xl text-gray-600">
                {responderResult.controlGroup.rate !== null
                  ? `${(responderResult.controlGroup.rate * 100).toFixed(1)}%`
                  : '-'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {responderResult.controlGroup.responders}/{responderResult.controlGroup.total}名
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 亜鉛欠乏 vs 正常の比較 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>亜鉛欠乏群（&lt;80 μg/dL）</CardDescription>
              <CardTitle className="text-4xl text-orange-600">
                {responderResult.zincDeficientGroup.rate !== null
                  ? `${(responderResult.zincDeficientGroup.rate * 100).toFixed(1)}%`
                  : '-'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {responderResult.zincDeficientGroup.responders}/{responderResult.zincDeficientGroup.total}名
              </p>
              {responderResult.zincDeficientGroup.meanSeizureChange !== null && (
                <p className="text-sm text-gray-500 mt-1">
                  発作減少率: {responderResult.zincDeficientGroup.meanSeizureChange.toFixed(1)}%（平均）
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>亜鉛正常群（≥80 μg/dL）</CardDescription>
              <CardTitle className="text-4xl text-teal-600">
                {responderResult.zincNormalGroup.rate !== null
                  ? `${(responderResult.zincNormalGroup.rate * 100).toFixed(1)}%`
                  : '-'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                {responderResult.zincNormalGroup.responders}/{responderResult.zincNormalGroup.total}名
              </p>
              {responderResult.zincNormalGroup.meanSeizureChange !== null && (
                <p className="text-sm text-gray-500 mt-1">
                  発作減少率: {responderResult.zincNormalGroup.meanSeizureChange.toFixed(1)}%（平均）
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 統計検定結果 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>統計検定結果</CardTitle>
            <CardDescription>
              Mann-Whitney U検定（Wilcoxon順位和検定）による群間比較
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">亜鉛補充群 vs 対照群</h4>
                {supplementationTest ? (
                  <div className="space-y-1 text-sm">
                    <p>U統計量: {supplementationTest.u.toFixed(2)}</p>
                    <p>Z値: {supplementationTest.z.toFixed(3)}</p>
                    <p className={supplementationTest.p < 0.05 ? 'text-green-600 font-medium' : ''}>
                      p値: {supplementationTest.p < 0.001 ? '<0.001' : supplementationTest.p.toFixed(3)}
                      {supplementationTest.p < 0.05 && ' *'}
                      {supplementationTest.p < 0.01 && '*'}
                      {supplementationTest.p < 0.001 && '*'}
                    </p>
                    <p className="text-gray-500 mt-2">
                      補充群: n={zincGroupChanges.length}, 対照群: n={controlGroupChanges.length}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">データ不足（各群2名以上必要）</p>
                )}
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">亜鉛欠乏群 vs 正常群</h4>
                {deficiencyTest ? (
                  <div className="space-y-1 text-sm">
                    <p>U統計量: {deficiencyTest.u.toFixed(2)}</p>
                    <p>Z値: {deficiencyTest.z.toFixed(3)}</p>
                    <p className={deficiencyTest.p < 0.05 ? 'text-green-600 font-medium' : ''}>
                      p値: {deficiencyTest.p < 0.001 ? '<0.001' : deficiencyTest.p.toFixed(3)}
                      {deficiencyTest.p < 0.05 && ' *'}
                      {deficiencyTest.p < 0.01 && '*'}
                      {deficiencyTest.p < 0.001 && '*'}
                    </p>
                    <p className="text-gray-500 mt-2">
                      欠乏群: n={deficientGroupChanges.length}, 正常群: n={normalGroupChanges.length}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">データ不足（各群2名以上必要）</p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              * p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001
            </p>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* 亜鉛補充群の棒グラフ */}
          <Card>
            <CardHeader>
              <CardTitle>亜鉛補充群 vs 対照群</CardTitle>
              <CardDescription>
                発作回数が50%以上減少した患者の割合
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patientOutcomes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={responderChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="responders" name="Responders" fill="#22c55e" stackId="a" />
                    <Bar dataKey="nonResponders" name="Non-responders" fill="#ef4444" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  解析可能なデータがありません
                </div>
              )}
            </CardContent>
          </Card>

          {/* 亜鉛欠乏群の棒グラフ */}
          <Card>
            <CardHeader>
              <CardTitle>亜鉛欠乏群 vs 正常群</CardTitle>
              <CardDescription>
                ベースライン血清亜鉛値による群分け（80 μg/dL基準）
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(responderResult.zincDeficientGroup.total > 0 || responderResult.zincNormalGroup.total > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deficiencyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="responders" name="Responders" fill="#22c55e" stackId="a" />
                    <Bar dataKey="nonResponders" name="Non-responders" fill="#ef4444" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  血清亜鉛値のデータがありません
                </div>
              )}
            </CardContent>
          </Card>

          {/* 円グラフ */}
          <Card>
            <CardHeader>
              <CardTitle>全体のResponder分布</CardTitle>
              <CardDescription>
                全患者における50% Responderの割合
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patientOutcomes.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#22c55e' : '#ef4444'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  解析可能なデータがありません
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 発作減少率の統計 */}
        {seizureStats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>発作減少率の統計</CardTitle>
              <CardDescription>
                ベースラインからの発作回数変化率（%）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">平均</p>
                  <p className="text-2xl font-bold">{seizureStats.mean.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">中央値</p>
                  <p className="text-2xl font-bold">{seizureStats.median.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">最小</p>
                  <p className="text-2xl font-bold">{seizureStats.min.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">最大</p>
                  <p className="text-2xl font-bold">{seizureStats.max.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">標準偏差</p>
                  <p className="text-2xl font-bold">{seizureStats.standardDeviation.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 患者別詳細 */}
        <Card>
          <CardHeader>
            <CardTitle>患者別詳細</CardTitle>
            <CardDescription>
              各患者の発作頻度変化
            </CardDescription>
          </CardHeader>
          <CardContent>
            {responderResult.patientDetails.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>患者ID</TableHead>
                    <TableHead>血清Zn (μg/dL)</TableHead>
                    <TableHead>ベースライン (回/月)</TableHead>
                    <TableHead>直近 (回/月)</TableHead>
                    <TableHead>変化率</TableHead>
                    <TableHead>亜鉛状態</TableHead>
                    <TableHead>亜鉛補充</TableHead>
                    <TableHead>判定</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responderResult.patientDetails.map((p) => (
                    <TableRow key={p.patientId}>
                      <TableCell className="font-medium">{p.patientId}</TableCell>
                      <TableCell className={p.hasZincDeficiency ? 'text-orange-600 font-medium' : ''}>
                        {p.baselineZincLevel !== null && p.baselineZincLevel !== undefined
                          ? p.baselineZincLevel
                          : '-'}
                      </TableCell>
                      <TableCell>{p.baselineSeizurePerMonth}</TableCell>
                      <TableCell>{p.latestSeizurePerMonth}</TableCell>
                      <TableCell
                        className={
                          p.changeRate >= 0.5
                            ? 'text-green-600 font-medium'
                            : p.changeRate > 0
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }
                      >
                        {p.changeRate >= 0 ? '+' : ''}
                        {(p.changeRate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {p.hasZincDeficiency === true ? (
                          <Badge className="bg-orange-100 text-orange-800">欠乏</Badge>
                        ) : p.hasZincDeficiency === false ? (
                          <Badge className="bg-teal-100 text-teal-800">正常</Badge>
                        ) : (
                          <Badge variant="outline">未測定</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.zincSupplementation ? (
                          <Badge className="bg-blue-100 text-blue-800">補充あり</Badge>
                        ) : (
                          <Badge variant="outline">補充なし</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.isResponder ? (
                          <Badge className="bg-green-100 text-green-800">Responder</Badge>
                        ) : (
                          <Badge variant="outline">Non-responder</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>解析可能なデータがありません</p>
                <p className="text-sm mt-2">
                  患者に2件以上の発作日誌を登録すると、分析結果が表示されます
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
