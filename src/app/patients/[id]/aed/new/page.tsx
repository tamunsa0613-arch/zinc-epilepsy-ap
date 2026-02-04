'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { createAedRecord, getPatient } from '@/lib/firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Patient, AedMedication, AED_LIST } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

type Duration = '0-6months' | '6-12months' | '1-2years' | '2-3years' | '3years+';

export default function NewAedRecordPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timepoint, setTimepoint] = useState('baseline');
  const [medications, setMedications] = useState<AedMedication[]>([
    { drug: '', dose: 0, dosePerKg: null, duration: '0-6months' },
  ]);
  const [changeDescription, setChangeDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    }
  }, [authLoading, userData, router]);

  useEffect(() => {
    const loadPatient = async () => {
      if (!patientId) return;
      try {
        const data = await getPatient(patientId);
        setPatient(data);
      } catch (error) {
        console.error('Failed to load patient:', error);
      }
    };
    loadPatient();
  }, [patientId]);

  const addMedication = () => {
    setMedications([
      ...medications,
      { drug: '', dose: 0, dosePerKg: null, duration: '0-6months' },
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof AedMedication, value: string | number | null) => {
    const updated = [...medications];
    if (field === 'drug') {
      updated[index].drug = value as string;
    } else if (field === 'dose') {
      updated[index].dose = value as number;
    } else if (field === 'dosePerKg') {
      updated[index].dosePerKg = value as number | null;
    } else if (field === 'duration') {
      updated[index].duration = value as Duration;
    }
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !patientId) return;

    const validMedications = medications.filter((m) => m.drug && m.dose > 0);

    if (validMedications.length === 0) {
      toast.error('少なくとも1つのAEDを入力してください');
      return;
    }

    setLoading(true);

    try {
      await createAedRecord(patientId, {
        date: Timestamp.fromDate(new Date(date)),
        timepoint,
        medications: validMedications,
        totalAedCount: validMedications.length,
        changeDescription,
        notes,
        createdBy: userData.uid,
        sourceImageUrl: null,
      });

      toast.success('AED記録を追加しました');
      router.push(`/patients/${patientId}`);
    } catch (error) {
      console.error('Failed to create AED record:', error);
      toast.error('AED記録の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
          <Link
            href={`/patients/${patientId}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 患者詳細に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">AED記録追加</h1>
          <p className="text-gray-600 mt-2">
            患者: {patient?.id} ({patient?.nickname || 'ニックネーム未設定'})
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>抗てんかん薬記録</CardTitle>
              <CardDescription>現在服用中のAEDを入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">記録日</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timepoint">タイムポイント</Label>
                  <Select value={timepoint} onValueChange={setTimepoint}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baseline">ベースライン</SelectItem>
                      <SelectItem value="1month">1ヶ月後</SelectItem>
                      <SelectItem value="3months">3ヶ月後</SelectItem>
                      <SelectItem value="6months">6ヶ月後</SelectItem>
                      <SelectItem value="12months">12ヶ月後</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">服用中のAED</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addMedication}>
                    + AEDを追加
                  </Button>
                </div>

                {medications.map((med, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">AED {index + 1}</span>
                      {medications.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMedication(index)}
                        >
                          削除
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>薬剤名</Label>
                        <Select
                          value={med.drug}
                          onValueChange={(v) => updateMedication(index, 'drug', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="薬剤を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {AED_LIST.map((aed) => (
                              <SelectItem key={aed.abbr} value={aed.abbr}>
                                {aed.abbr} ({aed.generic})
                              </SelectItem>
                            ))}
                            <SelectItem value="other">その他</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>用量 (mg/日)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={med.dose || ''}
                          onChange={(e) =>
                            updateMedication(index, 'dose', parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>用量 (mg/kg/日)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={med.dosePerKg || ''}
                          onChange={(e) =>
                            updateMedication(
                              index,
                              'dosePerKg',
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          placeholder="任意"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>服用期間</Label>
                        <Select
                          value={med.duration}
                          onValueChange={(v) => updateMedication(index, 'duration', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-6months">0-6ヶ月</SelectItem>
                            <SelectItem value="6-12months">6-12ヶ月</SelectItem>
                            <SelectItem value="1-2years">1-2年</SelectItem>
                            <SelectItem value="2-3years">2-3年</SelectItem>
                            <SelectItem value="3years+">3年以上</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="changeDescription">変更内容</Label>
                <Input
                  id="changeDescription"
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  placeholder="例: VPA増量、LEV追加など"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">備考</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="特記事項があれば記入"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4 mt-6">
            <Link href={`/patients/${patientId}`}>
              <Button type="button" variant="outline">
                キャンセル
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
