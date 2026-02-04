'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createSeizureLog, getPatient } from '@/lib/firebase/firestore';
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

export default function NewSeizureLogPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear().toString());
  const [month, setMonth] = useState((now.getMonth() + 1).toString());
  const [seizureCount, setSeizureCount] = useState('');
  const [severeSeizureCount, setSevereSeizureCount] = useState('');
  const [rescueMedicationCount, setRescueMedicationCount] = useState('');
  const [hospitalization, setHospitalization] = useState(false);
  const [seizureFreeDays, setSeizureFreeDays] = useState('');
  const [aedChange, setAedChange] = useState(false);
  const [zincSupplementation, setZincSupplementation] = useState(false);
  const [latestZincLevel, setLatestZincLevel] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !patientId) return;

    setLoading(true);

    try {
      await createSeizureLog(patientId, {
        year: parseInt(year),
        month: parseInt(month),
        seizureCount: parseInt(seizureCount) || 0,
        severeSeizureCount: parseInt(severeSeizureCount) || 0,
        rescueMedicationCount: parseInt(rescueMedicationCount) || 0,
        hospitalization,
        seizureFreeDays: parseInt(seizureFreeDays) || 0,
        aedChange,
        zincSupplementation,
        latestZincLevel: latestZincLevel ? parseFloat(latestZincLevel) : null,
        notes,
        createdBy: userData.uid,
      });

      toast.success('発作日誌を追加しました');
      router.push(`/patients/${patientId}`);
    } catch (error) {
      console.error('Failed to create seizure log:', error);
      toast.error('発作日誌の追加に失敗しました');
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

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

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
          <h1 className="text-3xl font-bold text-gray-900 mt-2">発作日誌追加</h1>
          <p className="text-gray-600 mt-2">
            患者: {patient?.id} ({patient?.nickname || 'ニックネーム未設定'})
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>月別発作記録</CardTitle>
              <CardDescription>該当月の発作状況を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">年</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}年
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="month">月</Label>
                  <Select value={month} onValueChange={setMonth}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m} value={m.toString()}>
                          {m}月
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">発作情報</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seizureCount">発作回数</Label>
                    <Input
                      id="seizureCount"
                      type="number"
                      min="0"
                      value={seizureCount}
                      onChange={(e) => setSeizureCount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="severeSeizureCount">重症発作回数</Label>
                    <Input
                      id="severeSeizureCount"
                      type="number"
                      min="0"
                      value={severeSeizureCount}
                      onChange={(e) => setSevereSeizureCount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rescueMedicationCount">レスキュー薬使用回数</Label>
                    <Input
                      id="rescueMedicationCount"
                      type="number"
                      min="0"
                      value={rescueMedicationCount}
                      onChange={(e) => setRescueMedicationCount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seizureFreeDays">発作ゼロ日数</Label>
                    <Input
                      id="seizureFreeDays"
                      type="number"
                      min="0"
                      max="31"
                      value={seizureFreeDays}
                      onChange={(e) => setSeizureFreeDays(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hospitalization"
                    checked={hospitalization}
                    onCheckedChange={(c) => setHospitalization(c === true)}
                  />
                  <Label htmlFor="hospitalization">入院あり</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="aedChange"
                    checked={aedChange}
                    onCheckedChange={(c) => setAedChange(c === true)}
                  />
                  <Label htmlFor="aedChange">AED変更あり</Label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">亜鉛補充状況</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="zincSupplementation"
                    checked={zincSupplementation}
                    onCheckedChange={(c) => setZincSupplementation(c === true)}
                  />
                  <Label htmlFor="zincSupplementation">亜鉛補充中</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latestZincLevel">直近の血清亜鉛濃度 (µg/dL)</Label>
                  <Input
                    id="latestZincLevel"
                    type="number"
                    step="0.1"
                    value={latestZincLevel}
                    onChange={(e) => setLatestZincLevel(e.target.value)}
                    placeholder="判明している場合は入力"
                  />
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
