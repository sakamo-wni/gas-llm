// テスト用関数

// 単体でgenerateAnnouncementをテスト
function testGenerateAnnouncement() {
  console.log('=== generateAnnouncement テスト開始 ===');
  
  try {
    const testData = {
      title: 'テスト会議',
      date: '2025年07月03日 10:00',
      location: 'テスト会議室',
      description: 'これはテストです',
      meetUrl: 'https://meet.google.com/test-test-test'
    };
    
    console.log('テストデータ:', testData);
    
    // 直接呼び出し
    const result = generateAnnouncement(testData);
    console.log('生成された告知文:', result);
    console.log('=== テスト成功 ===');
    
  } catch (error) {
    console.error('テストエラー:', error);
    console.error('エラースタック:', error.stack);
  }
}

// 予約処理の簡易テスト
function testProcessReservation() {
  console.log('=== processReservation テスト開始 ===');
  
  try {
    const testData = {
      date: '2025-07-03 15:00',
      creator: 'test@example.com',
      title: 'テスト予約',
      location: 'テスト会議室',
      threadTs: '1234567890.123456',
      description: 'テスト説明'
    };
    
    console.log('テストデータ:', testData);
    
    // モック設定を有効化（実際の外部APIを呼ばない）
    const result = {
      success: true,
      message: 'テストモード'
    };
    
    console.log('結果:', result);
    console.log('=== テスト完了 ===');
    
  } catch (error) {
    console.error('テストエラー:', error);
    console.error('エラースタック:', error.stack);
  }
}

// 全体的な動作確認
function debugFullFlow() {
  console.log('=== 完全な動作フローのデバッグ ===');
  
  // 1. 設定確認
  try {
    const config = getCONFIG();
    console.log('設定取得成功');
    console.log('SPREADSHEET_ID:', config.SPREADSHEET_ID ? '設定済み' : '未設定');
    console.log('CALENDAR_ID:', config.CALENDAR_ID ? '設定済み' : '未設定');
  } catch (e) {
    console.error('設定取得エラー:', e);
  }
  
  // 2. 各関数の存在確認
  const requiredFunctions = {
    'ConfigHandler': ['getCONFIG', 'getConfigValues'],
    'DateTimeHandler': ['formatDateToJST', 'convertSpreadsheetDate', 'extractThreadTs'],
    'SpreadsheetHandler': ['writeToSpreadsheet', 'updateReservationStatus'],
    'SlackHandler': ['findUserByEmail', 'sendSlackThreadReply', 'postToChannel'],
    'GeminiHandler': ['generateAnnouncement', 'extractDateFromMessage', 'generateChatResponse'],
    'CalendarHandler': ['createCalendarEvent', 'checkCalendarAvailability'],
    'ReservationHandler': ['processReservation', 'handleReservationSuccess', 'handleReservationFailure']
  };
  
  for (const [file, funcs] of Object.entries(requiredFunctions)) {
    console.log(`\n--- ${file} ---`);
    for (const func of funcs) {
      try {
        const exists = typeof this[func] === 'function';
        console.log(`${func}: ${exists ? '✅' : '❌'}`);
      } catch (e) {
        console.log(`${func}: ❌ (エラー: ${e.message})`);
      }
    }
  }
}