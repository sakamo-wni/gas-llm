// Googleカレンダー操作関連の関数

// カレンダーイベントを作成
function createCalendarEvent(data) {
  try {
    const calendar = CalendarApp.getCalendarById(getCONFIG().CALENDAR_ID);

    // カレンダーが取得できない場合のエラーハンドリング
    if (!calendar) {
      console.error(
        "カレンダーが見つかりません。IDを確認してください:",
        getCONFIG().CALENDAR_ID
      );
      return {
        success: false,
        message: "カレンダーが見つかりません",
        conflictingEvents: [],
      };
    }

    // 日付文字列をDateオブジェクトに変換
    const eventDate = new Date(data.date);
    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1時間後

    // 既存の予約をチェック
    const existingEvents = calendar.getEvents(eventDate, endDate);

    if (existingEvents.length > 0) {
      // 既に予約が存在する
      return {
        success: false,
        message: "指定時間帯に既に予約があります",
        conflictingEvents: existingEvents.map((e) => e.getTitle()),
      };
    }

    // イベントオプションを設定
    const eventOptions = {
      location: data.location,
      description: `作成者: ${data.creator}\n場所: ${data.location}\n概要: ${data.description || ''}`,
      // ゲストを自動的に追加（これによりMeetが生成される場合がある）
      guests: data.creator,
      sendInvites: false,
    };
    
    // カレンダー設定によっては、conferenceDataがサポートされている場合がある
    try {
      // Google Meetを追加するための特別な処理
      // カレンダーの設定で「ゲストが他のゲストを変更できる」がオンの場合、自動的にMeetが追加される
      eventOptions.guestsCanModify = false;
      eventOptions.guestsCanInviteOthers = false;
      eventOptions.guestsCanSeeOtherGuests = true;
    } catch (e) {
      console.log("イベントオプション設定エラー:", e);
    }
    
    // イベントを作成
    const event = calendar.createEvent(data.title, eventDate, endDate, eventOptions);

    console.log("カレンダーイベントが作成されました:", event.getId());

    // Google Meetを追加
    let meetUrl = "";
    try {
      // Google Apps ScriptではgetHangoutLinkメソッドは存在しない
      // Advanced Calendar Serviceを使用する必要がある
      if (typeof Calendar !== 'undefined') {
          try {
            // イベントIDからカレンダーイベントIDを抽出（@マークより前の部分）
            const eventId = event.getId().split('@')[0];
            
            const conferenceData = {
              createRequest: {
                requestId: Utilities.getUuid(),
                conferenceSolutionKey: { type: "hangoutsMeet" }
              }
            };
            
            // Advanced Calendar APIを使用してイベントを更新
            // まず現在のイベント情報を取得
            const currentEvent = Calendar.Events.get(
              getCONFIG().CALENDAR_ID,
              eventId
            );
            
            // conferenceDataを追加してパッチ
            currentEvent.conferenceData = conferenceData;
            
            const updatedEvent = Calendar.Events.update(
              currentEvent,
              getCONFIG().CALENDAR_ID,
              eventId,
              { conferenceDataVersion: 1 }
            );
            
            if (updatedEvent.hangoutLink) {
              meetUrl = updatedEvent.hangoutLink;
              console.log("Google Meet URL を生成しました:", meetUrl);
            } else if (updatedEvent.conferenceData && updatedEvent.conferenceData.entryPoints) {
              // hangoutLinkがない場合は、conferenceDataから取得
              const videoEntry = updatedEvent.conferenceData.entryPoints.find(
                entry => entry.entryPointType === 'video'
              );
              if (videoEntry) {
                meetUrl = videoEntry.uri;
                console.log("Google Meet URL を生成しました（conferenceData経由）:", meetUrl);
              }
            }
          } catch (apiError) {
            console.error("Advanced Calendar API エラー:", apiError);
            console.log("エラー詳細:", JSON.stringify(apiError));
          }
      } else {
        console.log("Advanced Calendar Serviceが無効です。");
        console.log("Google Apps Scriptエディタで「サービス」→「Google Calendar API」を追加してください。");
      }
    } catch (e) {
      console.log("Google Meet URL取得エラー:", e);
    }

    // スプレッドシートのステータスを更新は呼び出し元で行う
    // updateReservationStatus(data, "予約完了");

    // 24時間前／3時間前のSlack通知トリガーを設定
    try {
      setupSlackNotificationTriggers(event.getId(), eventDate);
    } catch (trgErr) {
      console.warn("Slack通知トリガーの設定中にエラー:", trgErr);
    }

    return {
      success: true,
      eventId: event.getId(),
      meetUrl: meetUrl,
    };
  } catch (error) {
    console.error("カレンダーイベント作成エラー:", error);
    // ステータス更新は呼び出し元で行う
    return {
      success: false,
      message: error.toString(),
      conflictingEvents: [],
    };
  }
}


