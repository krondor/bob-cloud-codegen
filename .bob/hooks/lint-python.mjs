#!/usr/bin/env node
// lint-python.mjs — cloud-codegen PostToolUse hook.
// After a file-writing tool succeeds, runs ruff and mypy on the written .py file and reports findings
// back to the agent as context. Non-Python files and missing tools are skipped silently.
//
// Bob passes the event as JSON on stdin (fields: tool_name, tool_input.path, cwd).
// PostToolUse cannot block; exit 0 always, and stdout is appended beside the tool result.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";

let event;
try {
  let raw = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) raw += chunk;
  event = JSON.parse(raw);
} catch {
  process.exit(0); // malformed input: do nothing
}

const path = String(event?.tool_input?.path ?? "");
if (!path.endsWith(".py")) process.exit(0);

const cwd = event?.cwd ?? process.cwd();
const file = isAbsolute(path) ? path : join(cwd, path);
if (!existsSync(file)) process.exit(0);

const findings = [];

function run(label, cmd, args) {
  const res = spawnSync(cmd, args, { cwd, encoding: "utf8" });
  if (res.error) return; // tool not installed: skip silently
  if (res.status !== 0) {
    const out = `${res.stdout ?? ""}${res.stderr ?? ""}`.trim();
    if (out) findings.push(`${label}:\n${out}`);
  }
}

run("ruff", "ruff", ["check", "--quiet", file]);

const hasMypyConfig = ["pyproject.toml", "mypy.ini", ".mypy.ini", "setup.cfg"].some((f) =>
  existsSync(join(cwd, f)),
);
if (hasMypyConfig) run("mypy", "mypy", ["--strict", "--no-error-summary", file]);

if (findings.length > 0) {
  process.stdout.write(`Lint/type findings for ${path}; fix before continuing:\n\n${findings.join("\n\n")}\n`);
}
process.exit(0);
