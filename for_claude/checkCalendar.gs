function checkCalendarEvent(formResult) {
  var scheduleCondi = 0; // 1ならスケジューリングOKのフラグ
  // var hpzCalendar = CalendarApp.getCalendarById("wni.com_cd8ct1l8dvglf0i67fiip72dis@group.calendar.google.com"); // hydepark & zukkoke
  var hpzCalendar = CalendarApp.getCalendarById(
    "c_47aa4b7ccd25770a2e8056f6bbbcf3eb34fa6ac5af2c9b05fd00939ba510fcb2@group.calendar.google.com"
  ); // hydepark & zukkoke
  // var tecCalendar = CalendarApp.getCalendarById("YOUR_OTHER_CALENDAR_ID@group.calendar.google.com"); // 必要であれば、もう一つのカレンダーIDを指定してください

  Logger.log("getCalender OK");

  // formResult.dateが日付と時刻の情報を持っていると仮定します。
  var startTime = new Date(formResult.date);
  // 終了時刻を開始時刻の1時間後と仮定します。
  var endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  // スケジュールチェック
  var events = hpzCalendar.getEvents(startTime, endTime);
  // もし他のカレンダーもチェックする場合は、以下の行のコメントを解除してください。
  // events = events.concat(tecCalendar.getEvents(startTime, endTime));

  Logger.log(`events.length: ${events.length}`);

  // イベントが入っていなければ配列の長さは0になります。
  if (events.length == 0) {
    scheduleCondi = 1;
    Logger.log("開催希望日で開催可能です");
  } else {
    scheduleCondi = 0;
    Logger.log("希望日には既に予定が入っています");
  }

  return scheduleCondi; // スケジューリング可否を0または1で返します。
}
