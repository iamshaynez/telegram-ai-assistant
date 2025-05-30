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
 * @returns {{message: string|null, chatId: string|number|null, userId: string|number|null, updateId: string|number|null}}
 */
function handleTelegramUpdate(update) {
  let message = null;
  let chatId = null;
  let userId = null;
  let updateId = update.update_id || null;

  if (update.message) {
    chatId = update.message.chat.id;
    userId = update.message.from.id;
    if (update.message.text) {
      message = update.message.text;
    }
    // You can also handle other message types like photos, documents, etc.
    // else if (update.message.photo) { ... }
  }
  // Add more handlers for other update types if necessary (e.g., inline_query)

  return { message, chatId, userId, updateId };
}



export const telegramApi = {
  sendMessage
};

export { handleTelegramUpdate }; // Exporting separately if used directly in index.js