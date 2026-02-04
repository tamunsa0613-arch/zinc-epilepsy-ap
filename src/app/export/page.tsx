'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPatientsByFacility,
  getLabResults,
  getSeizureLogs,
  getAedRecords,
} from '@/lib/firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Patient, LabResult, SeizureLog, AedRecord } from '@/types';

export default function ExportPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Export options
  const [includePatients, setIncludePatients] = useState(true);
  const [includeLabResults, setIncludeLabResults] = useState(true);
  const [includeSeizureLogs, setIncludeSeizureLogs] = useState(true);
  const [includeAedRecords, setIncludeAedRecords] = useState(true);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    }
  }, [authLoading, userData, router]);

  useEffect(() => {
    const loadPatients = async () => {
      if (!userData) return;
      try {
        const data = await getPatientsByFacility(userData.facilityId);
        setPatients(data);
      } catch (error) {
        console.error('Failed to load patients:', error);
      } finally {
        setDataLoading(false);
      }
    };

    if (userData) {
      loadPatients();
    }
  }, [userData]);

  const exportToCSV = async () => {
    if (!userData) return;
    setLoading(true);

    try {
      const exportData: Record<string, unknown[]> = {};

      if (includePatients) {
        exportData.patients = patients.map((p) => ({
          id: p.id,
          facilityId: p.facilityId,
          chartNumber: p.chartNumber,
          nickname: p.nickname,
          sex: p.sex,
          birthDate: p.birthDate?.toDate().toISOString().split('T')[0],
          registrationDate: p.registrationDate?.toDate().toISOString().split('T')[0],
          heightCm: p.baseline?.heightCm,
          weightKg: p.baseline?.weightKg,
          onsetAgeYears: p.baseline?.onsetAgeYears,
          onsetAgeMonths: p.baseline?.onsetAgeMonths,
          seizureType: p.baseline?.seizureType,
          seizureDetails: p.baseline?.seizureDetails?.join('; '),
          baselineSeizureFrequency: p.baseline?.baselineSeizureFrequency,
          baselineSeizureFrequencyUnit: p.baseline?.baselineSeizureFrequencyUnit,
          underlyingCondition: p.background?.underlyingCondition,
          intellectualDisability: p.background?.intellectualDisability,
          nutritionMethod: p.background?.nutritionMethod,
          autism: p.background?.autism,
          pickyEating: p.background?.picky_eating,
          inclusionMet: p.eligibility?.inclusionMet,
          exclusion1: p.eligibility?.exclusion1_supplementation,
          exclusion2: p.eligibility?.exclusion2_metabolicDisorder,
          exclusion3: p.eligibility?.exclusion3_geneticDiagnosis,
          exclusion4: p.eligibility?.exclusion4_epilepsySyndrome,
        }));
      }

      if (includeLabResults) {
        const allLabResults: (LabResult & { patientId: string })[] = [];
        for (const patient of patients) {
          const labs = await getLabResults(patient.id);
          labs.forEach((lab) => {
            allLabResults.push({ ...lab, patientId: patient.id });
          });
        }
        exportData.labResults = allLabResults.map((l) => ({
          patientId: l.patientId,
          date: l.date?.toDate().toISOString().split('T')[0],
          timepoint: l.timepoint,
          fastingMorning: l.fastingMorning,
          serumZinc: l.serumZinc,
          serumCopper: l.serumCopper,
          serumIron: l.serumIron,
          zincSupplementation: l.zincSupplementation,
          zincSupplementationDose: l.zincSupplementationDose,
          heightCm: l.heightCm,
          weightKg: l.weightKg,
          bmi: l.bmi,
          zincCopperRatio: l.zincCopperRatio,
        }));
      }

      if (includeSeizureLogs) {
        const allSeizureLogs: (SeizureLog & { patientId: string })[] = [];
        for (const patient of patients) {
          const logs = await getSeizureLogs(patient.id);
          logs.forEach((log) => {
            allSeizureLogs.push({ ...log, patientId: patient.id });
          });
        }
        exportData.seizureLogs = allSeizureLogs.map((l) => ({
          patientId: l.patientId,
          yearMonth: `${l.year}-${String(l.month).padStart(2, '0')}`,
          seizureCount: l.seizureCount,
          severeSeizureCount: l.severeSeizureCount,
          rescueMedicationCount: l.rescueMedicationCount,
          hospitalization: l.hospitalization,
          seizureFreeDays: l.seizureFreeDays,
          aedChange: l.aedChange,
          zincSupplementation: l.zincSupplementation,
          latestZincLevel: l.latestZincLevel,
        }));
      }

      if (includeAedRecords) {
        const allAedRecords: (AedRecord & { patientId: string })[] = [];
        for (const patient of patients) {
          const records = await getAedRecords(patient.id);
          records.forEach((record) => {
            allAedRecords.push({ ...record, patientId: patient.id });
          });
        }
        exportData.aedRecords = allAedRecords.map((r) => ({
          patientId: r.patientId,
          date: r.date?.toDate().toISOString().split('T')[0],
          timepoint: r.timepoint,
          totalAedCount: r.totalAedCount,
          medications: r.medications
            ?.map((m) => `${m.drug}:${m.dose}mg`)
            .join('; '),
          changeDescription: r.changeDescription,
        }));
      }

      // Convert to CSV files
      for (const [name, data] of Object.entries(exportData)) {
        if (data.length === 0) continue;

        const headers = Object.keys(data[0] as object);
        const csvContent = [
          headers.join(','),
          ...data.map((row) =>
            headers
              .map((header) => {
                const value = (row as Record<string, unknown>)[header];
                if (value === null || value === undefined) return '';
                if (typeof value === 'string' && value.includes(',')) {
                  return `"${value}"`;
                }
                return String(value);
              })
              .join(',')
          ),
        ].join('\n');

        // Download file
        const blob = new Blob(['\uFEFF' + csvContent], {
          type: 'text/csv;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${userData.facilityId}_${name}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success('データをエクスポートしました');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('エクスポートに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = async () => {
    if (!userData) return;
    setLoading(true);

    try {
      const exportData: Record<string, unknown> = {
        exportedAt: new Date().toISOString(),
        facilityId: userData.facilityId,
      };

      if (includePatients) {
        exportData.patients = patients;
      }

      if (includeLabResults) {
        const allLabResults: Record<string, LabResult[]> = {};
        for (const patient of patients) {
          const labs = await getLabResults(patient.id);
          if (labs.length > 0) {
            allLabResults[patient.id] = labs;
          }
        }
        exportData.labResults = allLabResults;
      }

      if (includeSeizureLogs) {
        const allSeizureLogs: Record<string, SeizureLog[]> = {};
        for (const patient of patients) {
          const logs = await getSeizureLogs(patient.id);
          if (logs.length > 0) {
            allSeizureLogs[patient.id] = logs;
          }
        }
        exportData.seizureLogs = allSeizureLogs;
      }

      if (includeAedRecords) {
        const allAedRecords: Record<string, AedRecord[]> = {};
        for (const patient of patients) {
          const records = await getAedRecords(patient.id);
          if (records.length > 0) {
            allAedRecords[patient.id] = records;
          }
        }
        exportData.aedRecords = allAedRecords;
      }

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${userData.facilityId}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('JSONをエクスポートしました');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('エクスポートに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">データエクスポート</h1>
          <p className="text-gray-600 mt-2">
            登録データをCSVまたはJSON形式でダウンロードします
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>エクスポート対象</CardTitle>
            <CardDescription>
              ダウンロードするデータを選択してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="patients"
                checked={includePatients}
                onCheckedChange={(c) => setIncludePatients(c === true)}
              />
              <Label htmlFor="patients">
                患者基本情報 ({patients.length}件)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="labResults"
                checked={includeLabResults}
                onCheckedChange={(c) => setIncludeLabResults(c === true)}
              />
              <Label htmlFor="labResults">血液検査記録</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="seizureLogs"
                checked={includeSeizureLogs}
                onCheckedChange={(c) => setIncludeSeizureLogs(c === true)}
              />
              <Label htmlFor="seizureLogs">発作日誌</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="aedRecords"
                checked={includeAedRecords}
                onCheckedChange={(c) => setIncludeAedRecords(c === true)}
              />
              <Label htmlFor="aedRecords">AED記録</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>エクスポート形式</CardTitle>
            <CardDescription>
              データの出力形式を選択してダウンロードします
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={exportToCSV}
                disabled={
                  loading ||
                  (!includePatients &&
                    !includeLabResults &&
                    !includeSeizureLogs &&
                    !includeAedRecords)
                }
                className="h-24 flex-col"
              >
                <span className="text-2xl mb-2">📊</span>
                <span>CSV形式でダウンロード</span>
              </Button>
              <Button
                variant="outline"
                onClick={exportToJSON}
                disabled={
                  loading ||
                  (!includePatients &&
                    !includeLabResults &&
                    !includeSeizureLogs &&
                    !includeAedRecords)
                }
                className="h-24 flex-col"
              >
                <span className="text-2xl mb-2">📄</span>
                <span>JSON形式でダウンロード</span>
              </Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-gray-600">データを準備中...</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">ファイル形式について</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <strong>CSV:</strong> Excelやスプレッドシートで開けます。
              データ種類ごとに別ファイルになります。
            </li>
            <li>
              <strong>JSON:</strong> プログラムでの処理に適しています。
              全データが1ファイルにまとまります。
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
