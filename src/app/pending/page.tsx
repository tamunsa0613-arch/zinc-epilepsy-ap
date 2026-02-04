'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PendingApprovalPage() {
  const { userData, loading, signOut, refreshUserData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userData) {
      router.push('/login');
    }
    // 承認済み or approvedフィールドがない既存ユーザーはダッシュボードへ
    if (!loading && userData && userData.approved !== false) {
      router.push('/dashboard');
    }
  }, [loading, userData, router]);

  const handleCheckStatus = async () => {
    await refreshUserData();
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl">承認待ち</CardTitle>
          <CardDescription>
            アカウントの承認をお待ちください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              アカウントは作成されましたが、管理者による承認が必要です。
              承認されるまでシステムをご利用いただけません。
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>氏名:</strong> {userData?.displayName}</p>
            <p><strong>メール:</strong> {userData?.email}</p>
            <p><strong>施設ID:</strong> {userData?.facilityId}</p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleCheckStatus} className="w-full" variant="outline">
              承認状況を確認
            </Button>
            <Button onClick={handleLogout} className="w-full" variant="ghost">
              ログアウト
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            承認完了後、自動的にダッシュボードにアクセスできるようになります。
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
