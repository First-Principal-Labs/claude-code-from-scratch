# Claude Code from Scratch — Chapter 4

**Conversation Management: The Art of Multi-Turn Context**

> Tag: `ch04-conversation-management` | Version: `0.4.0`

---

## What's New in This Chapter

Building on Chapter 3's multi-turn CLI, this chapter adds:

- **Conversation persistence** (`core/history.ts`) — save/load conversations as JSON files to disk
- **Resume conversations** — `--resume` flag or `/resume` command to pick up where you left off
- **Conversation IDs** — each conversation gets a unique ID for tracking
- **Auto-save on exit** — conversations are automatically saved when you quit
- **Budget warnings** — caution at 60% window utilization, critical at 80%
- **History browser** — `/history` lists saved conversations, `/resume [id]` loads one

## Context Engineering Concepts

- **The stateless illusion** — LLMs have zero memory; continuity comes from resending the full history
- **Message array = state** — the conversation's messages array IS the complete state
- **Context pressure** — history grows ~500-2000 tokens per turn while the window stays fixed
- **Persistence** — saving the message array to disk bridges the gap between sessions
- **Long conversation strategies** — sliding window, summarization, selective retention (theory; implemented in Ch 10)

## Run It

```bash
npm install
npm start              # Start a new conversation
npm start -- --resume  # Resume the most recent conversation
```

## Commands

| Command | Action |
|---------|--------|
| `/save` | Save the current conversation to disk |
| `/history` | List all saved conversations |
| `/resume [id]` | Resume a saved conversation (most recent if no ID) |
| `/clear` | Start a fresh conversation |
| `/stats` | Show conversation statistics and budget status |
| `/prompt` | Display the system prompt |
| `quit` | Auto-save and exit |

## Project Structure

```
claude-from-scratch/
├── src/
│   ├── index.ts              # CLI with persistence and budget warnings
│   ├── config.ts             # Model, tokens, pricing config
│   ├── core/
│   │   ├── messages.ts       # Message types and builder (Ch 2)
│   │   ├── tokens.ts         # Token counting and tracking (Ch 2)
│   │   ├── environment.ts    # OS/shell/platform detection (Ch 3)
│   │   ├── system-prompt.ts  # Template loading and rendering (Ch 3)
│   │   ├── conversation.ts   # Conversation manager with persistence (ENHANCED)
│   │   └── history.ts        # Conversation storage on disk (NEW)
│   ├── prompts/
│   │   └── coding-agent.md   # System prompt template (Ch 3)
│   └── data/
│       └── conversations/    # Saved conversation JSON files (NEW)
├── package.json              # v0.4.0
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```
