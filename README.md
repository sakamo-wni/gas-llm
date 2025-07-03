# Google Apps Script 会議室予約システム

## 概要

このシステムは、Slackワークフロー/イベントAPI経由でGoogle Apps Scriptを利用し、Googleカレンダーとスプレッドシートを使った会議室予約システムです。

### 主な機能

- 📅 **Slackワークフローによる予約受付**: Slackから簡単に会議室予約を申請
- 🔄 **第二希望自動フォールバック**: 第一希望が空いていない場合、自動的に第二希望で予約を試行
- 🤖 **AI チャットボット機能**: Slack mentions に対して Gemini API で自然な対話を提供
- 📊 **スプレッドシート管理**: 全ての予約情報をスプレッドシートで一元管理
- 🔔 **事前通知システム**: 24時間前/3時間前/3分前にSlackで通知
- 📢 **自動告知生成**: Gemini API により魅力的な告知文を自動生成
- 🎥 **Google Meet 統合**: カレンダーイベントにGoogle Meetを自動追加

## システム構成

### ファイル構成と役割

#### 1. エントリーポイント系

**Main.gs** - メインエントリーポイント
- システムの最初の読み込みファイル
- `doPost()` / `doGet()` 関数の定義
- 関数存在チェック機能(`checkFunctions`)

**Code.gs** - 実際のリクエスト処理
- `doPost_original()`: POSTリクエスト処理
- `doGet_original()`: GETリクエスト処理  
- Slackイベント（URL認証、app_mention）の処理
- スプレッドシート変更トリガーの処理(`onSpreadsheetChange`)

#### 2. 設定・共通系

**ConfigHandler.gs** - 設定管理
- `getCONFIG()`: 設定値の取得
- `getConfigValues()`: スクリプトプロパティから設定値を取得
- `clearConfigCache()`: 設定キャッシュをクリア

**DateTimeHandler.gs** - 日時処理ユーティリティ
- `formatDateToJST(date, format)`: JST形式への日付変換
- `extractThreadTs(url)`: URLからのthread_ts抽出
- `convertSpreadsheetDate(dateValue)`: スプレッドシート日付値の変換
- `getTimeDifferenceInMinutes(date1, date2)`: 時間差を計算（分単位）

#### 3. 外部サービス連携系

**SlackHandler.gs** - Slack操作関連
- `findUserByEmail(email_address)`: ユーザーID取得（メールアドレスから）
- `sendSlackThreadReply(channelId, threadTs, message)`: スレッド返信
- `sendSlackMessage(userId, message)`: ダイレクトメッセージ送信
- `postToChannel(message)`: チャンネル投稿
- `addSlackReaction(channel, timestamp, reaction)`: リアクション追加
- `removeSlackReaction(channel, timestamp, reaction)`: リアクション削除
- `sendWorkflowResponse(responseUrl, message, success)`: ワークフロー応答

**GeminiHandler.gs** - Gemini API連携
- `generateAnnouncement(data)`: 告知文生成
- `extractDateFromMessage(message)`: メッセージからの日付抽出
- `generateChatResponse(message, userId)`: チャット応答生成

**CalendarHandler.gs** - Googleカレンダー操作
- `createCalendarEvent(data)`: イベント作成・重複チェック
- `checkCalendarAvailability(dateString)`: 予約状況確認
- `setupSlackNotificationTriggers(eventId, eventStartTime)`: Slack通知トリガー設定
- `sendSlackNotification()`: 時間ベーストリガーで呼ばれる通知送信
- `sendWebhookMessage(webhookUrl, text)`: Webhook URL へメッセージ送信

#### 4. データ管理系

**SpreadsheetHandler.gs** - スプレッドシート操作
- `writeToSpreadsheet(data)`: 予約データの書き込み
- `updateReservationStatus(data, status)`: ステータス更新

**ReservationHandler.gs** - 予約処理ロジック
- `processReservation(data)`: メイン予約処理
- `handleReservationSuccess(data, calendarResult, isSecondChoice)`: 成功時の処理分岐
- `handleReservationFailure(data, calendarResult)`: 失敗時の処理

#### 5. テスト系

**TestFunction.gs** - 機能テスト
- `testGenerateAnnouncement()`: 告知文生成のテスト
- `testProcessReservation()`: 予約処理のテスト
- `debugFullFlow()`: 全体的な動作フローのデバッグ

**SimpleTest.gs** - 基本テスト
- `testLog()`: ログ出力テスト
- `testConfig()`: 設定値確認
- `listAllFunctions()`: 関数一覧表示
- `testGenerateAnnouncementDirect()`: 告知文生成の直接テスト

