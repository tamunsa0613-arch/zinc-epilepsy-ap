'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { createLabResult, getPatient } from '@/lib/firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Patient } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function NewLabResultPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timepoint, setTimepoint] = useState<string>('baseline');
  const [fastingMorning, setFastingMorning] = useState(true);
  const [serumZinc, setSerumZinc] = useState('');
  const [serumCopper, setSerumCopper] = useState('');
  const [serumIron, setSerumIron] = useState('');
  const [zincSupplementation, setZincSupplementation] = useState(false);
  const [zincSupplementationStartDate, setZincSupplementationStartDate] = useState('');
  const [zincSupplementationDose, setZincSupplementationDose] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
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
        if (data) {
          setPatient(data);
          if (data.baseline) {
            setHeightCm(data.baseline.heightCm?.toString() || '');
            setWeightKg(data.baseline.weightKg?.toString() || '');
          }
        }
      } catch (error) {
        console.error('Failed to load patient:', error);
      }
    };
    loadPatient();
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !patientId) return;

    setLoading(true);

    try {
      const zinc = serumZinc ? parseFloat(serumZinc) : null;
      const copper = serumCopper ? parseFloat(serumCopper) : null;
      const height = heightCm ? parseFloat(heightCm) : null;
      const weight = weightKg ? parseFloat(weightKg) : null;

      await createLabResult(patientId, {
        date: Timestamp.fromDate(new Date(date)),
        timepoint: timepoint as 'baseline' | '1month' | '3months' | '6months' | '12months' | 'other',
        fastingMorning,
        serumZinc: zinc,
        serumCopper: copper,
        serumIron: serumIron ? parseFloat(serumIron) : null,
        zincSupplementation,
        zincSupplementationStartDate: zincSupplementationStartDate
          ? Timestamp.fromDate(new Date(zincSupplementationStartDate))
          : null,
        zincSupplementationDose: zincSupplementationDose
          ? parseFloat(zincSupplementationDose)
          : null,
        heightCm: height,
        weightKg: weight,
        bmi: height && weight ? weight / Math.pow(height / 100, 2) : null,
        zincCopperRatio: zinc && copper ? zinc / copper : null,
        notes,
        createdBy: userData.uid,
        sourceImageUrl: null,
      });

      toast.success('血液検査結果を追加しました');
      router.push(`/patients/${patientId}`);
    } catch (error) {
      console.error('Failed to create lab result:', error);
      toast.error('血液検査結果の追加に失敗しました');
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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">血液検査結果追加</h1>
          <p className="text-gray-600 mt-2">
            患者: {patient?.id} ({patient?.nickname || 'ニックネーム未設定'})
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>検査情報</CardTitle>
              <CardDescription>血液検査の結果を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">採血日</Label>
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fastingMorning"
                  checked={fastingMorning}
                  onCheckedChange={(c) => setFastingMorning(c === true)}
                />
                <Label htmlFor="fastingMorning">絶食・午前採血</Label>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">血清微量元素</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serumZinc">亜鉛 (µg/dL)</Label>
                    <Input
                      id="serumZinc"
                      type="number"
                      step="0.1"
                      value={serumZinc}
                      onChange={(e) => setSerumZinc(e.target.value)}
                    />
                    {serumZinc && parseFloat(serumZinc) < 80 && (
                      <p className="text-sm text-red-500">基準値下限以下</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serumCopper">銅 (µg/dL)</Label>
                    <Input
                      id="serumCopper"
                      type="number"
                      step="0.1"
                      value={serumCopper}
                      onChange={(e) => setSerumCopper(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serumIron">鉄 (µg/dL)</Label>
                    <Input
                      id="serumIron"
                      type="number"
                      step="0.1"
                      value={serumIron}
                      onChange={(e) => setSerumIron(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">亜鉛補充</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="zincSupplementation"
                    checked={zincSupplementation}
                    onCheckedChange={(c) => setZincSupplementation(c === true)}
                  />
                  <Label htmlFor="zincSupplementation">亜鉛補充中</Label>
                </div>
                {zincSupplementation && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="zincSupplementationStartDate">補充開始日</Label>
                      <Input
                        id="zincSupplementationStartDate"
                        type="date"
                        value={zincSupplementationStartDate}
                        onChange={(e) => setZincSupplementationStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zincSupplementationDose">補充量 (mg/日)</Label>
                      <Input
                        id="zincSupplementationDose"
                        type="number"
                        step="1"
                        value={zincSupplementationDose}
                        onChange={(e) => setZincSupplementationDose(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">身体測定</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heightCm">身長 (cm)</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      step="0.1"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weightKg">体重 (kg)</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                    />
                  </div>
                </div>
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
