// src/applications/handler.js
import { handleAccountingIntent } from './accounting';
import { recognizeParameters } from '../ai/parameterRecognizer';
import { telegramApi } from '../services/telegram';
// Import other application handlers here
// import { handleOtherAppIntent } from './otherApp';

/**
 * General handler to route intents to the correct application.
 * @param {string} intent The recognized intent.
 * @param {object} entities Extracted entities.
 * @param {string|number} chatId The user's chat ID.
 * @param {object} env Environment variables.
 * @param {boolean} [skipConfirmation=false] Whether to skip the confirmation step.
 * @param {object} [preRecognizedParams=null] Pre-recognized parameters if available.
 * @returns {Promise<string|object>} Response message or confirmation object.
 */
export async function handleApplicationRequest(intent, entities, chatId, env, skipConfirmation = false, preRecognizedParams = null) {
  console.log(`Routing intent: ${intent}`);

  // Determine which application type should handle this intent
  let appType = 'default';
  let appHandler = null;
  
  if (intent.startsWith('add_expense') || intent.startsWith('get_balance')) {
    appType = 'accounting';
    appHandler = handleAccountingIntent;
  } 
  // Add more routing rules for other applications
  // else if (intent.startsWith('other_app_')) {
  //   appType = 'other_app';
  //   appHandler = handleOtherAppIntent;
  // }
  else if (intent === 'unknown_intent') {
    return "I'm sorry, I didn't understand that. Could you please rephrase?";
  }
  
  if (!appHandler) {
    // Fallback if no application is specifically matched but intent is known
    console.warn(`No specific application handler found for intent: ${intent}`);
    return `I'm not sure how to handle '${intent}' yet. This feature might be under development.`;
  }
  
  // If we have pre-recognized parameters and we're skipping confirmation, use them directly
  if (skipConfirmation && preRecognizedParams) {
    return await appHandler(preRecognizedParams.action, preRecognizedParams.parameters, chatId, env);
  }
  
  // Otherwise, recognize parameters and action type
  const message = entities.original_message || JSON.stringify(entities);
  const { action, parameters } = await recognizeParameters(message, appType, env);
  
  if (!action) {
    return "I couldn't determine what action to take. Could you please be more specific?";
  }
  
  // If skipConfirmation is true, proceed directly
  if (skipConfirmation) {
    return await appHandler(action, parameters, chatId, env);
  }
  
  // Otherwise, send confirmation message to user
  const confirmationData = {
    action: action,
    params: parameters,
    appType: appType,
    intent: intent
  };
  
  // Generate confirmation message
  let confirmationMessage = `请确认以下操作:\n\n`;
  confirmationMessage += `操作类型: ${action}\n`;
  confirmationMessage += `参数:\n`;
  
  // Add parameters to confirmation message
  Object.entries(parameters).forEach(([key, value]) => {
    confirmationMessage += `- ${key}: ${value}\n`;
  });
  
  // Send confirmation message with buttons
  await telegramApi.sendMessageWithConfirmation(chatId, confirmationMessage, confirmationData, env);
  
  // Return a special object to indicate that confirmation is pending
  return { status: 'confirmation_sent', message: 'Confirmation message sent to user.' };
}

/**
 * Handles a callback query from a confirmation button.
 * @param {object} callbackData The data from the callback query.
 * @param {string|number} chatId The user's chat ID.
 * @param {string} callbackQueryId The callback query ID.
 * @param {object} env Environment variables.
 * @returns {Promise<string>} Response message.
 */
export async function handleCallbackQuery(callbackData, chatId, callbackQueryId, env) {
  // Answer the callback query to stop the loading indicator
  await telegramApi.answerCallbackQuery(callbackQueryId, env);
  
  // If the user cancelled, send a message and return
  if (callbackData.action === 'cancel') {
    await telegramApi.sendMessage(chatId, '操作已取消。', env);
    return '操作已取消。';
  }
  
  // Otherwise, process the confirmed action
  const { action, params, appType, intent } = callbackData;
  
  let appHandler = null;
  if (appType === 'accounting') {
    appHandler = handleAccountingIntent;
  } else if (appType === 'notes') {
    appHandler = handleAccountingIntent;
  }
  // Add more handlers for other application types
  
  if (!appHandler) {
    await telegramApi.sendMessage(chatId, `未知的应用类型: ${appType}`, env);
    return `未知的应用类型: ${appType}`;
  }
  
  // Process the action with the confirmed parameters
  const result = await appHandler(action, params, chatId, env);
  
  // Send the result back to the user
  await telegramApi.sendMessage(chatId, result, env);
  
  return result;
}