// 特定の日時の予約状況を確認
function checkCalendarAvailability(dateString) {
  try {
    const calendar = CalendarApp.getCalendarById(getCONFIG().CALENDAR_ID);
    const checkDate = new Date(dateString);
    const endDate = new Date(checkDate.getTime() + 60 * 60 * 1000);

    const events = calendar.getEvents(checkDate, endDate);

    return {
      available: events.length === 0,
      existingEvents: events.map((e) => ({
        title: e.getTitle(),
        start: e.getStartTime(),
        end: e.getEndTime(),
      })),
    };
  } catch (error) {
    console.error("カレンダー確認エラー:", error);
    throw error;
  }
}

// ================= Slack 通知トリガー関連 =================

/**
 * Slack 通知用の時間ベーストリガーを設定する。
 * @param {string} eventId - 対象カレンダーイベントの ID
 * @param {Date} eventStartTime - イベント開始日時
 */
function setupSlackNotificationTriggers(eventId, eventStartTime) {
  const config = getCONFIG();

  // Webhook URL またはシート名が未設定ならスキップ
  if (!config.SLACK_WEBHOOK_URL || !config.NOTIFICATION_SHEET_NAME) {
    console.info("Slack 通知設定が不十分なため、トリガーを設定しません。");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(config.NOTIFICATION_SHEET_NAME);

  // シートが無ければ作成してヘッダーを追加
  if (!sheet) {
    sheet = ss.insertSheet(config.NOTIFICATION_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "イベントID",
      "通知タイプ",
      "通知時刻",
      "通知済み",
      "作成日時",
    ]);
    sheet.setFrozenRows(1);
  }

  const now = new Date();
  const time24hBefore = new Date(
    eventStartTime.getTime() - 24 * 60 * 60 * 1000
  );
  const time3hBefore = new Date(eventStartTime.getTime() - 3 * 60 * 60 * 1000);
  const time3mBefore = new Date(eventStartTime.getTime() - 3 * 60 * 1000);

  if (time24hBefore > now) {
    ScriptApp.newTrigger("sendSlackNotification")
      .timeBased()
      .at(time24hBefore)
      .create();

    sheet.appendRow([eventId, "24h", time24hBefore, false, now]);
    console.log("24時間前通知トリガーを設定:", time24hBefore);
  }

  if (time3hBefore > now) {
    ScriptApp.newTrigger("sendSlackNotification")
      .timeBased()
      .at(time3hBefore)
      .create();

    sheet.appendRow([eventId, "3h", time3hBefore, false, now]);
    console.log("3時間前通知トリガーを設定:", time3hBefore);
  }

  if (time3mBefore > now) {
    ScriptApp.newTrigger("sendSlackNotification")
      .timeBased()
      .at(time3mBefore)
      .create();

    sheet.appendRow([eventId, "3m", time3mBefore, false, now]);
    console.log("3分前通知トリガーを設定:", time3mBefore);
  }
}

/**
 * 時間ベーストリガーで呼ばれ、条件に合致する通知を Slack に送信する。
 */
