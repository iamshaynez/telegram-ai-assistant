// Translation application logic that uses AI for translation
import { LLMClient } from '../ai/llmClient';

// Constants
const MESSAGES = {
  UNKNOWN_ACTION: (action) => `抱歉，我不知道如何处理翻译操作：${action}`,
  TRANSLATION_SUCCESS: (originalText, translatedText, sourceLang, targetLang) => 
    `翻译完成！\n---\n原文 (${sourceLang}): ${originalText}\n译文 (${targetLang}): ${translatedText}`,
  TRANSLATION_ERROR: (error) => `翻译失败：${error}`,
  MISSING_TEXT: '请提供需要翻译的文本内容。'
};

// Language code mappings
const LANGUAGE_NAMES = {
  'auto': '自动检测',
  'zh': '中文',
  'en': '英文', 
  'ja': '日文',
  'ko': '韩文',
  'fr': '法文',
  'de': '德文',
  'es': '西班牙文',
  'ru': '俄文'
};

/**
 * Handles intents related to the translation application.
 * @param {string} action The recognized action
 * @param {object} parameters Extracted parameters from the user's message
 * @param {string|number} chatId The chat ID of the user
 * @param {object} env Environment variables with AI configuration
 * @returns {Promise<string>} Response message for the user
 */
export async function handleTranslationIntent(action, parameters, chatId, env) {
  console.log(`Handling translation action: ${action}`);

  switch (action) {
    case 'translation':
      return await translateText(parameters, env);
    default:
      return MESSAGES.UNKNOWN_ACTION(action);
  }
}

/**
 * Translates text using AI.
 * @param {object} parameters Translation details (text, source_language, target_language)
 * @param {object} env Environment variables with AI configuration
 * @returns {Promise<string>} Translation result message
 */
async function translateText(parameters, env) {
  try {
    const { text, source_language = 'auto', target_language = 'zh' } = parameters;
    
    if (!text || text.trim() === '') {
      return MESSAGES.MISSING_TEXT;
    }

    // Create an LLMClient instance for translation
    const llmClient = new LLMClient(env);
    
    // Construct translation prompt
    const translationPrompt = createTranslationPrompt(text, source_language, target_language);
    
    // Perform translation
    const result = await llmClient.complete({
      prompt: translationPrompt,
      message: text,
      temperature: 0.3,
      responseProcessor: (response) => {
        // Try to parse as JSON first, if fails, treat as plain text
        try {
          const parsed = LLMClient.parseJSON(response);
          return parsed.translatedText;
        } catch {
          return response.trim();
        }
      }
    });
    
    // console print the typeof result
    console.log('Translation result:', result);
    console.log('typeof result:', typeof result);
    const translatedText = (typeof result.data === 'string' ? result.data : String(result.data)).trim();
    const sourceLangName = LANGUAGE_NAMES[source_language] || source_language;
    const targetLangName = LANGUAGE_NAMES[target_language] || target_language;
    
    return MESSAGES.TRANSLATION_SUCCESS(
      text,
      translatedText,
      sourceLangName,
      targetLangName
    );
    
  } catch (error) {
    console.error('Translation error:', error);
    return MESSAGES.TRANSLATION_ERROR(error.message);
  }
}

/**
 * Creates a translation prompt for the AI.
 * @param {string} text The text to translate
 * @param {string} sourceLang Source language code
 * @param {string} targetLang Target language code
 * @returns {string} Translation prompt
 */
function createTranslationPrompt(text, sourceLang, targetLang) {
  const sourceLangName = LANGUAGE_NAMES[sourceLang] || sourceLang;
  const targetLangName = LANGUAGE_NAMES[targetLang] || targetLang;
  
  let prompt = `你是一个专业的翻译助手。请将以下文本翻译成${targetLangName}。\n\n`;
  
  if (sourceLang !== 'auto') {
    prompt += `源语言：${sourceLangName}\n`;
  }
  
  prompt += `目标语言：${targetLangName}\n\n`;
  prompt += `翻译要求：\n`;
  prompt += `- 保持原文的语气和风格\n`;
  prompt += `- 确保翻译准确、自然、流畅\n`;
  prompt += `- 如果是专业术语，请提供准确的对应翻译\n`;
  prompt += `- 返回结果用 json 格式 { translatedText: "xx" }\n\n`;
  prompt += `待翻译文本：`;
  
  return prompt;
}