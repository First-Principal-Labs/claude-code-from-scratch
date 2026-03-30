# Claude from Scratch

**Build an AI Coding Agent from Scratch — Learning Context Engineering Step by Step**

This is the companion repository for the book *Context Engineering: Build an AI Coding Agent from Scratch* by Pritam Kudale, Dr. Raj Dandekar, Dr. Rajat Dandekar, and Dr. Sreedath Panat.

Every chapter teaches a **context engineering** concept and immediately implements it in code. By the end, you'll have built a fully functional AI coding agent — and mastered the discipline behind every effective AI application.

---

## What is Context Engineering?

> **Context engineering** is the art and science of designing, assembling, and managing every piece of information that flows into and around a large language model — encompassing system prompts, tools, memory, retrieval, conversation history, compression, and orchestration.

The prompt is one small part. Context engineering is the whole system.

---

## Current Progress

| Chapter | Title | Tag | Status |
|---------|-------|-----|--------|
| **1** | The Context Engineering Manifesto | `ch01-manifesto` | **Current** |
| 2 | The Anatomy of Context: Messages, Tokens, and Windows | `ch02-anatomy-of-context` | Upcoming |
| 3 | System Prompts: Programming the Brain | `ch03-system-prompts` | Upcoming |
| 4 | Conversation Management | `ch04-conversation-management` | Upcoming |
| 5 | Tool Use: Teaching LLMs to Act | `ch05-tool-use` | Upcoming |
| 6 | The Agent Loop | `ch06-agent-loop` | Upcoming |
| 7 | File Operations: Read, Write, Edit | `ch07-file-operations` | Upcoming |
| 8 | Shell Integration: The Bash Tool | `ch08-shell-integration` | Upcoming |
| 9 | Search and Retrieval Tools | `ch09-search-retrieval` | Upcoming |
| 10 | Context Window Management | `ch10-context-management` | Upcoming |
| 11 | Memory Systems | `ch11-memory-systems` | Upcoming |
| 12 | Dynamic Context Assembly | `ch12-dynamic-context` | Upcoming |
| 13 | Prompt Caching and Optimization | `ch13-caching-optimization` | Upcoming |
| 14 | Sub-Agents and Orchestration | `ch14-sub-agents` | Upcoming |
| 15 | Planning and Reasoning | `ch15-planning-reasoning` | Upcoming |
| 16 | Permissions and Safety | `ch16-permissions-safety` | Upcoming |
| 17 | Streaming and User Experience | `ch17-streaming-ux` | Upcoming |
| 18 | Hooks and Extensibility | `ch18-hooks-extensibility` | Upcoming |
| 19 | Git Integration | `ch19-git-integration` | Upcoming |
| 20 | MCP: The Model Context Protocol | `ch20-mcp` | Upcoming |
| 21 | Putting It All Together | `ch21-complete` | Upcoming |

---

## Quick Start

### Prerequisites

- **Node.js 18+** — [Download](https://nodejs.org)
- **An Anthropic API key** — [Get one here](https://console.anthropic.com)
- **Git** — for following along with chapter tags

### Setup

```bash
# Clone the repository
git clone https://github.com/First-Principal-Labs/claude-code-from-scratch.git
cd claude-code-from-scratch

# Install dependencies
npm install

# Set your API key
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Run the current chapter
npm start
```

### Following a Specific Chapter

Each chapter has a Git tag. To jump to any chapter:

```bash
# See all available tags
git tag

# Checkout a specific chapter
git checkout ch01-manifesto

# Install dependencies for that chapter
npm install

# Run it
npm start
```

---

## Chapter 1: The Context Engineering Manifesto

**Concepts covered:**
- What is context engineering? (Definition, scope, why it matters)
- Context vs. Prompt — the critical distinction
- The Context Engineering Stack (system prompts, tools, memory, retrieval, orchestration)
- LLMs are stateless functions — context is everything
- The five principles: explicit, finite, positional, fresh, quality > quantity

**What we build:**
- Project setup (TypeScript, Anthropic SDK)
- First API call to the Claude Messages API
- Token usage reporting

**Run it:**

```bash
npm start
```

**Expected output:**

```
============================================================
  Claude from Scratch — Chapter 1
  The Context Engineering Manifesto
============================================================

Making our first API call...

Response:
------------------------------------------------------------
Context engineering is the practice of designing and managing the
complete information environment that surrounds a large language model,
going beyond simple prompt writing to encompass system prompts, tool
definitions, memory systems, and retrieval pipelines. It recognizes
that LLMs are stateless functions whose output quality is determined
entirely by the context they receive, making the systematic assembly
of that context the most important skill in AI application development.
------------------------------------------------------------

Token Usage:
  Input tokens:  25
  Output tokens: 78
  Total tokens:  103

Response Metadata:
  Model:         claude-sonnet-4-20250514
  Stop reason:   end_turn
  Response ID:   msg_...

============================================================
  Chapter 1 complete. Next: Ch 2 — Tokens & Windows
============================================================
```

---

## Project Structure

```
claude-from-scratch/
├── src/
│   ├── index.ts       # Entry point — first API call
│   └── config.ts      # Configuration (model, max_tokens, pricing)
├── package.json
├── tsconfig.json
├── .env.example       # API key placeholder
├── .gitignore
└── README.md          # This file
```

---

## The Five-Stage Roadmap

| Stage | Chapters | You'll Build | Milestone |
|-------|----------|-------------|-----------|
| **1. Foundations** | 1-4 | Context basics, system prompts, conversations | Interactive CLI chatbot |
| **2. Tools & Agency** | 5-9 | Tool use, agent loop, file ops, search | Functioning coding agent |
| **3. Context Intelligence** | 10-13 | Compression, memory, assembly, caching | Smart agent with memory |
| **4. Advanced Patterns** | 14-17 | Sub-agents, planning, permissions, streaming | Professional agent |
| **5. Production** | 18-21 | Hooks, git, MCP, full integration | Complete v1.0.0 |

---

## Companion Resources

| Resource | Description |
|----------|-------------|
| **Book** | *Context Engineering: Build an AI Coding Agent from Scratch* |
| **YouTube** | "Context Engineering" video series |
| **Notes** | Concept explainers in `/notes/` |
| **Illustrations** | Architecture diagrams in `/illustrations/` |

---

## Authors

- **Pritam Kudale** — Creator of "Build Claude Code from Scratch" YouTube series, Founder of First Principle Labs
- **Dr. Raj Dandekar** — AI/ML researcher, co-author of *Build a DeepSeek Model (From Scratch)*
- **Dr. Rajat Dandekar** — AI researcher, co-author of *Build a DeepSeek Model (From Scratch)*
- **Dr. Sreedath Panat** — AI systems researcher, co-author of *Build a DeepSeek Model (From Scratch)*

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- Report issues on [GitHub Issues](https://github.com/First-Principal-Labs/claude-code-from-scratch/issues)
- Join the discussion on [GitHub Discussions](https://github.com/First-Principal-Labs/claude-code-from-scratch/discussions)
