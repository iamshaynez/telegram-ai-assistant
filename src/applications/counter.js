// Counter application logic that interacts with Cloudflare D1 database

// Constants
const MESSAGES = {
  UNKNOWN_ACTION: (action) => `抱歉，我不知道如何处理打卡操作：${action}`,
  ADD_SUCCESS: (name) => `${name} 打卡成功`,
  ADD_ERROR: (name, error) => `${name} 打卡失败 ${error}`,
  RESET_SUCCESS: (name) => `${name} 打卡重置成功`,
  RESET_ERROR: (name, error) => `${name} 打卡重置失败 ${error}`,
  DELETE_SUCCESS: (name) => `${name} 删除打卡成功`,
  DELETE_ERROR: (name, error) => `${name} 删除打卡失败 ${error}`,
  QUERY_SUCCESS: (name, total) => `截止目前 ${name} 打卡数总计 ${total} 次`,
  QUERY_ERROR: (name, error) => `${name} 查询失败 ${error}`,
  SET_GOAL_SUCCESS: (name) => `${name} 打卡目标设置成功`,
  SET_GOAL_ERROR: (name, error) => `${name} 打卡目标设置失败 ${error}`,
  SHOW_GOAL_NO_GOAL: (name) => `未设置${name}的打卡目标`,
  SHOW_GOAL_SUCCESS: (goalComment, diff) => `距离${goalComment}还有 ${diff}次`,
  SHOW_GOAL_ERROR: (name, error) => `${name} 查询打卡目标失败 ${error}`,
  HISTORY_SUCCESS: (dataTable) => "打卡历史查询成功，列表如下: \n\n" + dataTable,
  HISTORY_ERROR: (name, error) => `${name} 查询打卡历史失败 ${error}`
};

/**
 * Handles intents related to the counter application.
 * @param {string} intent The recognized intent
 * @param {object} parameters Extracted parameters from the user's message
 * @param {string|number} chatId The chat ID of the user
 * @param {object} env Environment variables with D1 database configuration
 * @returns {Promise<string>} Response message for the user
 */
export async function handleCounterIntent(intent, parameters, chatId, env) {
  console.log(`Handling counter action: ${parameters.action}`);

  switch (parameters.action) {
    case 'add':
      return await commandAddCount(parameters.name, parameters.comment || '', env);
    case 'query':
      return await showCurrentCount(parameters.name, env);
    case 'reset':
      return await commandResetCount(parameters.name, env);
    case 'delete':
      return await deleteCount(parameters.name, env);
    case 'set_goal':
      return await commandSetGoal(parameters.name, parameters.goal, parameters.goal_comment || '', env);
    case 'history':
      return await commandShowCountHistory(parameters.name, parameters.limit || 10, env);
    default:
      return MESSAGES.UNKNOWN_ACTION(parameters.action);
  }
}

/**
 * Add a count record and show current status
 */
export async function commandAddCount(name, comment, env) {
  let messages = [];
  messages.push(await addCount(name, comment, env));
  messages.push(await showCurrentCount(name, env));
  messages.push(await showGoal(name, env));
  return messages.join("\n");
}

/**
 * Reset count and show current status
 */
export async function commandResetCount(name, env) {
  let messages = [];
  messages.push(await resetCount(name, env));
  messages.push(await showCurrentCount(name, env));
  return messages.join("\n");
}

/**
 * Set goal and show goal status
 */
export async function commandSetGoal(name, goal, comment, env) {
  let messages = [];
  messages.push(await setGoal(name, goal, comment, env));
  messages.push(await showGoal(name, env));
  return messages.join("\n");
}

/**
 * Show count history
 */
export async function commandShowCountHistory(name, limit, env) {
  let messages = [];
  messages.push(await showCountHistory(name, limit, env));
  return messages.join("\n");
}

/**
 * Add a single count record
 */
async function addCount(name, comment, env) {
  try {
    const info = await env.DB.prepare(
      "INSERT INTO count_log (count_name, count_type, count_value, count_date, count_comment) VALUES (?1, 'count', 1, date('now'), ?2)"
    )
      .bind(name, comment)
      .run();

    return MESSAGES.ADD_SUCCESS(name);
  } catch (error) {
    console.log(errorToString(error));
    return MESSAGES.ADD_ERROR(name, errorToString(error));
  }
}

