// src/ai/index.js
// AI 模块的主入口点

// 导出 LLM 客户端
export { LLMClient } from './llmClient';

// 导出意图处理相关功能
export { IntentProcessor, recognizeIntent } from './intentProcessor';

// 导出响应生成相关功能
export { ResponseGenerator, generateResponse } from './responseGenerator';

// 导出提示词模板
export { prompts, intentRecognitionPrompts, responseGenerationPrompts } from './prompts';

/**
 * AI 模块
 * 
 * 这个模块提供了与大型语言模型 (LLM) 交互的通用接口，包括：
 * 
 * 1. LLMClient - 与 LLM 交互的通用客户端
 * 2. IntentProcessor - 用于识别用户消息中的意图和实体
 * 3. ResponseGenerator - 用于生成对用户查询的响应
 * 4. 提示词模板 - 用于不同场景的系统提示词
 * 
 * 基本使用流程：
 * 
 * 1. 创建 LLMClient 实例或使用更高级别的 IntentProcessor/ResponseGenerator
 * 2. 调用相应的方法处理用户消息
 * 3. 处理返回的结果
 * 
 * 示例：
 * 
 * ```javascript
 * import { recognizeIntent, generateResponse } from './ai';
 * 
 * async function handleUserMessage(message, env) {
 *   // 识别意图
 *   const intentResult = await recognizeIntent(message, env);
 *   
 *   // 生成响应
 *   const responseResult = await generateResponse(
 *     message,
 *     intentResult.intent,
 *     intentResult.entities,
 *     env
 *   );
 *   
 *   return responseResult.response;
 * }
 * ```
 */