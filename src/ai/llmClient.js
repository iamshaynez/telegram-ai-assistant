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
   * @param {string} [params.imageData] Base64 encoded image data for multimodal models.
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
      responseProcessor = (response) => response,
      imageData = null
    } = params;

    try {
      if (this.provider === 'openai') {
        let messages;
        
        if (imageData) {
          // For multimodal requests with images
          messages = [
            { role: 'system', content: prompt },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: message
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageData}`
                  }
                }
              ]
            }
          ];
        } else {
          // For text-only requests
          messages = [
            { role: 'system', content: prompt },
            { role: 'user', content: message },
          ];
        }

        const chatCompletion = await this.client.chat.completions.create({
          model,
          messages,
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
   * Extracts text from an image using a multimodal model.
   * @param {string} imageData Base64 encoded image data.
   * @param {object} env Environment variables.
   * @returns {Promise<{success: boolean, text?: string, error?: string}>} The extracted text or error.
   */
  async extractTextFromImage(imageData, env) {
    if (!this.initialized && !this.initialize()) {
      return { success: false, error: 'No LLM provider available' };
    }

    const prompt = `你是一个专业的OCR助手。请仔细分析这张图片，准确提取出图片中的所有文字内容。

要求：
1. 提取所有可见的文字，包括中文、英文、数字、符号等
2. 保持文字的原始格式和排列顺序
3. 如果有表格，请保持表格结构
4. 如果图片中没有文字，请回复"图片中没有文字内容"
5. 只返回提取的文字内容，不要添加任何解释或说明

请开始分析图片：`;
    
    const message = "请提取这张图片中的所有文字内容。";

    try {
      const result = await this.complete({
        prompt,
        message,
        model: 'google/gemini-2.5-flash-preview-05-20',
        temperature: 0.1,
        responseFormat: { type: "text" },
        responseProcessor: (response) => response,
        imageData
      });

      if (result.success) {
        return { success: true, text: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error extracting text from image:', error);
      return { success: false, error: `Failed to extract text: ${error.message}` };
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