// 完全に新しいSlackテスト用ファイル
// このファイルを新しいGoogle Apps Scriptプロジェクトにコピーしてテストしてください

function doPost_newtest(e) {
  console.log('=== doPost V8 Test ===');
  console.log('Time:', new Date().toISOString());
  console.log('Arguments count:', arguments.length);
  
  // V8ランタイムでの修正アプローチ
  try {
    // 全ての引数をチェック
    for (let i = 0; i < arguments.length; i++) {
      console.log(`Argument ${i}:`, arguments[i]);
    }
    
    // 実際のeパラメータが最初の引数でない可能性をチェック
    const actualEvent = arguments[0] || e;
    
    console.log('actualEvent:', actualEvent);
    console.log('actualEvent type:', typeof actualEvent);
    
    if (actualEvent && actualEvent.postData && actualEvent.postData.contents) {
      console.log('Found postData!');
      console.log('Contents:', actualEvent.postData.contents);
      
      const data = JSON.parse(actualEvent.postData.contents);
      console.log('Parsed data:', data);
      
      if (data.type === 'url_verification') {
        console.log('URL verification with challenge:', data.challenge);
        return ContentService.createTextOutput(data.challenge);
      }
      
      if (data.event && data.event.type === 'app_mention') {
        console.log('App mention detected');
        return ContentService.createTextOutput('{"ok": true}');
      }
      
      return ContentService.createTextOutput('OK');
    }
    
    console.log('No valid event data found, returning test response');
    return ContentService.createTextOutput('test_response');
    
  } catch (error) {
    console.log('Error in doPost:', error.toString());
    return ContentService.createTextOutput('Error: ' + error.toString());
  }
  
  console.log('e exists, type:', typeof e);
  console.log('e properties:', Object.keys(e));
  
  if (!e.postData) {
    console.log('ERROR: No postData');
    return ContentService.createTextOutput('ERROR: No postData');
  }
  
  console.log('postData exists');
  console.log('postData.contents:', e.postData.contents);
  
  try {
    const data = JSON.parse(e.postData.contents);
    console.log('Parsed successfully');
    console.log('Data type:', data.type);
    
    if (data.type === 'url_verification') {
      console.log('URL Verification detected');
      console.log('Challenge:', data.challenge);
      return ContentService.createTextOutput(data.challenge);
    }
    
    return ContentService.createTextOutput('OK');
    
  } catch (error) {
    console.log('Parse error:', error.toString());
    return ContentService.createTextOutput('Parse error');
  }
}

function doGet(e) {
  console.log('=== NEW PROJECT doGet ===');
  return ContentService.createTextOutput('New project test endpoint working!');
}