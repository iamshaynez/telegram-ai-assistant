// src/services/telegram.js

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

/**
 * Sends a message to a given chat ID via the Telegram Bot API.
 * @param {string|number} chatId The chat ID to send the message to.
 * @param {string} text The message text to send.
 * @param {object} env Environment object containing TELEGRAM_BOT_TOKEN.
 * @param {object} [options] Optional parameters for the message.
 * @param {object} [options.reply_markup] Optional reply markup for inline keyboards.
 * @returns {Promise<Response>} The fetch API Response object.
 */
async function sendMessage(chatId, text, env, options = {}) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set in environment variables.');
    return Promise.reject('Telegram Bot Token not configured.');
  }
  const url = `${TELEGRAM_API_BASE}${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown', // Optional: use 'HTML' or remove for plain text
    ...options
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const responseData = await response.json();
    if (!response.ok) {
      console.error('Telegram API error:', responseData);
      throw new Error(`Telegram API Error: ${responseData.description || response.status}`);
    }
    console.log('Message sent successfully:', responseData);
    return responseData;
  } catch (error) {
    console.error('Failed to send message to Telegram:', error);
    throw error;
  }
}

/**
 * Parses the incoming Telegram update to extract relevant information.
 * @param {object} update The Telegram update object.
 * @returns {{message: string|null, chatId: string|number|null, userId: string|number|null, updateId: string|number|null, callbackData: object|null, callbackQueryId: string|null}}
 */
function handleTelegramUpdate(update) {
  let message = null;
  let chatId = null;
  let userId = null;
  let updateId = update.update_id || null;
  let callbackData = null;
  let callbackQueryId = null;
  let isCallback = false;

  if (update.message) {
    chatId = update.message.chat.id;
    userId = update.message.from.id;
    if (update.message.text) {
      message = update.message.text;
    }
    // You can also handle other message types like photos, documents, etc.
    // else if (update.message.photo) { ... }
  } else if (update.callback_query) {
    // Handle callback queries from inline keyboards
    isCallback = true;
    chatId = update.callback_query.message.chat.id;
    userId = update.callback_query.from.id;
    callbackQueryId = update.callback_query.id;
    
    // Try to parse the callback data as JSON
    try {
      callbackData = JSON.parse(update.callback_query.data);
      // For backward compatibility, also set message to the raw data
      message = update.callback_query.data;
    } catch (error) {
      console.error('Error parsing callback data:', error);
      message = update.callback_query.data; // Fallback to raw data
    }
  }
  // Add more handlers for other update types if necessary (e.g., inline_query)

  return { message, chatId, userId, updateId, callbackData, callbackQueryId, isCallback };
}

/**
 * (Optional) Answers a callback query. Call this after processing a callback_query.
 * @param {string} callbackQueryId The ID of the callback query.
 * @param {object} env Environment object containing TELEGRAM_BOT_TOKEN.
 * @param {string} [text] Optional text to display to the user.
 */
async function answerCallbackQuery(callbackQueryId, env, text = undefined) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is not set.');
    return;
  }
  const url = `${TELEGRAM_API_BASE}${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  const payload = {
    callback_query_id: callbackQueryId,
  };
  if (text) {
    payload.text = text;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const responseData = await response.json();
      console.error('Telegram API error (answerCallbackQuery):', responseData);
    }
  } catch (error) {
    console.error('Failed to answer callback query:', error);
  }
}


/**
 * Sends a message with a confirmation button to a given chat ID.
 * @param {string|number} chatId The chat ID to send the message to.
 * @param {string} text The message text to send.
 * @param {object} data The data to be attached to the callback button.
 * @param {object} env Environment object containing TELEGRAM_BOT_TOKEN.
 * @returns {Promise<Response>} The fetch API Response object.
 */
async function sendMessageWithConfirmation(chatId, text, data, env) {
  // Create a unique callback data string that includes the action and parameters
  const callbackData = JSON.stringify({
    action: data.action,
    params: data.params,
    timestamp: Date.now() // Add timestamp to make the callback data unique
  });
  
  // Create inline keyboard with confirmation button
  const replyMarkup = {
    inline_keyboard: [
      [
        { text: "确认", callback_data: callbackData },
        { text: "取消", callback_data: JSON.stringify({ action: "cancel" }) }
      ]
    ]
  };
  
  // Send message with inline keyboard
  return sendMessage(chatId, text, env, { reply_markup: replyMarkup });
}

export const telegramApi = {
  sendMessage,
  answerCallbackQuery,
  sendMessageWithConfirmation
};

export { handleTelegramUpdate }; // Exporting separately if used directly in index.js