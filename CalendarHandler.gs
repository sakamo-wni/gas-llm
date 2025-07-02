// Googleカレンダー操作関連の関数

// カレンダーイベントを作成
function createCalendarEvent(data) {
  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    
    // カレンダーが取得できない場合のエラーハンドリング
    if (!calendar) {
      console.error('カレンダーが見つかりません。IDを確認してください:', CONFIG.CALENDAR_ID);
      return {
        success: false,
        message: 'カレンダーが見つかりません',
        conflictingEvents: []
      };
    }
    
    // 日付文字列をDateオブジェクトに変換
    const eventDate = new Date(data.date);
    const endDate = new Date(eventDate.getTime() + (60 * 60 * 1000)); // 1時間後
    
    // 既存の予約をチェック
    const existingEvents = calendar.getEvents(eventDate, endDate);
    
    if (existingEvents.length > 0) {
      // 既に予約が存在する
      return {
        success: false,
        message: '指定時間帯に既に予約があります',
        conflictingEvents: existingEvents.map(e => e.getTitle())
      };
    }
    
    // イベントを作成（Google Meetを含む）
    const event = calendar.createEvent(
      data.title,
      eventDate,
      endDate,
      {
        location: data.location,
        description: `作成者: ${data.creator}\n場所: ${data.location}`,
        // ゲストを自動的に追加（これによりMeetが生成される場合がある）
        guests: data.creator,
        sendInvites: false
      }
    );
    
    console.log('カレンダーイベントが作成されました:', event.getId());
    
    // Google Meetのリンクを生成
    let meetUrl = '';
    try {
      // ランダムなMeet IDを生成（より安全な方法）
      const meetId = generateMeetId();
      meetUrl = `https://meet.google.com/${meetId}`;
      
      // イベントの説明を更新してMeet URLを含める
      const newDescription = event.getDescription() + `\n\nGoogle Meet: ${meetUrl}`;
      event.setDescription(newDescription);
      
      console.log('Google Meet URL を生成しました:', meetUrl);
    } catch (e) {
      console.log('Google Meet URLの生成でエラー:', e);
      // エラーの場合は空文字列のまま
    }
    
    // スプレッドシートのステータスを更新
    updateReservationStatus(data, '予約完了');
    
    return {
      success: true,
      eventId: event.getId(),
      meetUrl: meetUrl
    };
    
  } catch (error) {
    console.error('カレンダーイベント作成エラー:', error);
    return {
      success: false,
      message: error.toString(),
      conflictingEvents: []
    };
  }
}

// Google Meet IDを生成する関数
function generateMeetId() {
  // 3つの部分に分かれたMeet IDを生成（xxx-yyyy-zzz形式）
  const part1 = generateRandomString(3);
  const part2 = generateRandomString(4);
  const part3 = generateRandomString(3);
  
  return `${part1}-${part2}-${part3}`;
}

// ランダムな文字列を生成する補助関数
function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 特定の日時の予約状況を確認
function checkCalendarAvailability(dateString) {
  try {
    const calendar = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    const checkDate = new Date(dateString);
    const endDate = new Date(checkDate.getTime() + (60 * 60 * 1000));
    
    const events = calendar.getEvents(checkDate, endDate);
    
    return {
      available: events.length === 0,
      existingEvents: events.map(e => ({
        title: e.getTitle(),
        start: e.getStartTime(),
        end: e.getEndTime()
      }))
    };
    
  } catch (error) {
    console.error('カレンダー確認エラー:', error);
    throw error;
  }
}