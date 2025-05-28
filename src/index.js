import { Router } from 'itty-router';
import { handleTelegramUpdate } from './services/telegram';
import { recognizeIntent } from './ai/intentRecognizer';
import { handleApplicationRequest } from './applications/handler'; // Assuming a general handler

const router = Router();

// Endpoint for Telegram Webhook
router.post('/', async (request, env, ctx) => { // Modified to handle all POST requests to root
  // Token validation removed

  try {
    const update = await request.json();
    console.log('Received update:', JSON.stringify(update, null, 2));

    // 1. Get message from Telegram update
    const { message, chatId } = handleTelegramUpdate(update);

    if (!message || !chatId) {
      console.log('No message or chatId found in update');
      return new Response('OK'); // Acknowledge Telegram, but nothing to process
    }

    // 2. Recognize intent using AI
    const { intent, entities } = await recognizeIntent(message, env);
    console.log(`Intent: ${intent}, Entities: ${JSON.stringify(entities)}`);

    if (!intent) {
      await telegramApi.sendMessage(chatId, "Sorry, I couldn't understand that.", env);
      return new Response('OK');
    }

    // 3. Handle application logic based on intent
    const responseMessage = await handleApplicationRequest(intent, entities, chatId, env);

    // 4. Send response back to Telegram
    if (responseMessage) {

      await telegramApi.sendMessage(chatId, responseMessage, env);
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