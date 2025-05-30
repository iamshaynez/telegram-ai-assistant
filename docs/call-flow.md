# Telegram AI Assistant Call Flow Documentation

This document outlines the complete call flow of the Telegram AI Assistant application, from receiving a Telegram webhook to sending a response back to the user.

## Overview

The Telegram AI Assistant is a serverless application built to run on Cloudflare Workers. It processes incoming messages from Telegram users, recognizes their intent using AI, and responds accordingly. The application supports multiple features including accounting and note-taking.

## Architecture

The application follows a modular architecture with clear separation of concerns:

1. **Entry Point**: Handles incoming webhook requests from Telegram
2. **Telegram Service**: Processes Telegram updates and sends responses
3. **AI Layer**: Recognizes intent and extracts entities from user messages
4. **Application Layer**: Implements domain-specific logic (accounting, notes, etc.)

## Complete Call Flow

### 1. Entry Point (index.js)

The flow begins when Telegram sends a webhook request to the application:

```
Telegram Webhook → Cloudflare Worker → index.js (router)
```

The main router in `index.js` handles the POST request to the root endpoint:

1. Receives the webhook update from Telegram
2. Extracts the message and chat ID using `handleTelegramUpdate`
3. Determines if it's a regular message or a callback query (from buttons)
4. Routes the request accordingly

### 2. Message Processing

For regular messages, the flow continues:

```
index.js → recognizeIntent() → handleApplicationRequest() → Application Handler → Response
```

The steps are:

1. **Intent Recognition**: The message is sent to `recognizeIntent()` in `intentRecognizer.js`
   - Creates an `IntentProcessor` instance
   - Calls the LLM API through `llmClient.js`
   - Returns the recognized intent and extracted entities

2. **Application Routing**: The intent is passed to `handleApplicationRequest()` in `applications/handler.js`
   - Determines which application should handle the intent (accounting, notes, etc.)
   - Recognizes specific parameters using `parameterRecognizer.js`
   - Either sends a confirmation message or processes the request directly

3. **Application Logic**: The specific application handler processes the request
   - `accounting.js` for accounting-related intents
   - `notes.js` for note-taking intents
   - Interacts with KV storage for data persistence
   - Returns a response message

4. **Response Sending**: The response is sent back to the user via Telegram API
   - Uses `telegramApi.sendMessage()` from `telegram.js`

### 3. Callback Query Processing

For callback queries (button clicks), the flow is:

```
index.js → handleCallbackQuery() → Application Handler → Response
```

The steps are:

1. **Callback Extraction**: Extract callback data from the update
2. **Callback Processing**: Process the callback using `handleCallbackQuery()`
   - Answer the callback query to stop the loading indicator
   - Process the confirmed action with the appropriate application handler
   - Send the result back to the user

## Key Components

### LLM Client (llmClient.js)

The `LLMClient` class provides a generic interface for interacting with Large Language Models:

- Initializes the appropriate provider client (currently OpenAI)
- Sends completion requests to the LLM
- Processes and returns the responses

### Intent Processor (intentProcessor.js)

The `IntentProcessor` class handles intent recognition:

- Uses the LLM client to process user messages
- Applies appropriate prompts from `prompts.js`
- Returns structured intent and entity data

### Parameter Recognizer (parameterRecognizer.js)

The `recognizeParameters` function extracts specific parameters for actions:

- Uses the IntentProcessor with parameter-specific prompts
- Returns action type and structured parameters

### Application Handlers

Application-specific handlers implement domain logic:

- **Accounting (accounting.js)**: Handles expense tracking, balance queries, etc.
- **Notes (notes.js)**: Handles note creation, listing, viewing, etc.

### Telegram Service (telegram.js)

The `telegramApi` object provides methods for interacting with the Telegram Bot API:

- `sendMessage`: Sends text messages to users
- `answerCallbackQuery`: Responds to button clicks
- `sendMessageWithConfirmation`: Sends messages with confirmation buttons

## Data Flow

1. **User Input**: Text message from Telegram user
2. **Intent Recognition**: AI processes the message to determine intent and entities
3. **Parameter Extraction**: AI extracts specific parameters for the action
4. **Business Logic**: Application-specific code processes the request
5. **Response Generation**: Application generates a response message
6. **User Output**: Response is sent back to the user via Telegram

## Configuration

The application uses configuration from multiple sources:

- **Environment Variables**: API keys and secrets (from wrangler.toml or .env)
- **App Config (config.js)**: Non-sensitive application settings
- **Prompts (prompts.js)**: System prompts for AI interactions