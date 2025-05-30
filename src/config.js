// src/config.js

// This file can hold application-specific configurations that are not secrets.
// Secrets should be stored in environment variables (wrangler.toml for deployed, .env for local).

export const appConfig = {
  // Example: Default language for responses if not determined by user input
  defaultLanguage: 'en',

  // Example: Configuration for a specific application
  notesApp: {
    maxNotesToList: 10, // Max notes to show in a list command
    defaultNoteTitle: 'Untitled Note',
  },

  accountingApp: {
    defaultCurrency: 'USD', // Default currency for transactions
    // API endpoints for external accounting services (if any)
    // externalApiBaseUrl: 'https://api.exampleaccounting.com/v1',
  },

  // AI related configurations (non-sensitive)
  ai: {
    // Options for LLM client
    llmOptions: {
      defaultModel: 'qwen/qwen3-30b-a3b', // Default model to use
      temperature: 0.3, // Default temperature for generation
      defaultPromptType: 'default', // Default prompt type for intent recognition
    },
    
    // Backward compatibility - will be used by legacy code
    openai_options: {
      model: 'qwen/qwen3-30b-a3b', // Default model
      temperature: 0.3,
    },
    
    // Intent recognition configuration
    intentRecognition: {
      // Default prompt type to use for different contexts
      promptTypes: {
        accounting: 'accounting', // Use accounting-specific prompts for accounting contexts
        notes: 'notes', // Use notes-specific prompts for notes contexts
      }
    },
  },

  // Add other configurations as needed
};

// You can also export individual config sections if preferred
// export const notesConfig = appConfig.notesApp;
// export const accountingConfig = appConfig.accountingApp;