# GAS Slack連携アプリ セットアップガイド

## 必要なTOKEN・KEYの取得方法

### 1. SPREADSHEET_ID の取得

1. 新しいGoogleスプレッドシートを作成
2. スプレッドシートのURLから取得
   ```
   https://docs.google.com/spreadsheets/d/【ここがSPREADSHEET_ID】/edit
   ```
3. 例: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 2. CALENDAR_ID の取得

1. Googleカレンダーを開く
2. 左側の「マイカレンダー」から使用するカレンダーの3点メニューをクリック
3. 「設定と共有」を選択
4. 下にスクロールして「カレンダーの統合」セクション
5. 「カレンダーID」をコピー
6. 形式:
   - 個人カレンダー: `your-email@gmail.com`
   - 共有カレンダー: `c_xxxxxx@group.calendar.google.com`

### 3. GEMINI_API_KEY の取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. 「Create API key」をクリック
4. 新しいプロジェクトを作成または既存のプロジェクトを選択
5. APIキーが生成される
6. 形式: `AIzaSyD-xxxxxxxxxxxxxxxxxxxxxx`

### 4. SLACK_BOT_TOKEN の取得

1. [Slack API](https://api.slack.com/apps) にアクセス
2. 「Create New App」→「From scratch」を選択
3. App Nameとワークスペースを設定
4. 左メニューから「OAuth & Permissions」を選択
5. 「Scopes」セクションで以下のBot Token Scopesを追加：
   - `chat:write` - メッセージ送信権限
   - `chat:write.public` - パブリックチャンネルへの投稿権限
   - `users:read` - ユーザー情報読み取り権限
6. ページ上部の「Install to Workspace」をクリック
7. 権限を確認して「許可する」
8. 「Bot User OAuth Token」をコピー
9. 形式: `xoxb-1234567890-xxxxxxxxxxxxx`

### 5. SLACK_CHANNEL_ID の取得

1. Slackで告知を投稿したいチャンネルを開く
2. チャンネル名を右クリック
3. 「チャンネル詳細を表示」または「View channel details」を選択
4. ポップアップの一番下にある「チャンネルID」をコピー
5. 形式: `C1234567890`（Cで始まる英数字）

## 設定方法

Code.gsファイルの`CONFIG`オブジェクトに取得した値を設定：

```javascript
const CONFIG = {
  SPREADSHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  CALENDAR_ID: 'c_47aa4b7ccd25770a2e8056f6bbbcf3eb34fa6ac5af2c9b05fd00939ba510fcb2@group.calendar.google.com',
  GEMINI_API_KEY: 'AIzaSyD-xxxxxxxxxxxxxxxxxxxxxx',
  SLACK_BOT_TOKEN: 'xoxb-1234567890-xxxxxxxxxxxxx',
  SLACK_CHANNEL_ID: 'C09034N2FLN'
};
```

## Slackワークフローの設定

### ワークフローの作成

1. Slack Workflow Builderを開く
2. 「Create」をクリック
3. ワークフロー名を設定

### 入力フォームの設定

以下の4つのフィールドを作成：

1. **date** (日付)
   - タイプ: Text
   - 形式: `YYYY-MM-DD HH:mm`
   - 例: `2024-03-15 14:00`

2. **creator** (作成者)
   - タイプ: Person picker
   - ユーザーを選択

3. **title** (タイトル)
   - タイプ: Text
   - イベント名を入力

4. **location** (場所)
   - タイプ: Text
   - 開催場所を入力

### Webhook設定

1. アクションで「Send a webhook」を選択
2. URL: GAS Web AppのデプロイURL
3. Method: POST
4. Headers:
   ```
   Content-Type: application/json
   ```
5. Body:
   ```json
   {
     "date": "{{date}}",
     "creator": "{{creator}}",
     "title": "{{title}}",
     "location": "{{location}}",
     "thread_ts": "{{thread_timestamp}}"
   }
   ```

## 再試行フローの設定

予約が失敗した場合の第二希望受付用：

1. スレッドでの返信を検知するトリガーを設定
2. Webhookで以下を送信：
   ```json
   {
     "retry": true,
     "text": "{{message_text}}",
     "originalData": {
       "creator": "{{original_creator}}",
       "title": "{{original_title}}",
       "location": "{{original_location}}"
     }
   }
   ```

## 注意事項

- APIキーやTokenは安全に管理してください
- カレンダーへの編集権限が必要です
- Slack Appがワークスペースにインストールされている必要があります
- スプレッドシートへの編集権限が必要です