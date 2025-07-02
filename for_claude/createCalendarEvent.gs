function createCalenderEvent(formResult) {
  var calendar = CalendarApp.getCalendarById(
    "c_47aa4b7ccd25770a2e8056f6bbbcf3eb34fa6ac5af2c9b05fd00939ba510fcb2@group.calendar.google.com"
  );

  // タイトルにはcontentの内容を使用します。
  var title = `(仮) ${formResult.content}`;

  // formResult.dateが日付と時刻の情報を持っていると仮定します。
  var startTime = new Date(formResult.date);
  // 終了時刻を開始時刻の1時間後と仮定します。
  var endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  // イベントの詳細（説明）を、利用可能な情報だけで作成します。
  var body = "";
  body += `発表者(司会者)：${formResult.user}`;
  body += `\n\n概要：${formResult.content}`;
  body += "\n\n◆Zoom/Meet等のURLは別途発行・案内してください。";
  // 以下、元の詳細情報はformResultにないため、コメントアウトまたは削除します。
  /*
  body += '\n\n ＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝';
  body += `\n通訳：${form_result.translate}`;
  body += `\n録画：${(form_result.bool_record) ? '○' : '×'}`;
  body += `\n内定者参加：${(form_result.bool_hr) ? '○' : '×'}`;
  body += `\n資料の事前共有：${(form_result.bool_share_doc) ? '○' : '×'}`;
  body += `\nCurrent作成：${form_result.contrail}`;
  body += '\n＝＝＝＝＝＝＝＝＝＝＝＝＝＝＝';
  */

  var option = { description: body };

  Logger.log(`作成するイベント情報:`);
  Logger.log(`Title: ${title}`);
  Logger.log(`StartTime: ${startTime}`);
  Logger.log(`EndTime: ${endTime}`);
  Logger.log(`Option: ${JSON.stringify(option)}`);

  calendar.createEvent(title, startTime, endTime, option);
  Logger.log("カレンダーイベントを作成しました。");
}
