/**
 * Configuration for Claude from Scratch.
 *
 * This file centralizes all configuration values. In later chapters,
 * this will grow to include tool settings, memory paths, permission
 * modes, and more.
 *
 * For now, it's minimal — just the model and token settings.
 */

export const config = {
  /**
   * The Claude model to use.
   * - claude-sonnet-4-20250514: Fast, capable, cost-effective (recommended for development)
   * - claude-opus-4-20250514: Most capable, slower, more expensive
   * - claude-haiku-3-5-20241022: Fastest, cheapest, less capable
   */
  model: "claude-sonnet-4-20250514" as const,

  /**
   * Maximum number of tokens the model can generate in a response.
   * 1024 tokens ≈ 750 words. Increase for longer responses.
   */
  maxTokens: 1024,

  /**
   * The system prompt version. We'll track this as it evolves.
   * Chapter 1: Single sentence.
   * Chapter 3: Full system prompt with environment detection.
   */
  systemPromptVersion: "0.1.0",
} as const;

/**
 * Token pricing (as of 2025, per million tokens).
 * Used for cost estimation in later chapters (Ch 13).
 */
export const pricing = {
  "claude-sonnet-4-20250514": {
    input: 3.0, // $ per million input tokens
    output: 15.0, // $ per million output tokens
    cacheWrite: 3.75, // $ per million cached write tokens
    cacheRead: 0.3, // $ per million cached read tokens
  },
  "claude-opus-4-20250514": {
    input: 15.0,
    output: 75.0,
    cacheWrite: 18.75,
    cacheRead: 1.5,
  },
  "claude-haiku-3-5-20241022": {
    input: 0.8,
    output: 4.0,
    cacheWrite: 1.0,
    cacheRead: 0.08,
  },
} as const;
