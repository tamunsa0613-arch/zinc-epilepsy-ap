'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPatientsByFacility } from '@/lib/firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Patient } from '@/types';

export default function PatientsPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    }
  }, [authLoading, userData, router]);

  useEffect(() => {
    const loadPatients = async () => {
      if (!userData) return;

      try {
        const data = await getPatientsByFacility(userData.facilityId);
        setPatients(data);
        setFilteredPatients(data);
      } catch (error) {
        console.error('Failed to load patients:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      loadPatients();
    }
  }, [userData]);

  useEffect(() => {
    const filtered = patients.filter(
      (p) =>
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.chartNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

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

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">患者一覧</h1>
            <p className="text-gray-600 mt-2">
              登録患者数: {patients.length}名
            </p>
          </div>
          <Link href="/patients/new">
            <Button>新規患者登録</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>患者リスト</CardTitle>
              <div className="w-72">
                <Input
                  placeholder="ID、カルテ番号、ニックネームで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {patients.length === 0
                    ? '登録された患者がいません'
                    : '検索条件に一致する患者が見つかりません'}
                </p>
                {patients.length === 0 && (
                  <Link href="/patients/new">
                    <Button className="mt-4">最初の患者を登録</Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>患者ID</TableHead>
                    <TableHead>カルテ番号</TableHead>
                    <TableHead>ニックネーム</TableHead>
                    <TableHead>性別</TableHead>
                    <TableHead>年齢</TableHead>
                    <TableHead>発作型</TableHead>
                    <TableHead>登録日</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.id}</TableCell>
                      <TableCell>{patient.chartNumber || '-'}</TableCell>
                      <TableCell>{patient.nickname || '-'}</TableCell>
                      <TableCell>
                        {patient.sex === 'male' ? '男' : '女'}
                      </TableCell>
                      <TableCell>
                        {patient.birthDate
                          ? `${calculateAge(patient.birthDate.toDate())}歳`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {patient.baseline?.seizureType === 'focal'
                            ? '焦点性'
                            : patient.baseline?.seizureType === 'generalized'
                            ? '全般性'
                            : '不明'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {patient.createdAt?.toDate().toLocaleDateString('ja-JP')}
                      </TableCell>
                      <TableCell>
                        <Link href={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm">
                            詳細
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
