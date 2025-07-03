// スプレッドシート操作関連の関数

// スプレッドシートにデータを書き込む
function writeToSpreadsheet(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(getCONFIG().SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    
    // ヘッダーが存在しない場合は追加（新しい列構成）
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['日付', '作成者', 'タイトル', '場所', '第一希望', '第二希望', 'ステータス', '概要', 'tsを含むURL']);
    }
    
    // 既存のワークフローから来た場合は、最終行のデータを更新
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const lastRowData = sheet.getRange(lastRow, 1, 1, 8).getValues()[0];
      // 同じ第一希望日時のデータがあれば、それを更新（ステータスのみ）
      if (lastRowData[4] && new Date(lastRowData[4]).getTime() === new Date(data.date).getTime()) {
        // ステータスを更新
        sheet.getRange(lastRow, 7).setValue('処理中');
        console.log('既存の行のステータスを更新しました');
        return true;
      }
    }
    
    // 新規データの場合は追加（通常はワークフローが既に追加しているので、この処理は実行されない）
    const row = [
      new Date(),           // A列: 日付（記録日時）
      data.creator,         // B列: 作成者
      data.title,           // C列: タイトル
      data.location,        // D列: 場所
      data.date,            // E列: 第一希望
      data.secondDate || '', // F列: 第二希望
      '処理中',             // G列: ステータス
      data.description || '' // H列: 概要
    ];
    
    sheet.appendRow(row);
    
    console.log('スプレッドシートへの書き込みが完了しました');
    return true;
    
  } catch (error) {
    console.error('スプレッドシート書き込みエラー:', error);
    throw error;
  }
}

// 予約ステータスを更新
function updateReservationStatus(data, status) {
  try {
    const spreadsheet = SpreadsheetApp.openById(getCONFIG().SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // 該当する行を探す（最新のマッチする行を使用）
    let targetRow = -1;
    for (let i = values.length - 1; i >= 1; i--) { // 最新から検索
      // B列（作成者）、C列（タイトル）、G列（ステータス）で一致を確認
      if (values[i][1] === data.creator && values[i][2] === data.title && values[i][6] === '処理中') {
        targetRow = i;
        break;
      }
    }
    
    if (targetRow >= 0) {
      // G列（ステータス）を更新
      sheet.getRange(targetRow + 1, 7).setValue(status);
      
      // 第二希望で成功した場合は、実際に使用された日時も記録
      if (data.isSecondChoice && status === '完了') {
        // I列に使用された日時を記録
        if (sheet.getMaxColumns() < 9) {
          // 列が足りない場合は追加
          sheet.insertColumnsAfter(sheet.getMaxColumns(), 1);
          sheet.getRange(1, 9).setValue('実際の予約日時');
        }
        sheet.getRange(targetRow + 1, 9).setValue(data.date);
        console.log(`第二希望で予約完了。実際の予約日時も記録しました: ${data.date}`);
      }
      
      console.log(`ステータスを「${status}」に更新しました`);
    }
    
  } catch (error) {
    console.error('ステータス更新エラー:', error);
    throw error;
  }
}