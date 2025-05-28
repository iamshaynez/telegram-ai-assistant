// src/ai/intentRecognizer.js
import { getIntentFromOpenAI } from './providers/openai';
import { appConfig } from '../config';

/**
 * Recognizes the intent and extracts entities from a user's message using a configured AI provider.
 * @param {string} message The user's message.
 * @param {object} env The environment variables (containing API keys, AI bindings, etc.).
 * @returns {Promise<{intent: string|null, entities: object|null, error?: string}>}
 */
export async function recognizeIntent(message, env) {
  console.log(`Recognizing intent for message: "${message}"`);

  let result;

  if (env.OPENAI_API_KEY) {
    console.log('Using OpenAI for intent recognition.');
    result = await getIntentFromOpenAI(message, env, appConfig.ai?.openai_options);
  } else {
    console.warn('OpenAI API key not configured. Check OPENAI_API_KEY env var.');
    return { intent: null, entities: null, error: 'OpenAI API key not configured.' };
  }

  if (result.error) {
    console.error(`OpenAI API Error: ${result.error}`);
    return { intent: null, entities: null, error: `OpenAI API Error: ${result.error}` };
  }

  if (!result.intent || result.intent === 'unknown_intent') {
    console.log('AI could not determine a specific intent.');
    // If AI returns unknown_intent, we respect that and don't fallback to keywords
  }
  
  return result;
}
