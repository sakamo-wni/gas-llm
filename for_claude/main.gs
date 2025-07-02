const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
Logger.log(sheet);
const lastRowIndex = sheet.getLastRow();

function main() {
  const lastRowValues = sheet
    .getRange(lastRowIndex, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  let formResult = {
    timestamp: lastRowValues[0],
    id: lastRowValues[1],
    user: lastRowValues[3],
    content: lastRowValues[4],
    date: lastRowValues[5],
    url: lastRowValues[7],
  };
  let scheduleCondi = checkCalendarEvent(formResult);
  Logger.log(scheduleCondi);
  if (scheduleCondi == 0) {
    let message = "予定はこくぶんこうた！！";
    reply(formResult, message);
  } else {
    createCalenderEvent(formResult);
    let message = "私はこくぶんこうた！！！";
    reply(formResult, message);
  }
}
