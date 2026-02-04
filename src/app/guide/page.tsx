'use client';

import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">操作ガイド</h1>
          <p className="text-gray-600 mt-2">
            亜鉛・てんかん研究データ管理システムの使い方
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="patient">患者登録</TabsTrigger>
            <TabsTrigger value="ocr">OCR取込</TabsTrigger>
            <TabsTrigger value="analysis">分析</TabsTrigger>
            <TabsTrigger value="export">エクスポート</TabsTrigger>
            <TabsTrigger value="admin">管理</TabsTrigger>
          </TabsList>

          {/* 概要 */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>システム概要</CardTitle>
                <CardDescription>本システムの目的と機能</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">目的</h3>
                  <p className="text-gray-700">
                    本システムは、てんかん患者における亜鉛欠乏と発作頻度の関連を調査するための
                    多施設共同研究用データ管理システムです。
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">ダッシュボード画面</h3>
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <Image
                      src="/guide-images/dashboard-2.png"
                      alt="ダッシュボード画面"
                      width={800}
                      height={450}
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    ログイン後のダッシュボードでは、登録患者数、亜鉛補充中の患者数、今月の登録数などが確認できます。
                    ここから新規患者登録、OCR取り込み、データ分析に素早くアクセスできます。
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">主な機能</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">患者管理</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        患者の基本情報、検査結果、AED情報の登録・管理
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">OCR取り込み</h4>
                      <p className="text-sm text-green-700 mt-1">
                        手書き用紙を撮影してAIが自動データ抽出
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900">データ分析</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        50% Responder Rate、群間比較、統計検定
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900">エクスポート</h4>
                      <p className="text-sm text-orange-700 mt-1">
                        CSV/JSON形式でのデータダウンロード
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">画面構成</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">メニュー</th>
                          <th className="text-left py-2 px-3">説明</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">ダッシュボード</td>
                          <td className="py-2 px-3">登録状況の概要、クイックアクション</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">患者一覧</td>
                          <td className="py-2 px-3">患者一覧・新規登録・詳細表示</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">OCR取り込み</td>
                          <td className="py-2 px-3">手書き用紙からの自動データ抽出</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">分析</td>
                          <td className="py-2 px-3">統計解析結果の表示</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">エクスポート</td>
                          <td className="py-2 px-3">データのダウンロード</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">管理 <Badge variant="outline" className="ml-1">管理者</Badge></td>
                          <td className="py-2 px-3">ユーザー承認・権限管理（管理者のみ）</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">利用開始まで</h3>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <ol className="list-decimal list-inside space-y-2 text-blue-900">
                      <li><strong>新規登録</strong>：氏名・メール・所属施設を入力して登録</li>
                      <li><strong>承認待ち</strong>：管理者の承認を待ちます</li>
                      <li><strong>承認後</strong>：ダッシュボードにアクセス可能になります</li>
                    </ol>
                    <p className="text-sm text-blue-700 mt-2">
                      ※ セキュリティのため、新規ユーザーは管理者による承認が必要です。
                    </p>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 患者登録 */}
          <TabsContent value="patient">
            <Card>
              <CardHeader>
                <CardTitle>患者登録</CardTitle>
                <CardDescription>新規患者の登録方法（5つのタブで入力）</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">1. ベースライン情報</h3>
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <Image
                      src="/guide-images/patient-baseline.png"
                      alt="ベースライン情報の入力画面"
                      width={800}
                      height={450}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li><strong>身長・体重</strong>：登録時の測定値</li>
                      <li><strong>初発年齢</strong>：てんかん発症時の年齢</li>
                      <li><strong>発作型</strong>：焦点性/全般性/不明</li>
                      <li><strong>発作型詳細</strong>：tonic, tonic-clonic, absence など</li>
                      <li><strong>発作頻度</strong>：日/週/月/年あたりの回数</li>
                      <li><strong>脳波異常部位</strong>：前頭部、側頭部、頭頂部、後頭部</li>
                      <li><strong>脳波異常性状</strong>：棘波、鋭波、棘徐波複合など</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">2. 検査・治療情報</h3>
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <Image
                      src="/guide-images/patient-lab-treatment.png"
                      alt="検査・治療情報の入力画面"
                      width={800}
                      height={450}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">血液検査</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>採血日</li>
                        <li>絶食・午前採血</li>
                        <li>血清亜鉛 (µg/dL)</li>
                        <li>血清銅 (µg/dL)</li>
                        <li>血清鉄 (µg/dL)</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">亜鉛補充療法</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>補充中チェック</li>
                        <li>開始日</li>
                        <li>補充量 (mg/day)</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">抗てんかん薬</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>薬剤名（VPA, LEVなど）</li>
                        <li>用量・単位</li>
                        <li>投与期間</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>ポイント：</strong>血清亜鉛値が80 µg/dL未満の場合、自動的に「亜鉛欠乏」と判定され、
                      分析時に亜鉛欠乏群として分類されます。
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">3. 患者背景</h3>
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <Image
                      src="/guide-images/patient-background-2.png"
                      alt="患者背景の入力画面"
                      width={800}
                      height={450}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li><strong>基礎疾患</strong>：周産期障害、頭蓋内疾患など</li>
                      <li><strong>知的障害程度</strong>：正常/軽度/中等度/重度/最重度</li>
                      <li><strong>栄養方法</strong>：経口/経管/胃瘻/その他</li>
                      <li><strong>自閉傾向・偏食</strong>：該当する場合はチェック</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">4. 選択・除外基準</h3>
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <Image
                      src="/guide-images/patient-eligibility.png"
                      alt="選択・除外基準の入力画面"
                      width={800}
                      height={450}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">選択基準</h4>
                      <p className="text-sm text-green-700">
                        難治性てんかんの診断があり、研究参加に同意している場合にチェック
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">除外基準</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>微量元素補充療法中</li>
                        <li>代謝異常</li>
                        <li>遺伝子異常診断あり</li>
                        <li>てんかん症候群診断あり</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">経時データの確認</h3>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-900 mb-2">
                      <strong>患者詳細ページ</strong>（患者一覧から患者を選択）で経時データを確認できます：
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                      <li><strong>経過グラフ</strong>：発作回数と血清亜鉛濃度の推移</li>
                      <li><strong>血液検査</strong>：1回目、2回目…の検査結果一覧</li>
                      <li><strong>発作日誌</strong>：月別の発作回数記録</li>
                      <li><strong>AED記録</strong>：抗てんかん薬の処方履歴</li>
                    </ul>
                    <p className="text-sm text-blue-600 mt-2">
                      2回目以降のデータは「血液検査追加」「発作日誌追加」「AED記録追加」ボタンから追加できます。
                    </p>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OCR取込 */}
          <TabsContent value="ocr">
            <Card>
              <CardHeader>
                <CardTitle>OCR取り込み</CardTitle>
                <CardDescription>手書き用紙からの自動データ抽出</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">OCR画面</h3>
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <Image
                      src="/guide-images/ocr-page.png"
                      alt="OCR取り込み画面"
                      width={800}
                      height={450}
                      className="w-full h-auto"
                    />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">使い方</h3>
                  <ol className="list-decimal list-inside space-y-3 text-gray-700">
                    <li>
                      <strong>【完成版】患者データ記入用紙</strong>を印刷し、手書きで記入します
                    </li>
                    <li>
                      記入済みの用紙を<strong>スマホで撮影</strong>、スキャン、またはPDFで保存します
                    </li>
                    <li>
                      「登録時用紙（1回目）」を選択し、画像またはPDFを<strong>アップロード</strong>
                    </li>
                    <li>
                      <strong>「データを抽出」</strong>ボタンをクリックするとAIが自動読み取り
                    </li>
                    <li>
                      抽出結果を<strong>5つのタブ</strong>（基本・検査・治療・発作・背景）で確認・修正
                    </li>
                    <li>
                      <strong>「患者登録に反映」</strong>で一括登録完了
                    </li>
                  </ol>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">対応ファイル形式</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">画像</h4>
                      <p className="text-sm text-green-700">JPG, PNG, WebP, GIF</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">PDF</h4>
                      <p className="text-sm text-blue-700">複数ページにも対応</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">撮影のコツ</h3>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <ul className="list-disc list-inside space-y-2 text-sm text-yellow-800">
                      <li><strong>明るい場所</strong>で撮影してください</li>
                      <li>用紙を<strong>平らな状態</strong>にして撮影してください</li>
                      <li><strong>影や歪み</strong>がないと認識精度が向上します</li>
                      <li>チェックボックスは<strong>はっきりとチェック</strong>してください</li>
                      <li>数字は<strong>読みやすく</strong>書いてください</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">フォーマット検証</h3>
                  <div className="p-4 bg-red-50 rounded-lg space-y-3">
                    <p className="text-red-900">
                      アップロードされた画像が<strong>研究用CRF（患者データ記入用紙）</strong>かどうかを自動判定します。
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      <li>対応フォーマット以外の画像は<strong>エラー表示</strong>されます</li>
                      <li>風景写真や関係ない画像を誤ってアップロードしても安全です</li>
                      <li>正しい用紙の場合は「検証をスキップ」オプションも利用可能</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">書類タイプ</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">タイプ</th>
                          <th className="text-left py-2 px-3">用途</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">登録時用紙（1回目）</td>
                          <td className="py-2 px-3">新規患者の初回登録用</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">フォローアップ（2回目以降）</td>
                          <td className="py-2 px-3">追加の検査データ登録用</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">その他の記録</td>
                          <td className="py-2 px-3">その他の記録用</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 分析 */}
          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>データ分析</CardTitle>
                <CardDescription>分析機能の使い方と解釈</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">分析画面</h3>
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <Image
                      src="/guide-images/analysis-page.png"
                      alt="データ分析画面"
                      width={800}
                      height={450}
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    解析対象患者数、50% Responder Rate、亜鉛補充群/対照群、亜鉛欠乏群/正常群の比較が表示されます。
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">50% Responder Rate</h3>
                  <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                    <p className="text-blue-900">
                      ベースラインから発作回数が<strong>50%以上減少</strong>した患者の割合
                    </p>
                    <p className="text-sm text-blue-700">
                      計算式: (ベースライン発作数 - 直近発作数) / ベースライン発作数 ≥ 0.5
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">群間比較</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">亜鉛補充群 vs 対照群</h4>
                      <p className="text-sm text-green-700">
                        亜鉛サプリメント補充の有無で群分け
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-900 mb-2">亜鉛欠乏群 vs 正常群</h4>
                      <p className="text-sm text-orange-700">
                        ベースライン血清亜鉛値 80 µg/dL で群分け
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">統計検定</h3>
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <p className="font-medium">Mann-Whitney U検定（Wilcoxon順位和検定）</p>
                    <p className="text-sm text-gray-600">
                      2群間の発作減少率を比較するノンパラメトリック検定
                    </p>
                    <div className="text-sm">
                      <p><span className="font-medium">U統計量</span>：順位に基づく検定統計量</p>
                      <p><span className="font-medium">Z値</span>：正規近似によるZ統計量</p>
                      <p><span className="font-medium">p値</span>：有意確率（両側検定）</p>
                    </div>
                    <div className="mt-2 text-sm">
                      <p>* p &lt; 0.05（有意）</p>
                      <p>** p &lt; 0.01（高度に有意）</p>
                      <p>*** p &lt; 0.001（極めて有意）</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">必要なデータ</h3>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-800">
                      分析を行うには、各患者に<strong>2件以上の発作日誌</strong>が必要です。
                      ベースラインと最新のデータを比較して変化率を算出します。
                    </p>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          {/* エクスポート */}
          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>データエクスポート</CardTitle>
                <CardDescription>データのダウンロード方法</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">エクスポート画面</h3>
                  <div className="border rounded-lg overflow-hidden mb-4">
                    <Image
                      src="/guide-images/export-page.png"
                      alt="データエクスポート画面"
                      width={800}
                      height={450}
                      className="w-full h-auto"
                    />
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">出力形式</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">CSV形式</h4>
                      <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                        <li>Excel、Rで開きやすい</li>
                        <li>データ種類ごとに別ファイル</li>
                        <li>文字コード: UTF-8 (BOM付き)</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">JSON形式</h4>
                      <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                        <li>Python等での処理に適している</li>
                        <li>全データが1ファイル</li>
                        <li>階層構造を保持</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">エクスポート対象</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">データ種類</th>
                          <th className="text-left py-2 px-3">内容</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">患者基本情報</td>
                          <td className="py-2 px-3">ID、性別、年齢、ベースライン情報、背景</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">血液検査記録</td>
                          <td className="py-2 px-3">検査日、血清亜鉛/銅/鉄、亜鉛補充状況</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">発作日誌</td>
                          <td className="py-2 px-3">月別発作回数、重症発作、入院</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">AED記録</td>
                          <td className="py-2 px-3">薬剤、用量、変更内容</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Rでの読み込み例</h3>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <pre className="text-sm text-green-400 overflow-x-auto">
{`# CSVファイルの読み込み
patients <- read.csv("施設ID_patients_2024-01-01.csv",
                     fileEncoding = "UTF-8")

labResults <- read.csv("施設ID_labResults_2024-01-01.csv",
                       fileEncoding = "UTF-8")

# 亜鉛欠乏の定義
labResults$zinc_deficient <- labResults$serumZinc < 80

# 群間比較
wilcox.test(seizureChange ~ zinc_deficient,
            data = merged_data)`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Pythonでの読み込み例</h3>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <pre className="text-sm text-green-400 overflow-x-auto">
{`import pandas as pd
from scipy import stats

# CSVファイルの読み込み
patients = pd.read_csv("施設ID_patients_2024-01-01.csv")
lab_results = pd.read_csv("施設ID_labResults_2024-01-01.csv")

# 亜鉛欠乏の定義
lab_results['zinc_deficient'] = lab_results['serumZinc'] < 80

# Mann-Whitney U検定
deficient = data[data['zinc_deficient']]['seizure_change']
normal = data[~data['zinc_deficient']]['seizure_change']
stat, p_value = stats.mannwhitneyu(deficient, normal)`}
                    </pre>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 管理機能 */}
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>管理機能</CardTitle>
                <CardDescription>ユーザー管理と承認システム</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="text-lg font-semibold mb-3">ユーザー登録フロー</h3>
                  <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                    <ol className="list-decimal list-inside space-y-2 text-blue-900">
                      <li>新規ユーザーが<strong>新規登録画面</strong>で氏名・メール・施設を入力して登録</li>
                      <li>登録後は<strong>「承認待ち」状態</strong>となり、システムにアクセスできません</li>
                      <li>管理者が<strong>管理画面 → ユーザー一覧</strong>で承認ボタンを押す</li>
                      <li>承認後、ユーザーはダッシュボードにアクセスできるようになります</li>
                    </ol>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">管理画面へのアクセス</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 mb-2">
                      管理者権限を持つユーザーのみ、ナビゲーションに<strong>「管理」メニュー</strong>が表示されます。
                    </p>
                    <p className="text-sm text-gray-500">
                      ※ 最初の管理者は Firebase Console で直接 users コレクションの role を &quot;admin&quot; に設定してください。
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">ユーザー管理</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">承認待ちユーザー</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>ユーザー一覧で「承認待ち」バッジを確認</li>
                        <li>「承認」ボタンで承認</li>
                        <li>「削除」ボタンで拒否（ユーザーデータ削除）</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">承認済みユーザー</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>権限変更（一般 ↔ 管理者）が可能</li>
                        <li>管理者は全データにアクセス可能</li>
                        <li>一般ユーザーは管理機能にアクセス不可</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">セキュリティについて</h3>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-2">
                      <li>新規登録ユーザーは<strong>管理者の承認が必要</strong>です</li>
                      <li>未承認ユーザーは患者データにアクセスできません</li>
                      <li>患者データは<strong>施設ごとに分離</strong>されています</li>
                      <li>他施設のデータにはアクセスできません</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3">Firebase Console での設定</h3>
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <p className="text-gray-700">
                      最初の管理者を設定するには：
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                      <li><a href="https://console.firebase.google.com" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Firebase Console</a> を開く</li>
                      <li>プロジェクト → Firestore Database を選択</li>
                      <li>users コレクション → 対象ユーザーのドキュメントを開く</li>
                      <li>role フィールドを &quot;admin&quot; に変更</li>
                      <li>approved フィールドを true に変更</li>
                    </ol>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center text-sm text-gray-600">
          <p>ご不明点がありましたら、研究事務局までお問い合わせください。</p>
        </div>
      </main>
    </div>
  );
}
