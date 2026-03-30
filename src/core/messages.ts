/**
 * Message Types and Builder — Chapter 2
 *
 * CONTEXT ENGINEERING CONCEPT: The Messages API Format
 *
 * Every interaction with Claude uses the Messages API, which structures
 * context as an array of message objects. Each message has a `role` that
 * determines how the model interprets it:
 *
 *   - "user"      → human input (questions, instructions, feedback)
 *   - "assistant"  → model output (responses, tool calls)
 *
 * The `system` parameter is separate — it lives outside the messages array
 * and receives special treatment (highest priority in instruction hierarchy).
 *
 * Tool interactions introduce additional structures:
 *   - tool_use content blocks  → model requests a tool call
 *   - tool_result content blocks → system returns tool output
 *
 * Understanding this format is essential because the messages array IS
 * the context. What you put in it — and how you structure it — determines
 * everything the model knows and can do.
 */

import Anthropic from "@anthropic-ai/sdk";

// -----------------------------------------------------------------------
// Type aliases for clarity
//
// The Anthropic SDK provides these types. We re-export them with
// descriptive names so our codebase is self-documenting.
// -----------------------------------------------------------------------

/** A single message in the conversation (user or assistant turn). */
export type Message = Anthropic.MessageParam;

/** Content within a message: text, images, tool_use, or tool_result. */
export type ContentBlock = Anthropic.ContentBlockParam;

/** A text content block — the simplest form of content. */
export type TextBlock = Anthropic.TextBlockParam;

/** The role of a message: "user" or "assistant". */
export type Role = "user" | "assistant";

// -----------------------------------------------------------------------
// Message Builder
//
// A fluent API for constructing messages. This keeps message creation
// clean and consistent throughout the codebase.
//
// Usage:
//   const msg = MessageBuilder.user("Hello, Claude!");
//   const msg = MessageBuilder.assistant("I can help with that.");
// -----------------------------------------------------------------------

export const MessageBuilder = {
  /**
   * Create a user message with text content.
   *
   * User messages represent human input. In the context hierarchy,
   * they sit below system instructions but above tool results.
   */
  user(text: string): Message {
    return {
      role: "user",
      content: text,
    };
  },

  /**
   * Create an assistant message with text content.
   *
   * Assistant messages represent the model's previous responses.
   * Including them in the messages array gives the model "memory"
   * of what it said before — even though it's actually stateless.
   */
  assistant(text: string): Message {
    return {
      role: "assistant",
      content: text,
    };
  },

  /**
   * Create a user message with structured content blocks.
   *
   * The Messages API supports rich content: text, images, and
   * tool results can all appear in a single message. This method
   * accepts an array of content blocks for advanced use cases.
   */
  userWithBlocks(blocks: ContentBlock[]): Message {
    return {
      role: "user",
      content: blocks,
    };
  },

  /**
   * Create an assistant message with structured content blocks.
   *
   * When the model uses tools, its response contains both text
   * blocks and tool_use blocks. To include such a response in
   * the conversation history, we need this structured form.
   */
  assistantWithBlocks(blocks: ContentBlock[]): Message {
    return {
      role: "assistant",
      content: blocks,
    };
  },
};

// -----------------------------------------------------------------------
// Message Utilities
// -----------------------------------------------------------------------

/**
 * Extract all text content from a message, concatenated.
 *
 * Messages can contain multiple content blocks. This utility
 * extracts and joins all text blocks into a single string,
 * which is useful for display and logging.
 */
export function getMessageText(message: Message): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  return message.content
    .filter((block): block is TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

/**
 * Count the number of content blocks in a message by type.
 *
 * Useful for understanding the composition of a message:
 * how many text blocks, how many tool_use blocks, etc.
 */
export function countBlocksByType(
  message: Message
): Record<string, number> {
  if (typeof message.content === "string") {
    return { text: 1 };
  }

  const counts: Record<string, number> = {};
  for (const block of message.content) {
    counts[block.type] = (counts[block.type] || 0) + 1;
  }
  return counts;
}

/**
 * Format a message for display in the CLI.
 *
 * Shows the role and a preview of the content, useful for
 * debugging and for our interactive CLI.
 */
export function formatMessageForDisplay(
  message: Message,
  maxLength: number = 100
): string {
  const text = getMessageText(message);
  const truncated =
    text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  const roleLabel = message.role === "user" ? "You" : "Claude";
  return `${roleLabel}: ${truncated}`;
}
