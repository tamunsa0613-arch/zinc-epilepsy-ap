import { Timestamp } from 'firebase/firestore';

// 施設
export interface Facility {
  id: string;
  name: string;
  createdAt: Timestamp;
  adminUserIds: string[];
}

// ユーザー
export interface User {
  uid: string;
  email: string;
  displayName: string;
  facilityId: string;
  role: 'admin' | 'user';
  approved: boolean;
  createdAt: Timestamp;
}

// 患者ベースライン
export interface PatientBaseline {
  heightCm: number;
  weightKg: number;
  onsetAgeYears: number;
  onsetAgeMonths: number;
  seizureType: 'focal' | 'generalized' | 'unknown';
  seizureDetails: string[];
  baselineSeizureFrequency: number;
  baselineSeizureFrequencyUnit: 'day' | 'week' | 'month' | 'year';
  eegAbnormalityLocation: string[];
  eegAbnormalityType: string[];
}

// 患者背景
export interface PatientBackground {
  underlyingCondition: string | null;
  intellectualDisability: 'normal' | 'mild' | 'moderate' | 'severe' | 'profound';
  nutritionMethod: 'oral' | 'tube' | 'gastrostomy' | 'other';
  nutritionContent: string;
  autism: boolean;
  picky_eating: boolean;
}

// 選択・除外基準
export interface PatientEligibility {
  inclusionMet: boolean;
  exclusion1_supplementation: boolean;
  exclusion2_metabolicDisorder: boolean;
  exclusion3_geneticDiagnosis: boolean;
  exclusion4_epilepsySyndrome: boolean;
}

// 患者
export interface Patient {
  id: string;
  facilityId: string;
  chartNumber: string;
  nickname: string;
  sex: 'male' | 'female';
  birthDate: Timestamp;
  registrationDate: Timestamp;
  baseline: PatientBaseline;
  background: PatientBackground;
  eligibility: PatientEligibility;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// 血液検査記録
export interface LabResult {
  id: string;
  date: Timestamp;
  timepoint: 'baseline' | '1month' | '3months' | '6months' | '12months' | 'other';
  fastingMorning: boolean;
  serumZinc: number | null;
  serumCopper: number | null;
  serumIron: number | null;
  zincSupplementation: boolean;
  zincSupplementationStartDate: Timestamp | null;
  zincSupplementationDose: number | null;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  zincCopperRatio: number | null;
  notes: string;
  createdAt: Timestamp;
  createdBy: string;
  sourceImageUrl: string | null;
}

// 月別発作日誌
export interface SeizureLog {
  id: string;
  year: number;
  month: number;
  seizureCount: number;
  severeSeizureCount: number;
  rescueMedicationCount: number;
  hospitalization: boolean;
  seizureFreeDays: number;
  aedChange: boolean;
  zincSupplementation: boolean;
  latestZincLevel: number | null;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// AED投薬情報
export interface AedMedication {
  drug: string;
  dose: number;
  dosePerKg: number | null;
  duration: '0-6months' | '6-12months' | '1-2years' | '2-3years' | '3years+';
}

// AED記録
export interface AedRecord {
  id: string;
  date: Timestamp;
  timepoint: string;
  medications: AedMedication[];
  totalAedCount: number;
  changeDescription: string;
  notes: string;
  createdAt: Timestamp;
  createdBy: string;
  sourceImageUrl: string | null;
}

// OCRアップロード履歴
export interface OcrUpload {
  id: string;
  facilityId: string;
  patientId: string | null;
  imageUrl: string;
  documentType: 'registration' | 'labResult' | 'followup';
  extractedData: Record<string, unknown>;
  status: 'pending' | 'reviewed' | 'imported';
  createdAt: Timestamp;
  createdBy: string;
}

// AED略称リスト
export const AED_LIST = [
  { abbr: 'VPA', generic: 'バルプロ酸', brand: 'デパケン' },
  { abbr: 'CBZ', generic: 'カルバマゼピン', brand: 'テグレトール' },
  { abbr: 'PB', generic: 'フェノバルビタール', brand: 'フェノバール' },
  { abbr: 'LTG', generic: 'ラモトリギン', brand: 'ラミクタール' },
  { abbr: 'TPM', generic: 'トピラマート', brand: 'トピナ' },
  { abbr: 'ZNS', generic: 'ゾニサミド', brand: 'エクセグラン' },
  { abbr: 'LEV', generic: 'レベチラセタム', brand: 'イーケプラ' },
  { abbr: 'CLB', generic: 'クロバザム', brand: 'マイスタン' },
  { abbr: 'CZP', generic: 'クロナゼパム', brand: 'リボトリール' },
  { abbr: 'LCM', generic: 'ラコサミド', brand: 'ビムパット' },
  { abbr: 'PER', generic: 'ペランパネル', brand: 'フィコンパ' },
  { abbr: 'STP', generic: 'スチリペントール', brand: 'ディアコミット' },
  { abbr: 'RFN', generic: 'ルフィナミド', brand: 'イノベロン' },
  { abbr: 'ESM', generic: 'エトスクシミド', brand: 'エピレオプチマル' },
] as const;

// 発作型詳細
export const SEIZURE_DETAILS = [
  'tonic',
  'tonic-clonic',
  'myoclonic',
  'atonic',
  'absence',
  'clonic',
  'spasms',
  'focal',
  'focal to bilateral',
] as const;

// 脳波異常部位
export const EEG_LOCATIONS = [
  'frontal',
  'temporal',
  'parietal',
  'occipital',
  'central',
  'multifocal',
  'generalized',
] as const;

// 脳波異常性状
export const EEG_TYPES = [
  'spike',
  'spike-wave',
  'sharp-wave',
  'slow-wave',
  'hypsarrhythmia',
  'suppression-burst',
] as const;
