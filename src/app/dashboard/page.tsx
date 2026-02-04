'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientsByFacility, getFacility } from '@/lib/firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Patient, Facility } from '@/types';

export default function DashboardPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    }
    // 未承認ユーザーは承認待ちページへ（approvedフィールドがない既存ユーザーは承認済みとして扱う）
    if (!authLoading && userData && userData.approved === false) {
      router.push('/pending');
    }
  }, [authLoading, userData, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!userData) return;

      try {
        const [patientsData, facilityData] = await Promise.all([
          getPatientsByFacility(userData.facilityId),
          getFacility(userData.facilityId),
        ]);
        setPatients(patientsData);
        setFacility(facilityData);
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

  const recentPatients = patients.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-2">
            {facility?.name || userData.facilityId} - {userData.displayName}
          </p>
        </div>

        {/* 統計サマリー */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>登録患者数</CardDescription>
              <CardTitle className="text-4xl">{patients.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>亜鉛補充中</CardDescription>
              <CardTitle className="text-4xl text-blue-600">
                {patients.filter((p) => p.baseline?.baselineSeizureFrequency).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>今月登録</CardDescription>
              <CardTitle className="text-4xl text-green-600">
                {
                  patients.filter((p) => {
                    const createdAt = p.createdAt?.toDate();
                    const now = new Date();
                    return (
                      createdAt &&
                      createdAt.getMonth() === now.getMonth() &&
                      createdAt.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ユーザー権限</CardDescription>
              <CardTitle className="text-lg">
                {userData.role === 'admin' ? '管理者' : '一般ユーザー'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* クイックアクション */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">新規患者登録</CardTitle>
              <CardDescription>手動入力またはOCRで患者を登録</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/patients/new">
                <Button className="w-full">患者を登録</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">OCR取り込み</CardTitle>
              <CardDescription>CRFを撮影してデータを自動抽出</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ocr">
                <Button variant="outline" className="w-full">
                  OCR取り込み
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">データ分析</CardTitle>
              <CardDescription>50% Responder Rate等の分析</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/analysis">
                <Button variant="outline" className="w-full">
                  分析を開始
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 最近の患者 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>最近登録された患者</CardTitle>
              <CardDescription>直近5件の登録患者</CardDescription>
            </div>
            <Link href="/patients">
              <Button variant="outline" size="sm">
                すべて表示
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                登録された患者がいません
              </p>
            ) : (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{patient.id}</p>
                        <p className="text-sm text-gray-500">
                          {patient.nickname || 'ニックネーム未設定'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {patient.sex === 'male' ? '男性' : '女性'}
                        </p>
                        <p className="text-sm text-gray-500">
                          登録: {patient.createdAt?.toDate().toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
