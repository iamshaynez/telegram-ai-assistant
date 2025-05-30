// src/ai/parameterRecognizer.js
import { IntentProcessor } from './intentProcessor';
import { parameterRecognitionPrompts } from './prompts';

/**
 * Recognizes parameters and action type from a user's message using a configured AI provider.
 * This function uses the IntentProcessor class with parameter recognition prompts.
 * 
 * @param {string} message The user's message.
 * @param {string} appType The application type (e.g., 'accounting', 'notes').
 * @param {object} env The environment variables (containing API keys, AI bindings, etc.).
 * @returns {Promise<{action: string|null, parameters: object|null, error?: string}>}
 */
export async function recognizeParameters(message, appType, env) {
  console.log(`Recognizing parameters for message: "${message}" with app type: ${appType}`);

  // Check if OpenAI API key is configured
  if (!env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured. Check OPENAI_API_KEY env var.');
    return { action: null, parameters: null, error: 'OpenAI API key not configured.' };
  }

  console.log('Using LLM for parameter recognition.');
  
  // Create an IntentProcessor instance with the environment and config options
  const processor = new IntentProcessor(env);
  
  // Determine which prompt to use based on the application type
  const promptType = parameterRecognitionPrompts[appType] ? appType : 'default';
  
  // Process the message to recognize parameters and action
  const result = await processor.processMessage(message, {
    promptType,
    systemPrompt: parameterRecognitionPrompts[promptType],
    responseProcessor: (response) => {
      const parsedResponse = JSON.parse(response);
      return {
        action: parsedResponse.action || null,
        parameters: parsedResponse.parameters || {}
      };
    }
  });

  // Handle errors
  if (result.error) {
    console.error(`LLM API Error: ${result.error}`);
    return { action: null, parameters: null, error: `LLM API Error: ${result.error}` };
  }
  
  return {
    action: result.action,
    parameters: result.parameters
  };
}