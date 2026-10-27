import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INSTALLER = join(ROOT, "scripts", "install.mjs");
const SLUG = "cloud-codegen";
const REVIEWER_SLUG = "code-reviewer";

function workspace() {
  return mkdtempSync(join(tmpdir(), "bob-install-codegen-"));
}

function install(target, ...flags) {
  const res = spawnSync("node", [INSTALLER, target, ...flags], { encoding: "utf8" });
  assert.equal(res.status, 0, `installer failed:\n${res.stdout}\n${res.stderr}`);
  return res.stdout;
}

const modes = (target) => parse(readFileSync(join(target, ".bob", "custom_modes.yaml"), "utf8")).customModes;
const countSlug = (target) => modes(target).filter((m) => m.slug === SLUG).length;

function modesFromSource() {
  return parse(readFileSync(join(ROOT, ".bob", "custom_modes.yaml"), "utf8")).customModes;
}

test("fresh install creates mode, rules, skills and lock file", () => {
  const t = workspace();
  try {
    install(t);
    assert.equal(countSlug(t), 1);
    assert.ok(existsSync(join(t, ".bob", `rules-${SLUG}`, "01-role.md")));
    assert.ok(existsSync(join(t, ".bob", `rules-${REVIEWER_SLUG}`, "01-role.md")));
    assert.ok(existsSync(join(t, ".bob", "skills", "event-driven-python-patterns", "SKILL.md")));
    const lock = JSON.parse(readFileSync(join(t, ".bob", `${SLUG}.lock.json`), "utf8"));
    assert.ok(lock.version);
    assert.match(lock.files[`.bob/rules-${SLUG}/01-role.md`], /^[0-9a-f]{64}$/);
    assert.match(lock.modes[SLUG], /^[0-9a-f]{64}$/);
    assert.match(lock.modes[REVIEWER_SLUG], /^[0-9a-f]{64}$/);
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("reinstall preserves locally customized rules without --force", () => {
  const t = workspace();
  try {
    install(t);
    const rule = join(t, ".bob", `rules-${SLUG}`, "01-role.md");
    writeFileSync(rule, "# my local customization\n");
    const out = install(t);
    assert.equal(readFileSync(rule, "utf8"), "# my local customization\n");
    assert.match(out, /skip\s+\.bob\/rules-cloud-codegen\/01-role\.md/);
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("--force overwrites a locally customized rule", () => {
  const t = workspace();
  try {
    install(t);
    const rule = join(t, ".bob", `rules-${SLUG}`, "01-role.md");
    writeFileSync(rule, "# my local customization\n");
    install(t, "--force");
    assert.equal(readFileSync(rule, "utf8"), readFileSync(join(ROOT, ".bob", `rules-${SLUG}`, "01-role.md"), "utf8"));
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("upgrade replaces an untouched installed file", () => {
  const t = workspace();
  try {
    install(t);
    const lockPath = join(t, ".bob", `${SLUG}.lock.json`);
    const rule = join(t, ".bob", `rules-${SLUG}`, "01-role.md");
    writeFileSync(rule, "# older release\n");
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    lock.files[`.bob/rules-${SLUG}/01-role.md`] = createHash("sha256").update(readFileSync(rule)).digest("hex");
    writeFileSync(lockPath, JSON.stringify(lock));
    install(t);
    assert.equal(readFileSync(rule, "utf8"), readFileSync(join(ROOT, ".bob", `rules-${SLUG}`, "01-role.md"), "utf8"));
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("quoted existing slug is recognised; no duplicate mode is appended", () => {
  const t = workspace();
  try {
    mkdirSync(join(t, ".bob"));
    writeFileSync(
      join(t, ".bob", "custom_modes.yaml"),
      'customModes:\n  - slug: "cloud-codegen"\n    name: My Custom Codegen\n    roleDefinition: mine\n    groups: [read]\n',
    );
    install(t);
    assert.equal(countSlug(t), 1);
    assert.equal(modes(t).find((m) => m.slug === SLUG).name, "My Custom Codegen");
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("default install ships templates only: draft status with pending approval", () => {
  const t = workspace();
  try {
    install(t);
    assert.deepEqual(readdirSync(join(t, "specs")), ["TEMPLATE"]);
    const text = readFileSync(join(t, "specs", "TEMPLATE", "spec.md"), "utf8");
    assert.match(text, /^\*\*Status:\*\*\s*draft/m);
    assert.match(text, /^\*\*Requirements approval:\*\*\s*pending/m);
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("--dry-run writes nothing", () => {
  const t = workspace();
  try {
    install(t, "--dry-run");
    assert.deepEqual(readdirSync(t), []);
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("code-reviewer mode has no edit, mcp, or mode groups; allowedSubagents is [explore]", () => {
  const reviewer = modesFromSource().find((m) => m.slug === REVIEWER_SLUG);
  assert.ok(reviewer, "code-reviewer must exist");
  const groups = reviewer.groups ?? [];
  for (const forbidden of ["edit", "mcp", "mode"]) {
    assert.equal(groups.includes(forbidden), false, `code-reviewer must not have ${forbidden}`);
  }
  assert.ok(groups.includes("read"));
  assert.ok(groups.includes("skill"));
  assert.ok(groups.includes("subagent"));
  assert.deepEqual(reviewer.allowedSubagents, ["explore"]);
});

test("cloud-codegen mode has fileRegex on edit restricting to code and spec paths", () => {
  const mode = modesFromSource().find((m) => m.slug === SLUG);
  assert.ok(mode, "cloud-codegen must exist");
  const editGroup = mode.groups.find((g) => Array.isArray(g) && g[0] === "edit");
  assert.ok(editGroup, "cloud-codegen must have restricted edit group with fileRegex");
  assert.ok(editGroup[1].fileRegex, "fileRegex must be defined");
});

test("skill versions in SKILL.md match skills-lock.json", () => {
  const lock = JSON.parse(readFileSync(join(ROOT, "skills-lock.json"), "utf8"));
  for (const [name, entry] of Object.entries(lock.skills)) {
    const text = readFileSync(join(ROOT, entry.path), "utf8");
    const fm = parse(text.split(/^---\s*$/m)[1]);
    assert.equal(fm.name, name);
    assert.equal(String(fm.version), entry.version, `${name} version drift`);
  }
});

test("rules directory stays within the size ceiling", () => {
  const rulesDir = join(ROOT, ".bob", "rules-cloud-codegen");
  const total = readdirSync(rulesDir).reduce((n, f) => n + readFileSync(join(rulesDir, f), "utf8").length, 0);
  const ceiling = 8500; // ratcheted down from 15000; see also the combined-size test below
  assert.ok(total <= ceiling, `rules are ${total} chars, ceiling is ${ceiling}`);
});

// ---------------------------------------------------------------------------
// Architect handoff, ownership, size, skills, hook, and packaging gates
// ---------------------------------------------------------------------------

const read = (...p) => readFileSync(join(ROOT, ...p), "utf8");
const codegen = () => modesFromSource().find((m) => m.slug === SLUG);

test("always-loaded rules and mode instructions stay under ratcheted ceilings", () => {
  const rulesDir = join(ROOT, ".bob", `rules-${SLUG}`);
  const rules = readdirSync(rulesDir)
    .filter((f) => f.endsWith(".md"))
    .reduce((n, f) => n + readFileSync(join(rulesDir, f), "utf8").length, 0);
  assert.ok(rules <= 8500, `rules are ${rules} chars, ceiling 8500; trim wording rather than raise it`);
  const m = codegen();
  const inst = m.customInstructions.length + m.roleDefinition.length;
  assert.ok(inst <= 3700, `cloud-codegen instructions are ${inst} chars, ceiling 3700`);
  assert.ok(read("AGENTS.md").length <= 6500, "AGENTS.md exceeds 6500 chars");
});

test("edit fileRegex allows only codegen-owned paths and blocks architect-owned paths", () => {
  const group = codegen().groups.find((g) => Array.isArray(g) && g[0] === "edit");
  const re = new RegExp(group[1].fileRegex);
  const allowed = [
    "src/handlers/process.py",
    "prompts/summary_prompt.yaml",
    "specs/001-x/code/plan.md",
    "specs/001-x/code/checkpoint.md",
    "docs/001-x/code/sdk-evidence.md",
    "docs/001-x/code/review-findings.md",
  ];
  const blocked = [
    "specs/001-x/spec.md",
    "specs/001-x/plan.md",
    "specs/001-x/tasks.md",
    "specs/001-x/checkpoint.md",
    "docs/001-x/component-matrix.md",
    "docs/001-x/security-design.md",
    "docs/001-x/evidence-register.md",
    "docs/001-x/review-findings.md",
    "specs/TEMPLATE/spec.md",
    "README.md",
  ];
  for (const p of allowed) assert.ok(re.test(p), `${p} should be editable`);
  for (const p of blocked) assert.equal(re.test(p), false, `${p} must not be editable`);
});

test("handoff rule names the architect inputs, start gate, and ownership table", () => {
  const rule = read(".bob", `rules-${SLUG}`, "04-architect-handoff.md");
  for (const needle of [
    "component-matrix.md",
    "security-design.md",
    "evidence-register.md",
    "`verified`",
    "approved by",
    "at least one task marked done",
    "by header text",
    "File ownership",
    "specs/<id>/code/",
  ]) {
    assert.ok(rule.includes(needle), `04-architect-handoff.md missing: ${needle}`);
  }
});

test("sdk grounding rule keeps the four exact evidence statuses and a lookup budget", () => {
  const rule = read(".bob", `rules-${SLUG}`, "05-sdk-grounding.md");
  for (const s of ["`verified`", "`from-skill`", "`unverified`", "`stale`", "6 documentation lookups"]) {
    assert.ok(rule.includes(s), `05-sdk-grounding.md missing: ${s}`);
  }
});

test("no mode instruction or rule writes an architect-owned path", () => {
  const texts = [
    codegen().customInstructions,
    ...readdirSync(join(ROOT, ".bob", `rules-${SLUG}`))
      .filter((f) => f.endsWith(".md") && f !== "04-architect-handoff.md")
      .map((f) => read(".bob", `rules-${SLUG}`, f)),
  ].join("\n");
  assert.equal(/docs\/<(spec-)?id>\/review-findings\.md/.test(texts), false, "findings must go under docs/<id>/code/");
  assert.equal(/Write\s+specs\/<id>\/(plan|tasks|checkpoint)\.md/i.test(texts), false);
});

test("review-findings format is defined only in the code-quality-and-review skill", () => {
  const skill = read(".bob", "skills", "code-quality-and-review", "SKILL.md");
  const roleRule = read(".bob", "rules-code-reviewer", "01-role.md");
  assert.match(skill, /### Review findings: <spec-id>/);
  assert.equal(roleRule.includes("### Review findings:"), false, "reviewer rule must not redefine the format");
  assert.equal(roleRule.includes("| Severity |"), false, "reviewer rule must not redefine the table");
  assert.match(skill, /docs\/<spec-id>\/code\/review-findings\.md/);
});

test("every skill has front matter, resolving anchors, and a grounding section", () => {
  const lock = JSON.parse(read("skills-lock.json"));
  const slug = (h) => h.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s/g, "-");
  for (const [name, entry] of Object.entries(lock.skills)) {
    const text = read(entry.path);
    const fm = parse(text.split(/^---\s*$/m)[1]);
    for (const k of ["name", "version", "description", "when_to_use"]) assert.ok(fm[k], `${name} missing ${k}`);
    const anchors = new Set([...text.matchAll(/^#{1,4}\s+(.+)$/gm)].map((m) => slug(m[1].trim())));
    for (const [, a] of text.matchAll(/\]\(#([^)]+)\)/g)) {
      assert.ok(anchors.has(a), `${name}: anchor #${a} does not resolve`);
    }
    assert.match(text, /^## Grounding sources/m, `${name} lacks Grounding sources`);
    assert.ok(text.length <= 8000, `${name} is ${text.length} chars; split by topic over 8000`);
  }
});

test("skills do not pin model checkpoints or log raw completions", () => {
  const llm = read(".bob", "skills", "llm-prompt-and-pipeline-patterns", "SKILL.md");
  assert.equal(/gpt-4o|claude-3|gemini-1\.5/.test(llm), false, "pinned model IDs found");
  assert.equal(/Raw: %s/.test(llm), false, "raw completion is logged");
});

test("settings.json uses valid Bob hook events and the hook script exists", () => {
  const settings = JSON.parse(read(".bob", "settings.json"));
  const valid = ["SessionStart", "UserPromptSubmit", "PreCompact", "PostCompact", "PreToolUse", "PostToolUse", "Stop"];
  for (const [event, groups] of Object.entries(settings.hooks)) {
    assert.ok(valid.includes(event), `invalid hook event ${event}`);
    for (const g of groups) {
      assert.ok(Array.isArray(g.hooks) && g.hooks.length > 0);
      for (const h of g.hooks) {
        assert.equal(h.type, "command");
        const script = h.command.replace(/^node\s+/, "");
        assert.ok(existsSync(join(ROOT, script)), `${script} missing`);
      }
    }
  }
});

test("lint hook always exits 0, stays silent for non-Python input, and reports findings", () => {
  const dir = mkdtempSync(join(tmpdir(), "bob-hook-"));
  try {
    const hook = join(ROOT, ".bob", "hooks", "lint-python.mjs");
    const run = (payload, env = process.env) =>
      spawnSync("node", [hook], { input: payload, encoding: "utf8", env });
    const md = run(JSON.stringify({ cwd: dir, tool_input: { path: "README.md" } }));
    assert.equal(md.status, 0);
    assert.equal(md.stdout, "");
    assert.equal(run("not json").status, 0);

    writeFileSync(join(dir, "bad.py"), "import os\n");
    mkdirSync(join(dir, "bin"));
    writeFileSync(join(dir, "bin", "ruff"), '#!/bin/sh\necho "F401 unused import"\nexit 1\n', { mode: 0o755 });
    const withStub = run(JSON.stringify({ cwd: dir, tool_input: { path: "bad.py" } }), {
      ...process.env,
      PATH: `${join(dir, "bin")}:${process.env.PATH}`,
    });
    assert.equal(withStub.status, 0);
    assert.match(withStub.stdout, /F401 unused import/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("templates: spec is pending, code plan/tasks/checkpoint live under TEMPLATE/code", () => {
  for (const f of ["plan.md", "tasks.md", "checkpoint.md"]) {
    assert.ok(existsSync(join(ROOT, "specs", "TEMPLATE", "code", f)), `code/${f} missing`);
    assert.equal(existsSync(join(ROOT, "specs", "TEMPLATE", f)), false, `${f} must not sit beside the architect's files`);
  }
  const spec = read("specs", "TEMPLATE", "spec.md");
  assert.match(spec, /^\*\*Requirements approval:\*\*\s*pending/m);
  assert.match(spec, /Architecture inputs/);
});

test("default install ships the code/ templates but no hooks without --with-hooks", () => {
  const t = workspace();
  try {
    install(t);
    assert.ok(existsSync(join(t, "specs", "TEMPLATE", "code", "plan.md")));
    assert.equal(existsSync(join(t, ".bob", "hooks")), false);
    assert.ok(existsSync(join(t, ".bob", "rules-cloud-codegen", "04-architect-handoff.md")));
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("--with-hooks installs the PostToolUse hook and settings", () => {
  const t = workspace();
  try {
    install(t, "--with-hooks");
    assert.ok(existsSync(join(t, ".bob", "hooks", "lint-python.mjs")));
    const s = JSON.parse(readFileSync(join(t, ".bob", "settings.json"), "utf8"));
    assert.ok(s.hooks.PostToolUse);
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("skills-lock.json is merged by key and never drops a sibling repo's entries", () => {
  const t = workspace();
  try {
    const foreign = { source: "local", version: "9.9.9", path: ".bob/skills/cloud-architecture-patterns/SKILL.md" };
    writeFileSync(join(t, "skills-lock.json"), JSON.stringify({ skills: { "cloud-architecture-patterns": foreign } }));
    install(t);
    const lock = JSON.parse(readFileSync(join(t, "skills-lock.json"), "utf8"));
    assert.deepEqual(lock.skills["cloud-architecture-patterns"], foreign);
    assert.ok(lock.skills["code-quality-and-review"]);
    assert.equal(Object.keys(lock.skills).length, 5);
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("a locally modified skill keeps its existing lock entry", () => {
  const t = workspace();
  try {
    install(t);
    const skill = join(t, ".bob", "skills", "code-quality-and-review", "SKILL.md");
    writeFileSync(skill, "# my local copy\n");
    const lockPath = join(t, "skills-lock.json");
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    lock.skills["code-quality-and-review"].version = "local-1";
    writeFileSync(lockPath, JSON.stringify(lock));
    install(t);
    const after = JSON.parse(readFileSync(lockPath, "utf8"));
    assert.equal(after.skills["code-quality-and-review"].version, "local-1");
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});

test("npm package ships required assets and never the local .bob/mcp.json", () => {
  const out = execFileSync("npm", ["pack", "--dry-run", "--json"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const files = JSON.parse(out)[0].files.map((f) => f.path);
  assert.equal(files.includes(".bob/mcp.json"), false, ".bob/mcp.json must not be packaged");
  for (const must of [
    ".bob/custom_modes.yaml",
    ".bob/rules-cloud-codegen/04-architect-handoff.md",
    ".bob/rules-code-reviewer/01-role.md",
    ".bob/hooks/lint-python.mjs",
    ".bob/settings.json",
    "skills-lock.json",
    "specs/TEMPLATE/spec.md",
    "specs/TEMPLATE/code/plan.md",
    "scripts/install.mjs",
  ]) {
    assert.ok(files.includes(must), `${must} missing from package`);
  }
});

test("package version matches the installer lock version", () => {
  const t = workspace();
  try {
    install(t);
    const lock = JSON.parse(readFileSync(join(t, ".bob", `${SLUG}.lock.json`), "utf8"));
    assert.equal(lock.version, JSON.parse(read("package.json")).version);
  } finally {
    rmSync(t, { recursive: true, force: true });
  }
});
