/**
 * Claude Code from Scratch — Chapter 2: The Anatomy of Context
 *
 * WHAT'S NEW IN THIS CHAPTER:
 *   - Interactive CLI loop (readline-based)
 *   - Token counting and budget display
 *   - Message builder for structured message creation
 *   - Per-turn and session-level token tracking
 *   - Context window utilization display
 *
 * CONTEXT ENGINEERING CONCEPTS:
 *   - Messages API format (system, user, assistant roles)
 *   - Tokens as the atomic unit of context
 *   - Context windows as the fundamental constraint
 *   - Token budget awareness
 *
 * Usage:
 *   npx tsx src/index.ts
 *
 * Type a message and press Enter to chat. Type "quit" to exit.
 * After each response, token usage is displayed.
 */

// Must be the first import — silences Node's DEP0040 punycode warning
// before @anthropic-ai/sdk's transitive dependencies are loaded.
import "./silence.js";
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline";
import { config } from "./config.js";
import { MessageBuilder, type Message } from "./core/messages.js";
import {
  TokenTracker,
  estimateTokens,
  calculateBudget,
  formatTokenCount,
  contextUtilization,
} from "./core/tokens.js";

// -----------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------

const client = new Anthropic();
const tokenTracker = new TokenTracker();

// The system prompt — still simple for now. Chapter 3 will expand this
// into a full system prompt with environment detection.
const SYSTEM_PROMPT = "You are a helpful coding assistant. Be concise.";

// -----------------------------------------------------------------------
// Interactive CLI
//
// CONTEXT ENGINEERING CONCEPT: Single-Turn Interaction
//
// In this chapter, each exchange is a single turn: one user message,
// one assistant response. The model has NO memory of previous turns.
// Every API call is independent — the model sees only the system
// prompt and the current user message.
//
// In Chapter 4, we will add conversation history to create the
// ILLUSION of memory by resending all previous messages each turn.
// -----------------------------------------------------------------------

async function chat(userInput: string): Promise<string> {
  // Build the user message using our message builder
  const userMessage: Message = MessageBuilder.user(userInput);

  // Estimate input tokens before the API call
  const estimatedInput =
    estimateTokens(SYSTEM_PROMPT) + estimateTokens(userInput);

  const message = await client.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    system: SYSTEM_PROMPT,
    messages: [userMessage],
  });

  // Record actual token usage from the API response
  tokenTracker.recordUsage({
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  });

  // Extract text from response
  const textBlock = message.content.find((block) => block.type === "text");
  const responseText =
    textBlock && textBlock.type === "text"
      ? textBlock.text
      : "(no text response)";

  // Display token usage for this turn
  const budget = calculateBudget();
  const totalThisTurn =
    message.usage.input_tokens + message.usage.output_tokens;
  const utilization = contextUtilization(message.usage.input_tokens);

  console.log();
  console.log(
    `  Tokens: ${message.usage.input_tokens} in → ${message.usage.output_tokens} out (${totalThisTurn} total)`
  );
  console.log(
    `  Estimate was: ~${estimatedInput} tokens (actual: ${message.usage.input_tokens})`
  );
  console.log(
    `  Window: ${formatTokenCount(message.usage.input_tokens)} / ${formatTokenCount(budget.total)} (${utilization.toFixed(1)}% used)`
  );
  console.log();

  return responseText;
}

// -----------------------------------------------------------------------
// Main — CLI Loop
// -----------------------------------------------------------------------

async function main(): Promise<void> {
  const budget = calculateBudget();

  console.log("=".repeat(60));
  console.log("  Claude Code from Scratch — Chapter 2");
  console.log("  The Anatomy of Context");
  console.log("=".repeat(60));
  console.log();
  console.log(`  Model:          ${config.model}`);
  console.log(
    `  Context window: ${formatTokenCount(budget.total)} tokens`
  );
  console.log(
    `  Max output:     ${formatTokenCount(budget.reservedForOutput)} tokens`
  );
  console.log(
    `  Input budget:   ${formatTokenCount(budget.availableForInput)} tokens`
  );
  console.log();
  console.log("  Type a message to chat. Type 'quit' to exit.");
  console.log(
    "  Each message is independent (no conversation memory yet)."
  );
  console.log("-".repeat(60));
  console.log();

  // Set up readline for interactive input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (): void => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();

      // Exit conditions
      if (!trimmed) {
        prompt();
        return;
      }

      if (
        trimmed.toLowerCase() === "quit" ||
        trimmed.toLowerCase() === "exit"
      ) {
        console.log();
        console.log("-".repeat(60));
        console.log(tokenTracker.formatSessionSummary());
        console.log("-".repeat(60));
        console.log();
        console.log(
          "  Chapter 2 complete. Next: Ch 3 — System Prompts"
        );
        console.log();
        rl.close();
        return;
      }

      try {
        const response = await chat(trimmed);
        console.log(`Claude: ${response}`);
        console.log();
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error: ${error.message}`);

          if (error.message.includes("API key")) {
            console.error(
              "Hint: Set ANTHROPIC_API_KEY in your environment or .env file."
            );
          }
        }
        console.log();
      }

      prompt();
    });
  };

  prompt();
}

main().catch((error: Error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
