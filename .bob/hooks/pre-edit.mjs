#!/usr/bin/env node
// pre-edit.mjs — cloud-codegen pre-edit hook
// Runs ruff (lint) and mypy (type check) on any Python file being edited.
// Only fires when the file being edited is a .py file.
//
// Bob hook event: tool:edit (fires before file writes)
// Bob passes the event as JSON on stdin.
//
// Exit codes: 0 = allow edit; non-zero = block edit and surface error to agent.

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

let event;
try {
  const raw = [];
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw.push(chunk);
  event = JSON.parse(raw.join(""));
} catch {
  process.exit(0); // malformed input — don't block
}

const path = event?.tool_input?.path ?? "";
if (!path.endsWith(".py")) process.exit(0); // not a Python file

const errors = [];

// ruff lint
try {
  execSync(`ruff check --quiet "${path}"`, { stdio: "pipe" });
} catch (e) {
  errors.push(`ruff: ${e.stderr?.toString().trim() ?? e.message}`);
}

// mypy — only if mypy is available
if (existsSync("pyproject.toml") || existsSync("mypy.ini") || existsSync(".mypy.ini")) {
  try {
    execSync(`mypy --strict --no-error-summary "${path}"`, { stdio: "pipe" });
  } catch (e) {
    errors.push(`mypy: ${e.stdout?.toString().trim() ?? e.message}`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n\n"));
  process.exit(1); // block the edit; agent will see the errors and fix them
}

process.exit(0);
