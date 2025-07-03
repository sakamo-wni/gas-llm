// シンプルなテスト関数

// 基本的なログ出力テスト
function testLog() {
  console.log("=== testLog 開始 ===");
  console.log("現在時刻:", new Date().toString());
  console.log("テストメッセージ");
  console.log("=== testLog 終了 ===");
  return "テスト完了";
}

// doGet_originalのテスト
function testDoGet() {
  console.log("=== doGet_original テスト開始 ===");
  try {
    const result = doGet_original();
    console.log("結果:", result);
    console.log("コンテンツ:", result.getContent());
  } catch (error) {
    console.error("エラー:", error);
  }
  console.log("=== テスト終了 ===");
}

// 設定値の確認
function testConfig() {
  console.log("=== 設定値確認 ===");
  try {
    const config = getCONFIG();
    console.log("SPREADSHEET_ID:", config.SPREADSHEET_ID || "未設定");
    console.log("CALENDAR_ID:", config.CALENDAR_ID || "未設定");
    console.log("SLACK_BOT_TOKEN:", config.SLACK_BOT_TOKEN ? "設定済み" : "未設定");
  } catch (error) {
    console.error("設定取得エラー:", error);
  }
}

// すべての関数をリスト
function listAllFunctions() {
  console.log("=== 定義されている関数一覧 ===");
  const globalThis = this;
  const functionNames = [];
  
  for (const key in globalThis) {
    if (typeof globalThis[key] === 'function') {
      functionNames.push(key);
    }
  }
  
  functionNames.sort();
  functionNames.forEach(name => console.log("- " + name));
  console.log("合計:", functionNames.length, "個の関数");
  
  // 特定の関数の存在確認
  console.log("\n=== 重要な関数の確認 ===");
  const importantFuncs = ['generateAnnouncement', 'processReservation', 'getCONFIG'];
  importantFuncs.forEach(func => {
    console.log(`${func}: ${functionNames.includes(func) ? '✅ 存在' : '❌ 不在'}`);
  });
}

// generateAnnouncementの直接テスト
function testGenerateAnnouncementDirect() {
  console.log("=== generateAnnouncement 直接テスト ===");
  
  try {
    // 関数の存在確認
    console.log("typeof generateAnnouncement:", typeof generateAnnouncement);
    
    if (typeof generateAnnouncement === 'function') {
      const testData = {
        title: 'テスト会議',
        date: '2025年07月03日 10:00',
        location: 'テスト会議室',
        description: 'これはテストです',
        meetUrl: 'https://meet.google.com/test-test-test'
      };
      
      const result = generateAnnouncement(testData);
      console.log("結果:", result);
    } else {
      console.error("generateAnnouncement関数が見つかりません");
    }
  } catch (error) {
    console.error("エラー:", error);
    console.error("スタック:", error.stack);
  }
}

// processReservationのモックテスト
function testProcessReservationMock() {
  console.log("=== processReservation モックテスト ===");
  
  try {
    console.log("typeof processReservation:", typeof processReservation);
    
    if (typeof processReservation !== 'function') {
      console.error("processReservation関数が見つかりません");
      return;
    }
    
    // スプレッドシートIDが設定されているか確認
    const config = getCONFIG();
    if (!config.SPREADSHEET_ID || config.SPREADSHEET_ID === "YOUR_SPREADSHEET_ID") {
      console.error("スプレッドシートIDが設定されていません");
      console.log("プロジェクトの設定 → スクリプトプロパティで設定してください");
      return;
    }
    
    console.log("テストは実際の予約処理を行います。続行しますか？");
    console.log("注意: スプレッドシートとカレンダーにテストデータが作成されます");
    
  } catch (error) {
    console.error("エラー:", error);
  }
}