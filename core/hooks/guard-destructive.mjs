#!/usr/bin/env node
/**
 * WAYTER Engineering System — guard-destructive.mjs
 *
 * Hook PreToolUse (Claude Code) que bloqueia comandos destrutivos ou externos
 * que exigem pedido explícito do usuário (ver .agents/constitution.md e .agents/git.md).
 *
 * Entrada: JSON no stdin  { tool_name, tool_input: { command }, cwd, ... }
 * Saída:   exit 0 → permite; exit 2 + mensagem no stderr → bloqueia (a mensagem volta ao agente).
 *
 * Configuração por projeto em .agents/project.env:
 *   WAYTER_ALLOW_PUSH=1     libera `git push` (sem --force)
 *   WAYTER_ALLOW_BRANCH=1   libera `git checkout -b` / `git switch -c` / `git branch <nome>`
 *   WAYTER_GUARD_EXTRA=<regex>;<regex>   padrões adicionais a bloquear (ERE JavaScript)
 *   WAYTER_GUARD_DISABLE=1  desliga o hook (decisão do usuário, não do agente)
 *
 * Registro em .claude/settings.json (feito por `wayter sync`):
 *   { "hooks": { "PreToolUse": [ { "matcher": "Bash",
 *       "hooks": [ { "type": "command", "command": "node .agents/hooks/guard-destructive.mjs" } ] } ] } }
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const input = await readStdin();
let payload = {};
try {
  payload = JSON.parse(input || "{}");
} catch {
  process.exit(0); // entrada inesperada: não bloquear por bug do hook
}

if (payload.tool_name !== "Bash") process.exit(0);
const command = String(payload.tool_input?.command ?? "");
if (!command.trim()) process.exit(0);

const cwd = payload.cwd || process.cwd();
const env = loadProjectEnv(cwd);

if (env.WAYTER_GUARD_DISABLE === "1") process.exit(0);

const allowPush = env.WAYTER_ALLOW_PUSH === "1";
const allowBranch = env.WAYTER_ALLOW_BRANCH === "1";

/** @type {{ re: RegExp, why: string, unless?: () => boolean }[]} */
const rules = [
  // ---- git: reescrita de histórico / perda de trabalho local ----
  { re: /\bgit\s+push\b[^|;&]*\s(--force(-with-lease)?|-f)\b/, why: "git push --force reescreve histórico remoto" },
  { re: /\bgit\s+push\b[^|;&]*\s(--delete|-d)\b/, why: "git push --delete remove branch remota" },
  { re: /\bgit\s+push\b/, why: "git push exige pedido do usuário e WAYTER_ALLOW_PUSH=1 em .agents/project.env", unless: () => allowPush },
  { re: /\bgit\s+reset\s+[^|;&]*--hard\b/, why: "git reset --hard descarta alterações locais" },
  { re: /\bgit\s+checkout\s+(--\s+)?\.(\s|$)/, why: "git checkout -- . descarta alterações locais" },
  { re: /\bgit\s+checkout\s+--\s+\S/, why: "git checkout -- <arquivo> descarta alterações locais" },
  { re: /\bgit\s+restore\b(?![^|;&]*--staged)[^|;&]*(\s\.(\s|$)|\s--source|\s--worktree)/, why: "git restore descarta alterações locais" },
  { re: /\bgit\s+clean\b[^|;&]*\s-[a-zA-Z]*[fdxX]/, why: "git clean remove arquivos não rastreados" },
  { re: /\bgit\s+branch\s+(-D|--delete\s+--force|-d|--delete)\b/, why: "git branch -D/-d apaga branch" },
  { re: /\bgit\s+stash\s+(drop|clear)\b/, why: "git stash drop/clear perde trabalho guardado" },
  { re: /\bgit\s+rebase\b/, why: "git rebase reescreve histórico; peça ao usuário" },
  { re: /\bgit\s+commit\b[^|;&]*--amend/, why: "git commit --amend reescreve o último commit" },
  { re: /\bgit\s+(checkout|switch)\s+-[bcB]\b/, why: "criar branch exige pedido do usuário e WAYTER_ALLOW_BRANCH=1", unless: () => allowBranch },
  { re: /\bgit\s+branch\s+(?!-)(?!--)[\w./-]+(\s|$)/, why: "criar branch exige pedido do usuário e WAYTER_ALLOW_BRANCH=1", unless: () => allowBranch },
  { re: /\bgit\s+tag\s+-d\b/, why: "git tag -d apaga tag" },
  { re: /\bgit\s+filter-(branch|repo)\b/, why: "reescrita total de histórico" },

  // ---- banco de dados ----
  { re: /\bprisma\s+db\s+push\b/, why: "prisma db push altera schema sem migration versionada" },
  { re: /\bprisma\s+migrate\s+(reset|deploy)\b/, why: "prisma migrate reset/deploy toca dados reais; pedido explícito necessário" },
  { re: /\b(drizzle-kit|drizzle)\s+push\b/, why: "drizzle push altera schema sem migration versionada" },
  { re: /\b(typeorm|mikro-orm)\b[^|;&]*\bschema:(drop|sync)\b/, why: "sincronização/drop de schema sem migration" },
  { re: /\b(DROP\s+(TABLE|DATABASE|SCHEMA|INDEX)|TRUNCATE\s+TABLE|TRUNCATE\s+\w+|DELETE\s+FROM\s+\w+\s*;?\s*$)\b/i, why: "SQL destrutivo" },
  { re: /\b(dropdb|dropuser)\b/, why: "remoção de banco/usuário Postgres" },
  { re: /\bredis-cli\b[^|;&]*\b(FLUSHALL|FLUSHDB)\b/i, why: "flush do Redis apaga dados" },
  { re: /\bmongo(sh)?\b[^|;&]*\.(drop|dropDatabase|deleteMany)\(/, why: "operação destrutiva no MongoDB" },

  // ---- sistema de arquivos ----
  { re: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\b[^|;&]*\s(\/|~|\$HOME|\.|\.\.|\*|\/[a-z]+)(\s|$)/, why: "rm -rf em caminho amplo" },
  { re: /\brm\s+-[a-zA-Z]*r[a-zA-Z]*\s+[^|;&]*(\.git|node_modules\/\.\.|src|prisma|migrations)(\/|\s|$)/, why: "rm -r em diretório crítico do projeto" },
  { re: /\bsudo\s+rm\b/, why: "rm com sudo" },
  { re: /\b(mkfs|dd\s+if=|shred|chmod\s+-R\s+777|chown\s+-R\s+\S+\s+\/)\b/, why: "operação de sistema destrutiva" },
  { re: />\s*\/dev\/sd[a-z]/, why: "escrita direta em dispositivo" },

  // ---- infra / deploy / publicação ----
  { re: /\bterraform\s+(apply|destroy)\b/, why: "terraform apply/destroy altera infra" },
  { re: /\bpulumi\s+(up|destroy)\b/, why: "pulumi up/destroy altera infra" },
  { re: /\bkubectl\s+(delete|drain|cordon|apply|rollout\s+restart|scale)\b/, why: "kubectl que altera cluster" },
  { re: /\bhelm\s+(uninstall|delete|upgrade|install|rollback)\b/, why: "helm que altera cluster" },
  { re: /\bdocker\s+(system\s+prune|volume\s+(rm|prune)|rm\s+-f|rmi)\b/, why: "docker que remove dados/imagens" },
  { re: /\bdocker[\s-]compose\s+down\b[^|;&]*(-v|--volumes)/, why: "docker compose down -v apaga volumes" },
  { re: /\b(vercel|netlify)\b[^|;&]*\s(--prod|deploy)\b/, why: "deploy em produção" },
  { re: /\b(fly|flyctl)\s+deploy\b/, why: "deploy em produção" },
  { re: /\b(heroku\s+(pg:reset|apps:destroy)|railway\s+(down|delete))\b/, why: "operação destrutiva em PaaS" },
  { re: /\b(aws|gcloud|az)\s+[^|;&]*\b(delete|rm|terminate|destroy|remove)\b/, why: "cloud CLI destrutivo" },
  { re: /\baws\s+s3\s+(rm|rb|sync\s+[^|;&]*--delete)\b/, why: "remoção em S3" },
  { re: /\b(npm|pnpm|yarn)\s+publish\b/, why: "publicação de pacote" },
  { re: /\bnpm\s+(deprecate|unpublish)\b/, why: "npm unpublish/deprecate" },
  { re: /\bgh\s+(pr\s+merge|release\s+(create|delete)|repo\s+delete|api\s+[^|;&]*-X\s*(DELETE|PUT|PATCH))\b/, why: "gh que altera estado remoto" },
  { re: /\bgh\s+pr\s+create\b/, why: "abrir PR é ação externa; peça ao usuário" },
  { re: /\bcurl\b[^|;&]*\s-X\s*(DELETE|PUT|PATCH|POST)\b[^|;&]*https?:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/, why: "requisição mutante a serviço externo" },

  // ---- segredos / configuração global ----
  { re: /\bgit\s+config\s+--global\b/, why: "alteração de git config global" },
  { re: /(\bcat\b|\becho\b|\bprintf\b)[^|;&]*\s>\s*\.env(\.\w+)?(\s|$)/, why: "sobrescrever .env" },
  { re: /\bnpm\s+(login|adduser|token)\b/, why: "credenciais npm" },
];

// Padrões extras do projeto
if (env.WAYTER_GUARD_EXTRA) {
  for (const raw of env.WAYTER_GUARD_EXTRA.split(";")) {
    const pat = raw.trim();
    if (!pat) continue;
    try {
      rules.push({ re: new RegExp(pat), why: `padrão bloqueado por .agents/project.env (WAYTER_GUARD_EXTRA): ${pat}` });
    } catch {
      /* regex inválida: ignora e segue */
    }
  }
}

const normalized = command.replace(/\\\n/g, " ").replace(/\s+/g, " ");

for (const rule of rules) {
  if (rule.unless && rule.unless()) continue;
  if (rule.re.test(normalized)) {
    const msg = [
      `⛔ WAYTER guard: comando bloqueado.`,
      `Motivo: ${rule.why}.`,
      `Comando: ${command.length > 300 ? command.slice(0, 300) + "…" : command}`,
      ``,
      `Esta ação é DESTRUTIVA ou EXTERNA (.agents/constitution.md → Autonomia e limites).`,
      `Não tente contornar o bloqueio. Explique ao usuário o que quer executar e por quê, e execute apenas com pedido explícito dele.`,
      `Se o usuário já pediu, ele pode rodar o comando diretamente ou ajustar .agents/project.env (WAYTER_ALLOW_PUSH / WAYTER_ALLOW_BRANCH / WAYTER_GUARD_DISABLE).`,
    ].join("\n");
    process.stderr.write(msg + "\n");
    process.exit(2);
  }
}

process.exit(0);

// ---------------------------------------------------------------------------

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
    setTimeout(() => resolve(data), 2000).unref();
  });
}

function loadProjectEnv(startDir) {
  const out = { ...process.env };
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, ".agents", "project.env");
    if (existsSync(candidate)) {
      try {
        for (const line of readFileSync(candidate, "utf8").split("\n")) {
          const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
          if (!m) continue;
          let v = m[2];
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
          if (!(m[1] in process.env)) out[m[1]] = v;
        }
      } catch {
        /* ignora */
      }
      break;
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return out;
}
