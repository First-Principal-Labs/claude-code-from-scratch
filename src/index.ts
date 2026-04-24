/**
 * Claude Code from Scratch — Chapter 3: System Prompts
 *
 * WHAT'S NEW IN THIS CHAPTER:
 *   - Real system prompt loaded from a template file
 *   - Template variable injection (OS, shell, cwd, date)
 *   - Environment detection
 *   - Multi-turn conversation (the model now remembers previous turns!)
 *   - Conversation statistics display
 *
 * CONTEXT ENGINEERING CONCEPTS:
 *   - System prompt design (identity, rules, format, safety)
 *   - Instruction hierarchy (system > user > assistant > tool_result)
 *   - Template variables / dynamic system prompts
 *   - Multi-turn conversation via message history resending
 *
 * Usage:
 *   npx tsx src/index.ts
 *
 * Type a message and press Enter to chat. The model now remembers
 * the conversation! Type "quit" to exit, "/clear" to reset.
 */

// Must be the first import — silences Node's DEP0040 punycode warning
// before @anthropic-ai/sdk's transitive dependencies are loaded.
import "./silence.js";
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "node:readline";
import { config } from "./config.js";
import {
  TokenTracker,
  calculateBudget,
  formatTokenCount,
  contextUtilization,
} from "./core/tokens.js";
import { buildSystemPrompt } from "./core/system-prompt.js";
import {
  detectEnvironment,
  formatEnvironmentForDisplay,
} from "./core/environment.js";
import { Conversation } from "./core/conversation.js";

// -----------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------

const client = new Anthropic();
const tokenTracker = new TokenTracker();
const conversation = new Conversation();

// Build the system prompt with environment variables injected
const systemPrompt = buildSystemPrompt();

// -----------------------------------------------------------------------
// Multi-Turn Chat
//
// CONTEXT ENGINEERING CONCEPT: Conversation History
//
// THIS IS THE KEY CHANGE FROM CHAPTER 2.
//
// In Chapter 2, we sent a single message per API call — no history.
// Now, we maintain a Conversation object that accumulates all
// messages. Every API call sends the FULL HISTORY.
//
// The model sees:
//   [system prompt] + [user 1] + [assistant 1] + [user 2] + ...
//
// This creates the illusion of memory. The model doesn't actually
// remember anything — we just resend everything it needs to know.
// -----------------------------------------------------------------------

async function chat(userInput: string): Promise<string> {
  // Add the user's message to conversation history
  conversation.addUserMessage(userInput);

  const message = await client.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    system: systemPrompt.text,
    messages: conversation.getMessages(), // ← FULL HISTORY sent every time
  });

  // Record token usage
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

  // Add assistant response to conversation history
  conversation.addAssistantMessage(responseText);

  // Display per-turn stats
  const budget = calculateBudget();
  const utilization = contextUtilization(message.usage.input_tokens);
  const stats = conversation.getStats();

  console.log();
  console.log(
    `  [Turn ${stats.turnCount}] ${message.usage.input_tokens} in → ${message.usage.output_tokens} out | Window: ${utilization.toFixed(1)}% used`
  );
  console.log();

  return responseText;
}

// -----------------------------------------------------------------------
// Main — CLI Loop with Multi-Turn
// -----------------------------------------------------------------------

async function main(): Promise<void> {
  const budget = calculateBudget();
  const env = detectEnvironment();

  console.log("=".repeat(60));
  console.log("  Claude Code from Scratch — Chapter 3");
  console.log("  System Prompts: Programming the Brain");
  console.log("=".repeat(60));
  console.log();
  console.log(formatEnvironmentForDisplay(env));
  console.log();
  console.log(`  Model:          ${config.model}`);
  console.log(
    `  Context window: ${formatTokenCount(budget.total)} tokens`
  );
  console.log(
    `  System prompt:  ~${systemPrompt.estimatedTokens} tokens`
  );
  console.log();
  console.log(
    "  The model now remembers the conversation!"
  );
  console.log(
    "  Commands: /clear (reset), /stats (usage), /prompt (view), quit"
  );
  console.log("-".repeat(60));
  console.log();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (): void => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      // Handle exit
      if (
        trimmed.toLowerCase() === "quit" ||
        trimmed.toLowerCase() === "exit"
      ) {
        console.log();
        console.log("-".repeat(60));
        console.log(tokenTracker.formatSessionSummary());
        const stats = conversation.getStats();
        console.log(`  Turns:          ${stats.turnCount}`);
        console.log(`  History tokens: ~${stats.estimatedTokens}`);
        console.log("-".repeat(60));
        console.log();
        console.log(
          "  Chapter 3 complete. Next: Ch 4 — Conversation Management"
        );
        console.log();
        rl.close();
        return;
      }

      // Handle slash commands
      if (trimmed.toLowerCase() === "/clear") {
        conversation.clear();
        console.log("  Conversation cleared. Starting fresh.\n");
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === "/stats") {
        const stats = conversation.getStats();
        const sessionUsage = tokenTracker.getSessionUsage();
        console.log();
        console.log(`  Messages:       ${stats.messageCount}`);
        console.log(`  Turns:          ${stats.turnCount}`);
        console.log(`  History tokens: ~${stats.estimatedTokens}`);
        console.log(
          `  System prompt:  ~${systemPrompt.estimatedTokens} tokens`
        );
        console.log(
          `  Session cost:   $${sessionUsage.estimatedCost.toFixed(4)}`
        );
        console.log();
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === "/prompt") {
        console.log();
        console.log("--- System Prompt ---");
        console.log(systemPrompt.text);
        console.log("--- End System Prompt ---");
        console.log();
        prompt();
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
