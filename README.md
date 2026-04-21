# Claude Code from Scratch — Chapter 2

**The Anatomy of Context: Messages, Tokens, and Windows**

> Tag: `ch02-anatomy-of-context` | Version: `0.2.0`

---

## What's New in This Chapter

Building on Chapter 1's first API call, this chapter adds:

- **Message builder** (`core/messages.ts`) — structured message creation with type safety
- **Token counter** (`core/tokens.ts`) — estimation, tracking, budget calculation, and cost reporting
- **Interactive CLI** — readline-based input loop with per-turn token display
- **Session tracking** — cumulative token usage and cost estimation across multiple exchanges

## Context Engineering Concepts

- **Messages API format** — the four roles (system, user, assistant, tool) and how they structure context
- **Tokens** — the atomic unit of context; how text becomes tokens; why counts matter
- **Context windows** — the hard limit on how much context a model can process (200K for Claude)
- **Token budgets** — allocating finite window space across system prompt, tools, history, and output
- **The "lost in the middle" problem** — why position within the context window affects attention

## Run It

```bash
npm install
npm start
```

## Expected Output

```
============================================================
  Claude Code from Scratch — Chapter 2
  The Anatomy of Context
============================================================

  Model:          claude-sonnet-4-20250514
  Context window: 200.0K tokens
  Max output:     1.0K tokens
  Input budget:   199.0K tokens

  Type a message to chat. Type 'quit' to exit.
  Each message is independent (no conversation memory yet).
------------------------------------------------------------

You: What are tokens in the context of LLMs?

  Tokens: 28 in → 95 out (123 total)
  Estimate was: ~15 tokens (actual: 28)
  Window: 28 / 200.0K (0.0% used)

Claude: Tokens are the basic units that LLMs process...

You: quit

------------------------------------------------------------
Session Token Usage:
  API calls:      1
  Input tokens:   28
  Output tokens:  95
  Total tokens:   123
  Est. cost:      $0.0015
------------------------------------------------------------

  Chapter 2 complete. Next: Ch 3 — System Prompts
```

## Key Limitation

Each message is **independent** — the model has no memory of previous turns. If you ask a follow-up question, it won't know what you talked about before. Chapter 4 will fix this by maintaining conversation history.

## Project Structure

```
claude-from-scratch/
├── src/
│   ├── index.ts              # Interactive CLI with token display
│   ├── config.ts             # Model, tokens, pricing config
│   └── core/
│       ├── messages.ts       # Message types and builder (NEW)
│       └── tokens.ts         # Token counting and tracking (NEW)
├── package.json              # v0.2.0
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```
