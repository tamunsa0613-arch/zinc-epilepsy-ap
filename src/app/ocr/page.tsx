'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { DocumentType, ExtractedRegistrationData, ValidationResult } from '@/lib/ocr/extractPatientData';
import { createPatient, createLabResult, createAedRecord, getNextPatientId } from '@/lib/firebase/firestore';
import { Timestamp } from 'firebase/firestore';

export default function OcrPage() {
  const { userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('registration');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedRegistrationData | null>(null);
  const [editedData, setEditedData] = useState<ExtractedRegistrationData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    if (!authLoading && !userData) {
      router.push('/login');
    }
  }, [authLoading, userData, router]);

  useEffect(() => {
    if (extractedData) {
      setEditedData({ ...extractedData });
    }
  }, [extractedData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedData(null);
      setEditedData(null);
    }
  };

  const handleOcr = async (skipValidation: boolean = false) => {
    if (!selectedFile) {
      toast.error('画像を選択してください');
      return;
    }

    setLoading(true);
    setExtractedData(null);
    setValidation(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('documentType', documentType);
      if (skipValidation) {
        formData.append('skipValidation', 'true');
      }

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setValidation(result.validation);

        if (!result.validation.isValid) {
          toast.error('このファイルは対応フォーマットではありません');
          return;
        }

        if (result.validation.confidence === 'medium') {
          toast.warning(result.validation.message);
        }

        setExtractedData(result.data);
        toast.success('データを抽出しました。内容を確認してください。');
      } else {
        throw new Error(result.error || 'OCR failed');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('データの抽出に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setEditedData(null);
    setValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateField = (field: string, value: unknown) => {
    if (editedData) {
      setEditedData({ ...editedData, [field]: value });
    }
  };

  const handleRegisterPatient = async () => {
    if (!editedData || !userData) return;

    setSaving(true);
    try {
      // Generate patient ID
      const patientId = await getNextPatientId(userData.facilityId);

      // Parse dates
      const birthDate = editedData.birthDate
        ? Timestamp.fromDate(new Date(editedData.birthDate))
        : Timestamp.now();
      const registrationDate = editedData.registrationDate
        ? Timestamp.fromDate(new Date(editedData.registrationDate))
        : Timestamp.now();

      // Create patient
      const createdPatientId = await createPatient({
        id: patientId,
        facilityId: userData.facilityId,
        chartNumber: editedData.chartNumber || '',
        nickname: (editedData as { nickname?: string }).nickname || '',
        sex: editedData.sex || 'male',
        birthDate,
        registrationDate,
        baseline: {
          heightCm: editedData.heightCm || 0,
          weightKg: editedData.weightKg || 0,
          onsetAgeYears: editedData.onsetAgeYears || 0,
          onsetAgeMonths: editedData.onsetAgeMonths || 0,
          seizureType: editedData.seizureType || 'unknown',
          seizureDetails: editedData.seizureDetails || [],
          baselineSeizureFrequency: editedData.seizureFrequency || 0,
          baselineSeizureFrequencyUnit: editedData.seizureFrequencyUnit || 'month',
          eegAbnormalityLocation: editedData.eegLocation || [],
          eegAbnormalityType: editedData.eegType || [],
        },
        background: {
          underlyingCondition: editedData.underlyingCondition || null,
          intellectualDisability: (editedData.intellectualDisability as 'normal' | 'mild' | 'moderate' | 'severe' | 'profound') || 'normal',
          nutritionMethod: (editedData.nutritionMethod as 'oral' | 'tube' | 'gastrostomy' | 'other') || 'oral',
          nutritionContent: '',
          autism: editedData.autism || false,
          picky_eating: editedData.pickyEating || false,
        },
        eligibility: {
          inclusionMet: editedData.inclusionMet || false,
          exclusion1_supplementation: editedData.exclusion1 || false,
          exclusion2_metabolicDisorder: editedData.exclusion2 || false,
          exclusion3_geneticDiagnosis: editedData.exclusion3 || false,
          exclusion4_epilepsySyndrome: editedData.exclusion4 || false,
        },
        createdBy: userData.uid,
      });

      // Create lab result if zinc data exists
      if (editedData.serumZinc !== null || editedData.serumCopper !== null) {
        const sampleDate = (editedData as { sampleDate?: string }).sampleDate
          ? Timestamp.fromDate(new Date((editedData as { sampleDate?: string }).sampleDate!))
          : Timestamp.now();

        await createLabResult(createdPatientId, {
          date: sampleDate,
          timepoint: 'baseline',
          fastingMorning: (editedData as { fastingMorning?: boolean }).fastingMorning || false,
          serumZinc: editedData.serumZinc,
          serumCopper: editedData.serumCopper,
          serumIron: editedData.serumIron,
          zincSupplementation: editedData.zincSupplementation || false,
          zincSupplementationStartDate: editedData.zincSupplementationStartDate
            ? Timestamp.fromDate(new Date(editedData.zincSupplementationStartDate))
            : null,
          zincSupplementationDose: editedData.zincSupplementationDose,
          heightCm: editedData.heightCm,
          weightKg: editedData.weightKg,
          bmi: editedData.heightCm && editedData.weightKg
            ? editedData.weightKg / Math.pow(editedData.heightCm / 100, 2)
            : null,
          zincCopperRatio: editedData.serumZinc && editedData.serumCopper
            ? editedData.serumZinc / editedData.serumCopper
            : null,
          notes: '',
          createdBy: userData.uid,
          sourceImageUrl: null,
        });
      }

      // Create AED records if exist
      if (editedData.aedList && editedData.aedList.length > 0) {
        const medications = editedData.aedList.map((aed) => ({
          drug: aed.drug,
          dose: aed.dose || 0,
          dosePerKg: null,
          duration: (aed.duration as '0-6months' | '6-12months' | '1-2years' | '2-3years' | '3years+') || '0-6months',
        }));

        await createAedRecord(createdPatientId, {
          date: registrationDate,
          timepoint: 'baseline',
          medications,
          totalAedCount: medications.length,
          changeDescription: '初回登録',
          notes: '',
          createdBy: userData.uid,
          sourceImageUrl: null,
        });
      }

      toast.success('患者データを登録しました');
      router.push(`/patients/${createdPatientId}`);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('登録に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (editedData) {
      navigator.clipboard.writeText(JSON.stringify(editedData, null, 2));
      toast.success('クリップボードにコピーしました');
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
          <h1 className="text-3xl font-bold text-gray-900">OCR取り込み</h1>
          <p className="text-gray-600 mt-2">
            患者データ記入用紙を撮影してデータを自動抽出します
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* アップロードセクション */}
          <Card>
            <CardHeader>
              <CardTitle>画像アップロード</CardTitle>
              <CardDescription>
                記入済みの用紙を撮影してアップロード
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>書類タイプ</Label>
                <Select
                  value={documentType}
                  onValueChange={(v) => setDocumentType(v as DocumentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">登録時用紙（1回目）</SelectItem>
                    <SelectItem value="labResult">フォローアップ（2回目以降）</SelectItem>
                    <SelectItem value="followup">その他の記録</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>画像/PDFファイル</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500">画像（JPG, PNG）またはPDFに対応</p>
              </div>

              {selectedFile && (
                <div className="space-y-2">
                  <Label>プレビュー</Label>
                  <div className="border rounded-lg overflow-hidden">
                    {selectedFile.type === 'application/pdf' ? (
                      <div className="p-8 bg-gray-100 text-center">
                        <div className="text-4xl mb-2">📄</div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto max-h-80 object-contain bg-gray-100"
                      />
                    ) : null}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleOcr(false)}
                  disabled={!selectedFile || loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      AIが読み取り中...
                    </>
                  ) : (
                    'データを抽出'
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  リセット
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 抽出結果セクション */}
          <Card>
            <CardHeader>
              <CardTitle>抽出結果</CardTitle>
              <CardDescription>
                内容を確認・修正してから登録してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 検証エラー表示 */}
              {validation && !validation.isValid && (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTitle>対応フォーマットではありません</AlertTitle>
                    <AlertDescription>
                      {validation.message}
                    </AlertDescription>
                  </Alert>
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <p className="text-sm text-gray-600">
                      アップロードされた画像は、研究用の患者データ記入用紙として認識できませんでした。
                    </p>
                    <p className="text-sm text-gray-600">
                      以下をご確認ください：
                    </p>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      <li>正しい用紙（患者データ記入用紙）を撮影しましたか？</li>
                      <li>画像が鮮明で、用紙全体が写っていますか？</li>
                      <li>書類タイプ（登録時用紙など）は正しく選択されていますか？</li>
                    </ul>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOcr(true)}
                        disabled={loading}
                      >
                        検証をスキップして抽出を試みる
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        ※ 正しい用紙の場合のみ使用してください
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {editedData ? (
                <div className="space-y-4">
                  {/* 検証警告（medium confidence）*/}
                  {validation && validation.confidence === 'medium' && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTitle className="text-yellow-800">確認が必要です</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        {validation.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      OCRの結果を確認し、誤りがあれば修正してください。
                    </p>
                  </div>

                  <Tabs defaultValue="basic">
                    <TabsList className="grid grid-cols-5 w-full">
                      <TabsTrigger value="basic">基本</TabsTrigger>
                      <TabsTrigger value="lab">検査</TabsTrigger>
                      <TabsTrigger value="treatment">治療</TabsTrigger>
                      <TabsTrigger value="seizure">発作</TabsTrigger>
                      <TabsTrigger value="background">背景</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">カルテ番号</Label>
                          <Input
                            value={editedData.chartNumber || ''}
                            onChange={(e) => updateField('chartNumber', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">ニックネーム</Label>
                          <Input
                            value={(editedData as { nickname?: string }).nickname || ''}
                            onChange={(e) => updateField('nickname', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">性別</Label>
                          <Select
                            value={editedData.sex || ''}
                            onValueChange={(v) => updateField('sex', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="選択" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">男性</SelectItem>
                              <SelectItem value="female">女性</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">生年月日</Label>
                          <Input
                            type="date"
                            value={editedData.birthDate || ''}
                            onChange={(e) => updateField('birthDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">同意取得日</Label>
                        <Input
                          type="date"
                          value={editedData.registrationDate || ''}
                          onChange={(e) => updateField('registrationDate', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">適格性</Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editedData.inclusionMet || false}
                            onCheckedChange={(c) => updateField('inclusionMet', c)}
                          />
                          <span className="text-sm">選択基準を満たす</span>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="lab" className="space-y-3 mt-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">血清Zn (μg/dL)</Label>
                          <Input
                            type="number"
                            value={editedData.serumZinc ?? ''}
                            onChange={(e) => updateField('serumZinc', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">血清Cu (μg/dL)</Label>
                          <Input
                            type="number"
                            value={editedData.serumCopper ?? ''}
                            onChange={(e) => updateField('serumCopper', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">血清Fe (μg/dL)</Label>
                          <Input
                            type="number"
                            value={editedData.serumIron ?? ''}
                            onChange={(e) => updateField('serumIron', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">身長 (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={editedData.heightCm ?? ''}
                            onChange={(e) => updateField('heightCm', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">体重 (kg)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={editedData.weightKg ?? ''}
                            onChange={(e) => updateField('weightKg', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                      </div>
                      {editedData.serumZinc !== null && editedData.serumZinc < 80 && (
                        <Badge className="bg-orange-100 text-orange-800">
                          亜鉛欠乏 (&lt;80 μg/dL)
                        </Badge>
                      )}
                      {editedData.serumZinc !== null && editedData.serumCopper !== null && (
                        <div className="text-xs text-gray-500">
                          Zn/Cu比: {(editedData.serumZinc / editedData.serumCopper).toFixed(2)}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="treatment" className="space-y-3 mt-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">亜鉛補充療法</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={editedData.zincSupplementation || false}
                              onCheckedChange={(c) => updateField('zincSupplementation', c)}
                            />
                            <span className="text-sm">亜鉛補充中</span>
                          </div>
                          {editedData.zincSupplementation && (
                            <div className="grid grid-cols-2 gap-3 ml-6">
                              <div>
                                <Label className="text-xs">開始日</Label>
                                <Input
                                  type="date"
                                  value={editedData.zincSupplementationStartDate || ''}
                                  onChange={(e) => updateField('zincSupplementationStartDate', e.target.value)}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">補充量（µg/day）</Label>
                                <Input
                                  type="number"
                                  value={editedData.zincSupplementationDose ?? ''}
                                  onChange={(e) => updateField('zincSupplementationDose', e.target.value ? Number(e.target.value) : null)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">抗てんかん薬（AED）</h4>
                        {editedData.aedList && editedData.aedList.length > 0 ? (
                          <div className="space-y-2">
                            {editedData.aedList.map((aed, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-white rounded border">
                                <Badge variant="outline" className="font-mono">{aed.drug}</Badge>
                                <span className="text-sm">{aed.dose} {aed.unit}</span>
                                {aed.duration && (
                                  <span className="text-xs text-gray-500">
                                    ({aed.duration === '0-6months' ? '0-6ヶ月' :
                                      aed.duration === '6-12months' ? '6-12ヶ月' :
                                      aed.duration === '1-2years' ? '1-2年' :
                                      aed.duration === '2-3years' ? '2-3年' :
                                      aed.duration === '3years+' ? '3年以上' : aed.duration})
                                  </span>
                                )}
                              </div>
                            ))}
                            <p className="text-xs text-gray-500 mt-2">
                              合計: {editedData.aedList.length}剤
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">AED情報なし</p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="seizure" className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">初発年齢（歳）</Label>
                          <Input
                            type="number"
                            value={editedData.onsetAgeYears ?? ''}
                            onChange={(e) => updateField('onsetAgeYears', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">初発年齢（月）</Label>
                          <Input
                            type="number"
                            value={editedData.onsetAgeMonths ?? ''}
                            onChange={(e) => updateField('onsetAgeMonths', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">発作頻度</Label>
                          <Input
                            type="number"
                            value={editedData.seizureFrequency ?? ''}
                            onChange={(e) => updateField('seizureFrequency', e.target.value ? Number(e.target.value) : null)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">頻度単位</Label>
                          <Select
                            value={editedData.seizureFrequencyUnit || ''}
                            onValueChange={(v) => updateField('seizureFrequencyUnit', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="選択" />
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
                      <div>
                        <Label className="text-xs">発作型</Label>
                        <Select
                          value={editedData.seizureType || ''}
                          onValueChange={(v) => updateField('seizureType', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="focal">焦点起始</SelectItem>
                            <SelectItem value="generalized">全般起始</SelectItem>
                            <SelectItem value="unknown">起始不明</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {editedData.seizureDetails && editedData.seizureDetails.length > 0 && (
                        <div>
                          <Label className="text-xs">発作型詳細</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {editedData.seizureDetails.map((detail, i) => (
                              <Badge key={i} variant="outline">
                                {detail === 'tonic' ? '強直' :
                                 detail === 'tonic-clonic' ? '強直間代' :
                                 detail === 'myoclonic' ? 'ミオクロニー' :
                                 detail === 'absence' ? '欠神' :
                                 detail === 'atonic' ? '脱力' :
                                 detail === 'spasms' ? 'スパスム' : detail}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {editedData.eegLocation && editedData.eegLocation.length > 0 && (
                        <div>
                          <Label className="text-xs">脳波異常箇所</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {editedData.eegLocation.map((loc, i) => (
                              <Badge key={i} variant="outline">
                                {loc === 'frontal' ? '前頭部' :
                                 loc === 'temporal' ? '側頭部' :
                                 loc === 'parietal' ? '頭頂部' :
                                 loc === 'occipital' ? '後頭部' : loc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="background" className="space-y-3 mt-4">
                      <div>
                        <Label className="text-xs">知的障害</Label>
                        <Select
                          value={editedData.intellectualDisability || ''}
                          onValueChange={(v) => updateField('intellectualDisability', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">正常/IQ71以上</SelectItem>
                            <SelectItem value="mild">軽度/IQ51-70</SelectItem>
                            <SelectItem value="moderate">中等度/IQ36-50</SelectItem>
                            <SelectItem value="severe">重度/IQ21-35</SelectItem>
                            <SelectItem value="profound">最重度/IQ20以下</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">栄養方法</Label>
                        <Select
                          value={editedData.nutritionMethod || ''}
                          onValueChange={(v) => updateField('nutritionMethod', v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oral">経口摂取</SelectItem>
                            <SelectItem value="tube">胃管・胃瘻</SelectItem>
                            <SelectItem value="jejunostomy">腸瘻</SelectItem>
                            <SelectItem value="other">その他</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editedData.autism || false}
                            onCheckedChange={(c) => updateField('autism', c)}
                          />
                          <span className="text-sm">自閉傾向あり</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editedData.pickyEating || false}
                            onCheckedChange={(c) => updateField('pickyEating', c)}
                          />
                          <span className="text-sm">偏食あり</span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      checked={showRawJson}
                      onCheckedChange={(c) => setShowRawJson(c === true)}
                    />
                    <span className="text-xs text-gray-500">JSON形式で表示</span>
                  </div>

                  {showRawJson && (
                    <div className="max-h-48 overflow-y-auto">
                      <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(editedData, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={handleRegisterPatient}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          登録中...
                        </>
                      ) : (
                        '患者登録に反映'
                      )}
                    </Button>
                    <Button variant="outline" onClick={copyToClipboard}>
                      コピー
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p>AIがデータを読み取り中...</p>
                      <p className="text-xs">手書き文字を解析しています</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p>用紙を撮影してアップロードしてください</p>
                      <p className="text-xs">「データを抽出」で自動読み取り</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 使い方ガイド */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>使い方</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>【完成版】患者データ記入用紙を印刷し、手書きで記入します</li>
              <li>記入済みの用紙をスマホで撮影、スキャン、またはPDFで保存します</li>
              <li>「登録時用紙（1回目）」を選択し、画像またはPDFをアップロード</li>
              <li>「データを抽出」ボタンでAIが自動読み取り</li>
              <li>抽出結果を確認し、誤りがあれば修正</li>
              <li>「患者登録に反映」で一括登録完了</li>
            </ol>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>ヒント:</strong> 明るい場所で、用紙が平らな状態で撮影してください。
                影や歪みがないと認識精度が向上します。
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