**TestTrigger.gs** - トリガーテスト
- `testCreate3MinutesEvent()`: 通知機能のテスト
- `testSendNotificationManually()`: 手動通知テスト
- `checkAdvancedCalendarService()`: Advanced Calendar Service確認
- `checkTriggers()`: トリガーの状態確認
- `deleteAllTriggers()`: 全トリガー削除（注意して使用）

**TestSlack.gs**, **NewSlackTest.gs** - Slack Event API テスト用

## データフロー

### 1. 予約申請フロー
```
Slackワークフロー → doPost() → processReservation() → createCalendarEvent()
                                      ↓
                 ← 告知投稿 ← generateAnnouncement() ← 予約成功
```

### 2. 第二希望フォールバックフロー
```
第一希望失敗 → 第二希望データ作成 → createCalendarEvent() → 成功時は完了
                                                    ↓
                                              失敗時はユーザーに再入力依頼
```

### 3. Chat機能フロー
```
Slack app_mention → processAppMention() → generateChatResponse() → Slack返信
```

### 4. 通知フロー
```
イベント作成時 → setupSlackNotificationTriggers() → 時間ベーストリガー作成
時間到達時 → sendSlackNotification() → Webhook通知送信
```

### 5. スプレッドシート変更監視フロー
```
スプレッドシート変更 → onSpreadsheetChange() → processReservation()
```

## 設定項目 (スクリプトプロパティ)

| キー | 説明 | 必須 |
|------|------|------|
| `SPREADSHEET_ID` | 予約管理用スプレッドシートのID | ✅ |
| `CALENDAR_ID` | 予約対象のカレンダーID | ✅ |
| `GEMINI_API_KEY` | Gemini APIのAPIキー | ✅ |
| `SLACK_BOT_TOKEN` | SlackボットのOAuthトークン | ✅ |
| `SLACK_CHANNEL_ID` | 告知投稿先のチャンネルID | ✅ |
| `SLACK_WEBHOOK_URL` | 通知用のWebhook URL | ⚠️ |
| `SLACK_MESSAGE_TEMPLATE_24H` | 24時間前通知のメッセージテンプレート | ⚠️ |
| `SLACK_MESSAGE_TEMPLATE_3H` | 3時間前通知のメッセージテンプレート | ⚠️ |
| `SLACK_MESSAGE_TEMPLATE_3M` | 3分前通知のメッセージテンプレート | ⚠️ |
| `NOTIFICATION_SHEET_NAME` | 通知管理用シート名 | ⚠️ |
| `RESERVATION_SHEET_NAME` | 予約管理用シート名 | ⚠️ |

- ✅ 必須: システムの基本動作に必要
- ⚠️ オプション: 通知機能に必要（未設定でも基本機能は動作）

## スプレッドシート構成

### メインシート（予約データ）
| 列 | 項目 | 説明 |
|----|------|------|
| A | 日付 | 記録日時 |
| B | 作成者 | 予約者のメールアドレス |
| C | タイトル | 会議のタイトル |
| D | 場所 | 会議の場所 |
| E | 第一希望 | 第一希望の日時 |
| F | 第二希望 | 第二希望の日時（オプション） |
| G | ステータス | 処理中/完了/失敗/エラー |
| H | 概要 | 会議の概要（オプション） |
| I | tsを含むURL | SlackのスレッドURL（オプション） |

### 通知管理シート（NOTIFICATION_SHEET_NAME）
| 列 | 項目 | 説明 |
|----|------|------|
| A | イベントID | カレンダーイベントのID |
| B | 通知タイプ | 24h/3h/3m |
| C | 通知時刻 | 通知送信予定時刻 |
| D | 通知済み | 送信済みフラグ |
| E | 作成日時 | トリガー作成日時 |

## セットアップ手順

