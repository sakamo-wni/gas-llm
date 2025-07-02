# Slack連携GASアプリ

SlackワークフローとGemini APIを使用した予約管理システムです。

## 機能

- Slackワークフローから日付、作成者、タイトル、場所の情報を受信
- スプレッドシートへの記録
- Googleカレンダーへの予約登録
- Gemini APIを使った告知文の自動生成
- 予約失敗時の再試行フロー（LLMによる日付抽出）

## 完全セットアップ手順

### 1. Google Apps Scriptプロジェクトの作成

#### 方法A: スプレッドシートから作成（推奨）
1. 作成したスプレッドシートを開く
2. メニューから「拡張機能」→「Apps Script」
3. デフォルトの`Code.gs`に内容をコピー
4. 「+」ボタンで新規ファイルを作成し、以下を追加：
   - SpreadsheetHandler.gs
   - CalendarHandler.gs
   - SlackHandler.gs
   - GeminiHandler.gs
5. 各ファイルに対応するコードをコピーペースト

#### 方法B: 直接Apps Scriptから作成
1. [Google Apps Script](https://script.google.com/)にアクセス
2. 新しいプロジェクトを作成
3. 上記と同様に5つのファイルを作成してコードをコピー

### 2. 必要なAPIとサービスの設定

#### スプレッドシート
1. 新しいGoogleスプレッドシートを作成
2. スプレッドシートIDをメモ（URLの`/d/`と`/edit`の間の文字列）

#### Googleカレンダー
1. 使用するGoogleカレンダーのIDを取得
2. カレンダー設定 > カレンダーの統合 > カレンダーID

#### Gemini API
1. [Google AI Studio](https://makersuite.google.com/app/apikey)でAPIキーを取得

#### Slack App
1. [Slack API](https://api.slack.com/apps)で新しいアプリを作成
2. OAuth & Permissions で以下のスコープを追加：
   - `chat:write`
   - `chat:write.public`
   - `users:read`
3. Bot User OAuth Tokenを取得
4. アプリをワークスペースにインストール

### 3. 設定ファイルの作成

#### 設定ファイルのセットアップ
```bash
# 設定ファイルテンプレートをコピー
cp config.example.js config.js
```

`config.js` を編集して実際の値を設定：

```javascript
function getConfig() {
  return {
    SPREADSHEET_ID: "your_actual_spreadsheet_id",
    CALENDAR_ID: "your_actual_calendar_id", 
    GEMINI_API_KEY: "your_actual_gemini_api_key",
    SLACK_BOT_TOKEN: "xoxb-your_actual_bot_token",
    SLACK_CHANNEL_ID: "your_actual_channel_id"
  };
}
```

#### セキュリティについて
- `config.js` はGitにコミットされません（`.gitignore`で除外）
- 本番環境では必ず実際の値を設定してください
- APIキーやトークンは安全に管理してください

### 4. Web Appとしてデプロイ

1. Apps Scriptエディタの右上「デプロイ」ボタンをクリック
2. 「新しいデプロイ」をクリック
3. 設定：
   - 種類: 「ウェブアプリ」を選択
   - 説明: 任意（例: 「Slack連携アプリ」）
   - 実行ユーザー: 「自分」
   - アクセスできるユーザー: 「全員」
4. 「デプロイ」ボタンをクリック
5. 表示されるURLをコピー（後でSlackワークフローで使用）
   - 例: `https://script.google.com/macros/s/AKfyc.../exec`

### 5. Slackワークフローの設定

#### 既存のワークフローがある場合
1. Slackでワークフローを開く
2. Webhookアクションを編集
3. URLに上記でコピーしたGASのURLを設定

#### 新規にワークフローを作成する場合
1. Slackで「オートメーション」を開く
2. 「ワークフロー」タブを選択
3. 「ワークフローを作成」をクリック
4. トリガーを設定（例: フォーム送信、特定の絵文字リアクションなど）
5. 入力フォームを作成：
   - 日付（date）: テキスト入力
   - 作成者（creator）: ユーザー選択
   - タイトル（title）: テキスト入力
   - 場所（location）: テキスト入力
6. ステップを追加 > 「外部サービスに接続」 > 「Webhookを送信」
7. Webhook設定：
   - URL: コピーしたGASのURL
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
8. ワークフローを公開

## 動作確認

1. Slackでワークフローを実行
2. フォームに入力：
   - 日付: `2024-03-15 14:00`
   - 作成者: 自分を選択
   - タイトル: `テストイベント`
   - 場所: `会議室A`
3. 送信後、以下を確認：
   - スプレッドシートにデータが記録される
   - カレンダーに予約が登録される
   - Slackに成功通知が届く
   - チャンネルに告知が投稿される

## 使い方

1. Slackワークフローを実行
2. 必要な情報を入力
3. システムが自動的に：
   - スプレッドシートに記録
   - カレンダーの空き状況を確認
   - 予約可能な場合：
     - カレンダーに登録
     - 作成者に成功通知
     - 告知文を生成してチャンネルに投稿
   - 予約不可の場合：
     - 作成者に第二希望を求める
     - 返信から日付を抽出して再試行

## トラブルシューティング

### エラーが発生した場合
1. Apps Scriptエディタで「実行」 > 「関数を実行」 > `doPost`を選択してテスト
2. 「表示」 > 「ログ」でエラー内容を確認

### よくあるエラー
- 「権限がありません」: カレンダーやスプレッドシートの共有設定を確認
- 「Slack APIエラー」: Bot Tokenとスコープを確認
- 「Gemini APIエラー」: APIキーの有効性を確認

## 注意事項

- 日付形式は "YYYY-MM-DD HH:mm" を推奨
- カレンダーへのアクセス権限を適切に設定してください
- Slack Bot Tokenは安全に管理してください
- Gemini APIには使用制限があるため、必要に応じて有料プランを検討