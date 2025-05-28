// src/ai/providers/openai.js
import OpenAI from 'openai';
import { intentRecognitionPrompts } from '../prompts';

/**
 * Calls the OpenAI API to get intent and entities from a message.
 * @param {string} message The user's message.
 * @param {object} env Environment variables, must contain OPENAI_API_KEY.
 * @param {object} [options] Optional parameters for the AI call (e.g., model, prompt).
 * @returns {Promise<{intent: string|null, entities: object|null, error?: string}>}
 */
export async function getIntentFromOpenAI(message, env, options = {}) {
  if (!env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in environment variables.');
    return { intent: null, entities: null, error: 'OpenAI API key not configured.' };
  }

  // Initialize OpenAI client with API key and optional base URL from environment variables
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL // Will use default if not provided
  });

  const model = options.model || 'qwen/qwen3-30b-a3b'; // Default model

  // Get the appropriate prompt from the prompts configuration
  // Use the provided prompt in options, or fall back to the default prompt
  const systemPrompt = options.systemPrompt || intentRecognitionPrompts.default;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      response_format: { type: "json_object" }, // Enforce JSON output if supported by model
      temperature: options.temperature || 0.3, // Lower temperature for more deterministic output
    });

    console.log('OpenAI response:', JSON.stringify(chatCompletion, null, 2));

    if (chatCompletion.choices && chatCompletion.choices.length > 0) {
      const assistantResponse = chatCompletion.choices[0].message.content;
      try {
        const parsedResponse = JSON.parse(assistantResponse);
        // Validate the parsed response structure
        if (typeof parsedResponse.intent === 'string' && typeof parsedResponse.entities === 'object') {
          return {
            intent: parsedResponse.intent,
            entities: parsedResponse.entities || {},
          };
        } else {
          console.error('OpenAI response JSON does not match expected format:', parsedResponse);
          return { intent: 'unknown_intent', entities: {}, error: 'AI response format error.' };
        }
      } catch (e) {
        console.error('Error parsing OpenAI JSON response:', e, '\nRaw response:', assistantResponse);
        return { intent: 'unknown_intent', entities: {}, error: 'Error parsing AI response.' };
      }
    } else {
      console.error('No choices returned from OpenAI.');
      return { intent: null, entities: null, error: 'No response choices from OpenAI.' };
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return { intent: null, entities: null, error: `Failed to call OpenAI API: ${error.message}` };
  }
}