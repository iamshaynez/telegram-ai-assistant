// src/ai/parameterRecognizer.js
import { LLMClient } from './llmClient';
import { parameterRecognitionPrompts } from './prompts';

/**
 * Recognizes parameters from a user's message using a configured AI provider.
 * The intent directly corresponds to the action, so only parameters need to be extracted.
 * 
 * @param {string} message The user's message.
 * @param {string} intent The recognized intent (e.g., 'accounting_book_transaction', 'accounting_query').
 * @param {object} env The environment variables (containing API keys, AI bindings, etc.).
 * @returns {Promise<{parameters: object|null, error?: string}>}
 */
export async function recognizeParameters(message, intent, env) {
  console.log(`Recognizing parameters for message: "${message}" with intent: ${intent}`);

  // Check if OpenAI API key is configured
  if (!env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured. Check OPENAI_API_KEY env var.');
    return { parameters: null, error: 'OpenAI API key not configured.' };
  }

  console.log('Using LLM for parameter recognition.');
  
  // Create an LLMClient instance for direct AI interaction
  const llmClient = new LLMClient(env);
  
  // Determine which prompt to use based on the intent
  // For specific intents, try exact match first; for accounting intents, use 'accounting' prompt
  let promptType;
  if (parameterRecognitionPrompts[intent]) {
    promptType = intent;
  } else {
    throw new Error(`No parameter recognition prompt found for intent: ${intent}`);
  }
  
  const systemPrompt = parameterRecognitionPrompts[promptType];
  
  // Process the message to recognize parameters and action
  const result = await llmClient.complete({
    prompt: systemPrompt,
    message: message,
    temperature: 0.3,
    responseProcessor: (response) => {
      const parsedResponse = LLMClient.parseJSON(response);
      if (!parsedResponse || typeof parsedResponse !== 'object') {
        throw new Error('Invalid response format');
      }
      return {
        parameters: parsedResponse.parameters || {}
      };
    }
  });

  // Handle errors
  if (!result.success) {
    console.error(`LLM API Error: ${result.error}`);
    return { parameters: null, error: `LLM API Error: ${result.error}` };
  }
  
  return {
    parameters: result.data.parameters
  };
}