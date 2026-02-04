import Anthropic from '@anthropic-ai/sdk';

export type DocumentType = 'registration' | 'labResult' | 'followup';

export interface ExtractedRegistrationData {
  chartNumber: string | null;
  sex: 'male' | 'female' | null;
  birthDate: string | null;
  registrationDate: string | null;
  inclusionMet: boolean | null;
  exclusion1: boolean | null;
  exclusion2: boolean | null;
  exclusion3: boolean | null;
  exclusion4: boolean | null;
  serumZinc: number | null;
  serumCopper: number | null;
  serumIron: number | null;
  zincSupplementation: boolean | null;
  zincSupplementationStartDate: string | null;
  zincSupplementationDose: number | null;
  heightCm: number | null;
  weightKg: number | null;
  onsetAgeYears: number | null;
  onsetAgeMonths: number | null;
  seizureFrequency: number | null;
  seizureFrequencyUnit: 'day' | 'week' | 'month' | 'year' | null;
  seizureType: 'focal' | 'generalized' | 'unknown' | null;
  seizureDetails: string[];
  aedList: Array<{
    drug: string;
    dose: number | null;
    unit: string | null;
    duration: string | null;
  }>;
  eegLocation: string[];
  eegType: string[];
  underlyingCondition: string | null;
  intellectualDisability: string | null;
  nutritionMethod: string | null;
  autism: boolean | null;
  pickyEating: boolean | null;
}

export interface ExtractedLabResultData {
  sampleDate: string | null;
  fastingMorning: boolean | null;
  serumZinc: number | null;
  serumCopper: number | null;
  serumIron: number | null;
  zincSupplementation: boolean | null;
  zincSupplementationStartDate: string | null;
  zincSupplementationDose: number | null;
  heightCm: number | null;
  weightKg: number | null;
  seizureFrequency: number | null;
  seizureFrequencyUnit: string | null;
  aedList: Array<{
    drug: string;
    dose: number | null;
    unit: string | null;
    duration: string | null;
  }>;
}

export interface ExtractedFollowupData {
  recordDate: string | null;
  serumZinc: number | null;
  serumCopper: number | null;
  seizureFrequency: number | null;
  seizureFrequencyUnit: string | null;
  aedList: Array<{
    drug: string;
    dose: number | null;
    unit: string | null;
    duration: string | null;
  }>;
  zincSupplementation: boolean | null;
  notes: string | null;
}

export type ExtractedData = ExtractedRegistrationData | ExtractedLabResultData | ExtractedFollowupData;

export interface ValidationResult {
  isValid: boolean;
  confidence: 'high' | 'medium' | 'low';
  message: string;
  detectedType: DocumentType | 'unknown';
}

export interface ExtractionResult {
  validation: ValidationResult;
  data: ExtractedData | null;
}

const validationPrompt = `この画像が以下のいずれかの医療研究用フォームかどうかを判定してください：

1. registration（患者登録用紙）: カルテ番号、生年月日、適格性確認、選択基準・除外基準、血清亜鉛/銅濃度、抗てんかん薬リストなどを含む
2. labResult（血液検査記録）: 採血日、血清亜鉛/銅/鉄濃度、身長体重などの検査データを含む
3. followup（フォローアップ記録）: 経過観察データ、発作頻度、亜鉛補充状況などを含む

以下のJSON形式のみで回答してください：
{
  "isValid": true/false（上記いずれかのフォームとして認識できるか）,
  "confidence": "high"/"medium"/"low"（判定の確信度）,
  "detectedType": "registration"/"labResult"/"followup"/"unknown"（検出されたフォームタイプ）,
  "message": "判定理由を日本語で簡潔に"
}

JSONのみを出力してください。`;

