/**
 * Conversation History Manager — Chapter 3
 *
 * CONTEXT ENGINEERING CONCEPT: Multi-Turn Conversation
 *
 * LLMs are stateless — they have zero memory between API calls.
 * To create the ILLUSION of an ongoing conversation, we must
 * resend the ENTIRE conversation history with every request.
 *
 * This means:
 *   - Every previous user message is included
 *   - Every previous assistant response is included
 *   - The context grows by ~2 messages per turn
 *   - Eventually, the context window will fill up
 *
 * This module manages that growing history. In Chapter 10, we will
 * add compression to handle the case when history exceeds the budget.
 * For now, we simply maintain and return the full history.
 *
 * CONCEPT: Memory Is Just Resending
 *
 * There is no magic to LLM "memory." When the model appears to
 * remember what you said 5 turns ago, it's because we literally
 * included that message in the current request. If we omit it,
 * the model has no idea it ever happened.
 */

import {
  MessageBuilder,
  getMessageText,
  type Message,
} from "./messages.js";
import { estimateTokens } from "./tokens.js";

export interface ConversationStats {
  /** Total number of messages (user + assistant). */
  messageCount: number;
  /** Number of complete turns (one user + one assistant = one turn). */
  turnCount: number;
  /** Estimated token count for the entire history. */
  estimatedTokens: number;
}

/**
 * Manages the conversation history for a single session.
 *
 * The conversation is a simple array of messages that grows
 * with each turn. The full array is sent with every API call.
 */
export class Conversation {
  private messages: Message[] = [];

  /**
   * Add a user message to the conversation.
   */
  addUserMessage(text: string): void {
    this.messages.push(MessageBuilder.user(text));
  }

  /**
   * Add an assistant message to the conversation.
   */
  addAssistantMessage(text: string): void {
    this.messages.push(MessageBuilder.assistant(text));
  }

  /**
   * Get the full message history for an API call.
   *
   * This is the key method. Every API call receives this
   * entire array. The model sees all previous turns and
   * can reference anything that was said before.
   *
   * CONTEXT ENGINEERING INSIGHT: This array grows linearly
   * with the conversation length. At ~500-2000 tokens per
   * turn, a 30-turn conversation uses 15,000-60,000 tokens
   * of history. This is why compression (Ch 10) is essential.
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Get conversation statistics.
   */
  getStats(): ConversationStats {
    const estimatedTokens = this.messages.reduce((total, msg) => {
      const text = getMessageText(msg);
      return total + estimateTokens(text);
    }, 0);

    return {
      messageCount: this.messages.length,
      turnCount: Math.floor(this.messages.length / 2),
      estimatedTokens,
    };
  }

  /**
   * Get the most recent N messages.
   * Useful for display and debugging.
   */
  getRecentMessages(count: number): Message[] {
    return this.messages.slice(-count);
  }

  /**
   * Clear the conversation history.
   * Starts a fresh conversation.
   */
  clear(): void {
    this.messages = [];
  }

  /**
   * Check if the conversation is empty.
   */
  isEmpty(): boolean {
    return this.messages.length === 0;
  }
}
