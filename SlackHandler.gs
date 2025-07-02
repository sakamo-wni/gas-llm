// Slack関連の操作関数

// メールアドレスからSlackユーザーIDを取得
function findUserByEmail(email_address) {
  try {
    const url = "https://slack.com/api/users.lookupByEmail";
    
    const payload = {
      "token": getCONFIG().SLACK_BOT_TOKEN,
      "email": email_address
    };
    
    const options = {
      "method": "GET",
      "payload": payload,
      "headers": {
        "contentType": "x-www-form-urlencoded",
      }
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const json_data = JSON.parse(response.getContentText());
    
    console.log('Slack API応答:', JSON.stringify(json_data));
    
    if (json_data["ok"]) {
      const user_id = String(json_data["user"]["id"]);
      console.log(`ユーザーID取得成功: ${email_address} → ${user_id}`);
      return user_id;
    } else {
      console.error(`ユーザーID取得失敗: ${email_address}`, json_data["error"]);
      // エラーの詳細をログ出力
      if (json_data["error"] === "users_not_found") {
        console.error("ユーザーが見つかりません。メールアドレスがSlackに登録されていない可能性があります。");
      } else if (json_data["error"] === "missing_scope") {
        console.error("権限不足: users:read.email スコープが必要です。Slackアプリの設定でこのスコープを追加してください。");
        console.log("対処法: https://api.slack.com/apps でアプリを選択 → OAuth & Permissions → Scopes → Bot Token Scopes に users:read.email を追加");
      }
      // メールアドレスが見つからない場合は、nullを返す（メンションしない）
      return null;
    }
  } catch (error) {
    console.error('findUserByEmail エラー:', error);
    return null;
  }
}

// Slackスレッドに返信
function sendSlackThreadReply(channelId, threadTs, message) {
  try {
    const url = 'https://slack.com/api/chat.postMessage';
    
    const payload = {
      channel: channelId,
      text: message,
      thread_ts: threadTs
    };
    
    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${getCONFIG().SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (!result.ok) {
      throw new Error(`Slack API エラー: ${result.error}`);
    }
    
    console.log('Slackスレッド返信成功');
    return true;
    
  } catch (error) {
    console.error('Slackスレッド返信エラー:', error);
    throw error;
  }
}

// Slackユーザーにダイレクトメッセージを送信
function sendSlackMessage(userId, message) {
  try {
    const url = 'https://slack.com/api/chat.postMessage';
    
    const payload = {
      channel: userId,
      text: message
    };
    
    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${getCONFIG().SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (!result.ok) {
      throw new Error(`Slack API エラー: ${result.error}`);
    }
    
    console.log('Slackメッセージ送信成功:', userId);
    return true;
    
  } catch (error) {
    console.error('Slackメッセージ送信エラー:', error);
    throw error;
  }
}

// チャンネルに告知を投稿
function postToChannel(message) {
  try {
    const url = 'https://slack.com/api/chat.postMessage';
    
    const payload = {
      channel: getCONFIG().SLACK_CHANNEL_ID,
      text: message,
      unfurl_links: false,
      unfurl_media: false
    };
    
    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${getCONFIG().SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (!result.ok) {
      throw new Error(`Slack API エラー: ${result.error}`);
    }
    
    console.log('チャンネル投稿成功');
    return true;
    
  } catch (error) {
    console.error('チャンネル投稿エラー:', error);
    throw error;
  }
}

// Slackワークフローへの応答を送信
function sendWorkflowResponse(responseUrl, message, success = true) {
  try {
    const payload = {
      response_type: 'in_channel',
      text: message,
      replace_original: false
    };
    
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    };
    
    UrlFetchApp.fetch(responseUrl, options);
    
  } catch (error) {
    console.error('ワークフロー応答エラー:', error);
  }
}

// Slackメッセージにリアクションを追加
function addSlackReaction(channel, timestamp, reaction) {
  try {
    const url = 'https://slack.com/api/reactions.add';
    
    const payload = {
      channel: channel,
      timestamp: timestamp,
      name: reaction
    };
    
    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${getCONFIG().SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (!result.ok) {
      console.error(`リアクション追加エラー: ${result.error}`);
    } else {
      console.log(`リアクション追加成功: ${reaction}`);
    }
    
  } catch (error) {
    console.error('リアクション追加エラー:', error);
  }
}

// Slackメッセージからリアクションを削除
function removeSlackReaction(channel, timestamp, reaction) {
  try {
    const url = 'https://slack.com/api/reactions.remove';
    
    const payload = {
      channel: channel,
      timestamp: timestamp,
      name: reaction
    };
    
    const options = {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${getCONFIG().SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (!result.ok && result.error !== 'no_reaction') {
      console.error(`リアクション削除エラー: ${result.error}`);
    } else {
      console.log(`リアクション削除成功: ${reaction}`);
    }
    
  } catch (error) {
    console.error('リアクション削除エラー:', error);
  }
}