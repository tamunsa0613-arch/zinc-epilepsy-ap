'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { createPatient, createLabResult, createAedRecord, getNextPatientId } from '@/lib/firebase/firestore';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { AED_LIST, SEIZURE_DETAILS, EEG_LOCATIONS, EEG_TYPES } from '@/types';

export default function NewPatientPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [nextId, setNextId] = useState('');

  // 基本情報
  const [chartNumber, setChartNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [registrationDate, setRegistrationDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // ベースライン
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [onsetAgeYears, setOnsetAgeYears] = useState('');
  const [onsetAgeMonths, setOnsetAgeMonths] = useState('');
  const [seizureType, setSeizureType] = useState<'focal' | 'generalized' | 'unknown'>('unknown');
  const [seizureDetails, setSeizureDetails] = useState<string[]>([]);
  const [baselineSeizureFrequency, setBaselineSeizureFrequency] = useState('');
  const [baselineSeizureFrequencyUnit, setBaselineSeizureFrequencyUnit] = useState<
    'day' | 'week' | 'month' | 'year'
  >('month');
  const [eegAbnormalityLocation, setEegAbnormalityLocation] = useState<string[]>([]);
  const [eegAbnormalityType, setEegAbnormalityType] = useState<string[]>([]);

  // 背景
  const [underlyingCondition, setUnderlyingCondition] = useState('');
  const [intellectualDisability, setIntellectualDisability] = useState<
    'normal' | 'mild' | 'moderate' | 'severe' | 'profound'
  >('normal');
  const [nutritionMethod, setNutritionMethod] = useState<
    'oral' | 'tube' | 'gastrostomy' | 'other'
  >('oral');
  const [nutritionContent, setNutritionContent] = useState('');
  const [autism, setAutism] = useState(false);
  const [pickyEating, setPickyEating] = useState(false);

  // 選択・除外基準
  const [inclusionMet, setInclusionMet] = useState(true);
  const [exclusion1, setExclusion1] = useState(false);
  const [exclusion2, setExclusion2] = useState(false);
  const [exclusion3, setExclusion3] = useState(false);
  const [exclusion4, setExclusion4] = useState(false);

  // 検査データ
  const [sampleDate, setSampleDate] = useState(new Date().toISOString().split('T')[0]);
  const [fastingMorning, setFastingMorning] = useState(false);
  const [serumZinc, setSerumZinc] = useState('');
  const [serumCopper, setSerumCopper] = useState('');
  const [serumIron, setSerumIron] = useState('');

  // 亜鉛補充
  const [zincSupplementation, setZincSupplementation] = useState(false);
  const [zincSupplementationStartDate, setZincSupplementationStartDate] = useState('');
  const [zincSupplementationDose, setZincSupplementationDose] = useState('');

  // AED
  const [aedList, setAedList] = useState<Array<{ drug: string; dose: string; unit: string; duration: string }>>([]);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    }
  }, [authLoading, userData, router]);

  useEffect(() => {
    const loadNextId = async () => {
      if (!userData) return;
      try {
        const id = await getNextPatientId(userData.facilityId);
        setNextId(id);
      } catch (error) {
        console.error('Failed to get next patient ID:', error);
      }
    };
    if (userData) {
      loadNextId();
    }
  }, [userData]);

  const handleSeizureDetailToggle = (detail: string) => {
    setSeizureDetails((prev) =>
      prev.includes(detail)
        ? prev.filter((d) => d !== detail)
        : [...prev, detail]
    );
  };

  const handleEegLocationToggle = (location: string) => {
    setEegAbnormalityLocation((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );
  };

  const handleEegTypeToggle = (type: string) => {
    setEegAbnormalityType((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAddAed = () => {
    setAedList([...aedList, { drug: '', dose: '', unit: 'mg/day', duration: '0-6months' }]);
  };

  const handleRemoveAed = (index: number) => {
    setAedList(aedList.filter((_, i) => i !== index));
  };

  const handleAedChange = (index: number, field: string, value: string) => {
    const newList = [...aedList];
    newList[index] = { ...newList[index], [field]: value };
    setAedList(newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setLoading(true);

    try {
      const patientId = await createPatient({
        id: nextId,
        facilityId: userData.facilityId,
        chartNumber,
        nickname,
        sex,
        birthDate: Timestamp.fromDate(new Date(birthDate)),
        registrationDate: Timestamp.fromDate(new Date(registrationDate)),
        baseline: {
          heightCm: parseFloat(heightCm) || 0,
          weightKg: parseFloat(weightKg) || 0,
          onsetAgeYears: parseInt(onsetAgeYears) || 0,
          onsetAgeMonths: parseInt(onsetAgeMonths) || 0,
          seizureType,
          seizureDetails,
          baselineSeizureFrequency: parseFloat(baselineSeizureFrequency) || 0,
          baselineSeizureFrequencyUnit,
          eegAbnormalityLocation,
          eegAbnormalityType,
        },
        background: {
          underlyingCondition: underlyingCondition || null,
          intellectualDisability,
          nutritionMethod,
          nutritionContent,
          autism,
          picky_eating: pickyEating,
        },
        eligibility: {
          inclusionMet,
          exclusion1_supplementation: exclusion1,
          exclusion2_metabolicDisorder: exclusion2,
          exclusion3_geneticDiagnosis: exclusion3,
          exclusion4_epilepsySyndrome: exclusion4,
        },
        createdBy: userData.uid,
      });

      // 検査データがあれば保存
      if (serumZinc || serumCopper || serumIron) {
        const zincVal = serumZinc ? parseFloat(serumZinc) : null;
        const copperVal = serumCopper ? parseFloat(serumCopper) : null;
        const heightVal = parseFloat(heightCm) || null;
        const weightVal = parseFloat(weightKg) || null;

        await createLabResult(patientId, {
          date: Timestamp.fromDate(new Date(sampleDate)),
          timepoint: 'baseline',
          fastingMorning,
          serumZinc: zincVal,
          serumCopper: copperVal,
          serumIron: serumIron ? parseFloat(serumIron) : null,
          zincSupplementation,
          zincSupplementationStartDate: zincSupplementationStartDate
            ? Timestamp.fromDate(new Date(zincSupplementationStartDate))
            : null,
          zincSupplementationDose: zincSupplementationDose ? parseFloat(zincSupplementationDose) : null,
          heightCm: heightVal,
          weightKg: weightVal,
          bmi: heightVal && weightVal ? weightVal / Math.pow(heightVal / 100, 2) : null,
          zincCopperRatio: zincVal && copperVal ? zincVal / copperVal : null,
          notes: '',
          createdBy: userData.uid,
          sourceImageUrl: null,
        });
      }

      // AEDデータがあれば保存
      if (aedList.length > 0 && aedList.some(aed => aed.drug)) {
        const medications = aedList
          .filter(aed => aed.drug)
          .map(aed => ({
            drug: aed.drug,
            dose: parseFloat(aed.dose) || 0,
            dosePerKg: null,
            duration: (aed.duration as '0-6months' | '6-12months' | '1-2years' | '2-3years' | '3years+') || '0-6months',
          }));

        await createAedRecord(patientId, {
          date: Timestamp.fromDate(new Date(registrationDate)),
          timepoint: 'baseline',
          medications,
          totalAedCount: medications.length,
          changeDescription: '初回登録',
          notes: '',
          createdBy: userData.uid,
          sourceImageUrl: null,
        });
      }

      toast.success('患者を登録しました');
      router.push('/patients');
    } catch (error) {
      console.error('Failed to create patient:', error);
      toast.error('患者の登録に失敗しました');
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
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/patients"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 患者一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">新規患者登録</h1>
          <p className="text-gray-600 mt-2">患者ID: {nextId}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="baseline">ベースライン</TabsTrigger>
              <TabsTrigger value="labtreatment">検査・治療</TabsTrigger>
              <TabsTrigger value="background">患者背景</TabsTrigger>
              <TabsTrigger value="eligibility">選択・除外基準</TabsTrigger>
            </TabsList>

            {/* 基本情報 */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                  <CardDescription>患者の基本的な情報を入力してください</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="chartNumber">カルテ番号</Label>
                      <Input
                        id="chartNumber"
                        value={chartNumber}
                        onChange={(e) => setChartNumber(e.target.value)}
                        placeholder="例: 12345678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nickname">ニックネーム</Label>
                      <Input
                        id="nickname"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="識別用のニックネーム"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sex">性別</Label>
                      <Select value={sex} onValueChange={(v) => setSex(v as 'male' | 'female')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">男性</SelectItem>
                          <SelectItem value="female">女性</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">生年月日</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="registrationDate">同意取得日</Label>
                    <Input
                      id="registrationDate"
                      type="date"
                      value={registrationDate}
                      onChange={(e) => setRegistrationDate(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ベースライン */}
            <TabsContent value="baseline">
              <Card>
                <CardHeader>
                  <CardTitle>ベースライン情報</CardTitle>
                  <CardDescription>発作情報と身体測定値を入力してください</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="onsetAgeYears">初発年齢（歳）</Label>
                      <Input
                        id="onsetAgeYears"
                        type="number"
                        value={onsetAgeYears}
                        onChange={(e) => setOnsetAgeYears(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="onsetAgeMonths">初発年齢（月）</Label>
                      <Input
                        id="onsetAgeMonths"
                        type="number"
                        value={onsetAgeMonths}
                        onChange={(e) => setOnsetAgeMonths(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>発作型</Label>
                    <Select
                      value={seizureType}
                      onValueChange={(v) =>
                        setSeizureType(v as 'focal' | 'generalized' | 'unknown')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="focal">焦点性</SelectItem>
                        <SelectItem value="generalized">全般性</SelectItem>
                        <SelectItem value="unknown">不明</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>発作型詳細</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {SEIZURE_DETAILS.map((detail) => (
                        <div key={detail} className="flex items-center space-x-2">
                          <Checkbox
                            id={`seizure-${detail}`}
                            checked={seizureDetails.includes(detail)}
                            onCheckedChange={() => handleSeizureDetailToggle(detail)}
                          />
                          <Label htmlFor={`seizure-${detail}`} className="text-sm">
                            {detail}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baselineSeizureFrequency">発作頻度</Label>
                      <Input
                        id="baselineSeizureFrequency"
                        type="number"
                        step="0.1"
                        value={baselineSeizureFrequency}
                        onChange={(e) => setBaselineSeizureFrequency(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>頻度単位</Label>
                      <Select
                        value={baselineSeizureFrequencyUnit}
                        onValueChange={(v) =>
                          setBaselineSeizureFrequencyUnit(
                            v as 'day' | 'week' | 'month' | 'year'
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">日</SelectItem>
                          <SelectItem value="week">週</SelectItem>
                          <SelectItem value="month">月</SelectItem>
                          <SelectItem value="year">年</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>脳波異常部位</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {EEG_LOCATIONS.map((location) => (
                        <div key={location} className="flex items-center space-x-2">
                          <Checkbox
                            id={`eeg-loc-${location}`}
                            checked={eegAbnormalityLocation.includes(location)}
                            onCheckedChange={() => handleEegLocationToggle(location)}
                          />
                          <Label htmlFor={`eeg-loc-${location}`} className="text-sm">
                            {location}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>脳波異常性状</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {EEG_TYPES.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`eeg-type-${type}`}
                            checked={eegAbnormalityType.includes(type)}
                            onCheckedChange={() => handleEegTypeToggle(type)}
                          />
                          <Label htmlFor={`eeg-type-${type}`} className="text-sm">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 検査・治療 */}
            <TabsContent value="labtreatment">
              <Card>
                <CardHeader>
                  <CardTitle>検査・治療情報</CardTitle>
                  <CardDescription>血液検査結果と治療内容を入力してください</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 血液検査 */}
                  <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                    <h3 className="font-medium text-blue-900">血液検査</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sampleDate">採血日</Label>
                        <Input
                          id="sampleDate"
                          type="date"
                          value={sampleDate}
                          onChange={(e) => setSampleDate(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Checkbox
                          id="fastingMorning"
                          checked={fastingMorning}
                          onCheckedChange={(c) => setFastingMorning(c === true)}
                        />
                        <Label htmlFor="fastingMorning">絶食・午前採血</Label>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="serumZinc">血清亜鉛 (µg/dL)</Label>
                        <Input
                          id="serumZinc"
                          type="number"
                          step="0.1"
                          value={serumZinc}
                          onChange={(e) => setSerumZinc(e.target.value)}
                          placeholder="例: 65"
                        />
                        {serumZinc && parseFloat(serumZinc) < 80 && (
                          <Badge className="bg-orange-100 text-orange-800">亜鉛欠乏</Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serumCopper">血清銅 (µg/dL)</Label>
                        <Input
                          id="serumCopper"
                          type="number"
                          step="0.1"
                          value={serumCopper}
                          onChange={(e) => setSerumCopper(e.target.value)}
                          placeholder="例: 100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serumIron">血清鉄 (µg/dL)</Label>
                        <Input
                          id="serumIron"
                          type="number"
                          step="0.1"
                          value={serumIron}
                          onChange={(e) => setSerumIron(e.target.value)}
                          placeholder="例: 80"
                        />
                      </div>
                    </div>
                    {serumZinc && serumCopper && (
                      <p className="text-sm text-gray-600">
                        Zn/Cu比: {(parseFloat(serumZinc) / parseFloat(serumCopper)).toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* 亜鉛補充療法 */}
                  <div className="p-4 bg-green-50 rounded-lg space-y-4">
                    <h3 className="font-medium text-green-900">亜鉛補充療法</h3>
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
                          <Label htmlFor="zincSupplementationStartDate">開始日</Label>
                          <Input
                            id="zincSupplementationStartDate"
                            type="date"
                            value={zincSupplementationStartDate}
                            onChange={(e) => setZincSupplementationStartDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zincSupplementationDose">補充量 (mg/day)</Label>
                          <Input
                            id="zincSupplementationDose"
                            type="number"
                            value={zincSupplementationDose}
                            onChange={(e) => setZincSupplementationDose(e.target.value)}
                            placeholder="例: 25"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AED */}
                  <div className="p-4 bg-purple-50 rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-purple-900">抗てんかん薬 (AED)</h3>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddAed}>
                        + 薬剤を追加
                      </Button>
                    </div>
                    {aedList.length === 0 ? (
                      <p className="text-sm text-gray-500">「薬剤を追加」ボタンで入力してください</p>
                    ) : (
                      <div className="space-y-3">
                        {aedList.map((aed, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-white rounded border">
                            <div className="flex-1">
                              <Label className="text-xs">薬剤名</Label>
                              <Select
                                value={aed.drug}
                                onValueChange={(v) => handleAedChange(index, 'drug', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {AED_LIST.map((drug) => (
                                    <SelectItem key={drug.abbr} value={drug.abbr}>
                                      {drug.abbr} ({drug.generic})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-24">
                              <Label className="text-xs">用量</Label>
                              <Input
                                type="number"
                                value={aed.dose}
                                onChange={(e) => handleAedChange(index, 'dose', e.target.value)}
                                placeholder="mg"
                              />
                            </div>
                            <div className="w-28">
                              <Label className="text-xs">単位</Label>
                              <Select
                                value={aed.unit}
                                onValueChange={(v) => handleAedChange(index, 'unit', v)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mg/day">mg/日</SelectItem>
                                  <SelectItem value="mg/kg/day">mg/kg/日</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32">
                              <Label className="text-xs">投与期間</Label>
                              <Select
                                value={aed.duration}
                                onValueChange={(v) => handleAedChange(index, 'duration', v)}
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAed(index)}
                              className="text-red-500 hover:text-red-700 mt-5"
                            >
                              削除
                            </Button>
                          </div>
                        ))}
                        <p className="text-sm text-gray-500">
                          登録AED数: {aedList.filter(a => a.drug).length}剤
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 患者背景 */}
            <TabsContent value="background">
              <Card>
                <CardHeader>
                  <CardTitle>患者背景</CardTitle>
                  <CardDescription>基礎疾患や栄養状態などを入力してください</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="underlyingCondition">基礎疾患</Label>
                    <Textarea
                      id="underlyingCondition"
                      value={underlyingCondition}
                      onChange={(e) => setUnderlyingCondition(e.target.value)}
                      placeholder="基礎疾患がある場合は記載"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>知的障害程度</Label>
                    <Select
                      value={intellectualDisability}
                      onValueChange={(v) =>
                        setIntellectualDisability(
                          v as 'normal' | 'mild' | 'moderate' | 'severe' | 'profound'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">正常</SelectItem>
                        <SelectItem value="mild">軽度</SelectItem>
                        <SelectItem value="moderate">中等度</SelectItem>
                        <SelectItem value="severe">重度</SelectItem>
                        <SelectItem value="profound">最重度</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>栄養方法</Label>
                    <Select
                      value={nutritionMethod}
                      onValueChange={(v) =>
                        setNutritionMethod(v as 'oral' | 'tube' | 'gastrostomy' | 'other')
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oral">経口</SelectItem>
                        <SelectItem value="tube">経管</SelectItem>
                        <SelectItem value="gastrostomy">胃瘻</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nutritionContent">栄養内容</Label>
                    <Input
                      id="nutritionContent"
                      value={nutritionContent}
                      onChange={(e) => setNutritionContent(e.target.value)}
                      placeholder="例: 普通食、ミキサー食など"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autism"
                        checked={autism}
                        onCheckedChange={(c) => setAutism(c === true)}
                      />
                      <Label htmlFor="autism">自閉傾向あり</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pickyEating"
                        checked={pickyEating}
                        onCheckedChange={(c) => setPickyEating(c === true)}
                      />
                      <Label htmlFor="pickyEating">偏食あり</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 選択・除外基準 */}
            <TabsContent value="eligibility">
              <Card>
                <CardHeader>
                  <CardTitle>選択・除外基準</CardTitle>
                  <CardDescription>研究の適格性を確認してください</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="inclusionMet"
                        checked={inclusionMet}
                        onCheckedChange={(c) => setInclusionMet(c === true)}
                      />
                      <Label htmlFor="inclusionMet" className="font-medium">
                        選択基準を満たす
                      </Label>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 ml-6">
                      難治性てんかんの診断があり、研究参加に同意している
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-lg font-medium">除外基準</Label>
                    <p className="text-sm text-gray-500">
                      該当するものにチェックを入れてください（チェックがあると除外対象）
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="exclusion1"
                          checked={exclusion1}
                          onCheckedChange={(c) => setExclusion1(c === true)}
                        />
                        <div>
                          <Label htmlFor="exclusion1">微量元素補充療法中</Label>
                          <p className="text-sm text-gray-500">
                            現在、亜鉛や銅などの微量元素補充療法を受けている
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="exclusion2"
                          checked={exclusion2}
                          onCheckedChange={(c) => setExclusion2(c === true)}
                        />
                        <div>
                          <Label htmlFor="exclusion2">代謝異常</Label>
                          <p className="text-sm text-gray-500">
                            亜鉛代謝に影響する代謝異常がある
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="exclusion3"
                          checked={exclusion3}
                          onCheckedChange={(c) => setExclusion3(c === true)}
                        />
                        <div>
                          <Label htmlFor="exclusion3">遺伝子異常診断あり</Label>
                          <p className="text-sm text-gray-500">
                            てんかんの原因となる遺伝子異常が特定されている
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="exclusion4"
                          checked={exclusion4}
                          onCheckedChange={(c) => setExclusion4(c === true)}
                        />
                        <div>
                          <Label htmlFor="exclusion4">てんかん症候群診断あり</Label>
                          <p className="text-sm text-gray-500">
                            特定のてんかん症候群（Dravet症候群など）の診断がある
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(exclusion1 || exclusion2 || exclusion3 || exclusion4) && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 font-medium">
                        注意: 除外基準に該当しています
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        この患者は研究の除外基準に該当する可能性があります。
                        登録を続行する場合は、研究責任者に確認してください。
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 mt-8">
            <Link href="/patients">
              <Button type="button" variant="outline">
                キャンセル
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? '登録中...' : '患者を登録'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