const prompts: Record<DocumentType, string> = {
  registration: `この「患者データ記入用紙」から以下の情報をJSON形式で抽出してください。
手書きの文字を丁寧に読み取ってください。チェックボックスにチェックがあれば true、なければ false としてください。
読み取れない項目はnullとしてください。

【登録時／適格性確認セクション】
- chartNumber: カルテ番号
- nickname: ニックネーム（被験者識別コード）
- sex: 性別 ("male"=男性, "female"=女性)
- birthDate: 生年月日 (YYYY-MM-DD形式)
- ageYears: 年齢（歳）
- ageMonths: 年齢（か月）
- registrationDate: 同意取得日 (YYYY-MM-DD形式)
- inclusionMet: 選択基準「18歳以下のてんかん患者」が「はい」にチェック (boolean)
- exclusion1: 除外基準1「微量元素補充の栄養療法」が「はい」にチェック (boolean)
- exclusion2: 除外基準2「代謝異常」が「はい」にチェック (boolean)
- exclusion3: 除外基準3「遺伝子異常の診断」が「はい」にチェック (boolean)
- exclusion4: 除外基準4「てんかん症候群の診断」が「はい」にチェック (boolean)

【研究用データ（1回目）セクション】
- sampleDate: 採血日 (YYYY-MM-DD形式)
- fastingMorning: 絶食・午前採血が「YES」にチェック (boolean)
- serumZinc: 血清亜鉛濃度 (数値, µg/dL)。「未測定」チェックならnull
- serumCopper: 血清銅濃度 (数値, µg/dL)。「未測定」チェックならnull
- serumIron: 血清鉄濃度 (数値, µg/dL)。「未測定」チェックならnull
- zincSupplementation: 亜鉛補充中「はい」にチェック (boolean)
- zincSupplementationStartDate: 補充開始日 (YYYY-MM-DD形式)
- zincSupplementationDose: 補充量 (数値, µg/day)
- heightCm: 身長 (数値, cm)
- weightKg: 体重 (数値, kg)
- onsetAgeYears: てんかん初発年齢・歳 (数値)
- onsetAgeMonths: てんかん初発年齢・か月 (数値)
- seizureFrequency: 発作頻度の数値部分 (数値)
- seizureFrequencyUnit: 頻度単位 ("day"=日, "month"=月, "year"=年)
- seizureType: 発作型 ("focal"=焦点起始, "generalized"=全般起始, "unknown"=起始不明)
- seizureDetails: チェックされた発作型詳細 (配列: "tonic"=強直, "tonic-clonic"=強直間代, "myoclonic"=ミオクロニー, "absence"=意識減損/非定型欠神, "atonic"=脱力, "spasms"=スパスム)
- hadSeizureLast6Months: 血液検査前6か月以内のてんかん発作「あり」にチェック (boolean)
- aedList: チェックされた抗てんかん薬 (配列: [{drug: "VPA", dose: 数値, unit: "mg/kg/day"または"mg/day", duration: "0-6months"/"6-12months"/"1-2years"/"2-3years"/"3years+"}])
  ※薬剤略称: VPA, CBZ, PB, LTG, TPM, ZNS, LEV, CLB, CZP, LCM, PER, STP, RFN, ESM
- eegLocation: 脳波異常箇所 (配列: "frontal"=前頭部, "temporal"=側頭部, "occipital"=後頭部, "parietal"=頭頂部)
- eegType: 脳波異常性状 (配列: "sharp-wave"=鋭波, "spike"=棘波, "spike-wave"=棘徐波複合, "poly-spike-wave"=多棘徐波複合, "generalized-spike-wave"=全般性棘徐波複合)

【患者背景情報セクション】
- hasUnderlyingCondition: 基礎疾患「あり」にチェック (boolean)
- underlyingConditionType: 基礎疾患の種類 (配列: "perinatal"=周産期障害, "intracranial"=頭蓋内疾患, "other"=その他)
- underlyingConditionOther: その他の場合の記載内容
- intellectualDisability: 知的障害の程度 ("normal"=正常/IQ71以上, "mild"=軽度/IQ51-70, "moderate"=中等度/IQ36-50, "severe"=重度/IQ21-35, "profound"=最重度/IQ20以下)
- nutritionMethod: 栄養方法 ("oral"=経口摂取, "tube"=胃管・胃瘻, "jejunostomy"=腸瘻, "other"=その他)
- nutritionContent: 栄養内容 ("regular"=常食, "blended"=ミキサー食, "semi-elemental"=半消化態栄養, "elemental"=消化態栄養剤, "other"=その他)
- autism: 自閉傾向「あり」にチェック (boolean)
- pickyEating: 偏食「あり」にチェック (boolean)
- cannotEatMeat: 肉類が食べられない「YES」にチェック (boolean)
- cannotEatFish: 魚が食べられない「YES」にチェック (boolean)

JSONのみを出力してください。説明文は不要です。`,

  labResult: `この血液検査記録から以下の情報をJSON形式で抽出してください。
読み取れない項目はnullとしてください。

抽出項目:
- sampleDate: 採血日 (YYYY-MM-DD形式)
- fastingMorning: 絶食・午前採血 (boolean)
- serumZinc: 血清亜鉛濃度 (数値, µg/dL)
- serumCopper: 血清銅濃度 (数値, µg/dL)
- serumIron: 血清鉄濃度 (数値, µg/dL)
- zincSupplementation: 亜鉛補充中 (boolean)
- zincSupplementationStartDate: 補充開始日 (YYYY-MM-DD形式)
- zincSupplementationDose: 補充量 (数値, mg/day)
- heightCm: 身長 (数値, cm)
- weightKg: 体重 (数値, kg)
- seizureFrequency: 発作頻度 (数値)
- seizureFrequencyUnit: 頻度単位
- aedList: 内服中のAED (配列)

JSONのみを出力してください。`,

  followup: `このフォローアップ記録から以下の情報をJSON形式で抽出してください。
読み取れない項目はnullとしてください。

抽出項目:
- recordDate: 記録日 (YYYY-MM-DD形式)
- serumZinc: 血清亜鉛濃度 (数値)
- serumCopper: 血清銅濃度 (数値)
- seizureFrequency: 発作頻度 (数値)
- seizureFrequencyUnit: 頻度単位
- aedList: 内服中のAED (配列)
- zincSupplementation: 亜鉛補充中 (boolean)
- notes: 備考

JSONのみを出力してください。`,
};

