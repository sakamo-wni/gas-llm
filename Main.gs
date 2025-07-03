// メインエントリーポイント
// このファイルが最初に読み込まれ、正しいdoPost関数を定義します

// 関数の存在チェック（デバッグ用）
function checkFunctions() {
  const functions = [
    'getCONFIG',
    'generateAnnouncement',
    'processReservation',
    'createCalendarEvent',
    'sendSlackThreadReply',
    'formatDateToJST',
    'convertSpreadsheetDate',
    'extractThreadTs'
  ];
  
  console.log('=== 関数チェック開始 ===');
  
  functions.forEach(func => {
    try {
      const funcType = typeof this[func];
      if (funcType === 'undefined') {
        console.error(`❌ 関数 ${func} が定義されていません`);
      } else if (funcType === 'function') {
        console.log(`✅ 関数 ${func} は正常に定義されています`);
      } else {
        console.warn(`⚠️ ${func} は関数ではありません (型: ${funcType})`);
      }
    } catch (e) {
      console.error(`❌ 関数 ${func} のチェック中にエラー:`, e);
    }
  });
  
  console.log('=== 関数チェック完了 ===');
  
  // 追加のデバッグ情報
  try {
    console.log('generateAnnouncement関数の型:', typeof generateAnnouncement);
    console.log('generateAnnouncement関数の存在:', generateAnnouncement !== undefined);
  } catch (e) {
    console.error('generateAnnouncement直接アクセスエラー:', e);
  }
}

// WebアプリケーションのPOSTリクエストを処理
function doPost(e) {
  // Code.gsのdoPost_original関数を呼び出す
  return doPost_original(e);
}

// WebアプリケーションのGETリクエストを処理
function doGet(e) {
  // Code.gsのdoGet_original関数を呼び出す
  return doGet_original(e);
}