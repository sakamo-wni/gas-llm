// Slackワークフロー連携アプリ - メインエントリーポイント

// 設定値を関数で取得する方式に変更
function getConfig() {
  return {
    SPREADSHEET_ID: "YOUR_SPREADSHEET_ID",
    CALENDAR_ID: "YOUR_CALENDAR_ID",
    GEMINI_API_KEY: "YOUR_GEMINI_API_KEY",
    SLACK_BOT_TOKEN: "YOUR_SLACK_BOT_TOKEN",
    SLACK_CHANNEL_ID: "YOUR_SLACK_CHANNEL_ID"
  };
}

// CONFIG変数を定義
var CONFIG = getConfig();

// Slackワークフローからのリクエストを受信
function doPost_original(e) {
  try {
    console.log('=== doPost関数開始 ===');
    console.log('eオブジェクト全体:', JSON.stringify(e, null, 2));
    
    // 受信データの詳細チェック
    if (!e) {
      console.error('eオブジェクトが存在しません');
      return ContentService.createTextOutput('No event object').setMimeType(ContentService.MimeType.TEXT);
    }
    
    // postDataの詳細チェック
    if (!e.postData) {
      console.error('postDataが存在しません');
      console.log('利用可能なプロパティ:', Object.keys(e));
      return ContentService.createTextOutput('No postData').setMimeType(ContentService.MimeType.TEXT);
    }
    
    // contentsの詳細チェック
    if (!e.postData.contents) {
      console.error('contentsが存在しません');
      console.log('postDataのプロパティ:', Object.keys(e.postData));
      console.log('postData.type:', e.postData.type);
      console.log('postData.length:', e.postData.length);
      return ContentService.createTextOutput('No contents').setMimeType(ContentService.MimeType.TEXT);
    }
    
    console.log('受信データ:', e.postData.contents);
    console.log('データ長:', e.postData.contents.length);
    console.log('データ型:', typeof e.postData.contents);
    
    let params;
    try {
      params = JSON.parse(e.postData.contents);
      console.log('パース成功');
      console.log('パラメータのキー:', Object.keys(params));
      console.log('params.type:', params.type);
      console.log('params.challenge:', params.challenge);
    } catch (parseError) {
      console.error('JSON解析エラー:', parseError.toString());
      console.log('解析失敗データ:', e.postData.contents);
      console.log('最初の100文字:', e.postData.contents.substring(0, 100));
      return ContentService.createTextOutput('Parse error: ' + parseError.toString()).setMimeType(ContentService.MimeType.TEXT);
    }

    // Slackイベント認証（URL Verification）
    if (params.type === 'url_verification') {
      console.log('=== URL Verification 処理開始 ===');
      console.log('challenge値の型:', typeof params.challenge);
      console.log('challenge値の長さ:', params.challenge ? params.challenge.length : 'undefined');
      console.log('challenge値:', params.challenge);
      
      if (!params.challenge) {
        console.error('challengeパラメータが存在しません');
        return ContentService.createTextOutput('No challenge parameter').setMimeType(ContentService.MimeType.TEXT);
      }
      
      const challengeResponse = String(params.challenge);
      console.log('文字列に変換後:', challengeResponse);
      console.log('返却する値:', challengeResponse);
      
      const response = ContentService.createTextOutput(challengeResponse);
      console.log('=== URL Verification 処理完了 ===');
      return response;
    }

    // Slackイベント（app_mention）の処理
    if (params.event && params.event.type === 'app_mention') {
      console.log('app_mentionイベントを検出');
      // 非同期処理のため、即座に200 OKを返す
      processAppMention(params.event);
      return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // リトライ処理の場合
    if (params.retry && params.originalData) {
      return processRetry(e);
    }

    // Slackワークフローからの入力データ
    const date = params.date;
    const creator = params.creator;
    const title = params.title;
    const location = params.location;
    const threadTs = params.thread_ts; // スレッドのタイムスタンプ

    // メイン処理を実行
    const result = processReservation({
      date: date,
      creator: creator,
      title: title,
      location: location,
      threadTs: threadTs,
    });

    // Slackに結果を返す
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
      ContentService.MimeType.JSON
    );
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// メイン処理
function processReservation(data) {
  try {
    // 1. スプレッドシートに記録
    writeToSpreadsheet(data);

    // 2. カレンダーに予約を試みる
    const calendarResult = createCalendarEvent(data);

    if (calendarResult.success) {
      // 予約成功時の処理
      // 作成者に成功通知を送信（スレッド返信）
      // 日時をJST形式に変換
      const jstDateForReply = new Date(data.date);
      const jstDateStringForReply = Utilities.formatDate(
        jstDateForReply,
        "JST",
        "yyyy年MM月dd日 HH:mm"
      );

      // メールアドレスからSlackユーザーIDを取得
      console.log('作成者情報:', data.creator);
      const userId = findUserByEmail(data.creator);
      console.log('取得したユーザーID:', userId);
      const mentionText = userId ? `<@${userId}>` : data.creator;
      
      const meetUrlText = calendarResult.meetUrl ? `\nGoogle Meet: ${calendarResult.meetUrl}` : '';
      sendSlackThreadReply(
        CONFIG.SLACK_CHANNEL_ID,
        data.threadTs,
        `${mentionText} 予約が完了しました！\n日時: ${jstDateStringForReply}\nタイトル: ${data.title}\n場所: ${data.location}${meetUrlText}`
      );

      // 告知文を生成してチャンネルに投稿
      // 日時をJST形式に変換
      const jstDate = new Date(data.date);
      const jstDateString = Utilities.formatDate(
        jstDate,
        "JST",
        "yyyy年MM月dd日 HH:mm"
      );

      const announcementData = {
        ...data,
        date: jstDateString,
        description: data.description || "",
        meetUrl: calendarResult.meetUrl || ""
      };

      const announcement = generateAnnouncement(announcementData);
      postToChannel(announcement);

      return {
        success: true,
        message: "予約が完了しました",
      };
    } else {
      // 予約失敗時の処理（スレッド返信）
      // 日時をJST形式に変換
      const jstDateForError = new Date(data.date);
      const jstDateStringForError = Utilities.formatDate(
        jstDateForError,
        "JST",
        "yyyy年MM月dd日 HH:mm"
      );

      // メールアドレスからSlackユーザーIDを取得
      const userIdForError = findUserByEmail(data.creator);
      const mentionTextForError = userIdForError ? `<@${userIdForError}>` : data.creator;
      
      sendSlackThreadReply(
        CONFIG.SLACK_CHANNEL_ID,
        data.threadTs,
        `${mentionTextForError} 申し訳ございません。${jstDateStringForError}は既に予約が入っています。\n既存の予約: ${calendarResult.conflictingEvents.join(
          ", "
        )}\n\n第二希望の日時をこのスレッドに返信してください。`
      );

      return {
        success: false,
        message: "予約が失敗しました",
        needRetry: true,
      };
    }
  } catch (error) {
    console.error("processReservation エラー:", error);
    throw error;
  }
}

// 再試行処理（第二希望以降の処理）
function processRetry(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const userMessage = params.text;
    const originalData = params.originalData;

    // Gemini APIで日付を抽出
    const extractedDate = extractDateFromMessage(userMessage);

    if (extractedDate) {
      // 新しい日付で再度予約を試みる
      const retryData = {
        ...originalData,
        date: extractedDate,
      };

      return processReservation(retryData);
    } else {
      sendSlackMessage(
        originalData.creator,
        "日付を認識できませんでした。もう一度日時をお知らせください。"
      );
      return {
        success: false,
        message: "日付の抽出に失敗しました",
      };
    }
  } catch (error) {
    console.error("processRetry エラー:", error);
    throw error;
  }
}

// スプレッドシート変更時のトリガー
function onSpreadsheetChange(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = sheet.getLastRow();

    // ヘッダー行しかない場合は処理しない
    if (lastRow <= 1) return;

    // 最新行のデータを取得（9列まで取得）
    const data = sheet.getRange(lastRow, 1, 1, 9).getValues()[0];
    
    // デバッグ：全データを確認
    console.log('スプレッドシートの行データ:', data);
    console.log('B列（作成者）:', data[1]);

    // 空のデータは処理しない（第一希望の日付をチェック）
    if (!data[4]) return; // E列: 第一希望 が空の場合

    // 日付を適切な形式に変換
    const dateValue = data[4]; // E列: 第一希望
    let formattedDate;

    // デバッグログ
    console.log("元の日付データ:", dateValue);
    console.log("データ型:", typeof dateValue);

    if (dateValue instanceof Date) {
      // Dateオブジェクトの場合
      // スプレッドシートの日付を正しくJSTとして扱う
      formattedDate = Utilities.formatDate(
        dateValue,
        "JST",
        "yyyy-MM-dd HH:mm"
      );
      console.log("変換後の日付:", formattedDate);
    } else {
      // 文字列の場合
      formattedDate = dateValue;
    }

    // メイン処理を実行
    processReservation({
      date: formattedDate,                // E列: 第一希望
      creator: data[1],                   // B列: 作成者
      title: data[2],                     // C列: タイトル
      location: data[3] || "コミプラ",      // D列: 場所（空なら「コミプラ」）
      threadTs: extractThreadTs(data[8]), // I列: tsを含むURL
      description: data[7] || "",         // H列: 概要
      secondDate: data[5] || null         // F列: 第二希望（今後の拡張用）
    });
  } catch (error) {
    console.error("onSpreadsheetChange エラー:", error);
  }
}

