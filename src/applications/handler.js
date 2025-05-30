// src/applications/handler.js
import { handleAccountingIntent } from './accounting';
import { recognizeParameters } from '../ai/parameterRecognizer';
// Import other application handlers here
// import { handleOtherAppIntent } from './otherApp';

/**
 * General handler to route intents to the correct application.
 * @param {string} intent The recognized intent.
 * @param {string} message The original user message.
 * @param {string|number} chatId The user's chat ID.
 * @param {object} env Environment variables.
 * @param {boolean} [skipConfirmation=false] Whether to skip the confirmation step.
 * @param {object} [preRecognizedParams=null] Pre-recognized parameters if available.
 * @returns {Promise<string|object>} Response message or confirmation object.
 */
export async function handleApplicationRequest(intent, message, chatId, env) {
  console.log(`Routing intent: ${intent}`);

  // Determine which application type should handle this intent
  let appHandler = null;
  
  if (intent.startsWith('accounting')) {
    appHandler = handleAccountingIntent;
  } 
  // Add more routing rules for other applications
  // else if (intent.startsWith('other_app_')) {
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
  
  // Recognize parameters using the specific intent
  const { parameters } = await recognizeParameters(message, intent, env);
  
  if (!parameters) {
    return "I couldn't extract the necessary parameters. Could you please be more specific?";
  }
  
  // Process the action directly with the parameters
  return await appHandler(intent, parameters, chatId, env);
}