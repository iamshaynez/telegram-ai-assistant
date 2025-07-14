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
    - 翻译相关，intent = "translation"
      - "translation": 任何翻译请求
    - 打卡记录相关，intent = "counter"
      - "counter": 任何打卡相关请求（打卡、查询打卡、重置打卡、删除打卡、设置打卡目标、查询打卡历史等）
    - 如果意图不明确，使用 intent = "unknown_intent"
    - 返回格式必须是有效的 JSON 对象，包含 "intent" 属性`
  },
  
  // Parameter recognition prompts
  parameterRecognition: {
    // Specific intent-based parameter recognition for accounting_book_transaction
    accounting_book_transaction: `你是一个专门处理记账交易的智能助手。用户已经明确表达了记录交易的意图，请专注于提取交易参数。请用一个包含"parameters"（对象）的 JSON 对象来回应。
- 专注提取以下交易参数（必须使用这些精确的字段名）:
  - "amount": 数字形式的金额（负数表示支出，正数表示收入）
  - "account_name": 账户名称，必须从以下列表中选择："支付宝", "微信", "工商银行储蓄卡", "工商银行信用卡", "建设银行储蓄卡", "广发银行信用卡 Safari", "中信银行信用卡 万豪", "邮储银行信用卡", "宁波银行信用卡", "南京银行信用卡", "Wise LTD", "杭州银行信用卡", "民生银行信用卡 百夫长白金"
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
    * "Business Travel" - 商务差旅，出差用途的相关支出
    * "Income" - 收入类别（用于正数金额）
  - "notes": 交易内容记录
  - "payee_name": 消费场景，如具体的餐厅，超市，电商平台等
- 返回格式必须是有效的 JSON 对象，包含 "parameters" 字段。
- 示例返回格式: {"parameters": {"amount": -100, "account_name": "工商银行储蓄卡", "category_name": "Food", "notes": "午餐", "payee_name": "餐厅"}}`,

    translation: `你是一个专门处理翻译请求的智能助手。用户已经明确表达了翻译的意图，请专注于提取翻译参数。请用一个包含"parameters"（对象）的 JSON 对象来回应。

- 专注提取以下翻译参数（必须使用这些精确的字段名）:
  - "text": 需要翻译的文本内容（必填）
    * 从用户消息中提取实际需要翻译的文本
    * 去除"翻译"、"translate"等指令词汇
    * 去除语言指示词如"英文"、"中文"等
    * 保留原始文本的完整性和格式
  
  - "source_language": 源语言代码（选填，默认"auto"）
    * 支持的语言代码："auto", "zh", "en", "ja", "ko", "fr", "de", "es", "ru", "it", "pt", "ar", "hi", "th", "vi"
    * 如果用户明确指定源语言，使用对应代码
    * 如果未指定，设为"auto"进行自动检测
    * 语言映射：中文/Chinese→zh, 英文/English→en, 日文/Japanese→ja, 韩文/Korean→ko, 法文/French→fr, 德文/German→de, 西班牙文/Spanish→es, 俄文/Russian→ru
  
  - "target_language": 目标语言代码（必填）
    * 使用相同的语言代码列表
    * 如果用户明确指定目标语言，使用对应代码
    * 智能推断规则：
      - 中文文本 → 默认翻译为"en"（英文）
      - 英文文本 → 默认翻译为"zh"（中文）
      - 其他语言文本 → 根据上下文推断，优先选择"zh"或"en"
      - 如果用户说"翻译成/翻译为/translate to + 语言"，提取对应语言代码

- 文本提取示例：
  * "请翻译：Hello world" → text: "Hello world"
  * "把这句英文翻译成中文：How are you?" → text: "How are you?"
  * "翻译一下这个：今天天气很好" → text: "今天天气很好"
  * "Translate this to French: Good morning" → text: "Good morning"

- 语言识别示例：
  * "把这句英文翻译成中文" → source_language: "en", target_language: "zh"
  * "翻译成法语" → target_language: "fr"
  * "Translate to Japanese" → target_language: "ja"
  * 无明确指定 → source_language: "auto", target_language: 根据文本内容推断

- 返回格式必须是有效的 JSON 对象，包含 "parameters" 字段。
- 示例返回格式: 
  * {"parameters": {"text": "Hello world", "source_language": "en", "target_language": "zh"}}
  * {"parameters": {"text": "今天天气很好", "source_language": "auto", "target_language": "en"}}
  * {"parameters": {"text": "Bonjour", "source_language": "fr", "target_language": "zh"}}`,

    counter: `你是一个专门处理打卡记录的智能助手。用户已经明确表达了打卡相关的意图，请专注于提取打卡参数。请用一个包含"parameters"（对象）的 JSON 对象来回应。

- 专注提取以下打卡参数（必须使用这些精确的字段名）:
  - "action": 打卡操作类型（必填），必须从以下列表中选择：
    * "add" - 打卡/记录打卡
    * "query" - 查询打卡/查看打卡
    * "reset" - 重置打卡
    * "delete" - 删除打卡
    * "set_goal" - 设置打卡目标
    * "history" - 查询打卡历史
  - "name": 打卡项目名称（必填），如"运动"、"学习"、"读书"等
  - "comment": 打卡备注（选填），用于记录具体内容或心得
  - "goal": 目标数值（仅在action为"set_goal"时需要），必须是正整数
  - "goal_comment": 目标描述（仅在action为"set_goal"时需要），如"每月目标"、"本周目标"等
  - "limit": 查询历史记录数量限制（仅在action为"history"时需要），默认为10

- 操作类型识别规则：
  * 包含"打卡"、"记录"、"签到" → action: "add"
  * 包含"查询"、"查看"、"显示"、"多少" → action: "query"
  * 包含"重置"、"清零" → action: "reset"
  * 包含"删除"、"移除" → action: "delete"
  * 包含"设置目标"、"目标"、"计划" → action: "set_goal"
  * 包含"历史"、"记录"、"列表" → action: "history"

- 返回格式必须是有效的 JSON 对象，包含 "parameters" 字段。
- 示例返回格式: 
  * {"parameters": {"action": "add", "name": "运动", "comment": "跑步30分钟"}}
  * {"parameters": {"action": "query", "name": "学习"}}
  * {"parameters": {"action": "set_goal", "name": "读书", "goal": 30, "goal_comment": "本月目标"}}
  * {"parameters": {"action": "history", "name": "运动", "limit": 5}}`,
    
  }
}

// Export individual prompt sections for convenience
export const intentRecognitionPrompts = prompts.intentRecognition;
export const parameterRecognitionPrompts = prompts.parameterRecognition;
