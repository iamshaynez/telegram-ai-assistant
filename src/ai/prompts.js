// src/ai/prompts.js

/**
 * This file contains all the prompt templates used in the application.
 * Centralizing prompts makes it easier to maintain and update them.
 */

export const prompts = {
  // Intent recognition prompts
  intentRecognition: {
    // Default system prompt for intent recognition
    default: `你是一个能够识别用户意图并从用户消息中提取相关实体的智能助手。请用一个包含“intent”（字符串）和“entities”（对象）的 JSON 对象来回应。. 
- Possible intents are: "记账类", "打卡类".
- 提取以下字段（必须使用这些精确的字段名）:
- 记账意图: "item"(物品), "amount"(金额), "currency"(货币), "date"(日期)
- 笔记意图: "title"(标题), "content"(内容)
For "add_expense", entities can include "amount" (number) and "description" (string).
For "add_note", entities can include "content" (string).
If the intent is unclear, use "unknown_intent".`
  },
  
  // You can add more prompt categories as needed
  // For example, prompts for generating responses, summarization, etc.
};

// Export individual prompt sections for convenience
export const intentRecognitionPrompts = prompts.intentRecognition;