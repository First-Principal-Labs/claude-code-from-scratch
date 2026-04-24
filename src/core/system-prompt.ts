/**
 * System Prompt Builder — Chapter 3
 *
 * CONTEXT ENGINEERING CONCEPT: System Prompt Design
 *
 * The system prompt is the FOUNDATION of the context engineering stack.
 * It establishes the model's identity, capabilities, behavioral rules,
 * output format, and safety constraints. It receives the HIGHEST
 * priority in the instruction hierarchy:
 *
 *   System Prompt > User Messages > Assistant Messages > Tool Results
 *
 * CONCEPT: Dynamic System Prompts (Template Variables)
 *
 * A production system prompt is not static text — it's a TEMPLATE
 * with variables that are filled at runtime. Our template injects:
 *   - Working directory
 *   - OS and shell information
 *   - Current date
 *
 * This makes the system prompt a piece of DYNAMIC CONTEXT that
 * adapts to the environment where the agent is running.
 *
 * In later chapters, we will inject even more:
 *   - Tool descriptions (Ch 5)
 *   - Memory contents (Ch 11)
 *   - Git status (Ch 19)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { detectEnvironment, type EnvironmentInfo } from "./environment.js";
import { estimateTokens } from "./tokens.js";

// -----------------------------------------------------------------------
// System Prompt Template
//
// The template uses {{variable}} syntax for dynamic injection.
// Each section serves a specific purpose in shaping the model's behavior.
//
// This is stored in src/prompts/coding-agent.md for readability.
// We load and render it at startup.
// -----------------------------------------------------------------------

/** Default system prompt template if the file can't be loaded. */
const DEFAULT_TEMPLATE = `You are an interactive AI coding assistant powered by Claude.

You help users with software engineering tasks including writing code, debugging, explaining concepts, and navigating codebases.

# Environment
- Working directory: {{working_directory}}
- Operating system: {{os_name}} ({{platform}})
- Shell: {{shell}}
- Date: {{date}}

# Behavior
- Be concise and direct. Lead with the answer, not the reasoning.
- When referencing files, use paths relative to the working directory.
- When writing code, match the style and conventions of the existing codebase.
- If you are unsure about something, say so rather than guessing.

# Output Format
- Use markdown formatting for code blocks, lists, and emphasis.
- Keep responses short unless the user asks for detail.`;

/**
 * Load the system prompt template from the prompts directory.
 * Falls back to the default template if the file doesn't exist.
 */
function loadTemplate(): string {
  try {
    const templatePath = path.join(
      import.meta.dirname ?? process.cwd(),
      "..",
      "prompts",
      "coding-agent.md"
    );
    return fs.readFileSync(templatePath, "utf-8");
  } catch {
    return DEFAULT_TEMPLATE;
  }
}

// -----------------------------------------------------------------------
// Template Variable Rendering
//
// CONTEXT ENGINEERING CONCEPT: Template Variables
//
// Template variables are placeholders in the system prompt that are
// replaced with real values at runtime. This turns a static document
// into dynamic context that adapts to the current environment.
//
// Pattern: {{variable_name}} → replaced with actual value
// -----------------------------------------------------------------------

/** The variables available for template injection. */
export interface TemplateVariables {
  working_directory: string;
  os_name: string;
  platform: string;
  shell: string;
  date: string;
  home_directory: string;
  username: string;
}

/**
 * Build template variables from the detected environment.
 */
function buildVariables(env: EnvironmentInfo): TemplateVariables {
  return {
    working_directory: env.workingDirectory,
    os_name: env.osName,
    platform: env.platform,
    shell: env.shell,
    date: env.date,
    home_directory: env.homeDirectory,
    username: env.username,
  };
}

/**
 * Render a template string by replacing {{variable}} placeholders.
 */
function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  return rendered;
}

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

export interface SystemPromptResult {
  /** The fully rendered system prompt text. */
  text: string;
  /** Estimated token count. */
  estimatedTokens: number;
  /** The template variables that were injected. */
  variables: TemplateVariables;
}

/**
 * Build the complete system prompt for the current environment.
 *
 * This is the main entry point. It:
 * 1. Detects the current environment (OS, shell, cwd, date)
 * 2. Loads the system prompt template from disk (or uses default)
 * 3. Renders the template with environment variables
 * 4. Returns the rendered prompt with token estimate
 *
 * In later chapters, this function will also:
 * - Inject CLAUDE.md contents (Ch 11)
 * - Add tool usage guidelines (Ch 5)
 * - Include memory file contents (Ch 11)
 * - Add permission mode instructions (Ch 16)
 */
export function buildSystemPrompt(): SystemPromptResult {
  const env = detectEnvironment();
  const variables = buildVariables(env);
  const template = loadTemplate();
  const text = renderTemplate(template, variables);

  return {
    text,
    estimatedTokens: estimateTokens(text),
    variables,
  };
}

/**
 * Get just the rendered system prompt text.
 * Convenience function for use in API calls.
 */
export function getSystemPrompt(): string {
  return buildSystemPrompt().text;
}
