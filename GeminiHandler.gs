// Gemini API関連の関数

// 直前通知メッセージを生成
function generateNotificationMessage(data, type) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
      getCONFIG().GEMINI_API_KEY
    }`;

    let prompt;
    if (type === "24h") {
      prompt = `
      以下のイベント情報を基に、24時間前の通知メッセージを作成してください。

      タイトル: ${data.title}
      日時: ${data.date} ${data.time}
      場所: ${data.location}
      ${data.meetUrl ? `Google Meet URL: ${data.meetUrl}` : ""}

      メッセージは以下の要素を含めてください：
      - 明日の予定であることを明記
      - イベントの詳細（タイトル、日時、場所）
      - 準備を促す内容
      ${data.meetUrl ? "- Google MeetのURLを含める" : ""}
      - 親しみやすい絵文字を適度に使用

      文字数は2-3文程度でお願いします。
      `;
    } else if (type === "3h") {
      prompt = `
      以下のイベント情報を基に、3時間前の通知メッセージを作成してください。

      タイトル: ${data.title}
      日時: ${data.date} ${data.time}
      場所: ${data.location}
      ${data.meetUrl ? `Google Meet URL: ${data.meetUrl}` : ""}

      メッセージは以下の要素を含めてください：
      - 本日の予定であることを明記
      - イベントの詳細（タイトル、日時、場所）
      - 準備の確認を促す内容
      ${data.meetUrl ? "- Google MeetのURLを含める" : ""}
      - 親しみやすい絵文字を適度に使用

      文字数は2-3文程度でお願いします。
      `;
    } else if (type === "3m") {
      prompt = `
      以下のイベント情報を基に、3分前の直前通知メッセージを作成してください。

      タイトル: ${data.title}
      日時: ${data.date} ${data.time}
      場所: ${data.location}
      ${data.meetUrl ? `Google Meet URL: ${data.meetUrl}` : ""}

      メッセージは以下の要素を含めてください：
      - まもなく始まることを強調
      - イベントの詳細（タイトル、日時、場所）
      - 急ぎの準備を促す内容
      ${data.meetUrl ? "- Google MeetのURLを含める" : ""}
      - 緊急感のある絵文字を使用

      文字数は2-3文程度でお願いします。
      `;
    } else {
      throw new Error("未知の通知タイプ: " + type);
    }

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      payload: JSON.stringify(requestBody),
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseData = JSON.parse(response.getContentText());

    if (responseData.candidates && responseData.candidates.length > 0) {
      const generatedText = responseData.candidates[0].content.parts[0].text;
      console.log("通知メッセージ生成成功:", generatedText);
      return generatedText;
    } else {
      console.error("通知メッセージ生成失敗: 応答が空です");
      return null;
    }
  } catch (error) {
    console.error("通知メッセージ生成エラー:", error);
    return null;
  }
}

// 告知文を生成
function generateAnnouncement(data) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
      getCONFIG().GEMINI_API_KEY
    }`;

    const prompt = `
    以下のイベント情報を基に、魅力的で親しみやすい告知文を作成してください。

    タイトル: ${data.title}
    日時: ${data.date}
    場所: ${data.location}
    概要: ${data.description || "なし"}
    ${data.meetUrl ? `Google Meet URL: ${data.meetUrl}` : ""}

    告知文は以下の要素を含めてください：
    - 概要がある場合はその内容を活かした説明
    - 概要がない場合はタイトルから内容を推測
    - 参加を促す呼びかけ
    - 日時と場所の明確な案内
    ${data.meetUrl ? "- Google MeetのURLを含める" : ""}
    - 絵文字を適度に使用

    文字数は2文程度でお願いします。
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      payload: JSON.stringify(requestBody),
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (
      result.candidates &&
      result.candidates[0] &&
      result.candidates[0].content
    ) {
      const announcement = result.candidates[0].content.parts[0].text;
      console.log("告知文生成成功");
      return announcement;
    } else {
      throw new Error("Gemini APIからの応答が不正です");
    }
  } catch (error) {
    console.error("告知文生成エラー:", error);
    // エラー時はデフォルトの告知文を返す
    return `📢 ${data.title}\n\n日時: ${data.date}\n場所: ${data.location}\n${
      data.description ? `\n概要: ${data.description}\n` : ""
    }${
      data.meetUrl ? `\nGoogle Meet: ${data.meetUrl}\n` : ""
    }\nぜひご参加ください！`;
  }
}

// メッセージから日付を抽出
function extractDateFromMessage(message) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
      getCONFIG().GEMINI_API_KEY
    }`;

    const prompt = `
    以下のメッセージから日時情報を抽出してください。
    日時は "YYYY-MM-DD HH:mm" の形式で返してください。
    日時が複数ある場合は最初の1つだけを返してください。
    日時が見つからない場合は "NOT_FOUND" と返してください。

    メッセージ: ${message}

    出力形式の例:
    - 2024-03-15 14:00
    - NOT_FOUND

    回答は日時のみ、または "NOT_FOUND" のみを返してください。
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      payload: JSON.stringify(requestBody),
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (
      result.candidates &&
      result.candidates[0] &&
      result.candidates[0].content
    ) {
      const extractedDate = result.candidates[0].content.parts[0].text.trim();

      if (extractedDate === "NOT_FOUND") {
        return null;
      }

      // 日付の妥当性をチェック
      const dateObj = new Date(extractedDate);
      if (isNaN(dateObj.getTime())) {
        return null;
      }

      return extractedDate;
    } else {
      throw new Error("Gemini APIからの応答が不正です");
    }
  } catch (error) {
    console.error("日付抽出エラー:", error);
    return null;
  }
}

// チャットメッセージに対する応答を生成
function generateChatResponse(message, userId) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${
      getCONFIG().GEMINI_API_KEY
    }`;

    const prompt = `
    あなたは社内の会議室予約を管理する多機能アシスタントボットです。
    予約に関する質問だけでなく、一般的な会話や質問にも親切に対応してください。

    ユーザーからのメッセージ: ${message}

    以下の点に注意してください：

    【会議室予約関連】
    - 予約方法について聞かれたら、Slackワークフローを使用することを案内する
    - 日程調整の相談には建設的な提案をする
    - 予約状況の確認方法を聞かれたら、カレンダーを確認するよう案内する

    【一般的な対応】
    - 挨拶には親しみやすく返答する（例：「こんにちは！」「お疲れ様です！」）
    - 天気や時事ネタには適切に反応する
    - 雑談や相談にも丁寧に応じる
    - ユーモアのある質問にはユーモアで返す
    - 知らないことは正直に「わかりません」と答える

    【コミュニケーションスタイル】
    - 絵文字を適度に使用して親しみやすくする
    - カジュアルだが丁寧な口調を心がける
    - 簡潔で分かりやすい応答を心がける
    - 相手の気持ちに共感的に応答する

    応答は200文字程度でお願いします。
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    const options = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      payload: JSON.stringify(requestBody),
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (
      result.candidates &&
      result.candidates[0] &&
      result.candidates[0].content
    ) {
      const chatResponse = result.candidates[0].content.parts[0].text;
      console.log("チャット応答生成成功");
      return chatResponse;
    } else {
      throw new Error("Gemini APIからの応答が不正です");
    }
  } catch (error) {
    console.error("チャット応答生成エラー:", error);
    // エラー時のデフォルト応答
    return "お問い合わせありがとうございます。現在、一時的に応答を生成できません。しばらくしてから再度お試しください。🙏";
  }
}
