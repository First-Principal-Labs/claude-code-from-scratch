/**
 * Token Counting Utility — Chapter 2
 *
 * CONTEXT ENGINEERING CONCEPT: Tokens and Context Windows
 *
 * Tokens are the atomic unit of context. Every piece of information
 * that flows into an LLM — system prompts, messages, tool definitions,
 * file contents — is measured in tokens. Understanding token counts
 * is essential for context engineering because:
 *
 *   1. Context windows have FIXED TOKEN LIMITS (e.g., 200K for Claude)
 *   2. Every token costs money (input and output are priced per million)
 *   3. Token budget must be allocated across competing needs:
 *      system prompt + tools + memory + history + current turn + output
 *
 * This module provides token estimation and budget tracking.
 *
 * NOTE: We use a character-based estimator (1 token ≈ 4 characters for
 * English text) because the exact tokenizer is model-specific and not
 * publicly available. The Anthropic API returns exact token counts in
 * its response, which we use for precise tracking after each call.
 * In Chapter 13, we'll refine this with API-based token counting.
 */

import { config, pricing } from "../config.js";

// -----------------------------------------------------------------------
// Token Estimation
//
// Exact tokenization requires the model's specific tokenizer.
// For planning and budgeting, we use a well-known heuristic:
//   English text: ~4 characters per token
//   Code: ~3.5 characters per token (shorter identifiers, symbols)
//   JSON/structured data: ~3 characters per token (lots of punctuation)
//
// These are approximations. The API response gives exact counts.
// -----------------------------------------------------------------------

/** Characters per token ratio for different content types. */
const CHARS_PER_TOKEN = {
  text: 4,
  code: 3.5,
  json: 3,
} as const;

type ContentType = keyof typeof CHARS_PER_TOKEN;

/**
 * Estimate token count for a string.
 *
 * This is a heuristic — not exact. Use it for planning and
 * budget estimation. The API response provides exact counts.
 *
 * @param text - The text to estimate tokens for
 * @param type - The type of content (affects the ratio)
 * @returns Estimated token count
 */
export function estimateTokens(
  text: string,
  type: ContentType = "text"
): number {
  if (!text) return 0;
  const ratio = CHARS_PER_TOKEN[type];
  return Math.ceil(text.length / ratio);
}

// -----------------------------------------------------------------------
// Context Window Sizes
//
// Different Claude models have different context windows.
// This is the HARD LIMIT — you cannot exceed it.
// -----------------------------------------------------------------------

/** Context window sizes by model (in tokens). */
export const CONTEXT_WINDOWS: Record<string, number> = {
  "claude-sonnet-4-20250514": 200_000,
  "claude-opus-4-20250514": 200_000,
  "claude-haiku-3-5-20241022": 200_000,
};

/**
 * Get the context window size for the current model.
 */
export function getContextWindowSize(): number {
  return CONTEXT_WINDOWS[config.model] ?? 200_000;
}

// -----------------------------------------------------------------------
// Token Usage Tracking
//
// After each API call, we receive exact token counts. This tracker
// accumulates usage across a session for cost estimation and
// budget monitoring.
// -----------------------------------------------------------------------

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface SessionUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  apiCalls: number;
  estimatedCost: number;
}

/**
 * Tracks token usage across an entire session.
 *
 * CONTEXT ENGINEERING INSIGHT: Understanding your token usage
 * pattern is the first step toward optimization. Are you spending
 * most tokens on the system prompt? On tool results? On conversation
 * history? This tracker reveals the pattern.
 */
export class TokenTracker {
  private totalInput: number = 0;
  private totalOutput: number = 0;
  private callCount: number = 0;
  private history: TokenUsage[] = [];

  /**
   * Record token usage from an API response.
   */
  recordUsage(usage: TokenUsage): void {
    this.totalInput += usage.inputTokens;
    this.totalOutput += usage.outputTokens;
    this.callCount += 1;
    this.history.push(usage);
  }

  /**
   * Get the cumulative session usage with cost estimate.
   */
  getSessionUsage(): SessionUsage {
    const modelPricing =
      pricing[config.model as keyof typeof pricing];

    const inputCost = modelPricing
      ? (this.totalInput / 1_000_000) * modelPricing.input
      : 0;
    const outputCost = modelPricing
      ? (this.totalOutput / 1_000_000) * modelPricing.output
      : 0;

    return {
      totalInputTokens: this.totalInput,
      totalOutputTokens: this.totalOutput,
      totalTokens: this.totalInput + this.totalOutput,
      apiCalls: this.callCount,
      estimatedCost: inputCost + outputCost,
    };
  }

  /**
   * Get the usage history for analysis.
   */
  getHistory(): readonly TokenUsage[] {
    return this.history;
  }

  /**
   * Format session usage for CLI display.
   */
  formatSessionSummary(): string {
    const usage = this.getSessionUsage();
    const lines = [
      "Session Token Usage:",
      `  API calls:      ${usage.apiCalls}`,
      `  Input tokens:   ${usage.totalInputTokens.toLocaleString()}`,
      `  Output tokens:  ${usage.totalOutputTokens.toLocaleString()}`,
      `  Total tokens:   ${usage.totalTokens.toLocaleString()}`,
      `  Est. cost:      $${usage.estimatedCost.toFixed(4)}`,
    ];
    return lines.join("\n");
  }
}

// -----------------------------------------------------------------------
// Context Budget
//
// CONTEXT ENGINEERING CONCEPT: Budget Allocation
//
// The context window is a fixed resource. We must allocate it:
//
//   ┌─────────────────────────────────────────┐
//   │ System Prompt         ~3,000-5,000      │
//   │ Tool Definitions      ~10,000-15,000    │
//   │ Memory (CLAUDE.md)    ~1,000-3,000      │
//   │ Conversation History  ~variable~        │
//   │ Current Turn          ~variable~        │
//   │ ─── Reserved for Output ─── ~4,096 ──── │
//   └─────────────────────────────────────────┘
//
// In Chapter 10, we'll build a full context manager that
// enforces these budgets. For now, we just define them.
// -----------------------------------------------------------------------

export interface ContextBudget {
  total: number;
  reservedForOutput: number;
  availableForInput: number;
}

/**
 * Calculate the context budget for the current model.
 *
 * We reserve space for the model's output (max_tokens) so
 * the input never exceeds what the model can actually process.
 */
export function calculateBudget(): ContextBudget {
  const total = getContextWindowSize();
  const reservedForOutput = config.maxTokens;
  const availableForInput = total - reservedForOutput;

  return {
    total,
    reservedForOutput,
    availableForInput,
  };
}

/**
 * Format a token count as a human-readable string.
 * e.g., 150000 → "150K", 1234 → "1.2K"
 */
export function formatTokenCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Calculate the percentage of the context window used.
 */
export function contextUtilization(tokensUsed: number): number {
  const windowSize = getContextWindowSize();
  return (tokensUsed / windowSize) * 100;
}
