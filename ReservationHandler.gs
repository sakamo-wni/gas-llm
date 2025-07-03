// 予約処理関連の関数

// 予約成功時の処理を共通化
function handleReservationSuccess(data, calendarResult, isSecondChoice = false) {
  const jstDate = new Date(data.date);
  const jstDateString = Utilities.formatDate(jstDate, "JST", "yyyy年MM月dd日 HH:mm");
  
  // ユーザーへの通知準備
  const userId = findUserByEmail(data.creator);
  const mentionText = userId ? `<@${userId}>` : data.creator;
  const meetUrlText = calendarResult.meetUrl ? `\nGoogle Meet: ${calendarResult.meetUrl}` : "";
  const choiceText = isSecondChoice ? "（第二希望での予約）" : "";
  
  // Slackに成功通知
  const successMessage = isSecondChoice 
    ? `${mentionText} 第一希望は空いていませんでしたが、第二希望で予約が完了しました！\n日時: ${jstDateString}\nタイトル: ${data.title}\n場所: ${data.location}${meetUrlText}`
    : `${mentionText} 予約が完了しました！${choiceText}\n日時: ${jstDateString}\nタイトル: ${data.title}\n場所: ${data.location}${meetUrlText}`;
    
  sendSlackThreadReply(getCONFIG().SLACK_CHANNEL_ID, data.threadTs, successMessage);
  
  // 告知文を生成してチャンネルに投稿
  const announcementData = {
    ...data,
    date: jstDateString,
    description: data.description || "",
    meetUrl: calendarResult.meetUrl || ""
  };
  
  const announcement = generateAnnouncement(announcementData);
  postToChannel(announcement);
  
  // ステータスを更新
  const statusData = isSecondChoice ? { ...data, date: data.secondDate, isSecondChoice: true } : data;
  updateReservationStatus(statusData, "完了");
  
  return {
    success: true,
    message: isSecondChoice ? "第二希望で予約が完了しました" : "予約が完了しました"
  };
}

// 予約失敗時の処理を共通化
function handleReservationFailure(data, calendarResult) {
  const jstDate = new Date(data.date);
  const jstDateString = Utilities.formatDate(jstDate, "JST", "yyyy年MM月dd日 HH:mm");
  
  const userId = findUserByEmail(data.creator);
  const mentionText = userId ? `<@${userId}>` : data.creator;
  
  let errorMessage = `${mentionText} 申し訳ございません。${jstDateString}は既に予約が入っています。`;
  
  if (calendarResult.conflictingEvents && calendarResult.conflictingEvents.length > 0) {
    errorMessage += `\n既存の予約: ${calendarResult.conflictingEvents.join(", ")}`;
  }
  
  // 第二希望の処理状況に応じてメッセージを追加
  if (data.isSecondChoice && data.secondDate) {
    // 第二希望も失敗した場合
    const jstSecondDate = new Date(data.date); // 現在試行した日付（第二希望）
    const jstSecondDateString = Utilities.formatDate(jstSecondDate, "JST", "yyyy年MM月dd日 HH:mm");
    errorMessage += `\n第二希望（${jstSecondDateString}）も既に予約が入っています。`;
  }
  
  errorMessage += `\n\n新しい日時をこのスレッドに返信してください。`;
  
  sendSlackThreadReply(getCONFIG().SLACK_CHANNEL_ID, data.threadTs, errorMessage);
  updateReservationStatus(data, "失敗");
  
  return {
    success: false,
    message: "予約が失敗しました",
    needRetry: true
  };
}

// メイン予約処理（リファクタリング版）
function processReservation(data) {
  try {
    // 1. スプレッドシートに記録
    writeToSpreadsheet(data);
    
    // 2. カレンダーに予約を試みる
    const calendarResult = createCalendarEvent(data);
    
    if (calendarResult.success) {
      // 第一希望で予約成功
      return handleReservationSuccess(data, calendarResult, false);
    }
    
    // 第一希望が失敗した場合、第二希望があるかチェック
    if (data.secondDate && !data.isSecondChoice) {
      console.log("第一希望が失敗、第二希望を試行します:", data.secondDate);
      
      // 第二希望で再試行
      const secondChoiceData = {
        ...data,
        date: data.secondDate,
        isSecondChoice: true
      };
      
      const secondResult = createCalendarEvent(secondChoiceData);
      
      if (secondResult.success) {
        // 第二希望で成功
        return handleReservationSuccess(secondChoiceData, secondResult, true);
      } else {
        // 第二希望も失敗
        return handleReservationFailure(secondChoiceData, secondResult);
      }
    }
    
    // 第二希望がない、または既に第二希望での試行だった場合
    return handleReservationFailure(data, calendarResult);
    
  } catch (error) {
    console.error("processReservation エラー:", error);
    
    // エラー時の通知
    try {
      const userId = findUserByEmail(data.creator);
      const mentionText = userId ? `<@${userId}>` : data.creator;
      sendSlackThreadReply(
        getCONFIG().SLACK_CHANNEL_ID,
        data.threadTs,
        `${mentionText} システムエラーが発生しました。管理者にお問い合わせください。`
      );
    } catch (notifyError) {
      console.error("エラー通知も失敗:", notifyError);
    }
    
    updateReservationStatus(data, "エラー");
    throw error;
  }
}