async function validateDocument(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
): Promise<ValidationResult> {
  const anthropic = new Anthropic();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: validationPrompt,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {
        isValid: false,
        confidence: 'low',
        message: '画像の解析に失敗しました',
        detectedType: 'unknown',
      };
    }

    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    return JSON.parse(jsonStr) as ValidationResult;
  } catch {
    return {
      isValid: false,
      confidence: 'low',
      message: '検証処理中にエラーが発生しました',
      detectedType: 'unknown',
    };
  }
}

export async function extractPatientDataFromImage(
  imageBase64: string,
  documentType: DocumentType,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg',
  skipValidation: boolean = false
): Promise<ExtractionResult> {
  const anthropic = new Anthropic();

  // First, validate the document
  let validation: ValidationResult;
  if (skipValidation) {
    validation = {
      isValid: true,
      confidence: 'high',
      message: '検証をスキップしました',
      detectedType: documentType,
    };
  } else {
    validation = await validateDocument(imageBase64, mediaType);
  }

  // If not valid, return early with null data
  if (!validation.isValid) {
    return {
      validation,
      data: null,
    };
  }

  // Warn if detected type doesn't match requested type
  if (validation.detectedType !== 'unknown' && validation.detectedType !== documentType) {
    validation.message = `選択された種類（${documentType}）と検出された種類（${validation.detectedType}）が異なります。`;
    validation.confidence = 'medium';
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompts[documentType],
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from OCR');
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  return {
    validation,
    data: JSON.parse(jsonStr),
  };
}

async function validatePdfDocument(
  pdfBase64: string
): Promise<ValidationResult> {
  const anthropic = new Anthropic();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: validationPrompt,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return {
        isValid: false,
        confidence: 'low',
        message: 'PDFの解析に失敗しました',
        detectedType: 'unknown',
      };
    }

    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    return JSON.parse(jsonStr) as ValidationResult;
  } catch {
    return {
      isValid: false,
      confidence: 'low',
      message: '検証処理中にエラーが発生しました',
      detectedType: 'unknown',
    };
  }
}

export async function extractPatientDataFromPdf(
  pdfBase64: string,
  documentType: DocumentType,
  skipValidation: boolean = false
): Promise<ExtractionResult> {
  const anthropic = new Anthropic();

  // First, validate the document
  let validation: ValidationResult;
  if (skipValidation) {
    validation = {
      isValid: true,
      confidence: 'high',
      message: '検証をスキップしました',
      detectedType: documentType,
    };
  } else {
    validation = await validatePdfDocument(pdfBase64);
  }

  // If not valid, return early with null data
  if (!validation.isValid) {
    return {
      validation,
      data: null,
    };
  }

  // Warn if detected type doesn't match requested type
  if (validation.detectedType !== 'unknown' && validation.detectedType !== documentType) {
    validation.message = `選択された種類（${documentType}）と検出された種類（${validation.detectedType}）が異なります。`;
    validation.confidence = 'medium';
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: prompts[documentType],
          },
        ],
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from OCR');
  }

  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  return {
    validation,
    data: JSON.parse(jsonStr),
  };
}
