'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getFacility, getPatientsByFacility, getPendingUsers, approveUser, rejectUser } from '@/lib/firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Facility, Patient, User } from '@/types';

export default function AdminPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    } else if (!authLoading && userData && userData.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, userData, router]);

  useEffect(() => {
    const loadData = async () => {
      if (!userData) return;

      try {
        const [facilityData, patientsData, pendingUsersData] = await Promise.all([
          getFacility(userData.facilityId),
          getPatientsByFacility(userData.facilityId),
          getPendingUsers(userData.facilityId),
        ]);
        setFacility(facilityData);
        setPatients(patientsData);
        setPendingUsers(pendingUsersData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userData && userData.role === 'admin') {
      loadData();
    }
  }, [userData]);

  const handleApprove = async (uid: string) => {
    try {
      await approveUser(uid);
      setPendingUsers(pendingUsers.filter(u => u.uid !== uid));
      toast.success('ユーザーを承認しました');
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast.error('承認に失敗しました');
    }
  };

  const handleReject = async (uid: string) => {
    if (!confirm('このユーザーを削除しますか？この操作は取り消せません。')) return;
    try {
      await rejectUser(uid);
      setPendingUsers(pendingUsers.filter(u => u.uid !== uid));
      toast.success('ユーザーを削除しました');
    } catch (error) {
      console.error('Failed to reject user:', error);
      toast.error('削除に失敗しました');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData || userData.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理画面</h1>
          <p className="text-gray-600 mt-2">
            施設管理者専用の設定画面です
          </p>
        </div>

        {/* 施設情報 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>施設情報</CardTitle>
            <CardDescription>現在の施設設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">施設ID</p>
                <p className="font-medium">{facility?.id || userData.facilityId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">施設名</p>
                <p className="font-medium">{facility?.name || '未設定'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">登録患者数</p>
                <p className="font-medium">{patients.length}名</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">作成日</p>
                <p className="font-medium">
                  {facility?.createdAt?.toDate().toLocaleDateString('ja-JP') || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 承認待ちユーザー */}
        {pendingUsers.length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>承認待ちユーザー</CardTitle>
                <Badge className="bg-yellow-500">{pendingUsers.length}</Badge>
              </div>
              <CardDescription>
                以下のユーザーが承認を待っています
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div
                    key={user.uid}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        登録日: {user.createdAt?.toDate().toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user.uid)}
                      >
                        承認
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(user.uid)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 管理メニュー */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>ユーザー管理</CardTitle>
              <CardDescription>
                施設のユーザーを管理します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users">
                <Button className="w-full">ユーザー一覧</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>データエクスポート</CardTitle>
              <CardDescription>
                施設のデータをエクスポートします
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/export">
                <Button variant="outline" className="w-full">
                  エクスポート画面へ
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 注意事項 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>管理者向け注意事項</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>
              1. 患者データは施設ごとに分離されており、他施設のデータにはアクセスできません。
            </p>
            <p>
              2. ユーザーの権限変更は慎重に行ってください。管理者権限を持つユーザーは
              すべての患者データにアクセスできます。
            </p>
            <p>
              3. データのバックアップは定期的にエクスポート機能を使用して行ってください。
            </p>
            <p>
              4. 個人情報の取り扱いには十分注意し、研究倫理に従って運用してください。
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