function sendSlackNotification() {
  const config = getCONFIG();
  if (
    !config.SLACK_WEBHOOK_URL ||
    !config.CALENDAR_ID ||
    !config.NOTIFICATION_SHEET_NAME
  ) {
    console.error("Slack 通知に必要な設定が不足しています。");
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(config.NOTIFICATION_SHEET_NAME);
  if (!sheet) {
    console.error(
      `通知設定シート（${config.NOTIFICATION_SHEET_NAME}）が見つかりません。`
    );
    return;
  }

  const calendar = CalendarApp.getCalendarById(config.CALENDAR_ID);
  if (!calendar) {
    console.error("カレンダーが見つかりません。");
    return;
  }

  const now = new Date();
  const toleranceMinutes = 3; // 許容誤差（分）

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return; // データなし

  const header = data[0];
  const idxEventId = header.indexOf("イベントID");
  const idxType = header.indexOf("通知タイプ");
  const idxTime = header.indexOf("通知時刻");
  const idxSent = header.indexOf("通知済み");

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const sent = row[idxSent];
    const notifyAt = new Date(row[idxTime]);

    if (sent === true) continue; // 既に送信済み

    const diffMin = Math.abs(now.getTime() - notifyAt.getTime()) / (60 * 1000);
    if (diffMin > toleranceMinutes) continue; // 時間外

    const eventId = row[idxEventId];
    const type = row[idxType];

    let event;
    try {
      event = calendar.getEventById(eventId);
      if (!event) throw new Error("event not found");
    } catch (er) {
      console.warn("イベント取得失敗:", eventId, er);
      // 取得できなければ通知済みにしてスキップ
      sheet.getRange(i + 1, idxSent + 1).setValue(true);
      continue;
    }

    const start = event.getStartTime();
    const formattedDate = Utilities.formatDate(
      start,
      Session.getScriptTimeZone(),
      "yyyy/MM/dd"
    );
    const formattedTime = Utilities.formatDate(
      start,
      Session.getScriptTimeZone(),
      "HH:mm"
    );
    // Google Meet URLを取得
    let meetUrl = "N/A";
    
    // Advanced Calendar APIで取得を試す
    if (typeof Calendar !== 'undefined') {
      try {
        // イベントIDから実際のIDを抽出（@マークより前の部分）
        const actualEventId = eventId.split('@')[0];
        const advancedEvent = Calendar.Events.get(
          getCONFIG().CALENDAR_ID,
          actualEventId
        );
        if (advancedEvent.hangoutLink) {
          meetUrl = advancedEvent.hangoutLink;
        } else if (advancedEvent.conferenceData && advancedEvent.conferenceData.entryPoints) {
          const videoEntry = advancedEvent.conferenceData.entryPoints.find(
            entry => entry.entryPointType === 'video'
          );
          if (videoEntry) {
            meetUrl = videoEntry.uri;
          }
        }
      } catch (e) {
        console.log("Advanced Calendar APIでエラー:", e);
      }
    }

    // LLMを使用してメッセージを生成
    const eventData = {
      title: event.getTitle(),
      date: formattedDate,
      time: formattedTime,
      location: event.getLocation() || "未定",
      meetUrl: meetUrl !== "N/A" ? meetUrl : null
    };

    let message = generateNotificationMessage(eventData, type);
    
    // LLMでの生成に失敗した場合はフォールバック
    if (!message) {
      console.warn("LLMでのメッセージ生成に失敗、フォールバックテンプレートを使用");
      let template;
      if (type === "24h") {
        template =
          config.SLACK_MESSAGE_TEMPLATE_24H ||
          "【予約通知】明日 {time} から「{title}」の予約があります。\n場所: {location}\nGoogle Meet: {meetUrl}";
      } else if (type === "3h") {
        template =
          config.SLACK_MESSAGE_TEMPLATE_3H ||
          "【予約通知】本日 {time} から「{title}」の予約があります。\n場所: {location}\nGoogle Meet: {meetUrl}";
      } else if (type === "3m") {
        template =
          config.SLACK_MESSAGE_TEMPLATE_3M ||
          "【直前通知】まもなく {time} から「{title}」の予約が始まります！\n場所: {location}\nGoogle Meet: {meetUrl}";
      } else {
        console.warn("未知の通知タイプ:", type);
        sheet.getRange(i + 1, idxSent + 1).setValue(true);
        continue;
      }

      message = template
        .replace(/{title}/g, event.getTitle())
        .replace(/{date}/g, formattedDate)
        .replace(/{time}/g, formattedTime)
        .replace(/{location}/g, event.getLocation() || "未定")
        .replace(/{meetUrl}/g, meetUrl);
    }

    if (sendWebhookMessage(config.SLACK_WEBHOOK_URL, message)) {
      console.log("Slack 通知送信成功");
      sheet.getRange(i + 1, idxSent + 1).setValue(true);
    } else {
      console.error("Slack 通知送信失敗");
    }
  }
}

/**
 * 指定された Webhook URL へテキストメッセージを送信する。
 * @param {string} webhookUrl
 * @param {string} text
 * @returns {boolean}
 */
function sendWebhookMessage(webhookUrl, text) {
  if (!webhookUrl || !text) {
    console.error("Webhook URL またはメッセージが未指定です。");
    return false;
  }

  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ text: text }),
      muteHttpExceptions: true,
    });

    const status = response.getResponseCode();
    if (status >= 200 && status < 300) {
      return true;
    }
    console.error("Webhook 送信失敗:", status, response.getContentText());
    return false;
  } catch (err) {
    console.error("Webhook 送信中に例外:", err);
    return false;
  }
}