/**
 * Reset count for a specific name
 */
async function resetCount(name, env) {
  try {
    const info = await env.DB.prepare(
      "INSERT INTO count_log (count_name, count_type, count_value, count_date, count_comment) VALUES (?1, 'reset', 0, date('now'), '')"
    )
      .bind(name)
      .run();

    return MESSAGES.RESET_SUCCESS(name);
  } catch (error) {
    return MESSAGES.RESET_ERROR(name, errorToString(error));
  }
}

/**
 * Delete all count records for a specific name
 */
export async function deleteCount(name, env) {
  try {
    const info = await env.DB.prepare(
      "DELETE FROM count_log WHERE count_name=?1"
    )
      .bind(name)
      .run();

    return MESSAGES.DELETE_SUCCESS(name);
  } catch (error) {
    return MESSAGES.DELETE_ERROR(name, errorToString(error));
  }
}

/**
 * Show current count for a specific name
 */
export async function showCurrentCount(name, env) {
  try {
    const info = await env.DB.prepare(
      "SELECT COALESCE(SUM(count_value),0) AS total FROM count_log WHERE count_name=?1 and id > COALESCE(( \
        SELECT MAX(id) FROM count_log WHERE count_type = 'reset' and count_name=?2 \
      ),0)"
    )
      .bind(name, name)
      .first();
    return MESSAGES.QUERY_SUCCESS(name, info["total"]);
  } catch (error) {
    console.log(errorToString(error));
    return MESSAGES.QUERY_ERROR(name, errorToString(error));
  }
}

/**
 * Set goal for a specific name
 */
async function setGoal(name, goal, comment, env) {
  try {
    await env.DB.prepare("DELETE FROM count_goal WHERE count_name=?1")
      .bind(name)
      .run();
    await env.DB.prepare(
      "INSERT INTO count_goal (count_name, goal_comment, goal_value) VALUES (?1, ?2, ?3)"
    )
      .bind(name, comment, goal)
      .run();

    return MESSAGES.SET_GOAL_SUCCESS(name);
  } catch (error) {
    console.log(errorToString(error));
    return MESSAGES.SET_GOAL_ERROR(name, errorToString(error));
  }
}

/**
 * Show goal progress for a specific name
 */
async function showGoal(name, env) {
  try {
    const info = await env.DB.prepare(
      "WITH T AS (SELECT COALESCE(SUM(count_value),0) AS total FROM count_log \
      WHERE count_name=?1 and id > COALESCE((SELECT MAX(id) FROM count_log WHERE count_type = 'reset' and count_name=?2 ),0)) \
      SELECT (goal_value - (SELECT total from T)) as diff, goal_comment FROM count_goal where count_name = ?3"
    )
      .bind(name, name, name)
      .first();
    console.log(info);
    if (!info) {
      return MESSAGES.SHOW_GOAL_NO_GOAL(name);
    }
    return MESSAGES.SHOW_GOAL_SUCCESS(info["goal_comment"], info["diff"]);
  } catch (error) {
    console.log(errorToString(error));
    return MESSAGES.SHOW_GOAL_ERROR(name, errorToString(error));
  }
}

/**
 * Show count history for a specific name
 */
async function showCountHistory(name, limit, env) {
  try {
    const info = await env.DB.prepare(
      "SELECT count_name, count_type, count_date, count_comment FROM count_log WHERE count_name=?1 ORDER BY id DESC LIMIT ?2"
    )
      .bind(name, limit)
      .all();

    let dataTable = messageCountRecordList(info["results"]);
    
    return MESSAGES.HISTORY_SUCCESS(dataTable);
  } catch (error) {
    console.log(errorToString(error));
    return MESSAGES.HISTORY_ERROR(name, errorToString(error));
  }
}

/**
 * Format count records as a list
 */
function messageCountRecordList(data) {
  // 如果数据为空或者不是数组，返回空字符串
  if (!Array.isArray(data) || data.length == 0) {
    return "";
  }

  var table = "";
  // 创建表格的每一行数据
  for (var i = 0; i < data.length; i++) {
    table += "> " + Object.values(data[i]).join(" | ") + "\n";
  }
  return table;
}

/**
 * Convert error to string for logging
 */
function errorToString(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}