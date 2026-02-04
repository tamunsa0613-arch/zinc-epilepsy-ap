'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userData) {
      router.push('/dashboard');
    }
  }, [userData, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            亜鉛・てんかん研究
          </h1>
          <h2 className="text-2xl text-gray-600 mb-8">
            データ管理システム
          </h2>
          <p className="text-lg text-gray-500 mb-12">
            難治性てんかん患者における亜鉛補充療法の効果を検討する
            <br />
            多施設観察研究用のデータ管理アプリケーション
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">患者データ管理</CardTitle>
                <CardDescription>
                  患者情報、血液検査、発作日誌を一元管理
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">OCR取り込み</CardTitle>
                <CardDescription>
                  CRFを撮影してAIが自動でデータ抽出
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">データ分析</CardTitle>
                <CardDescription>
                  経過グラフと50% Responder Rate計算
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>研究参加者専用</CardTitle>
              <CardDescription>
                アカウントをお持ちの方はログインしてください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                size="lg"
                onClick={() => router.push('/login')}
              >
                ログイン
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => router.push('/register')}
              >
                新規登録
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>亜鉛・てんかん研究 多施設観察研究</p>
        </div>
      </footer>
    </main>
  );
}
