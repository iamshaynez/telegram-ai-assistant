// src/ai/intentProcessor.js
import { LLMClient } from './llmClient';
import { intentRecognitionPrompts } from './prompts';

/**
 * Processes user messages to recognize intents.
 * This module uses the LLMClient to interact with AI models and process responses.
 */
export class IntentProcessor {
  /**
   * Creates a new intent processor.
   * @param {object} env Environment variables.
   * @param {object} [options] Optional configuration.
   */
  constructor(env, options = {}) {
    this.env = env;
    this.options = options;
    this.llmClient = new LLMClient(env, options.llmOptions);
  }

  /**
   * Processes a user message to recognize intent.
   * @param {string} message The user's message.
   * @param {object} [options] Optional parameters for processing.
   * @param {string} [options.promptType] The type of prompt to use (default, accounting, etc.)
   * @param {string} [options.model] The model to use for processing.
   * @returns {Promise<{intent: string|null, error?: string}>}
   */
  async processMessage(message, options = {}) {
    // Get the appropriate prompt based on the promptType option
    const promptType = options.promptType || 'default';
    const systemPrompt = intentRecognitionPrompts[promptType] || intentRecognitionPrompts.default;
    
    // Define a response processor for intent recognition
    const intentResponseProcessor = (response) => {
      const parsedResponse = LLMClient.parseJSON(response);
      console.log('Parsed response:', parsedResponse);
      // Validate the parsed response structure
      if (!parsedResponse || typeof parsedResponse !== 'object') {
        throw new Error('Invalid response format');
      }
      
      if (typeof parsedResponse.intent !== 'string') {
        console.warn('Invalid intent format:', parsedResponse.intent);
        parsedResponse.intent = 'unknown_intent';
      }
      
      return {
        intent: parsedResponse.intent
      };
    };
    
    // Call the LLM client with the appropriate parameters
    const result = await this.llmClient.complete({
      prompt: systemPrompt,
      message: message,
      model: options.model || this.options.model,
      temperature: options.temperature || this.options.temperature || 0.3,
      responseProcessor: intentResponseProcessor
    });
    
    if (result.success) {
      return result.data;
    } else {
      console.error('Error processing intent:', result.error);
      return { 
        intent: 'unknown_intent', 
        error: result.error || 'Unknown error processing intent'
      };
    }
  }
}

/**
 * A convenience function to process a message for intent recognition.
 * @param {string} message The user's message.
 * @param {object} env Environment variables.
 * @param {object} [options] Optional parameters.
 * @returns {Promise<{intent: string|null, error?: string}>}
 */
export async function recognizeIntent(message, env, options = {}) {
  const processor = new IntentProcessor(env, options);
  return processor.processMessage(message, options);
}