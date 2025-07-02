function reply(formResult, message) {
  const accessToken = "YOUR_SLACK_BOT_TOKEN";
  const channelId = "YOUR_SLACK_CHANNEL_ID"; //投稿したいチャンネルID
  // const message ="私はこくぶんこうた！！";
  // const ts = "1751249891.127639" // スレッドに投稿するメッセージのタイムスタンプ
  const parts = formResult.url.split("/");
  const p_value = parts[parts.length - 1];
  const ts_string_raw = p_value.substring(1);
  const ts_number = Number(ts_string_raw) / 1000000;
  const ts = ts_number.toString();

  const endpoint = "https://slack.com/api/chat.postMessage";
  const payload = {
    channel: channelId,
    text: message,
    thread_ts: ts,
  };
  const options = {
    method: "post",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    payload: JSON.stringify(payload),
  };

  UrlFetchApp.fetch(endpoint, options);
}
