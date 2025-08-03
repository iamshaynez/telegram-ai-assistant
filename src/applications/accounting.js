// src/applications/accounting.js
// Accounting application logic that interacts with Actual API
import { accounts, categories } from "./accountingData";

// Constants
const MESSAGES = {
  UNKNOWN_ACTION: (action) => `抱歉，我不知道如何处理记账操作：${action}`,
  TRANSACTION_SUCCESS: (amount, account, category, payee_name, budget) => 
    `交易已成功记录！\n---\n金额：${Math.abs(amount)}\n账户：${account}\n分类：${category}\n收款方/付款方：${payee_name || '未指定'}\n\n${budget}`,
  TRANSACTION_ERROR: (error) => `记账失败：${error}`,
  BUDGET_INFO: (name, spent, balance, percentage) => 
    `预算科目查询成功！\n---\n预算名称：${name}\n本月总花费：${Math.abs(spent / 100)}\n本月预算剩余：${balance / 100}\n本月预算使用率：${percentage}%`
};

/**
 * Handles intents related to the accounting application.
 * @param {string} action The recognized action
 * @param {object} parameters Extracted parameters from the user's message
 * @param {string|number} chatId The chat ID of the user
 * @param {object} env Environment variables with Actual API configuration
 * @returns {Promise<string>} Response message for the user
 */
export async function handleAccountingIntent(action, parameters, chatId, env) {
  console.log(`Handling accounting action: ${action}`);

  switch (action) {
    case 'accounting_book_transaction':
      return await bookTransaction(parameters, env);
    default:
      return MESSAGES.UNKNOWN_ACTION(action);
  }
}

/**
 * Books a transaction in the Actual API.
 * @param {object} parameters Transaction details (amount, account_name, category_name, etc.)
 * @param {object} env Environment variables with Actual API configuration
 * @returns {Promise<string>} Confirmation message
 */
async function bookTransaction(parameters, env) {
  try {
    const transaction = createTransactionObject(parameters);
    const processedTransaction = processTransaction(transaction);
    
    await saveTransaction(env, processedTransaction);
    const budgetMessage = await getBudgetMessage(env, processedTransaction);
    
    return MESSAGES.TRANSACTION_SUCCESS(
      parameters.amount,
      parameters.account_name,
      parameters.category_name,
      parameters.payee_name,
      budgetMessage
    );
  } catch (error) {
    console.error('Transaction booking failed:', error);
    return MESSAGES.TRANSACTION_ERROR(error.message || error);
  }
}

/**
 * Creates a transaction object from parameters.
 * @param {object} parameters Transaction parameters
 * @returns {object} Transaction object
 */
function createTransactionObject(parameters) {
  return {
    transaction: {
      amount: parameters.amount,
      account_name: parameters.account_name,
      category_name: parameters.category_name,
      notes: parameters.notes || '',
      payee_name: parameters.payee_name || ''
    }
  };
}

/**
 * Saves a transaction to the Actual API.
 * @param {object} env Environment variables
 * @param {object} transactionData The processed transaction data
 * @returns {Promise<Response>} The API response
 */
async function saveTransaction(env, transactionData) {
  // Remove name fields as API expects IDs
  delete transactionData.transaction.account_name;
  delete transactionData.transaction.category_name;
  
  const url = `${env.ACTUAL_BASE}/accounts/${transactionData.transaction.account}/transactions`;
  const headers = {
    "Content-Type": "application/json",
    "accept": "application/json",
    "x-api-key": env.ACTUAL_API_KEY,
  };
  
  console.log(`Saving transaction to: ${url}`);
  
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(transactionData),
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
}

/**
 * Gets budget information for a category after a transaction.
 * @param {object} env Environment variables
 * @param {object} transactionData The transaction data
 * @returns {Promise<string>} Formatted budget message
 */
async function getBudgetMessage(env, transactionData) {
  const url = `${env.ACTUAL_BASE}/months/${getCurrentMonthFormatted()}/categories/${transactionData.transaction.category}`;
  const headers = {
    "accept": "application/json",
    "budget-encryption-password": env.ACTUAL_ENCRYPTION_PASSWORD,
    "x-api-key": env.ACTUAL_API_KEY,
  };

  console.log(`Fetching budget info from: ${url}`);
  
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`Budget API request failed: ${response.status} ${response.statusText}`);
  }

  const budgetData = await response.json();
  return formatBudgetMessage(budgetData);
}

/**
 * Processes a transaction object by adding date and converting names to IDs.
 * @param {object} transactionObj The transaction object
 * @returns {object} The processed transaction object
 */
function processTransaction(transactionObj) {
  if (!transactionObj || typeof transactionObj !== "object") {
    throw new Error("Invalid transaction object");
  }

  const { transaction } = transactionObj;
  console.log("Processing transaction:", transaction);
  // Add current date
  transaction.date = getCurrentDateFormatted();
  
  // Convert account and category names to IDs
  transaction.account = findIdByName(accounts.data, transaction.account_name);
  transaction.category = findIdByName(categories.data, transaction.category_name);
  
  // Validate that IDs were found
  if (!transaction.account) {
    throw new Error(`Account not found: ${transaction.account_name}`);
  }
  if (!transaction.category) {
    throw new Error(`Category not found: ${transaction.category_name}`);
  }
  
  // Convert amount to cents and mark as cleared
  transaction.amount = Math.round(transaction.amount * 100);
  transaction.cleared = true;

  return transactionObj;
}

// Utility Functions

/**
 * Gets the current date in YYYY-MM-DD format.
 * @returns {string} The formatted date
 */
function getCurrentDateFormatted() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets the current month in YYYY-MM format.
 * @returns {string} The formatted month
 */
function getCurrentMonthFormatted() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Finds an ID by name in an array of objects.
 * @param {Array} items The array to search
 * @param {string} name The name to find
 * @returns {string|null} The ID or null if not found
 */
function findIdByName(items, name) {
  console.log('findIdByName called with:', {
    items: items,
    name: name,
    itemsLength: Array.isArray(items) ? items.length : 'not an array'
  });
  
  if (!Array.isArray(items) || !name) {
    console.log('findIdByName returning null - invalid parameters');
    return null;
  }
  
  const item = items.find(item => item.name === name);
  const result = item ? item.id : null;
  
  console.log('findIdByName result:', {
    foundItem: item,
    result: result,
    availableNames: items.map(item => item.name)
  });
  
  return result;
}

/**
 * Creates a formatted budget message from budget data.
 * @param {object} budgetData The budget data from API
 * @returns {string} Formatted budget message
 */
function formatBudgetMessage(budgetData) {
  if (!budgetData || !budgetData.data) {
    return "预算信息获取失败";
  }
  
  const { name, budgeted, spent, balance } = budgetData.data;
  const spentPercentage = budgeted > 0 ? ((-spent / budgeted) * 100).toFixed(2) : 0;

  return MESSAGES.BUDGET_INFO(name, spent, balance, spentPercentage);
}