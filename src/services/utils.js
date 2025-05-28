// src/services/utils.js

/**
 * A simple utility to delay execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to wait.
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates a random ID.
 * @param {number} length - The desired length of the ID.
 * @returns {string}
 */
export function generateRandomId(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Basic error handler for fetch requests or promises.
 * @param {Error} error - The error object.
 * @param {string} context - Contextual information about where the error occurred.
 */
export function handleError(error, context = 'Generic Error') {
  console.error(`[${context}]:`, error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  // Depending on the environment, you might want to send this to a logging service.
}

// Add other general utility functions here as needed.