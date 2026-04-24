# Claude Code from Scratch — Chapter 3

**System Prompts: Programming the Brain**

> Tag: `ch03-system-prompts` | Version: `0.3.0`

---

## What's New in This Chapter

Building on Chapter 2's interactive CLI, this chapter adds:

- **System prompt template** (`prompts/coding-agent.md`) — a full system prompt with identity, rules, format, and safety sections
- **Template variable injection** (`core/system-prompt.ts`) — `{{working_directory}}`, `{{os_name}}`, `{{shell}}`, `{{date}}` filled at runtime
- **Environment detection** (`core/environment.ts`) — OS, shell, platform, cwd, username
- **Multi-turn conversation** (`core/conversation.ts`) — the model now remembers previous turns!
- **Slash commands** — `/clear` (reset), `/stats` (usage), `/prompt` (view system prompt)

## Context Engineering Concepts

- **System prompt design** — the five sections: identity, environment, behavior, conventions, safety
- **Instruction hierarchy** — system > user > assistant > tool_result
- **Template variables** — dynamic system prompts that adapt to the runtime environment
- **Multi-turn conversation** — memory is just resending the full message history

## Run It

```bash
npm install
npm start
```

## Try It

```
You: What's my operating system?
Claude: You're running macOS (darwin).

You: And what directory am I in?
Claude: You're in /Users/you/claude-from-scratch.
```

The model answers environment questions because that info is in the system prompt. It remembers the first question because we now send full conversation history.

## Project Structure

```
claude-from-scratch/
├── src/
│   ├── index.ts              # Multi-turn CLI with system prompt
│   ├── config.ts             # Model, tokens, pricing config
│   ├── core/
│   │   ├── messages.ts       # Message types and builder (Ch 2)
│   │   ├── tokens.ts         # Token counting and tracking (Ch 2)
│   │   ├── environment.ts    # OS/shell/platform detection (NEW)
│   │   ├── system-prompt.ts  # Template loading and rendering (NEW)
│   │   └── conversation.ts   # Conversation history manager (NEW)
│   └── prompts/
│       └── coding-agent.md   # The system prompt template (NEW)
├── package.json              # v0.3.0
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
└── LICENSE
```
