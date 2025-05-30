// src/ai/llmClient.js
import OpenAI from 'openai';

/**
 * A generic client for interacting with Large Language Models (LLMs).
 * This abstraction allows for easy switching between different LLM providers
 * and standardizes the interaction patterns.
 */
export class LLMClient {
  /**
   * Creates a new LLM client instance.
   * @param {object} env Environment variables containing API keys and configuration.
   * @param {object} [options] Optional configuration for the client.
   */
  constructor(env, options = {}) {
    this.env = env;
    this.options = options;
    this.client = null;
    this.initialized = false;
  }

  /**
   * Initializes the LLM client with the appropriate provider.
   * @returns {boolean} Whether initialization was successful.
   */
  initialize() {
    if (this.initialized) return true;

    if (this.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: this.env.OPENAI_API_KEY,
        baseURL: this.env.OPENAI_BASE_URL // Will use default if not provided
      });
      this.provider = 'openai';
      this.initialized = true;
      return true;
    }
    
    // Could add more providers here in the future
    
    return false;
  }

  /**
   * Sends a completion request to the LLM.
   * @param {object} params Parameters for the completion request.
   * @param {string} params.prompt The system prompt to use.
   * @param {string} params.message The user message to process.
   * @param {string} [params.model] The model to use (provider-specific).
   * @param {number} [params.temperature] The temperature for generation.
   * @param {object} [params.responseFormat] Format specification for the response.
   * @param {function} [params.responseProcessor] Function to process the raw response.
   * @returns {Promise<{success: boolean, data?: any, error?: string}>} The processed response or error.
   */
  async complete(params) {
    if (!this.initialized && !this.initialize()) {
      return { success: false, error: 'No LLM provider available' };
    }

    const {
      prompt,
      message,
      model = this.options.defaultModel || 'qwen/qwen3-30b-a3b',
      temperature = this.options.temperature || 0.3,
      responseFormat = { type: "json_object" },
      responseProcessor = (response) => response
    } = params;

    try {
      if (this.provider === 'openai') {
        const chatCompletion = await this.client.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: message },
          ],
          response_format: responseFormat,
          temperature,
        });

        if (chatCompletion.choices && chatCompletion.choices.length > 0) {
          const assistantResponse = chatCompletion.choices[0].message.content;
          console.log('Raw LLM response:', assistantResponse);
          try {
            // Process the response with the provided processor function
            const processedResponse = responseProcessor(assistantResponse);
            return { success: true, data: processedResponse };
          } catch (e) {
            console.error('Error processing LLM response:', e, '\nRaw response:', assistantResponse);
            return { success: false, error: `Error processing response: ${e.message}`, rawResponse: assistantResponse };
          }
        } else {
          return { success: false, error: 'No choices returned from LLM' };
        }
      }
      
      // Handle other providers here in the future
      
      return { success: false, error: `Unsupported provider: ${this.provider}` };
    } catch (error) {
      console.error(`Error calling ${this.provider} API:`, error);
      return { success: false, error: `Failed to call ${this.provider} API: ${error.message}` };
    }
  }

  /**
   * Parses a JSON string response safely.
   * @param {string} jsonString The JSON string to parse.
   * @returns {object|null} The parsed object or null if parsing failed.
   */
  static parseJSON(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error('JSON parsing error:', e);
      return null;
    }
  }
}