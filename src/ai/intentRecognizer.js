// src/ai/intentRecognizer.js
import { IntentProcessor } from './intentProcessor';
import { appConfig } from '../config';

/**
 * Recognizes the intent from a user's message using a configured AI provider.
 * This function now uses the IntentProcessor class which provides a more flexible and extensible
 * approach to intent recognition.
 * 
 * @param {string} message The user's message.
 * @param {object} env The environment variables (containing API keys, AI bindings, etc.).
 * @returns {Promise<{intent: string|null, error?: string}>}
 */
export async function recognizeIntent(message, env) {
  console.log(`Recognizing intent for message: "${message}"`);

  // Check if OpenAI API key is configured
  if (!env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured. Check OPENAI_API_KEY env var.');
    return { intent: null, error: 'OpenAI API key not configured.' };
  }

  console.log('Using LLM for intent recognition.');
  
  // Create an IntentProcessor instance with the environment and config options
  const processor = new IntentProcessor(env, appConfig.ai?.openai_options || {});
  
  // Process the message to recognize intent
  const result = await processor.processMessage(message);

  // Handle errors
  if (result.error) {
    console.error(`LLM API Error: ${result.error}`);
    return { intent: null, error: `LLM API Error: ${result.error}` };
  }

  // Log if no specific intent was determined
  if (!result.intent || result.intent === 'unknown_intent') {
    console.log('AI could not determine a specific intent.');
    // We respect the AI's determination and don't fallback to other methods
  }
  
  return result;
}
