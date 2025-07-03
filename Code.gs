// Slackワークフロー連携アプリ - メインエントリーポイント

// 設定管理関連の関数はConfigHandler.gsに移動しました

// Slackワークフローからのリクエストを受信
function doPost_original(e) {
  try {
    const params = parsePostData(e);
    if (!params) {
      return ContentService.createTextOutput("Invalid request").setMimeType(
        ContentService.MimeType.TEXT
      );
    }
    
    // Slackイベント認証（URL Verification）
    if (params.type === "url_verification") {
      return handleUrlVerification(params);
    }

    // Slackイベント（app_mention）の処理
    if (params.event && params.event.type === "app_mention") {
      processAppMention(params.event);
      return ContentService.createTextOutput(
        JSON.stringify({ ok: true })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // リトライ処理の場合
    if (params.retry && params.originalData) {
      return processRetry(e);
    }

    // Slackワークフローからの入力データ
    const result = processReservation({
      date: params.date,
      creator: params.creator,
      title: params.title,
      location: params.location,
      threadTs: params.thread_ts,
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

// POSTデータのパースとバリデーション
function parsePostData(e) {
  if (!e || !e.postData || !e.postData.contents) {
    console.error("無効なリクエストデータ");
    return null;
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (parseError) {
    console.error("JSON解析エラー:", parseError.toString());
    return null;
  }
}

// URL Verification処理
function handleUrlVerification(params) {
  if (!params.challenge) {
    console.error("challengeパラメータが存在しません");
    return ContentService.createTextOutput(
      "No challenge parameter"
    ).setMimeType(ContentService.MimeType.TEXT);
  }

  return ContentService.createTextOutput(String(params.challenge));
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

    // 空のデータは処理しない（第一希望の日付をチェック）
    if (!data[4]) return; // E列: 第一希望 が空の場合

    // ステータスが既に処理済みの場合は重複処理を防ぐ
    const status = data[6]; // G列: ステータス
    if (status === "完了" || status === "処理中") {
      console.log("既に処理済みのため、重複処理をスキップします:", status);
      return;
    }

    // 日付を適切な形式に変換
    const formattedDate = convertSpreadsheetDate(data[4]); // E列: 第一希望
    const secondDate = data[5] ? convertSpreadsheetDate(data[5]) : null; // F列: 第二希望

    // メイン処理を実行
    processReservation({
      date: formattedDate, // E列: 第一希望
      creator: data[1], // B列: 作成者
      title: data[2], // C列: タイトル
      location: data[3] || "コミプラ", // D列: 場所（空なら「コミプラ」）
      threadTs: extractThreadTs(data[8]), // I列: tsを含むURL
      description: data[7] || "", // H列: 概要
      secondDate: secondDate, // F列: 第二希望（適切に変換）
    });
  } catch (error) {
    console.error("onSpreadsheetChange エラー:", error);
  }
}

// テスト用: GET リクエストの処理
function doGet_original(e) {
  return ContentService.createTextOutput(
    "Google Apps Script is working!"
  ).setMimeType(ContentService.MimeType.TEXT);
}

// app_mentionイベントを処理
function processAppMention(event) {
  try {
    // ボット自身のメッセージは無視
    if (event.bot_id) {
      return;
    }

    // すぐにリアクションを追加（考え中を示す）
    addSlackReaction(event.channel, event.ts, "thinking_face");

    // メンションを除去してメッセージを取得
    const botUserId =
      event.authorizations && event.authorizations[0]
        ? event.authorizations[0].user_id
        : null;
    let userMessage = event.text;

    // ボットのメンションを削除
    if (botUserId) {
      userMessage = userMessage
        .replace(new RegExp(`<@${botUserId}>`, "g"), "")
        .trim();
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
    removeSlackReaction(event.channel, event.ts, "thinking_face");
    addSlackReaction(event.channel, event.ts, "white_check_mark");
  } catch (error) {
    console.error("app_mention処理エラー:", error);

    // エラー時はリアクションを変更
    try {
      removeSlackReaction(event.channel, event.ts, "thinking_face");
      addSlackReaction(event.channel, event.ts, "x");
    } catch (e) {
      console.error("リアクション変更エラー:", e);
    }

    // エラー時もユーザーに通知
    try {
      const errorMessage =
        "申し訳ございません。エラーが発生しました。もう一度お試しください。";
      if (event.thread_ts) {
        sendSlackThreadReply(event.channel, event.thread_ts, errorMessage);
      } else {
        sendSlackThreadReply(event.channel, event.ts, errorMessage);
      }
    } catch (e) {
      console.error("エラー通知の送信も失敗:", e);
    }
  }
}