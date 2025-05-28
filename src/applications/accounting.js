// src/applications/accounting.js
// Placeholder for accounting application logic
// In a real application, this would interact with a database or a dedicated accounting API.

/**
 * Handles intents related to the accounting application.
 * @param {string} intent The recognized intent (e.g., 'add_expense', 'get_balance').
 * @param {object} entities Extracted entities from the user's message.
 * @param {string|number} chatId The chat ID of the user.
 * @param {object} env Environment variables, might contain API keys or KV binding.
 * @returns {Promise<string>} A message to send back to the user.
 */
export async function handleAccountingIntent(intent, entities, chatId, env) {
  console.log(`Accounting: Handling intent '${intent}' with entities:`, entities);

  // Example: Using a KV store for simple data persistence
  // Ensure you have a KV namespace bound in your wrangler.toml, e.g., binding = "ACCOUNTING_KV"
  const kv = env.ACCOUNTING_KV;
  if (!kv) {
    console.warn('ACCOUNTING_KV namespace not bound. Accounting features will be limited.');
    // return "Accounting service is not fully configured (KV missing).";
  }

  switch (intent) {
    case 'add_expense':
      return await addExpense(entities, chatId, kv);
    case 'get_balance':
      return await getBalance(chatId, kv);
    // Add more cases for other accounting intents like 'list_expenses', 'get_report', etc.
    default:
      return `Sorry, I don't know how to handle the accounting request: ${intent}.`;
  }
}

/**
 * Adds an expense for the user.
 * @param {object} entities Must contain 'amount' and optionally 'description'.
 * @param {string|number} chatId User's chat ID, used as a key for storing data.
 * @param {object} kv The KV namespace instance.
 * @returns {Promise<string>}
 */
async function addExpense(entities, chatId, kv) {
  const { amount, description = 'Unspecified expense' } = entities;

  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return 'Please provide a valid amount for the expense. For example: add expense 10 for coffee.';
  }

  if (!kv) return "Cannot record expense: Accounting storage (KV) is not available.";

  try {
    const userKey = `user_${chatId}_expenses`;
    let expenses = await kv.get(userKey, { type: 'json' }) || [];
    const newExpense = {
      id: Date.now().toString(), // Simple ID
      amount,
      description,
      date: new Date().toISOString(),
    };
    expenses.push(newExpense);
    await kv.put(userKey, JSON.stringify(expenses));

    // Update balance (simplified)
    const balanceKey = `user_${chatId}_balance`;
    let currentBalance = await kv.get(balanceKey, { type: 'json' }) || 0;
    currentBalance -= amount;
    await kv.put(balanceKey, JSON.stringify(currentBalance));

    return `Expense of ${amount} for "${description}" recorded. Your new balance is ${currentBalance.toFixed(2)}.`;
  } catch (error) {
    console.error('Error adding expense to KV:', error);
    return 'Sorry, there was an error recording your expense.';
  }
}

/**
 * Retrieves the current balance for the user.
 * @param {string|number} chatId User's chat ID.
 * @param {object} kv The KV namespace instance.
 * @returns {Promise<string>}
 */
async function getBalance(chatId, kv) {
  if (!kv) return "Cannot retrieve balance: Accounting storage (KV) is not available.";

  try {
    const balanceKey = `user_${chatId}_balance`;
    const balance = await kv.get(balanceKey, { type: 'json' });

    if (balance === null) {
      // Initialize balance if not found, perhaps after adding an initial deposit feature
      // For now, just say it's 0 or prompt to add income.
      await kv.put(balanceKey, JSON.stringify(0)); // Initialize to 0
      return 'Your balance is currently 0. You can add expenses or income (income feature TBD).';
    }
    return `Your current balance is ${parseFloat(balance).toFixed(2)}.`;
  } catch (error) {
    console.error('Error retrieving balance from KV:', error);
    return 'Sorry, there was an error retrieving your balance.';
  }
}

// TODO: Implement other functions like listExpenses, addIncome, etc.