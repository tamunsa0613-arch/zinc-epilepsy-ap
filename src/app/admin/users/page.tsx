'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser, approveUser, rejectUser } from '@/lib/firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { User } from '@/types';

export default function AdminUsersPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    } else if (!authLoading && userData && userData.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [authLoading, userData, router]);

  useEffect(() => {
    const loadUsers = async () => {
      if (!userData) return;

      try {
        const q = query(
          collection(db, 'users'),
          where('facilityId', '==', userData.facilityId)
        );
        const querySnapshot = await getDocs(q);
        const usersData = querySnapshot.docs.map((doc) => doc.data() as User);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userData && userData.role === 'admin') {
      loadUsers();
    }
  }, [userData]);

  const handleRoleChange = async (uid: string, newRole: 'admin' | 'user') => {
    try {
      await updateUser(uid, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
      );
      toast.success('権限を更新しました');
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('権限の更新に失敗しました');
    }
  };

  const handleApprove = async (uid: string) => {
    try {
      await approveUser(uid);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, approved: true } : u))
      );
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
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
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
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 管理画面に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">ユーザー管理</h1>
          <p className="text-gray-600 mt-2">
            施設のユーザー一覧と権限管理
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ユーザー一覧</CardTitle>
            <CardDescription>
              {userData.facilityId} のユーザー ({users.length}名)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                ユーザーが登録されていません
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名前</TableHead>
                    <TableHead>メールアドレス</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>権限</TableHead>
                    <TableHead>登録日</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">
                        {user.displayName}
                        {user.uid === userData.uid && (
                          <Badge className="ml-2" variant="outline">
                            あなた
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.approved === false ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            承認待ち
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            承認済み
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.role === 'admin' ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            管理者
                          </Badge>
                        ) : (
                          <Badge variant="outline">一般</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.createdAt?.toDate().toLocaleDateString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        {user.uid !== userData.uid ? (
                          <div className="flex items-center gap-2">
                            {user.approved === false ? (
                              <>
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
                              </>
                            ) : (
                              <Select
                                value={user.role}
                                onValueChange={(v) =>
                                  handleRoleChange(user.uid, v as 'admin' | 'user')
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">一般</SelectItem>
                                  <SelectItem value="admin">管理者</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">ユーザー管理について</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>
              <strong>承認待ち:</strong> 新規登録ユーザーは管理者の承認が必要です。
              承認されるまでシステムにアクセスできません。
            </li>
            <li>
              <strong>管理者:</strong> すべてのデータにアクセス可能、
              ユーザー権限の変更が可能
            </li>
            <li>
              <strong>一般:</strong> 患者データの閲覧・編集が可能、
              管理機能へのアクセス不可
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
