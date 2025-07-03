// Slack Event API テスト用のシンプルな関数

function doPost_test(e) {
  console.log('doPost called');
  console.log('Arguments length:', arguments.length);
  console.log('First argument:', arguments[0]);
  console.log('Second argument:', arguments[1]);
  
  // すべてのリクエストをログに記録
  console.log('Request received:', new Date().toISOString());
  
  // eオブジェクトの詳細を調査
  console.log('e object exists:', !!e);
  console.log('e type:', typeof e);
  console.log('e keys:', e ? Object.keys(e) : 'e is null/undefined');
  
  // argumentsの詳細調査
  for (let i = 0; i < arguments.length; i++) {
    console.log(`Argument ${i}:`, typeof arguments[i], arguments[i]);
  }
  
  if (e) {
    console.log('e.postData exists:', !!e.postData);
    console.log('e.parameter exists:', !!e.parameter);
    console.log('e.parameters exists:', !!e.parameters);
    
    if (e.parameter) {
      console.log('e.parameter:', JSON.stringify(e.parameter));
    }
    
    if (e.parameters) {
      console.log('e.parameters:', JSON.stringify(e.parameters));
    }
    
    if (e.postData) {
      console.log('postData keys:', Object.keys(e.postData));
      console.log('postData.contents exists:', !!e.postData.contents);
      console.log('postData.length exists:', !!e.postData.length);
      console.log('postData.type exists:', !!e.postData.type);
    }
  }
  
  // URL verification用の固定応答をテスト
  console.log('Returning test challenge response');
  return ContentService.createTextOutput('test_challenge_response_123');
  
  console.log('postData exists');
  console.log('Contents:', e.postData.contents);
  
  try {
    const data = JSON.parse(e.postData.contents);
    console.log('Parsed data:', JSON.stringify(data));
    
    // URL verification
    if (data.type === 'url_verification') {
      console.log('URL verification request');
      console.log('Challenge:', data.challenge);
      return ContentService.createTextOutput(data.challenge);
    }
    
    // Other events
    console.log('Other event type:', data.type);
    return ContentService.createTextOutput('OK');
    
  } catch (e) {
    console.log('Parse error:', e.toString());
    return ContentService.createTextOutput('Parse error');
  }
}

function doGet(e) {
  console.log('doGet called');
  console.log('e object exists:', !!e);
  console.log('e keys:', e ? Object.keys(e) : 'e is null/undefined');
  
  if (e && e.parameter) {
    console.log('e.parameter:', JSON.stringify(e.parameter));
  }
  
  return ContentService.createTextOutput('Test endpoint is working - GET method');
}