# Telegram AI Assistant

一个基于 Cloudflare Workers 的智能 Telegram 机器人，支持多种应用场景的自然语言交互。

## 功能特性

### 📊 记账功能
- 自然语言记录收支交易
- 支持多账户和分类管理
- 与 Actual Budget API 集成

### 🌐 翻译功能
- 支持多语言翻译
- 智能语言检测
- 基于 OpenAI API

### ✅ 打卡功能 (新增)
- **打卡记录**: 支持各种项目的打卡记录（运动、学习、读书等）
- **查询统计**: 查看当前打卡总数和进度
- **目标设置**: 设置打卡目标并跟踪完成情况
- **历史记录**: 查看详细的打卡历史
- **数据管理**: 支持重置和删除打卡数据
- **自然语言**: 完全支持中文自然语言交互

## 打卡功能使用示例

### 基本打卡
```
用户: 运动打卡，今天跑步30分钟
机器人: 运动 打卡成功
        截止目前 运动 打卡数总计 15 次
        距离本月目标还有 15次
```

### 查询打卡
```
用户: 查询运动打卡
机器人: 截止目前 运动 打卡数总计 15 次
```

### 设置目标
```
用户: 设置运动打卡目标30次，本月目标
机器人: 运动 打卡目标设置成功
        距离本月目标还有 15次
```

### 查看历史
```
用户: 查看运动打卡历史
机器人: 打卡历史查询成功，列表如下:
        > 运动 | count | 2024-01-15 | 跑步30分钟
        > 运动 | count | 2024-01-14 | 健身1小时
```

### 重置打卡
```
用户: 重置运动打卡
机器人: 运动 打卡重置成功
        截止目前 运动 打卡数总计 0 次
```

## 技术架构

### AI 处理流程
1. **意图识别**: 使用 OpenAI API 识别用户意图
2. **参数提取**: 根据意图提取相关参数
3. **应用路由**: 将请求路由到对应的应用处理器
4. **业务处理**: 执行具体的业务逻辑
5. **响应生成**: 生成用户友好的响应消息

### 数据存储
- **记账数据**: Actual Budget API
- **打卡数据**: Cloudflare D1 数据库
  - `count_log` 表: 存储打卡记录
  - `count_goal` 表: 存储打卡目标

## 部署配置

### 环境变量
```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
OPENAI_API_KEY=your_openai_api_key
```

### D1 数据库配置
在 `wrangler.toml` 中配置:
```toml
[[d1_databases]]
binding = "DB"
database_name = "counter"
database_id = "your_database_id"
```

### 数据库表结构
```sql
-- 打卡记录表
CREATE TABLE count_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  count_name TEXT NOT NULL,
  count_type TEXT NOT NULL, -- 'count' 或 'reset'
  count_value INTEGER NOT NULL,
  count_date TEXT NOT NULL,
  count_comment TEXT
);

-- 打卡目标表
CREATE TABLE count_goal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  count_name TEXT NOT NULL UNIQUE,
  goal_comment TEXT,
  goal_value INTEGER NOT NULL
);
```

## 开发指南

### 本地开发
```bash
npm install
npm run dev
```

### 部署
```bash
npm run deploy
```

### 添加新功能
1. 在 `src/ai/prompts.js` 中添加意图识别和参数提取提示
2. 在 `src/applications/` 中创建新的应用处理器
3. 在 `src/applications/handler.js` 中添加路由
4. 更新文档和测试

## 许可证

MIT License