// src/ai/responseGenerator.js
import { LLMClient } from './llmClient';
import { responseGenerationPrompts } from './prompts';

/**
 * Generates responses to user queries based on recognized intent and entities.
 * This module uses the LLMClient to interact with AI models and process responses.
 */
export class ResponseGenerator {
  /**
   * Creates a new response generator.
   * @param {object} env Environment variables.
   * @param {object} [options] Optional configuration.
   */
  constructor(env, options = {}) {
    this.env = env;
    this.options = options;
    this.llmClient = new LLMClient(env, options.llmOptions);
  }

  /**
   * Generates a response based on the user's message, recognized intent, and entities.
   * @param {string} message The user's original message.
   * @param {string} intent The recognized intent.
   * @param {object} entities The extracted entities.
   * @param {object} [options] Optional parameters for processing.
   * @param {string} [options.promptType] The type of prompt to use (default, accounting, notes).
   * @param {string} [options.model] The model to use for processing.
   * @returns {Promise<{response: string|null, error?: string}>}
   */
  async generateResponse(message, intent, entities, options = {}) {
    // Determine the appropriate prompt type based on intent or explicit option
    let promptType = options.promptType || 'default';
    
    // If no explicit prompt type is provided, try to infer from intent
    if (!options.promptType) {
      if (intent.includes('记账') || intent.includes('支出') || intent.includes('收入') || intent.includes('预算')) {
        promptType = 'accounting';
      } else if (intent.includes('笔记') || intent.includes('记录')) {
        promptType = 'notes';
      }
    }
    
    // Get the appropriate prompt from the prompts configuration
    const systemPrompt = responseGenerationPrompts[promptType] || responseGenerationPrompts.default;
    
    // Prepare a context object with intent and entities for the AI
    const context = {
      intent,
      entities,
      originalMessage: message
    };
    
    // Create a message that includes both the original message and the context
    const contextualMessage = `用户消息: ${message}\n\n上下文信息: ${JSON.stringify(context, null, 2)}`;
    
    // Define a response processor for text generation
    const responseProcessor = (response) => {
      // For response generation, we can just return the text as-is
      // But we could add additional processing here if needed
      return response;
    };
    
    // Call the LLM client with the appropriate parameters
    const result = await this.llmClient.complete({
      prompt: systemPrompt,
      message: contextualMessage,
      model: options.model || this.options.model,
      temperature: options.temperature || this.options.temperature || 0.7, // Higher temperature for more creative responses
      responseFormat: { type: "text" }, // We want a text response, not JSON
      responseProcessor
    });
    
    if (result.success) {
      return { response: result.data };
    } else {
      console.error('Error generating response:', result.error);
      return { 
        response: null, 
        error: result.error || 'Unknown error generating response'
      };
    }
  }
}

/**
 * A convenience function to generate a response based on intent and entities.
 * @param {string} message The user's original message.
 * @param {string} intent The recognized intent.
 * @param {object} entities The extracted entities.
 * @param {object} env Environment variables.
 * @param {object} [options] Optional parameters.
 * @returns {Promise<{response: string|null, error?: string}>}
 */
export async function generateResponse(message, intent, entities, env, options = {}) {
  const generator = new ResponseGenerator(env, options);
  return generator.generateResponse(message, intent, entities, options);
}