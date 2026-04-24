/**
 * Environment Detection — Chapter 3
 *
 * CONTEXT ENGINEERING CONCEPT: Environment as Context
 *
 * The model needs to know about its operating environment to give
 * relevant advice. A macOS user needs different commands than a
 * Windows user. A project using Bun needs different setup than Node.
 *
 * Environment information is DYNAMIC context — it changes depending
 * on where and when the agent runs. This is our first example of
 * template variable injection: detecting real values at runtime
 * and inserting them into the system prompt.
 */

import * as os from "node:os";
import * as path from "node:path";
import { execSync } from "node:child_process";

export interface EnvironmentInfo {
  /** Operating system: "darwin", "linux", "win32" */
  platform: string;
  /** Human-readable OS name: "macOS", "Linux", "Windows" */
  osName: string;
  /** OS version string */
  osVersion: string;
  /** Current working directory */
  workingDirectory: string;
  /** User's default shell: "/bin/zsh", "/bin/bash", etc. */
  shell: string;
  /** Current date in ISO format */
  date: string;
  /** Home directory */
  homeDirectory: string;
  /** Username */
  username: string;
  /** Node.js version */
  nodeVersion: string;
}

/**
 * Detect the current operating environment.
 *
 * This information is injected into the system prompt so the model
 * knows what OS, shell, and directory it's operating in. Without
 * this, the model might suggest Linux commands on macOS or assume
 * a different project structure.
 */
export function detectEnvironment(): EnvironmentInfo {
  return {
    platform: process.platform,
    osName: getOSName(),
    osVersion: os.release(),
    workingDirectory: process.cwd(),
    shell: getDefaultShell(),
    date: new Date().toISOString().split("T")[0],
    homeDirectory: os.homedir(),
    username: os.userInfo().username,
    nodeVersion: process.version,
  };
}

/**
 * Format environment info for display in the CLI.
 */
export function formatEnvironmentForDisplay(env: EnvironmentInfo): string {
  return [
    `  OS:         ${env.osName} (${env.platform})`,
    `  Shell:      ${env.shell}`,
    `  Directory:  ${env.workingDirectory}`,
    `  Date:       ${env.date}`,
    `  Node:       ${env.nodeVersion}`,
  ].join("\n");
}

// -----------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------

function getOSName(): string {
  switch (process.platform) {
    case "darwin":
      return "macOS";
    case "linux":
      return "Linux";
    case "win32":
      return "Windows";
    default:
      return process.platform;
  }
}

function getDefaultShell(): string {
  // Check SHELL env var (Unix/macOS)
  if (process.env.SHELL) {
    return process.env.SHELL;
  }

  // Check COMSPEC for Windows
  if (process.env.COMSPEC) {
    return process.env.COMSPEC;
  }

  // Try to detect from OS
  try {
    if (process.platform === "win32") {
      return "cmd.exe";
    }
    const shell = execSync("echo $SHELL", { encoding: "utf-8" }).trim();
    return shell || "/bin/sh";
  } catch {
    return "/bin/sh";
  }
}
