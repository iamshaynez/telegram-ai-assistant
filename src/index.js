import { Router } from 'itty-router';
import { handleTelegramUpdate, telegramApi } from './services/telegram';
import { recognizeIntent } from './ai/intentRecognizer';
import { handleApplicationRequest, handleCallbackQuery } from './applications/handler';

const router = Router();

// Endpoint for Telegram Webhook
router.post('/', async (request, env, ctx) => { // Modified to handle all POST requests to root
  // Token validation removed

  try {
    const update = await request.json();
    console.log('Received update:', JSON.stringify(update, null, 2));

    // 1. Get message and other data from Telegram update
    const { message, chatId, callbackData, callbackQueryId, isCallback } = handleTelegramUpdate(update);

    if (!chatId) {
      console.log('No chatId found in update');
      return new Response('OK'); // Acknowledge Telegram, but nothing to process
    }

    // Handle callback queries (confirmation buttons)
    if (isCallback && callbackData && callbackQueryId) {
      console.log('Processing callback query:', callbackData);
      await handleCallbackQuery(callbackData, chatId, callbackQueryId, env);
      return new Response('OK');
    }

    // Regular message flow
    if (!message) {
      console.log('No message found in update');
      return new Response('OK');
    }

    // 2. Recognize intent using AI
    const { intent, entities } = await recognizeIntent(message, env);
    console.log(`Intent: ${intent}, Entities: ${JSON.stringify(entities)}`);

    if (!intent) {
      await telegramApi.sendMessage(chatId, "Sorry, I couldn't understand that.", env);
      return new Response('OK');
    }

    // Store original message in entities for later parameter recognition
    entities.original_message = message;

    // 3. Handle application logic based on intent
    const response = await handleApplicationRequest(intent, entities, chatId, env);

    // 4. Send response back to Telegram if it's not a confirmation flow
    if (response && typeof response === 'string') {
      await telegramApi.sendMessage(chatId, response, env);
    }

    return new Response('OK');
  } catch (error) {
    console.error('Error processing update:', error);
    // Optionally send an error message back to the user if a chatId is available
    // and it's a user-facing error.
    return new Response('Error processing request', { status: 200 });
  }
});

// Catch-all for other requests
router.all('*', () => new Response('Not Found.', { status: 200 }));

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  },
};