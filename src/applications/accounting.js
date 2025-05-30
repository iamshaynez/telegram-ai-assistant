// src/applications/accounting.js
// Placeholder for accounting application logic
// In a real application, this would interact with a database or a dedicated accounting API.

/**
 * Handles intents related to the accounting application.
 * @param {string} action The recognized action (e.g., 'add_expense', 'get_balance').
 * @param {object} parameters Extracted parameters from the user's message.
 * @param {string|number} chatId The chat ID of the user.
 * @param {object} env Environment variables, might contain API keys or KV binding.
 * @returns {Promise<string>} A message to send back to the user.
 */
export async function handleAccountingIntent(action, parameters, chatId, env) {
  console.log(`Accounting: Handling action '${action}' with parameters:`, parameters);

  // Example: Using a KV store for simple data persistence
  // Ensure you have a KV namespace bound in your wrangler.toml, e.g., binding = "ACCOUNTING_KV"
  const kv = env.ACCOUNTING_KV;
  if (!kv) {
    console.warn('ACCOUNTING_KV namespace not bound. Accounting features will be limited.');
    // return "Accounting service is not fully configured (KV missing).";
  }

  switch (action) {
    case 'add_expense':
      return await addExpense(parameters, chatId, kv);
    case 'get_balance':
      return await getBalance(chatId, kv);
    // Add more cases for other accounting actions like 'list_expenses', 'get_report', etc.
    default:
      return `Sorry, I don't know how to handle the accounting action: ${action}.`;
  }
}

/**
 * Adds an expense for the user.
 * @param {object} parameters Must contain 'amount' and optionally 'item'.
 * @param {string|number} chatId User's chat ID, used as a key for storing data.
 * @param {object} kv The KV namespace instance.
 * @returns {Promise<string>}
 */
async function addExpense(parameters, chatId, kv) {
  const { amount, item = 'Unspecified expense', category, date, currency = 'CNY', payment_method } = parameters;

  // Convert amount to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (typeof numericAmount !== 'number' || isNaN(numericAmount) || numericAmount <= 0) {
    return 'Please provide a valid amount for the expense. For example: add expense 10 for coffee.';
  }

  if (!kv) return "Cannot record expense: Accounting storage (KV) is not available.";

  try {
    const userKey = `user_${chatId}_expenses`;
    let expenses = await kv.get(userKey, { type: 'json' }) || [];
    const newExpense = {
      id: Date.now().toString(), // Simple ID
      amount: numericAmount,
      description: item,
      category: category || 'Uncategorized',
      date: date ? new Date(date).toISOString() : new Date().toISOString(),
      currency,
      payment_method: payment_method || 'Not specified'
    };
    expenses.push(newExpense);
    await kv.put(userKey, JSON.stringify(expenses));

    // Update balance (simplified)
    const balanceKey = `user_${chatId}_balance`;
    let currentBalance = await kv.get(balanceKey, { type: 'json' }) || 0;
    currentBalance -= numericAmount;
    await kv.put(balanceKey, JSON.stringify(currentBalance));

    return `Expense of ${numericAmount} ${currency} for "${item}" recorded. Your new balance is ${currentBalance.toFixed(2)} ${currency}.`;
  } catch (error) {
    console.error('Error adding expense to KV:', error);
    return 'Sorry, there was an error recording your expense.';
  }
}

/**
 * Gets the current balance for the user.
 * @param {object} parameters May contain 'currency' for display.
 * @param {string|number} chatId User's chat ID, used as a key for retrieving data.
 * @param {object} kv The KV namespace instance.
 * @returns {Promise<string>}
 */
async function getBalance(parameters, chatId, kv) {
  const { currency = 'CNY' } = parameters || {};
  
  if (!kv) return "Cannot retrieve balance: Accounting storage (KV) is not available.";

  try {
    const balanceKey = `user_${chatId}_balance`;
    let currentBalance = await kv.get(balanceKey, { type: 'json' }) || 0;
    return `Your current balance is ${currentBalance.toFixed(2)} ${currency}.`;
  } catch (error) {
    console.error('Error getting balance from KV:', error);
    return 'Sorry, there was an error retrieving your balance.';
  }
}

// TODO: Implement other functions like listExpenses, addIncome, etc.