// URLからthread_tsを抽出
function extractThreadTs(url) {
  if (!url) return null;
  const match = url.match(/p(\d+)/);
  return match ? (parseInt(match[1]) / 1000000).toString() : null;
}

// テスト用: GET リクエストの処理
function doGet_original(e) {
  console.log('doGet関数が呼び出されました');
  console.log('パラメータ:', e.parameter);
  
  return ContentService.createTextOutput('Google Apps Script is working!')
    .setMimeType(ContentService.MimeType.TEXT);
}

// app_mentionイベントを処理
function processAppMention(event) {
  try {
    console.log('app_mentionイベントを受信:', JSON.stringify(event));
    
    // ボット自身のメッセージは無視
    if (event.bot_id) {
      return;
    }
    
    // すぐにリアクションを追加（考え中を示す）
    addSlackReaction(event.channel, event.ts, 'thinking_face');
    
    // メンションを除去してメッセージを取得
    const botUserId = event.authorizations && event.authorizations[0] ? 
      event.authorizations[0].user_id : null;
    let userMessage = event.text;
    
    // ボットのメンションを削除
    if (botUserId) {
      userMessage = userMessage.replace(new RegExp(`<@${botUserId}>`, 'g'), '').trim();
    }
    
    // Gemini APIでメッセージに対する応答を生成
    const response = generateChatResponse(userMessage, event.user);
    
    // Slackに返信
    if (event.thread_ts) {
      // スレッド内のメンションの場合
      sendSlackThreadReply(event.channel, event.thread_ts, response);
    } else {
      // 通常のチャンネルでのメンションの場合
      sendSlackThreadReply(event.channel, event.ts, response);
    }
    
    // 成功したら考え中のリアクションを削除して、完了のリアクションを追加
    removeSlackReaction(event.channel, event.ts, 'thinking_face');
    addSlackReaction(event.channel, event.ts, 'white_check_mark');
    
  } catch (error) {
    console.error('app_mention処理エラー:', error);
    
    // エラー時はリアクションを変更
    try {
      removeSlackReaction(event.channel, event.ts, 'thinking_face');
      addSlackReaction(event.channel, event.ts, 'x');
    } catch (e) {
      console.error('リアクション変更エラー:', e);
    }
    
    // エラー時もユーザーに通知
    try {
      const errorMessage = '申し訳ございません。エラーが発生しました。もう一度お試しください。';
      if (event.thread_ts) {
        sendSlackThreadReply(event.channel, event.thread_ts, errorMessage);
      } else {
        sendSlackThreadReply(event.channel, event.ts, errorMessage);
      }
    } catch (e) {
      console.error('エラー通知の送信も失敗:', e);
    }
  }
}
