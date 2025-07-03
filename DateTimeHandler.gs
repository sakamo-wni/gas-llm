// 日時処理関連のユーティリティ関数

// 日付をJST形式の文字列に変換
function formatDateToJST(date, format = "yyyy年MM月dd日 HH:mm") {
  if (!date) return "";
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    console.error("無効な日付:", date);
    return "";
  }
  
  return Utilities.formatDate(dateObj, "JST", format);
}

// URLからthread_tsを抽出
function extractThreadTs(url) {
  if (!url) return null;
  const match = url.match(/p(\d+)/);
  return match ? (parseInt(match[1]) / 1000000).toString() : null;
}

// スプレッドシートの日付値を適切な形式に変換
function convertSpreadsheetDate(dateValue) {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    // Dateオブジェクトの場合
    // スプレッドシートの日付を正しくJSTとして扱う
    return Utilities.formatDate(dateValue, "JST", "yyyy-MM-dd HH:mm");
  } else {
    // 文字列の場合はそのまま返す
    return dateValue;
  }
}

// 時間差を計算（分単位）
function getTimeDifferenceInMinutes(date1, date2) {
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  return Math.abs(d1.getTime() - d2.getTime()) / (60 * 1000);
}