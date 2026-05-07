/**
 * Claude Code from Scratch — Chapter 4: Conversation Management
 *
 * WHAT'S NEW IN THIS CHAPTER:
 *   - Conversation persistence (save/load to disk as JSON)
 *   - Resume previous conversations with /resume
 *   - List saved conversations with /history
 *   - Conversation IDs and metadata
 *   - Token budget warnings (caution at 60%, critical at 80%)
 *   - Auto-save on exit
 *
 * CONTEXT ENGINEERING CONCEPTS:
 *   - The stateless illusion — memory is just resending
 *   - Conversation state = the message array
 *   - Context pressure — history grows, window doesn't
 *   - Persistence as a bridge between sessions
 *
 * Usage:
 *   npx tsx src/index.ts           # Start a new conversation
 *   npx tsx src/index.ts --resume  # Resume most recent conversation
 *
 * Commands: /clear, /stats, /prompt, /save, /history, /resume, quit
 */

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
import { HistoryManager } from "./core/history.js";

// -----------------------------------------------------------------------
// Initialize
// -----------------------------------------------------------------------

const client = new Anthropic();
const tokenTracker = new TokenTracker();
const historyManager = new HistoryManager();
const systemPrompt = buildSystemPrompt();

// Check for --resume flag
const shouldResume = process.argv.includes("--resume");

// Create or resume a conversation
let conversation: Conversation;

if (shouldResume) {
  const saved = historyManager.list();
  if (saved.length > 0) {
    const mostRecent = historyManager.load(saved[0].id);
    if (mostRecent) {
      conversation = Conversation.fromSaved(mostRecent);
    } else {
      conversation = new Conversation(config.model, systemPrompt.text);
    }
  } else {
    conversation = new Conversation(config.model, systemPrompt.text);
  }
} else {
  conversation = new Conversation(config.model, systemPrompt.text);
}

// -----------------------------------------------------------------------
// Chat Function
// -----------------------------------------------------------------------

async function chat(userInput: string): Promise<string> {
  conversation.addUserMessage(userInput);

  const message = await client.messages.create({
    model: config.model,
    max_tokens: config.maxTokens,
    system: systemPrompt.text,
    messages: conversation.getMessages(),
  });

  tokenTracker.recordUsage({
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const responseText =
    textBlock && textBlock.type === "text"
      ? textBlock.text
      : "(no text response)";

  conversation.addAssistantMessage(responseText);

  // Display per-turn stats with budget warning
  const stats = conversation.getStats();
  const utilization = contextUtilization(message.usage.input_tokens);

  let warning = "";
  if (stats.budgetWarning === "critical") {
    warning = " *** CRITICAL: Context nearly full! Use /clear or expect degraded performance.";
  } else if (stats.budgetWarning === "caution") {
    warning = " (caution: context filling up)";
  }

  console.log();
  console.log(
    `  [Turn ${stats.turnCount}] ${message.usage.input_tokens} in → ${message.usage.output_tokens} out | Window: ${utilization.toFixed(1)}% used${warning}`
  );
  console.log();

  return responseText;
}

// -----------------------------------------------------------------------
// Main — CLI Loop
// -----------------------------------------------------------------------

async function main(): Promise<void> {
  const budget = calculateBudget();
  const env = detectEnvironment();
  const stats = conversation.getStats();

  console.log("=".repeat(60));
  console.log("  Claude Code from Scratch — Chapter 4");
  console.log("  Conversation Management");
  console.log("=".repeat(60));
  console.log();
  console.log(formatEnvironmentForDisplay(env));
  console.log();
  console.log(`  Model:          ${config.model}`);
  console.log(`  Context window: ${formatTokenCount(budget.total)} tokens`);
  console.log(`  System prompt:  ~${systemPrompt.estimatedTokens} tokens`);
  console.log(`  Conversation:   ${stats.id}`);

  if (!conversation.isEmpty()) {
    console.log(`  Resumed:        ${stats.turnCount} turns, ~${stats.estimatedTokens} tokens of history`);
  }

  console.log();
  console.log("  Commands: /save, /history, /resume, /clear, /stats, /prompt, quit");
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

      // --- Exit ---
      if (trimmed.toLowerCase() === "quit" || trimmed.toLowerCase() === "exit") {
        // Auto-save on exit if conversation has content
        if (!conversation.isEmpty()) {
          conversation.save(historyManager);
          console.log(`  Auto-saved conversation ${conversation.getId()}`);
        }
        console.log();
        console.log("-".repeat(60));
        console.log(tokenTracker.formatSessionSummary());
        const finalStats = conversation.getStats();
        console.log(`  Turns:          ${finalStats.turnCount}`);
        console.log(`  History tokens: ~${finalStats.estimatedTokens}`);
        console.log("-".repeat(60));
        console.log();
        console.log("  Chapter 4 complete. Next: Ch 5 — Tool Use");
        console.log();
        rl.close();
        return;
      }

      // --- Slash Commands ---
      if (trimmed.toLowerCase() === "/save") {
        conversation.save(historyManager);
        console.log(`  Saved conversation ${conversation.getId()}\n`);
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === "/history") {
        const saved = historyManager.list();
        if (saved.length === 0) {
          console.log("  No saved conversations.\n");
        } else {
          console.log();
          console.log("  Saved conversations:");
          for (const s of saved.slice(0, 10)) {
            console.log(`    ${s.id} (${s.turnCount} turns) — ${s.preview}`);
          }
          console.log();
        }
        prompt();
        return;
      }

      if (trimmed.toLowerCase().startsWith("/resume")) {
        const parts = trimmed.split(/\s+/);
        let targetId: string | undefined;

        if (parts.length > 1) {
          targetId = parts[1];
        } else {
          const saved = historyManager.list();
          if (saved.length > 0) {
            targetId = saved[0].id;
          }
        }

        if (targetId) {
          const loaded = historyManager.load(targetId);
          if (loaded) {
            conversation = Conversation.fromSaved(loaded);
            const resumedStats = conversation.getStats();
            console.log(`  Resumed ${targetId} (${resumedStats.turnCount} turns)\n`);
          } else {
            console.log(`  Conversation ${targetId} not found.\n`);
          }
        } else {
          console.log("  No saved conversations to resume.\n");
        }
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === "/clear") {
        conversation = new Conversation(config.model, systemPrompt.text);
        console.log("  New conversation started.\n");
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === "/stats") {
        const s = conversation.getStats();
        const sessionUsage = tokenTracker.getSessionUsage();
        console.log();
        console.log(`  Conversation:   ${s.id}`);
        console.log(`  Messages:       ${s.messageCount}`);
        console.log(`  Turns:          ${s.turnCount}`);
        console.log(`  History tokens: ~${s.estimatedTokens}`);
        console.log(`  Budget status:  ${s.budgetWarning}`);
        console.log(`  Session cost:   $${sessionUsage.estimatedCost.toFixed(4)}`);
        console.log();
        prompt();
        return;
      }

      if (trimmed.toLowerCase() === "/prompt") {
        console.log("\n--- System Prompt ---");
        console.log(systemPrompt.text);
        console.log("--- End ---\n");
        prompt();
        return;
      }

      // --- Chat ---
      try {
        const response = await chat(trimmed);
        console.log(`Claude: ${response}`);
        console.log();
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error: ${error.message}`);
          if (error.message.includes("API key")) {
            console.error("Hint: Set ANTHROPIC_API_KEY in your environment or .env file.");
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
