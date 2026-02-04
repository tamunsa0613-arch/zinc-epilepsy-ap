'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Navbar() {
  const { userData, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              亜鉛・てんかん研究
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                ダッシュボード
              </Link>
              <Link
                href="/patients"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                患者一覧
              </Link>
              <Link
                href="/ocr"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                OCR取り込み
              </Link>
              <Link
                href="/analysis"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                分析
              </Link>
              <Link
                href="/export"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                エクスポート
              </Link>
              <Link
                href="/guide"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                操作ガイド
              </Link>
              {userData?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  管理
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {userData && (
              <span className="text-sm text-gray-500 hidden md:inline">
                {userData.facilityId}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {userData ? getInitials(userData.displayName) : '?'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{userData?.displayName}</p>
                    <p className="text-sm text-gray-500">{userData?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">ダッシュボード</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/patients">患者一覧</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/guide">操作ガイド</Link>
                </DropdownMenuItem>
                {userData?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">管理画面</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
