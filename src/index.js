import { Router } from 'itty-router';
import { handleTelegramUpdate, telegramApi } from './services/telegram';
import { recognizeIntent } from './ai/intentRecognizer';
import { handleApplicationRequest } from './applications/handler';
import { processImageMessage } from './ai/imageProcessor';

const router = Router();

// Endpoint for Telegram Webhook
router.post('/', async (request, env, ctx) => { // Modified to handle all POST requests to root
  // Token validation removed

  try {
    const update = await request.json();
    console.log('Received update:', JSON.stringify(update, null, 2));

    // 1. Get message and other data from Telegram update
    const { message, chatId, photo, messageType } = handleTelegramUpdate(update);

    if (!chatId) {
      console.log('No chatId found in update');
      return new Response('OK'); // Acknowledge Telegram, but nothing to process
    }

    // Skip callback queries - we only handle regular messages now

    let processedMessage = message;
    
    // Handle different message types
    if (messageType === 'photo') {
      console.log('Processing photo message');
      await telegramApi.sendMessage(chatId, "收到图片，正在识别图片中的文字内容...", env);
      
      // Process the image and extract text
      const imageResult = await processImageMessage(photo, env);
      
      if (imageResult.success && imageResult.text) {
        processedMessage = imageResult.text;
        console.log('Extracted text from image:', processedMessage);
        await telegramApi.sendMessage(chatId, `图片文字识别完成，正在分析指令...`, env);
      } else {
        console.error('Failed to extract text from image:', imageResult.error);
        await telegramApi.sendMessage(chatId, "抱歉，无法识别图片中的文字内容。请尝试发送更清晰的图片或直接输入文字指令。", env);
        return new Response('OK');
      }
    } else if (messageType === 'text') {
      // Regular text message
      if (!message) {
        console.log('No message found in update');
        return new Response('OK');
      }
    } else {
      console.log('Unsupported message type:', messageType);
      await telegramApi.sendMessage(chatId, "抱歉，目前只支持文字和图片消息。", env);
      return new Response('OK');
    }

    console.log(`ProcessedMessage: ${processedMessage}`);

    // 2. Recognize intent using AI (with processed message from text or image)
    const { intent } = await recognizeIntent(processedMessage, env);
    console.log(`Intent: ${intent}`);

    if (!intent || intent === 'unknown_intent') {
      await telegramApi.sendMessage(chatId, "抱歉，我无法识别您的指令。", env);
      return new Response('OK');
    }

    // Send processing message to user
    await telegramApi.sendMessage(chatId, `已开始调用【${intent}】模块，处理中请稍后...`, env);

    // 3. Handle application logic based on intent
    const response = await handleApplicationRequest(intent, processedMessage, chatId, env);

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