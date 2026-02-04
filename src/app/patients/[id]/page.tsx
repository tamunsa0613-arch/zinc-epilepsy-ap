'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPatient,
  getLabResults,
  getSeizureLogs,
  getAedRecords,
} from '@/lib/firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { PatientTimeline } from '@/components/PatientTimeline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Patient, LabResult, SeizureLog, AedRecord } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PatientDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [seizureLogs, setSeizureLogs] = useState<SeizureLog[]>([]);
  const [aedRecords, setAedRecords] = useState<AedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    }
  }, [authLoading, userData, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!userData || !patientId) return;

      try {
        const [patientData, labs, seizures, aeds] = await Promise.all([
          getPatient(patientId),
          getLabResults(patientId),
          getSeizureLogs(patientId),
          getAedRecords(patientId),
        ]);

        if (!patientData) {
          router.push('/patients');
          return;
        }

        setPatient(patientData);
        setLabResults(labs);
        setSeizureLogs(seizures);
        setAedRecords(aeds);
      } catch (error) {
        console.error('Failed to load patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      loadData();
    }
  }, [userData, patientId, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData || !patient) {
    return null;
  }

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const timelineData = seizureLogs.map((log) => ({
    month: `${log.year}-${String(log.month).padStart(2, '0')}`,
    seizureCount: log.seizureCount,
    serumZinc: log.latestZincLevel,
    zincSupplementation: log.zincSupplementation,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/patients"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 患者一覧に戻る
          </Link>

          <div className="flex justify-between items-start mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{patient.id}</h1>
              <p className="text-gray-600 mt-2">
                {patient.nickname || 'ニックネーム未設定'} | カルテ番号:{' '}
                {patient.chartNumber || '未設定'}
              </p>
            </div>
            <div className="flex space-x-2">
              <Link href={`/patients/${patientId}/lab/new`}>
                <Button variant="outline">血液検査追加</Button>
              </Link>
              <Link href={`/patients/${patientId}/seizure/new`}>
                <Button variant="outline">発作日誌追加</Button>
              </Link>
              <Link href={`/patients/${patientId}/aed/new`}>
                <Button variant="outline">AED記録追加</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">性別</span>
                <span>{patient.sex === 'male' ? '男性' : '女性'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">年齢</span>
                <span>
                  {patient.birthDate
                    ? `${calculateAge(patient.birthDate.toDate())}歳`
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">生年月日</span>
                <span>
                  {patient.birthDate?.toDate().toLocaleDateString('ja-JP')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">登録日</span>
                <span>
                  {patient.registrationDate?.toDate().toLocaleDateString('ja-JP')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 身体測定 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">身体測定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">身長</span>
                <span>{patient.baseline?.heightCm || '-'} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">体重</span>
                <span>{patient.baseline?.weightKg || '-'} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">BMI</span>
                <span>
                  {patient.baseline?.heightCm && patient.baseline?.weightKg
                    ? (
                        patient.baseline.weightKg /
                        Math.pow(patient.baseline.heightCm / 100, 2)
                      ).toFixed(1)
                    : '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 発作情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">発作情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">発作型</span>
                <Badge variant="outline">
                  {patient.baseline?.seizureType === 'focal'
                    ? '焦点性'
                    : patient.baseline?.seizureType === 'generalized'
                    ? '全般性'
                    : '不明'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">初発年齢</span>
                <span>
                  {patient.baseline?.onsetAgeYears || 0}歳{' '}
                  {patient.baseline?.onsetAgeMonths || 0}ヶ月
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ベースライン頻度</span>
                <span>
                  {patient.baseline?.baselineSeizureFrequency || '-'}/
                  {patient.baseline?.baselineSeizureFrequencyUnit === 'day'
                    ? '日'
                    : patient.baseline?.baselineSeizureFrequencyUnit === 'week'
                    ? '週'
                    : patient.baseline?.baselineSeizureFrequencyUnit === 'month'
                    ? '月'
                    : '年'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="timeline">経過グラフ</TabsTrigger>
            <TabsTrigger value="lab">血液検査</TabsTrigger>
            <TabsTrigger value="seizure">発作日誌</TabsTrigger>
            <TabsTrigger value="aed">AED記録</TabsTrigger>
            <TabsTrigger value="background">患者背景</TabsTrigger>
          </TabsList>

          {/* 経過グラフ */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>経過グラフ</CardTitle>
                <CardDescription>発作回数と血清亜鉛濃度の推移</CardDescription>
              </CardHeader>
              <CardContent>
                {timelineData.length > 0 ? (
                  <PatientTimeline data={timelineData} />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    データがありません。発作日誌を追加してください。
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 血液検査 */}
          <TabsContent value="lab">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>血液検査記録</CardTitle>
                  <CardDescription>血清亜鉛・銅・鉄の推移</CardDescription>
                </div>
                <Link href={`/patients/${patientId}/lab/new`}>
                  <Button>検査結果を追加</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {labResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    血液検査記録がありません
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>検査日</TableHead>
                        <TableHead>タイムポイント</TableHead>
                        <TableHead>亜鉛 (µg/dL)</TableHead>
                        <TableHead>銅 (µg/dL)</TableHead>
                        <TableHead>鉄 (µg/dL)</TableHead>
                        <TableHead>Zn/Cu比</TableHead>
                        <TableHead>亜鉛補充</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labResults.map((lab) => (
                        <TableRow key={lab.id}>
                          <TableCell>
                            {lab.date?.toDate().toLocaleDateString('ja-JP')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{lab.timepoint}</Badge>
                          </TableCell>
                          <TableCell
                            className={
                              lab.serumZinc && lab.serumZinc < 80
                                ? 'text-red-600 font-medium'
                                : ''
                            }
                          >
                            {lab.serumZinc || '-'}
                          </TableCell>
                          <TableCell>{lab.serumCopper || '-'}</TableCell>
                          <TableCell>{lab.serumIron || '-'}</TableCell>
                          <TableCell>
                            {lab.serumZinc && lab.serumCopper
                              ? (lab.serumZinc / lab.serumCopper).toFixed(2)
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {lab.zincSupplementation ? (
                              <Badge>補充中</Badge>
                            ) : (
                              <Badge variant="outline">なし</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 発作日誌 */}
          <TabsContent value="seizure">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>月別発作日誌</CardTitle>
                  <CardDescription>月ごとの発作回数記録</CardDescription>
                </div>
                <Link href={`/patients/${patientId}/seizure/new`}>
                  <Button>発作日誌を追加</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {seizureLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    発作日誌がありません
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>年月</TableHead>
                        <TableHead>発作回数</TableHead>
                        <TableHead>重症発作</TableHead>
                        <TableHead>レスキュー薬</TableHead>
                        <TableHead>発作ゼロ日数</TableHead>
                        <TableHead>入院</TableHead>
                        <TableHead>AED変更</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {seizureLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {log.year}年{log.month}月
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.seizureCount}
                          </TableCell>
                          <TableCell>{log.severeSeizureCount}</TableCell>
                          <TableCell>{log.rescueMedicationCount}</TableCell>
                          <TableCell>{log.seizureFreeDays}日</TableCell>
                          <TableCell>
                            {log.hospitalization ? '有' : '無'}
                          </TableCell>
                          <TableCell>
                            {log.aedChange ? (
                              <Badge variant="destructive">変更あり</Badge>
                            ) : (
                              '変更なし'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AED記録 */}
          <TabsContent value="aed">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>AED記録</CardTitle>
                  <CardDescription>抗てんかん薬の処方履歴</CardDescription>
                </div>
                <Link href={`/patients/${patientId}/aed/new`}>
                  <Button>AED記録を追加</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {aedRecords.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    AED記録がありません
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aedRecords.map((record) => (
                      <div
                        key={record.id}
                        className="p-4 border rounded-lg space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            {record.date?.toDate().toLocaleDateString('ja-JP')}
                          </span>
                          <Badge variant="outline">{record.timepoint}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {record.medications.map((med, idx) => (
                            <Badge key={idx} className="text-sm">
                              {med.drug} {med.dose}mg/日
                            </Badge>
                          ))}
                        </div>
                        {record.changeDescription && (
                          <p className="text-sm text-gray-600">
                            変更内容: {record.changeDescription}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 患者背景 */}
          <TabsContent value="background">
            <Card>
              <CardHeader>
                <CardTitle>患者背景</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">基礎疾患・状態</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">基礎疾患</span>
                        <span>{patient.background?.underlyingCondition || 'なし'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">知的障害</span>
                        <span>
                          {patient.background?.intellectualDisability === 'normal'
                            ? '正常'
                            : patient.background?.intellectualDisability === 'mild'
                            ? '軽度'
                            : patient.background?.intellectualDisability === 'moderate'
                            ? '中等度'
                            : patient.background?.intellectualDisability === 'severe'
                            ? '重度'
                            : '最重度'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">自閉傾向</span>
                        <span>{patient.background?.autism ? 'あり' : 'なし'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-medium">栄養状態</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">栄養方法</span>
                        <span>
                          {patient.background?.nutritionMethod === 'oral'
                            ? '経口'
                            : patient.background?.nutritionMethod === 'tube'
                            ? '経管'
                            : patient.background?.nutritionMethod === 'gastrostomy'
                            ? '胃瘻'
                            : 'その他'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">栄養内容</span>
                        <span>{patient.background?.nutritionContent || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">偏食</span>
                        <span>{patient.background?.picky_eating ? 'あり' : 'なし'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">選択・除外基準</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          patient.eligibility?.inclusionMet
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span>選択基準: {patient.eligibility?.inclusionMet ? '満たす' : '満たさない'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          !patient.eligibility?.exclusion1_supplementation
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span>
                        微量元素補充:{' '}
                        {patient.eligibility?.exclusion1_supplementation ? '該当' : '非該当'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          !patient.eligibility?.exclusion2_metabolicDisorder
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span>
                        代謝異常:{' '}
                        {patient.eligibility?.exclusion2_metabolicDisorder ? '該当' : '非該当'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          !patient.eligibility?.exclusion3_geneticDiagnosis
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span>
                        遺伝子異常:{' '}
                        {patient.eligibility?.exclusion3_geneticDiagnosis ? '該当' : '非該当'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
