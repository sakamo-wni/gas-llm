// テスト用のトリガー関数

// テスト用: 3分後のイベントを作成して通知をテスト
function testCreate3MinutesEvent() {
  // ランダムな分数を追加して重複を避ける
  const randomMinutes = Math.floor(Math.random() * 10) + 5; // 5-14分後
  const testDate = new Date(Date.now() + randomMinutes * 60 * 1000);
  
  const testData = {
    date: testDate,
    creator: "sakamo@wni.com",
    title: `テストイベント - ${randomMinutes}分後通知確認`,
    location: "テスト会場",
    description: "3分前通知のテスト用イベント",
    threadTs: null
  };
  
  console.log("テストイベント作成開始:", testData);
  
  // スプレッドシートに記録
  writeToSpreadsheet(testData);
  
  // カレンダーイベントを作成
  const result = createCalendarEvent(testData);
  
  if (result.success) {
    console.log("イベント作成成功:", result);
    console.log("イベントID:", result.eventId);
    console.log("Meet URL:", result.meetUrl);
    
    // 通知設定を確認
    const config = getCONFIG();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(config.NOTIFICATION_SHEET_NAME);
    
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      console.log("通知設定シートの内容:");
      data.forEach((row, index) => {
        if (index > 0 && row[0] === result.eventId) {
          console.log(`- ${row[1]}通知: ${new Date(row[2])}`);
        }
      });
    }
    
    return "テストイベントを作成しました。3分後に通知が来るはずです。";
  } else {
    console.error("イベント作成失敗:", result);
    return "エラー: " + result.message;
  }
}

// 手動で通知をテスト
function testSendNotificationManually() {
  const config = getCONFIG();
  const calendar = CalendarApp.getCalendarById(config.CALENDAR_ID);
  
  // 今日のイベントを取得
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  const events = calendar.getEvents(now, endOfDay);
  
  if (events.length === 0) {
    console.log("今日のイベントがありません");
    return;
  }
  
  // 最初のイベントで通知テスト
  const event = events[0];
  console.log("テスト対象イベント:", event.getTitle());
  
  // 通知設定シートに仮のエントリを追加
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(config.NOTIFICATION_SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(config.NOTIFICATION_SHEET_NAME);
    sheet.appendRow(["イベントID", "通知タイプ", "通知時刻", "通知済み", "作成日時"]);
  }
  
  // 3分前通知のテストエントリを追加
  sheet.appendRow([
    event.getId(),
    "3m",
    new Date(), // 現在時刻で通知
    false,
    new Date()
  ]);
  
  console.log("通知エントリを追加しました。sendSlackNotification()を実行してください。");
}

// Advanced Calendar Serviceが有効かチェック
function checkAdvancedCalendarService() {
  try {
    if (typeof Calendar !== 'undefined') {
      console.log("Advanced Calendar Service: 有効");
      
      // テストでカレンダーリストを取得
      const calendarList = Calendar.CalendarList.list();
      console.log("カレンダー数:", calendarList.items.length);
      
      return true;
    } else {
      console.log("Advanced Calendar Service: 無効");
      console.log("プロジェクト設定でGoogle Calendar APIを有効にしてください。");
      return false;
    }
  } catch (e) {
    console.error("エラー:", e);
    return false;
  }
}

// トリガーの状態を確認
function checkTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  console.log(`現在のトリガー数: ${triggers.length}`);
  
  triggers.forEach((trigger, index) => {
    console.log(`\nトリガー ${index + 1}:`);
    console.log(`- 関数名: ${trigger.getHandlerFunction()}`);
    console.log(`- タイプ: ${trigger.getEventType()}`);
    console.log(`- ソース: ${trigger.getTriggerSource()}`);
    
    if (trigger.getTriggerSource() === ScriptApp.TriggerSource.CLOCK) {
      console.log(`- ユニークID: ${trigger.getUniqueId()}`);
    }
  });
}

// すべてのトリガーを削除（注意して使用）
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  
  console.log(`${triggers.length}個のトリガーを削除しました`);
}

// トリガー権限のテスト関数
function testTriggerPermission() {
  try {
    // 1秒後に実行するトリガーを作成
    const trigger = ScriptApp.newTrigger("testFunction")
      .timeBased()
      .after(1000) // 1秒後
      .create();
    
    console.log("トリガー作成成功:", trigger.getUniqueId());
    console.log("トリガータイプ:", trigger.getEventType());
    
    // テスト用なのですぐ削除
    ScriptApp.deleteTrigger(trigger);
    console.log("トリガーを削除しました");
    
    return "トリガーの作成と削除に成功しました！";
    
  } catch (error) {
    console.error("トリガー作成エラー:", error);
    return "エラー: " + error.toString();
  }
}

// テスト用の関数（実際には実行されない）
function testFunction() {
  console.log("テスト関数が実行されました");
}

// 既存のイベントのMeet URLをチェック
function checkExistingEventMeetUrl() {
  const config = getCONFIG();
  const calendar = CalendarApp.getCalendarById(config.CALENDAR_ID);
  
  // 今日のイベントを取得
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  const events = calendar.getEvents(now, endOfDay);
  
  if (events.length === 0) {
    console.log("今日のイベントがありません");
    return;
  }
  
  console.log(`今日のイベント数: ${events.length}`);
  
  events.forEach((event, index) => {
    console.log(`\nイベント ${index + 1}:`);
    console.log(`- タイトル: ${event.getTitle()}`);
    console.log(`- 開始時刻: ${event.getStartTime()}`);
    console.log(`- イベントID: ${event.getId()}`);
    
    // 標準APIでMeet URLを取得
    try {
      const hangoutLink = event.getHangoutLink();
      console.log(`- Meet URL (標準API): ${hangoutLink || 'なし'}`);
    } catch (e) {
      console.log(`- Meet URL (標準API): エラー - ${e.message}`);
    }
    
    // Advanced Calendar APIでも試す
    if (typeof Calendar !== 'undefined') {
      try {
        const eventId = event.getId().split('@')[0];
        const advancedEvent = Calendar.Events.get(config.CALENDAR_ID, eventId);
        
        if (advancedEvent.hangoutLink) {
          console.log(`- Meet URL (Advanced API): ${advancedEvent.hangoutLink}`);
        } else if (advancedEvent.conferenceData && advancedEvent.conferenceData.entryPoints) {
          const videoEntry = advancedEvent.conferenceData.entryPoints.find(
            entry => entry.entryPointType === 'video'
          );
          if (videoEntry) {
            console.log(`- Meet URL (Conference Data): ${videoEntry.uri}`);
          } else {
            console.log(`- Meet URL (Advanced API): なし`);
          }
        } else {
          console.log(`- Meet URL (Advanced API): なし`);
        }
      } catch (e) {
        console.log(`- Meet URL (Advanced API): エラー - ${e.message}`);
      }
    }
  });
}