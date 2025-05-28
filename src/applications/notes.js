// src/applications/notes.js
// Placeholder for notes application logic
// This would typically interact with a database or a KV store for persistence.

/**
 * Handles intents related to the notes application.
 * @param {string} intent The recognized intent (e.g., 'add_note', 'list_notes').
 * @param {object} entities Extracted entities from the user's message.
 * @param {string|number} chatId The chat ID of the user.
 * @param {object} env Environment variables, might contain API keys or KV binding.
 * @returns {Promise<string>} A message to send back to the user.
 */
export async function handleNotesIntent(intent, entities, chatId, env) {
  console.log(`Notes: Handling intent '${intent}' with entities:`, entities);

  // Example: Using a KV store for simple data persistence
  // Ensure you have a KV namespace bound in your wrangler.toml, e.g., binding = "NOTES_KV"
  const kv = env.NOTES_KV;
  if (!kv) {
    console.warn('NOTES_KV namespace not bound. Notes features will be limited.');
    // return "Notes service is not fully configured (KV missing).";
  }

  switch (intent) {
    case 'add_note':
      return await addNote(entities, chatId, kv);
    case 'list_notes':
      return await listNotes(chatId, kv);
    // Add more cases for other notes intents like 'find_note', 'delete_note', etc.
    default:
      return `Sorry, I don't know how to handle the notes request: ${intent}.`;
  }
}

/**
 * Adds a note for the user.
 * @param {object} entities Must contain 'content' for the note.
 * @param {string|number} chatId User's chat ID, used as a key for storing data.
 * @param {object} kv The KV namespace instance.
 * @returns {Promise<string>}
 */
async function addNote(entities, chatId, kv) {
  const { content } = entities;

  if (!content || content.trim() === '') {
    return 'Please provide some content for your note. For example: add note remember to buy milk.';
  }

  if (!kv) return "Cannot save note: Notes storage (KV) is not available.";

  try {
    const userKey = `user_${chatId}_notes`;
    let notes = await kv.get(userKey, { type: 'json' }) || [];
    const newNote = {
      id: Date.now().toString(), // Simple ID
      content,
      created_at: new Date().toISOString(),
    };
    notes.push(newNote);
    await kv.put(userKey, JSON.stringify(notes));
    return `Note added: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`;
  } catch (error) {
    console.error('Error adding note to KV:', error);
    return 'Sorry, there was an error saving your note.';
  }
}

/**
 * Lists all notes for the user.
 * @param {string|number} chatId User's chat ID.
 * @param {object} kv The KV namespace instance.
 * @returns {Promise<string>}
 */
async function listNotes(chatId, kv) {
  if (!kv) return "Cannot list notes: Notes storage (KV) is not available.";

  try {
    const userKey = `user_${chatId}_notes`;
    const notes = await kv.get(userKey, { type: 'json' }) || [];

    if (notes.length === 0) {
      return 'You have no notes yet. Try adding one with "add note [your note]".';
    }

    let responseMessage = 'Your notes:\n';
    notes.forEach((note, index) => {
      responseMessage += `${index + 1}. ${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}\n`;
    });
    return responseMessage.trim();
  } catch (error) {
    console.error('Error listing notes from KV:', error);
    return 'Sorry, there was an error retrieving your notes.';
  }
}

// TODO: Implement other functions like findNote, deleteNote, etc.