### 1. Google Apps Script プロジェクト作成
1. [Google Apps Script](https://script.google.com/) でプロジェクト作成
2. すべての `.gs` ファイルをコピー

### 2. Google Services 有効化
- Google Calendar API を Advanced Google Services で有効化

### 3. スクリプトプロパティ設定
1. プロジェクト設定 → スクリプトプロパティ
2. 上記の設定項目を追加

### 4. Slack アプリ設定
1. [Slack API](https://api.slack.com/apps) でアプリ作成
2. OAuth スコープ設定:
   - `app_mentions:read`
   - `channels:history`
   - `chat:write`
   - `reactions:write`
   - `users:read.email`
3. Event Subscriptions で Request URL を GAS の Web アプリ URL に設定
4. app_mention イベントを購読

### 5. Slackワークフロー設定
1. Slackで「オートメーション」→「ワークフロー」を選択
2. 「ワークフローを作成」をクリック
3. トリガーを設定（例: フォーム送信）
4. 入力フォームを作成:
   - 日付（date）: テキスト入力
   - 作成者（creator）: ユーザー選択
   - タイトル（title）: テキスト入力
   - 場所（location）: テキスト入力
5. ステップを追加 → 「外部サービスに接続」 → 「Webhookを送信」
6. Webhook設定:
   - URL: GASのWebアプリURL
   - メソッド: POST
   - ヘッダー: `Content-Type: application/json`
   - ボディ:
     ```json
     {
       "date": "{{date}}",
       "creator": "{{creator}}",
       "title": "{{title}}",
       "location": "{{location}}",
       "thread_ts": "{{thread_timestamp}}"
     }
     ```

### 6. デプロイ
1. デプロイ → 新しいデプロイ
2. 種類: Webアプリ
3. 実行ユーザー: 自分
4. アクセス権限: 全員

## 使用方法

### 基本的な予約フロー
1. Slackワークフローを実行
2. フォームに入力:
   - 日付: `2025-07-03 14:00`
   - 作成者: 自分を選択
   - タイトル: `チーム会議`
   - 場所: `会議室A`
3. システムが自動的に:
   - スプレッドシートに記録
   - カレンダーの空き状況を確認
   - 予約可能な場合: カレンダーに登録、成功通知、告知投稿
   - 予約不可の場合: 第二希望を試行、それも失敗なら再入力要求

### 第二希望機能
- 第一希望が空いていない場合、自動的に第二希望で予約を試行
- 第二希望も失敗した場合、ユーザーに新しい日時の入力を要請

### チャットボット機能
- Slackでボットにメンションすると、Gemini APIで自然な対話応答
- 予約に関する質問から一般的な雑談まで対応

### 通知機能
- 予約イベントの24時間前/3時間前/3分前にSlack通知
- カスタマイズ可能なメッセージテンプレート

## エラーハンドリング

### 一般的なエラー対応
- APIエラー: コンソールログ出力 + デフォルト処理
- 設定値エラー: フォールバック値使用
- 外部API障害: エラーメッセージをSlackに通知

### 予約処理のエラー対応
- 第一希望失敗 → 第二希望で自動リトライ
- 第二希望も失敗 → ユーザーに新しい日時の入力を要請
- システムエラー → 管理者への通知

### 通知システムのエラー対応
- 通知送信失敗 → 次回トリガー実行時に再試行
- イベント取得失敗 → 通知済みフラグを立ててスキップ

## トラブルシューティング

### よくある問題

**1. 関数が見つからないエラー**
- `checkFunctions()` でスクリプトの読み込み状況を確認
- Main.gs が最初に読み込まれているか確認

**2. Google Meet URLが生成されない**
- Advanced Calendar API が有効になっているか確認
- `checkAdvancedCalendarService()` でサービス状態を確認

**3. Slack通知が送信されない**
- SLACK_WEBHOOK_URL が正しく設定されているか確認
- `testSendNotificationManually()` でテスト実行

**4. 予約の重複が発生する**
- カレンダーIDが正しく設定されているか確認
- `checkCalendarAvailability()` で予約状況を確認

### デバッグ用関数

- `debugFullFlow()` - 全体的な動作フローのデバッグ
- `testGenerateAnnouncement()` - 告知文生成のテスト
- `testProcessReservation()` - 予約処理のテスト
- `checkTriggers()` - トリガーの状態確認
- `listAllFunctions()` - 定義されている関数一覧を表示

### ログの確認方法
1. Google Apps Scriptエディタで「実行」→「関数を実行」
2. 「表示」→「ログ」でエラー内容を確認
3. Stackdriver Loggingでより詳細なログを確認可能

## パフォーマンス考慮事項

### キャッシュ機能
- 設定値のメモリキャッシュ
- API応答の一時保存

### 実行時間制限対策
- 各処理の分離
- エラー時の早期リターン
- 重い処理の非同期化（トリガー利用）

## セキュリティ

### 機密情報の保護
- APIキーはスクリプトプロパティで管理
- ログには機密情報を出力しない
- SlackトークンやAPIキーは環境変数で分離

### アクセス制御
- Slackアプリの適切なスコープ設定
- GASの実行権限制限
- Webhook URLの秘匿

## 注意事項

- 日付形式は "YYYY-MM-DD HH:mm" を推奨
- カレンダーへのアクセス権限を適切に設定
- Slack Bot Tokenは安全に管理
- Gemini APIには使用制限があるため、必要に応じて有料プランを検討
- 時間ベーストリガーには制限があるため、大量の予約には注意

## 今後の拡張予定

- [ ] 複数会議室対応
- [ ] 繰り返し予約機能
- [ ] 参加者管理機能
- [ ] 統計レポート機能
- [ ] モバイル対応のUI改善
- [ ] より高度な自然言語処理
- [ ] 会議室の利用統計ダッシュボード

---

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。