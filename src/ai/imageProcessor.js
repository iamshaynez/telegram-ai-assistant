import { LLMClient } from './llmClient.js';
import { telegramApi } from '../services/telegram.js';

/**
 * Processes image messages from Telegram and extracts text content.
 */
export class ImageProcessor {
  /**
   * Creates a new ImageProcessor instance.
   * @param {object} env Environment variables containing API keys.
   */
  constructor(env) {
    this.env = env;
    this.llmClient = new LLMClient(env);
  }

  /**
   * Processes a photo message from Telegram and extracts text.
   * @param {object} photo The photo object from Telegram message.
   * @returns {Promise<{success: boolean, text?: string, error?: string}>} The extracted text or error.
   */
  async processPhoto(photo) {
    try {
      // Get the largest photo size (usually the last one in the array)
      const largestPhoto = photo[photo.length - 1];
      const fileId = largestPhoto.file_id;
      
      console.log(`Processing photo with file_id: ${fileId}`);
      
      // Get file information from Telegram
      const fileInfo = await telegramApi.getFile(fileId, this.env);
      console.log('File info:', fileInfo);
      
      // Download the file
      const fileBuffer = await telegramApi.downloadFile(fileInfo.file_path, this.env);
      
      // Convert ArrayBuffer to base64
      const base64Image = this.arrayBufferToBase64(fileBuffer);
      
      // Extract text using multimodal LLM
      const result = await this.llmClient.extractTextFromImage(base64Image, this.env);
      
      if (result.success) {
        console.log('Extracted text from image:', result.text);
        return { success: true, text: result.text };
      } else {
        console.error('Failed to extract text from image:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Error processing photo:', error);
      return { success: false, error: `Failed to process photo: ${error.message}` };
    }
  }

  /**
   * Converts ArrayBuffer to base64 string.
   * @param {ArrayBuffer} buffer The buffer to convert.
   * @returns {string} Base64 encoded string.
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Processes an image message and extracts text content.
 * @param {object} photo The photo object from Telegram message.
 * @param {object} env Environment variables.
 * @returns {Promise<{success: boolean, text?: string, error?: string}>} The extracted text or error.
 */
export async function processImageMessage(photo, env) {
  const processor = new ImageProcessor(env);
  return await processor.processPhoto(photo);
}