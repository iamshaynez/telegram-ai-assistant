// src/applications/handler.js
import { handleAccountingIntent } from './accounting';
import { handleNotesIntent } from './notes';
// Import other application handlers here
// import { handleOtherAppIntent } from './otherApp';

/**
 * General handler to route intents to the correct application.
 * @param {string} intent The recognized intent.
 * @param {object} entities Extracted entities.
 * @param {string|number} chatId The user's chat ID.
 * @param {object} env Environment variables.
 * @returns {Promise<string>} Response message from the application.
 */
export async function handleApplicationRequest(intent, entities, chatId, env) {
  console.log(`Routing intent: ${intent}`);

  // Determine which application should handle this intent.
  // This could be based on a prefix in the intent string, or a mapping.
  if (intent.startsWith('add_expense') || intent.startsWith('get_balance')) {
    return await handleAccountingIntent(intent, entities, chatId, env);
  } else if (intent.startsWith('add_note') || intent.startsWith('list_notes')) {
    return await handleNotesIntent(intent, entities, chatId, env);
  }
  // Add more routing rules for other applications
  // else if (intent.startsWith('other_app_')) {
  //   return await handleOtherAppIntent(intent, entities, chatId, env);
  // }
  else if (intent === 'unknown_intent') {
    return "I'm sorry, I didn't understand that. Could you please rephrase?";
  }

  // Fallback if no application is specifically matched but intent is known
  console.warn(`No specific application handler found for intent: ${intent}`);
  return `I'm not sure how to handle '${intent}' yet. This feature might be under development.`;
}