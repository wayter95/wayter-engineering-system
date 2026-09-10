#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, copyFileSync, chmodSync, renameSync, rmSync } from "node:fs";
import { join, resolve, dirname, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HOME = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CORE = join(HOME, "core");
const TEMPLATES = join(HOME, "templates");
const VERSION = readFileSync(join(HOME, "VERSION"), "utf8").trim();

const MANAGED_FILES = ["constitution.md", "workflow.md", "coding-standards.md", "engineering-quality.md", "security.md", "testing.md", "git.md", "definition-of-done.md"];
const MANAGED_DIRS = ["roles", "skills", "bin", "hooks"];
const AGENT_TEMPLATES = ["adr.md", "pr.md"];
const SKILLS = ["adopt-project", "create-feature", "fix-bug", "refactor", "create-tests", "review-code", "resolve-conflicts", "validate", "adr"];
const ROLES_AS_AGENTS = ["architect", "developer", "tester", "reviewer"];

const [, , cmd = "help", ...rest] = process.argv;
const flags = new Set(rest.filter((a) => a.startsWith("--")));
const targetArg = rest.find((a) => !a.startsWith("--"));
const ROOT = resolve(targetArg || process.cwd());
const AGENTS = join(ROOT, ".agents");

const log = (s) => console.log(s);
const ok = (s) => log(`  ✓ ${s}`);
const info = (s) => log(`  · ${s}`);
const warn = (s) => log(`  ! ${s}`);
const die = (s, code = 1) => { console.error(`✗ ${s}`); process.exit(code); };

try {
  switch (cmd) {
    case "init": init(); break;
    case "update": update(); break;
    case "sync": sync(); break;
    case "doctor": doctor(); break;
    case "version": case "-v": case "--version": log(VERSION); break;
    case "help": case "-h": case "--help": help(); break;
    default: die(`comando desconhecido: ${cmd}\n`); 
  }
} catch (e) {
  die(e?.stack || String(e));
}

function help() {
  log([
    `wayter v${VERSION} — WAYTER Engineering System`,
    "",
    "  wayter init   [dir] [--force] [--with-devops]   instala .agents/, detecta stack, gera adaptadores",
    "  wayter update [dir]                             atualiza arquivos gerenciados (preserva project.md / project.env)",
    "  wayter sync   [dir] [--with-devops]             regenera AGENTS.md, CLAUDE.md, .claude/, .cursor/",
    "  wayter doctor [dir]                             verifica a instalação",
    "  wayter version | help",
  ].join("\n"));
}

function init() {
  log(`WAYTER init v${VERSION} → ${ROOT}`);
  if (!existsSync(ROOT)) die(`diretório não existe: ${ROOT}`);
  const fresh = !existsSync(AGENTS);
  if (!fresh && !flags.has("--force")) {
    info(".agents/ já existe; use 'wayter update' para atualizar ou 'wayter init --force' para reinstalar arquivos gerenciados.");
  }
  mkdirSync(AGENTS, { recursive: true });

  const legacy = backupLegacy();
  copyManaged();

  const detected = detectStack();
  if (!existsSync(join(AGENTS, "project.env"))) {
    writeFileSync(join(AGENTS, "project.env"), fill(readTemplate("project.env"), detected));
    ok("project.env criado (detecção automática — confirme com a skill adopt-project)");
  } else info("project.env preservado");

  if (!existsSync(join(AGENTS, "project.md"))) {
    writeFileSync(join(AGENTS, "project.md"), fill(readTemplate("project.md"), detected) + importedSection(legacy));
    ok(`project.md criado a partir do template${legacy.length ? " com o conteúdo de " + legacy.map((l) => l.name).join(", ") + " na seção 'Regras importadas'" : ""}`);
  } else info("project.md preservado");

  ensureGitignore();
  writeFileSync(join(AGENTS, "VERSION"), VERSION + "\n");
  sync(true);
  log("");
  log("Próximos passos:");
  log("  1. Revise .agents/project.env (comandos de lint/typecheck/test/build).");
  log("  2. Rode: bash .agents/bin/validate.sh --list");
  log("  3. Abra o Claude Code no projeto e rode a skill /adopt-project para preencher .agents/project.md.");
}

function update() {
  requireInstalled();
  const prev = readIf(join(AGENTS, "VERSION")) || "?";
  log(`WAYTER update ${prev.trim()} → ${VERSION} em ${ROOT}`);
  copyManaged();
  writeFileSync(join(AGENTS, "VERSION"), VERSION + "\n");
  sync(true);
}

function sync(nested = false) {
  requireInstalled();
  if (!nested) log(`WAYTER sync → ${ROOT}`);
  const env = parseEnv(readIf(join(AGENTS, "project.env")) || "");
  const projectMd = readIf(join(AGENTS, "project.md")) || "_(project.md ausente)_";
  const projectName = basename(ROOT);
  const withDevops = env.WAYTER_DEVOPS === "1" || flags.has("--with-devops") || existsSync(join(ROOT, "Dockerfile")) || existsSync(join(ROOT, ".github", "workflows"));
  writeFileSync(join(ROOT, "AGENTS.md"), fill(readTemplate("AGENTS.md"), { PROJECT_NAME: projectName, VERSION, PROJECT_MD: projectMd.replace(/^# .*\n/, "") }));
  ok("AGENTS.md gerado");
  writeFileSync(join(ROOT, "CLAUDE.md"), fill(readTemplate("CLAUDE.md"), { DEVOPS_AGENT: withDevops ? ", devops" : "" }));
  ok("CLAUDE.md gerado");
  const agentsDir = join(ROOT, ".claude", "agents");
  mkdirSync(agentsDir, { recursive: true });
  const roles = withDevops ? [...ROLES_AS_AGENTS, "devops"] : ROLES_AS_AGENTS;
  for (const r of roles) copyFileSync(join(AGENTS, "roles", `${r}.md`), join(agentsDir, `${r}.md`));
  if (!withDevops) rmIf(join(agentsDir, "devops.md"));
  ok(`.claude/agents: ${roles.join(", ")}`);
  const skillsDir = join(ROOT, ".claude", "skills");
  for (const s of SKILLS) {
    mkdirSync(join(skillsDir, s), { recursive: true });
    copyFileSync(join(AGENTS, "skills", s, "SKILL.md"), join(skillsDir, s, "SKILL.md"));
  }
  ok(`.claude/skills: ${SKILLS.length} skills`);
  registerHook(join(ROOT, ".claude", "settings.json"));
  const cursorDir = join(ROOT, ".cursor", "rules");
  mkdirSync(cursorDir, { recursive: true });
  writeFileSync(join(cursorDir, "wayter.mdc"), readTemplate("cursor-rule.mdc"));
  ok(".cursor/rules/wayter.mdc gerado");
  mkdirSync(join(ROOT, "docs", "decisions"), { recursive: true });
  const keep = join(ROOT, "docs", "decisions", "README.md");
  if (!existsSync(keep)) writeFileSync(keep, "# Decisões arquiteturais\n\nADRs numerados (`NNN-slug.md`), criados a partir de `.agents/templates/adr.md` via skill `/adr`.\n");
}

function doctor() {
  log(`WAYTER doctor v${VERSION} → ${ROOT}`);
  let problems = 0;
  const check = (cond, okMsg, badMsg) => { if (cond) ok(okMsg); else { warn(badMsg); problems++; } };

  check(existsSync(AGENTS), ".agents/ presente", ".agents/ ausente — rode wayter init");
  if (!existsSync(AGENTS)) process.exit(1);
  const installed = (readIf(join(AGENTS, "VERSION")) || "").trim();
  check(installed === VERSION, `versão ${installed} (atual)`, `versão instalada ${installed || "?"} ≠ ${VERSION} — rode wayter update`);
  for (const f of MANAGED_FILES) check(existsSync(join(AGENTS, f)), f, `${f} ausente`);
  for (const d of MANAGED_DIRS) check(existsSync(join(AGENTS, d)), `${d}/`, `${d}/ ausente`);
  check(existsSync(join(AGENTS, "project.md")), "project.md", "project.md ausente");
  check(existsSync(join(AGENTS, "project.env")), "project.env", "project.env ausente");
  check(existsSync(join(ROOT, "AGENTS.md")), "AGENTS.md", "AGENTS.md ausente — rode wayter sync");
  check(existsSync(join(ROOT, "CLAUDE.md")), "CLAUDE.md", "CLAUDE.md ausente — rode wayter sync");
  const settings = readJson(join(ROOT, ".claude", "settings.json"));
  const hooked = JSON.stringify(settings?.hooks?.PreToolUse || []).includes("guard-destructive.sh");
  check(hooked, "hook guard-destructive registrado", "hook guard-destructive não registrado — rode wayter sync");
  check(settings?.includeCoAuthoredBy === false && settings?.attribution?.commit === "", "atribuição de IA em commits desligada", "atribuição de IA em commits ativa — rode wayter sync");
  check(existsSync(join(AGENTS, "bin", "check-comments.sh")), "bin/check-comments.sh", "bin/check-comments.sh ausente — rode wayter update");
  const env = parseEnv(readIf(join(AGENTS, "project.env")) || "");
  for (const k of ["WAYTER_LINT", "WAYTER_TYPECHECK", "WAYTER_TEST"]) {
    if (!env[k]) warn(`${k} vazio em project.env — passo será pulado no validate`);
  }
  const major = Number(process.versions.node.split(".")[0]);
  check(major >= 18, `node ${process.versions.node}`, `node ${process.versions.node} < 18`);
  log("");
  log(problems ? `${problems} problema(s).` : "Tudo certo.");
  process.exit(problems ? 1 : 0);
}

function requireInstalled() {
  if (!existsSync(AGENTS)) die(`.agents/ não encontrado em ${ROOT}. Rode 'wayter init'.`);
}

function copyManaged() {
  for (const f of MANAGED_FILES) copyFileSync(join(CORE, f), join(AGENTS, f));
  for (const d of MANAGED_DIRS) {
    const dst = join(AGENTS, d);
    rmIf(dst);
    copyDir(join(CORE, d), dst);
  }
  mkdirSync(join(AGENTS, "templates"), { recursive: true });
  for (const t of AGENT_TEMPLATES) copyFileSync(join(TEMPLATES, t), join(AGENTS, "templates", t));
  for (const f of readdirSync(join(AGENTS, "bin"))) chmodSync(join(AGENTS, "bin", f), 0o755);
  for (const f of readdirSync(join(AGENTS, "hooks"))) chmodSync(join(AGENTS, "hooks", f), 0o755);
  ok(`arquivos gerenciados copiados (${MANAGED_FILES.length} docs, ${MANAGED_DIRS.join("/")}, templates)`);
}

function backupLegacy() {
  const candidates = ["CLAUDE.md", "AGENTS.md", ".cursorrules", "GEMINI.md", ".github/copilot-instructions.md"];
  const found = candidates.filter((c) => existsSync(join(ROOT, c)) && !isGenerated(join(ROOT, c)));
  if (!found.length) return [];
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(AGENTS, "backup", stamp);
  mkdirSync(dir, { recursive: true });
  const result = [];
  for (const c of found) {
    const dst = join(dir, c.replace(/\//g, "__"));
    copyFileSync(join(ROOT, c), dst);
    result.push({ name: c, content: readIf(join(ROOT, c)) || "" });
  }
  ok(`backup de ${found.join(", ")} em .agents/backup/${stamp}/`);
  return result;
}

function importedSection(legacy) {
  if (!legacy.length) return "";
  const parts = legacy.map((l) => `### Origem: ${l.name}\n\n${l.content.trim()}\n`);
  return `\n## Regras importadas (a consolidar)\n\nConteúdo dos arquivos de instrução que existiam antes do \`wayter init\`. Consolide nas seções acima com a skill \`adopt-project\` e remova esta seção.\n\n${parts.join("\n")}`;
}

function isGenerated(p) {
  const head = (readIf(p) || "").slice(0, 400);
  return head.includes("Gerado por `wayter sync`");
}

function registerHook(settingsPath) {
  mkdirSync(dirname(settingsPath), { recursive: true });
  const settings = readJson(settingsPath) || {};
  settings.hooks ||= {};
  settings.hooks.PreToolUse ||= [];
  const serialized = JSON.stringify(settings.hooks.PreToolUse);
  const already = serialized.includes("guard-destructive.sh");
  if (!already && serialized.includes("guard-destructive.mjs")) {
    settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter((h) => !JSON.stringify(h).includes("guard-destructive.mjs"));
  }
  let changed = false;
  if (!already) {
    settings.hooks.PreToolUse.push({
      matcher: "Bash",
      hooks: [{ type: "command", command: "bash .agents/hooks/guard-destructive.sh" }],
    });
    changed = true;
  }
  if (settings.includeCoAuthoredBy !== false) { settings.includeCoAuthoredBy = false; changed = true; }
  const attribution = settings.attribution || {};
  if (attribution.commit !== "" || attribution.pr !== "") { settings.attribution = { ...attribution, commit: "", pr: "" }; changed = true; }
  if (changed) {
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
    ok(".claude/settings.json: hook guard-destructive registrado, atribuição de IA em commits/PRs desligada");
  } else info(".claude/settings.json: hook e atribuição já configurados");
}

function ensureGitignore() {
  const p = join(ROOT, ".gitignore");
  const lines = [".agents/.validate/", ".agents/backup/"];
  let cur = readIf(p) || "";
  const missing = lines.filter((l) => !cur.split("\n").some((x) => x.trim() === l));
  if (!missing.length) return;
  cur = cur.replace(/\s*$/, "") + (cur ? "\n\n" : "") + "# WAYTER\n" + missing.join("\n") + "\n";
  writeFileSync(p, cur);
  ok(`.gitignore: ${missing.join(", ")}`);
}

function detectStack() {
  const d = {
    PROJECT_NAME: basename(ROOT), DESCRIPTION: "(a confirmar)", LANGUAGE: "(a confirmar)", FRAMEWORK: "(a confirmar)",
    DATABASE: "(a confirmar)", TEST_RUNNER: "(a confirmar)", PKG_MANAGER: "npm", LINT: "", TYPECHECK: "", TEST: "", BUILD: "",
    BUILD_ENABLED: "0", TEST_FILE: "", TEST_FAST: "", DEV_CMD: "",
  };
  const pkg = readJson(join(ROOT, "package.json"));
  if (pkg) {
    d.LANGUAGE = existsSync(join(ROOT, "tsconfig.json")) ? "TypeScript" : "JavaScript";
    d.DESCRIPTION = pkg.description || d.DESCRIPTION;
    const pm = existsSync(join(ROOT, "pnpm-lock.yaml")) ? "pnpm"
      : existsSync(join(ROOT, "yarn.lock")) ? "yarn"
      : existsSync(join(ROOT, "bun.lockb")) || existsSync(join(ROOT, "bun.lock")) ? "bun" : "npm";
    d.PKG_MANAGER = pm;
    const run = (s) => (pm === "npm" ? `npm run ${s}` : `${pm} ${s}`);
    const exec = (bin) => (pm === "npm" ? `npx ${bin}` : pm === "pnpm" ? `pnpm exec ${bin}` : pm === "yarn" ? `yarn ${bin}` : `bunx ${bin}`);
    const scripts = pkg.scripts || {};
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const has = (n) => n in deps;

    if (scripts.lint) d.LINT = run("lint");
    else if (has("eslint")) d.LINT = `${exec("eslint")} .`;
    else if (has("biome") || has("@biomejs/biome")) d.LINT = `${exec("biome")} check .`;

    if (scripts.typecheck) d.TYPECHECK = run("typecheck");
    else if (scripts["type-check"]) d.TYPECHECK = run("type-check");
    else if (existsSync(join(ROOT, "tsconfig.json"))) d.TYPECHECK = `${exec("tsc")} --noEmit -p tsconfig.json`;

    if (has("vitest")) {
      d.TEST_RUNNER = "vitest";
      d.TEST = `${exec("vitest")} run --maxWorkers=2 --no-file-parallelism`;
      d.TEST_FILE = `${exec("vitest")} run --maxWorkers=1 {file}`;
      d.TEST_FAST = `${exec("vitest")} related --run --maxWorkers=1 {files}`;
    } else if (has("jest")) {
      d.TEST_RUNNER = "jest";
      d.TEST = `${exec("jest")} --maxWorkers=2 --silent`;
      d.TEST_FILE = `${exec("jest")} --maxWorkers=1 {file}`;
      d.TEST_FAST = `${exec("jest")} --maxWorkers=1 --findRelatedTests {files}`;
    } else if (scripts.test) d.TEST = run("test");
    else if (has("mocha")) { d.TEST_RUNNER = "mocha"; d.TEST_FILE = `${exec("mocha")} {file}`; }
    else if (has("@playwright/test")) { d.TEST_RUNNER = "playwright"; d.TEST_FILE = `${exec("playwright")} test {file}`; }
    if (has("@playwright/test") && d.TEST_RUNNER !== "playwright") d.TEST_RUNNER += " + playwright (e2e, fora do validate)";
    if (d.TYPECHECK.includes("tsc")) d.TYPECHECK = d.TYPECHECK.replace("--noEmit", "--noEmit --incremental --tsBuildInfoFile .agents/.validate/tsbuildinfo");
    if (d.LINT.includes("eslint")) d.LINT += " --cache --cache-location .agents/.validate/eslintcache";

    if (scripts.build) { d.BUILD = run("build"); d.BUILD_ENABLED = has("next") ? "0" : "1"; }
    if (scripts.dev) d.DEV_CMD = run("dev"); else if (scripts.start) d.DEV_CMD = run("start");

    d.FRAMEWORK = has("next") ? `Next.js ${deps.next}` : has("@nestjs/core") ? `NestJS ${deps["@nestjs/core"]}` : has("express") ? "Express" : has("fastify") ? "Fastify" : has("react") ? "React" : has("vue") ? "Vue" : has("svelte") ? "Svelte" : d.FRAMEWORK;
    d.DATABASE = has("prisma") || has("@prisma/client") ? "Prisma" : has("drizzle-orm") ? "Drizzle" : has("typeorm") ? "TypeORM" : has("mongoose") ? "Mongoose" : d.DATABASE;
  } else if (existsSync(join(ROOT, "pyproject.toml")) || existsSync(join(ROOT, "requirements.txt"))) {
    d.LANGUAGE = "Python"; d.PKG_MANAGER = existsSync(join(ROOT, "uv.lock")) ? "uv" : existsSync(join(ROOT, "poetry.lock")) ? "poetry" : "pip";
    const pre = d.PKG_MANAGER === "uv" ? "uv run " : d.PKG_MANAGER === "poetry" ? "poetry run " : "";
    d.LINT = `${pre}ruff check .`; d.TYPECHECK = `${pre}mypy .`; d.TEST = `${pre}pytest -q -x`; d.TEST_FILE = `${pre}pytest -q {file}`; d.TEST_FAST = `${pre}pytest -q -x {files}`; d.TEST_RUNNER = "pytest";
  } else if (existsSync(join(ROOT, "go.mod"))) {
    d.LANGUAGE = "Go"; d.PKG_MANAGER = "go"; d.LINT = "go vet ./..."; d.TEST = "go test -p 2 ./..."; d.TEST_FILE = "go test {file}"; d.BUILD = "go build ./..."; d.BUILD_ENABLED = "1"; d.TEST_RUNNER = "go test";
  } else if (existsSync(join(ROOT, "Cargo.toml"))) {
    d.LANGUAGE = "Rust"; d.PKG_MANAGER = "cargo"; d.LINT = "cargo clippy -j 2 -- -D warnings"; d.TYPECHECK = "cargo check -j 2"; d.TEST = "cargo test -j 2"; d.BUILD = "cargo build"; d.BUILD_ENABLED = "1"; d.TEST_RUNNER = "cargo test";
  } else if (existsSync(join(ROOT, "composer.json"))) {
    d.LANGUAGE = "PHP"; d.PKG_MANAGER = "composer"; d.TEST = "vendor/bin/phpunit"; d.TEST_FILE = "vendor/bin/phpunit {file}"; d.TEST_RUNNER = "phpunit";
  }
  return d;
}

function readTemplate(name) { return readFileSync(join(TEMPLATES, name), "utf8"); }
function fill(tpl, vars) { return tpl.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => (k in vars ? String(vars[k]) : "")); }
function readIf(p) { try { return readFileSync(p, "utf8"); } catch { return null; } }
function readJson(p) { const s = readIf(p); if (s == null) return null; try { return JSON.parse(s); } catch { return null; } }
function rmIf(p) { if (existsSync(p)) rmSync(p, { recursive: true, force: true }); }
function copyDir(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const e of readdirSync(src)) {
    const s = join(src, e), t = join(dst, e);
    if (statSync(s).isDirectory()) copyDir(s, t); else copyFileSync(s, t);
  }
}
function parseEnv(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}
