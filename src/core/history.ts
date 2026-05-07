/**
 * Conversation Persistence — Chapter 4
 *
 * CONTEXT ENGINEERING CONCEPT: Conversation Persistence
 *
 * Since LLMs are stateless, the conversation history is the ONLY
 * record of what happened. If you lose the history, you lose everything.
 *
 * This module persists conversations to disk as JSON files, enabling:
 *   - Resume a conversation after closing the CLI
 *   - Review past conversations for debugging
 *   - Share conversation context across sessions
 *
 * Each conversation is saved with metadata (ID, timestamps, model,
 * turn count) so we can manage multiple saved conversations.
 *
 * In Chapter 11, we'll build a more sophisticated memory system
 * (CLAUDE.md + auto-memory) that extracts and persists important
 * information ACROSS conversations. This module persists the raw
 * conversation history of a SINGLE conversation.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { type Message } from "./messages.js";

// -----------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------

export interface SavedConversation {
  /** Unique conversation identifier. */
  id: string;
  /** When the conversation was first created. */
  createdAt: string;
  /** When the conversation was last updated. */
  updatedAt: string;
  /** The model used for this conversation. */
  model: string;
  /** Number of complete turns. */
  turnCount: number;
  /** The system prompt text used. */
  systemPrompt: string;
  /** The full message history. */
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  turnCount: number;
  /** Preview: first user message, truncated. */
  preview: string;
}

// -----------------------------------------------------------------------
// History Manager
// -----------------------------------------------------------------------

/**
 * Manages saving and loading conversations to/from disk.
 *
 * Conversations are stored as JSON files in a configurable directory.
 * Each file is named by the conversation ID.
 */
export class HistoryManager {
  private storageDir: string;

  constructor(storageDir?: string) {
    this.storageDir =
      storageDir ??
      path.join(process.cwd(), "data", "conversations");
    this.ensureDirectory();
  }

  /**
   * Save a conversation to disk.
   */
  save(conversation: SavedConversation): void {
    const filePath = this.getFilePath(conversation.id);
    const json = JSON.stringify(conversation, null, 2);
    fs.writeFileSync(filePath, json, "utf-8");
  }

  /**
   * Load a conversation from disk by ID.
   * Returns null if not found.
   */
  load(id: string): SavedConversation | null {
    const filePath = this.getFilePath(id);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const json = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(json) as SavedConversation;
    } catch {
      return null;
    }
  }

  /**
   * List all saved conversations (summaries only).
   * Sorted by most recently updated first.
   */
  list(): ConversationSummary[] {
    if (!fs.existsSync(this.storageDir)) {
      return [];
    }

    const files = fs.readdirSync(this.storageDir).filter((f) =>
      f.endsWith(".json")
    );

    const summaries: ConversationSummary[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(this.storageDir, file);
        const json = fs.readFileSync(filePath, "utf-8");
        const conv = JSON.parse(json) as SavedConversation;

        // Extract preview from first user message
        let preview = "(empty conversation)";
        const firstUserMsg = conv.messages.find(
          (m) => m.role === "user"
        );
        if (firstUserMsg) {
          const text =
            typeof firstUserMsg.content === "string"
              ? firstUserMsg.content
              : "(structured content)";
          preview =
            text.length > 60 ? text.slice(0, 60) + "..." : text;
        }

        summaries.push({
          id: conv.id,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          turnCount: conv.turnCount,
          preview,
        });
      } catch {
        // Skip corrupted files
      }
    }

    // Sort by most recently updated
    summaries.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
    );

    return summaries;
  }

  /**
   * Delete a saved conversation.
   */
  delete(id: string): boolean {
    const filePath = this.getFilePath(id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  /**
   * Get the storage directory path.
   */
  getStorageDir(): string {
    return this.storageDir;
  }

  // -------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------

  private getFilePath(id: string): string {
    return path.join(this.storageDir, `${id}.json`);
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }
}

/**
 * Generate a short, human-readable conversation ID.
 * Format: "conv-{timestamp}-{random}"
 */
export function generateConversationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  return `conv-${timestamp}-${random}`;
}
