// 設定管理関連の関数

// 設定キャッシュ
let CONFIG_CACHE = null;

// スクリプトプロパティから設定を取得
function getConfigValues() {
  // キャッシュがあれば返す
  if (CONFIG_CACHE) {
    return CONFIG_CACHE;
  }
  
  try {
    const props = PropertiesService.getScriptProperties();
    CONFIG_CACHE = {
      SPREADSHEET_ID: props.getProperty("SPREADSHEET_ID"),
      CALENDAR_ID: props.getProperty("CALENDAR_ID"),
      GEMINI_API_KEY: props.getProperty("GEMINI_API_KEY"),
      SLACK_BOT_TOKEN: props.getProperty("SLACK_BOT_TOKEN"),
      SLACK_CHANNEL_ID: props.getProperty("SLACK_CHANNEL_ID"),
      SLACK_WEBHOOK_URL: props.getProperty("SLACK_WEBHOOK_URL"),
      SLACK_MESSAGE_TEMPLATE_24H: props.getProperty("SLACK_MESSAGE_TEMPLATE_24H"),
      SLACK_MESSAGE_TEMPLATE_3H: props.getProperty("SLACK_MESSAGE_TEMPLATE_3H"),
      SLACK_MESSAGE_TEMPLATE_3M: props.getProperty("SLACK_MESSAGE_TEMPLATE_3M"),
      NOTIFICATION_SHEET_NAME: props.getProperty("NOTIFICATION_SHEET_NAME"),
      RESERVATION_SHEET_NAME: props.getProperty("RESERVATION_SHEET_NAME"),
    };
    return CONFIG_CACHE;
  } catch (e) {
    console.error("スクリプトプロパティの取得に失敗:", e);
    // フォールバック値
    return {
      SPREADSHEET_ID: "YOUR_SPREADSHEET_ID",
      CALENDAR_ID: "YOUR_CALENDAR_ID",
      GEMINI_API_KEY: "YOUR_GEMINI_API_KEY",
      SLACK_BOT_TOKEN: "YOUR_SLACK_BOT_TOKEN",
      SLACK_CHANNEL_ID: "YOUR_SLACK_CHANNEL_ID",
      SLACK_WEBHOOK_URL: "YOUR_SLACK_WEBHOOK_URL",
      SLACK_MESSAGE_TEMPLATE_24H: "YOUR_SLACK_MESSAGE_TEMPLATE_24H",
      SLACK_MESSAGE_TEMPLATE_3H: "YOUR_SLACK_MESSAGE_TEMPLATE_3H",
      SLACK_MESSAGE_TEMPLATE_3M: "YOUR_SLACK_MESSAGE_TEMPLATE_3M",
      NOTIFICATION_SHEET_NAME: "YOUR_NOTIFICATION_SHEET_NAME",
      RESERVATION_SHEET_NAME: "YOUR_RESERVATION_SHEET_NAME",
    };
  }
}

// CONFIG変数を動的に取得する関数
function getCONFIG() {
  return getConfigValues();
}

// 設定キャッシュをクリア（設定変更時に使用）
function clearConfigCache() {
  CONFIG_CACHE = null;
}