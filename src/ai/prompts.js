// src/ai/prompts.js

/**
 * This file contains all the prompt templates used in the application.
 * Centralizing prompts makes it easier to maintain and update them.
 */

export const prompts = {
  // Intent recognition prompts
  intentRecognition: {
    // Default system prompt for intent recognition
    default: `你是一个能够识别用户意图的智能助手。请用一个包含"intent"（字符串）的 JSON 对象来回应。
    - 返回格式必须是有效的 JSON 对象，包含 "intent"
    - 记账相关，intent starts with "accounting", 当前支持如下
      - "accounting_book_transaction": 记录交易
    - 打卡记录相关，使用 intent = "checkin"
    - 如果意图不明确，使用 intent = "unknown_intent"
    - 返回格式必须是有效的 JSON 对象，包含 "intent" 属性`
  },
  
  // Parameter recognition prompts
  parameterRecognition: {
    // Specific intent-based parameter recognition for accounting_book_transaction
    accounting_book_transaction: `你是一个专门处理记账交易的智能助手。用户已经明确表达了记录交易的意图，请专注于提取交易参数。请用一个包含"parameters"（对象）的 JSON 对象来回应。
- 专注提取以下交易参数（必须使用这些精确的字段名）:
  - "amount": 数字形式的金额（负数表示支出，正数表示收入）
  - "account_name": 账户名称，必须从以下列表中选择："支付宝", "微信", "工商银行储蓄卡", "工商银行信用卡", "建设银行储蓄卡", "广发银行信用卡 Safari", "中信银行信用卡 万豪", "邮储银行信用卡", "宁波银行信用卡", "南京银行信用卡", "Wise LTD", "杭州银行信用卡"
  - "category_name": 交易类别名称，必须从以下列表中选择：
    * "Food" - 餐饮、食物相关支出
    * "House" - 房屋、家居、家里账单等相关支出
    * "Family" - 家庭、亲属相关支出
    * "Digital Bills" - 数字服务、订阅、软件等费用
    * "Transportation" - 交通、出行相关支出
    * "Mortgage" - 房贷、按揭相关支出
    * "Assurance" - 保险相关支出
    * "Outing" - 外出、娱乐相关支出
    * "Hobby" - 爱好、兴趣相关支出
    * "Business Travel" - 商务差旅相关支出
    * "Income" - 收入类别（用于正数金额）
  - "notes": 交易内容记录
  - "payee_name": 消费场景，如具体的餐厅，超市，电商平台等
- 返回格式必须是有效的 JSON 对象，包含 "parameters" 字段。
- 示例返回格式: {"parameters": {"amount": -100, "account_name": "工商银行储蓄卡", "category_name": "Food", "notes": "午餐", "payee_name": "餐厅"}}`,
    
  },

  
  // You can add more prompt categories as needed
  // For example, prompts for summarization, translation, etc.
};

// Export individual prompt sections for convenience
export const intentRecognitionPrompts = prompts.intentRecognition;
export const parameterRecognitionPrompts = prompts.parameterRecognition;
