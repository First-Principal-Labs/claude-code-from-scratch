/**
 * Conversation History Manager — Chapter 4 (Enhanced)
 *
 * CONTEXT ENGINEERING CONCEPT: Conversation State Management
 *
 * Enhanced from Chapter 3 with:
 *   - Conversation IDs for tracking
 *   - Persistence support (save/load via HistoryManager)
 *   - Token budget awareness (warns when approaching limits)
 *   - Richer statistics
 *
 * CONCEPT: The Message Array IS the State
 *
 * In a stateless system, the conversation's message array is the
 * COMPLETE state. There is no hidden state, no server-side session.
 * If the array has 20 messages, the model knows 20 messages.
 *
 * CONCEPT: Context Pressure
 *
 * Every turn adds ~500-2000 tokens. The window doesn't grow.
 * Eventually, something has to give:
 *   - This chapter: we warn when approaching limits
 *   - Chapter 10: we compress old messages automatically
 */

import {
  MessageBuilder,
  getMessageText,
  type Message,
} from "./messages.js";
import { estimateTokens, calculateBudget } from "./tokens.js";
import {
  HistoryManager,
  generateConversationId,
  type SavedConversation,
} from "./history.js";

export interface ConversationStats {
  id: string;
  messageCount: number;
  turnCount: number;
  estimatedTokens: number;
  createdAt: string;
  budgetWarning: "ok" | "caution" | "critical";
}

const BUDGET_CAUTION = 0.6;
const BUDGET_CRITICAL = 0.8;

export class Conversation {
  private messages: Message[] = [];
  private id: string;
  private createdAt: string;
  private model: string;
  private systemPrompt: string;

  constructor(model: string, systemPrompt: string, id?: string) {
    this.id = id ?? generateConversationId();
    this.createdAt = new Date().toISOString();
    this.model = model;
    this.systemPrompt = systemPrompt;
  }

  getId(): string {
    return this.id;
  }

  addUserMessage(text: string): void {
    this.messages.push(MessageBuilder.user(text));
  }

  addAssistantMessage(text: string): void {
    this.messages.push(MessageBuilder.assistant(text));
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  getStats(): ConversationStats {
    const estimatedTokens = this.messages.reduce((total, msg) => {
      const text = getMessageText(msg);
      return total + estimateTokens(text);
    }, 0);

    const budget = calculateBudget();
    const systemTokens = estimateTokens(this.systemPrompt);
    const totalUsed = systemTokens + estimatedTokens;
    const ratio = totalUsed / budget.availableForInput;

    let budgetWarning: "ok" | "caution" | "critical" = "ok";
    if (ratio >= BUDGET_CRITICAL) budgetWarning = "critical";
    else if (ratio >= BUDGET_CAUTION) budgetWarning = "caution";

    return {
      id: this.id,
      messageCount: this.messages.length,
      turnCount: Math.floor(this.messages.length / 2),
      estimatedTokens,
      createdAt: this.createdAt,
      budgetWarning,
    };
  }

  getRecentMessages(count: number): Message[] {
    return this.messages.slice(-count);
  }

  clear(): void {
    this.messages = [];
  }

  isEmpty(): boolean {
    return this.messages.length === 0;
  }

  // -----------------------------------------------------------------
  // Persistence (Chapter 4)
  // -----------------------------------------------------------------

  save(historyManager: HistoryManager): void {
    const data: SavedConversation = {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: new Date().toISOString(),
      model: this.model,
      turnCount: Math.floor(this.messages.length / 2),
      systemPrompt: this.systemPrompt,
      messages: this.messages,
    };
    historyManager.save(data);
  }

  static fromSaved(saved: SavedConversation): Conversation {
    const conv = new Conversation(saved.model, saved.systemPrompt, saved.id);
    conv.createdAt = saved.createdAt;
    conv.messages = [...saved.messages];
    return conv;
  }
}
