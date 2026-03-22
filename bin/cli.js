#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

const TOOLS = {
  claude: {
    label: "Claude Code",
    userDir: path.join(os.homedir(), ".claude", "skills"),
    projectDir: path.join(process.cwd(), ".claude", "skills"),
  },
  codex: {
    label: "Codex",
    userDir: path.join(os.homedir(), ".agents", "skills"),
    projectDir: path.join(process.cwd(), ".agents", "skills"),
  },
};

const ANIMALS = [
  "monkey",
  "ox",
  "tiger",
  "snake",
  "dog",
  "rat",
  "pig",
  "rabbit",
  "dragon",
  "horse",
  "goat",
  "rooster",
];

const DESCRIPTIONS = {
  monkey: "Chaos Agent — pokes assumptions until something flinches",
  ox: "First Principles — questions whether patterns are warranted",
  tiger: "Solution Attacker — steel-mans then tries to kill decisions",
  snake: "Scope Killer — cuts what doesn't earn its place",
  dog: "Drift Detector — catches unconscious direction changes",
  rat: "Consequence Mapper — traces 2nd and 3rd order effects",
  pig: "Truth-Teller — says the uncomfortable thing plainly",
  rabbit: "The Filter — orchestrates animals and shapes output for the reader",
  dragon: "The Visionary — analyzes reversibility, optionality, and decay",
  horse: "The Sprinter — breaks analysis paralysis",
  goat: "The Wanderer — explores genuinely novel approaches",
  rooster: "The Critic — audits claims for evidence",
};

function getPackageRoot() {
  return path.resolve(__dirname, "..");
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function install(animals, skillsDir) {
  fs.mkdirSync(skillsDir, { recursive: true });
  const root = getPackageRoot();
  let installed = 0;

  for (const animal of animals) {
    const src = path.join(root, animal);
    const skillFile = path.join(src, "SKILL.md");

    if (!fs.existsSync(skillFile)) {
      console.error(`  skip: ${animal} (no SKILL.md found)`);
      continue;
    }

    const dest = path.join(skillsDir, animal);
    copyDir(src, dest);
    console.log(`  installed: ${animal} → ${dest}`);
    installed++;
  }

  return installed;
}

function uninstall(animals, skillsDir) {
  let removed = 0;

  for (const animal of animals) {
    const dest = path.join(skillsDir, animal);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true });
      console.log(`  removed: ${animal}`);
      removed++;
    } else {
      console.log(`  skip: ${animal} (not installed)`);
    }
  }

  return removed;
}

function list(skillsDir, label) {
  const installed = new Set();
  if (fs.existsSync(skillsDir)) {
    for (const d of fs.readdirSync(skillsDir)) {
      if (fs.existsSync(path.join(skillsDir, d, "SKILL.md"))) {
        installed.add(d);
      }
    }
  }

  console.log(`\n  Zodiac Skills (${label})\n`);
  for (const animal of ANIMALS) {
    const status = installed.has(animal) ? "●" : "○";
    console.log(`  ${status} ${animal.padEnd(10)} ${DESCRIPTIONS[animal]}`);
  }
  console.log(
    `\n  ${installed.size} of ${ANIMALS.length} installed → ${skillsDir}\n`
  );
}

function resolveAnimals(args, defaultAll = false) {
  if (args.includes("--all") || args.includes("all")) {
    return ANIMALS;
  }
  const animals = args.filter(
    (a) => !a.startsWith("-") && ANIMALS.includes(a)
  );
  if (animals.length === 0) {
    if (defaultAll) return ANIMALS;
    console.error(
      `  error: specify animal names or --all\n  animals: ${ANIMALS.join(", ")}`
    );
    process.exit(1);
  }
  return animals;
}

const FLAG_ARGS = ["--claude", "--codex", "--project", "--user"];

function resolveToolsFromArgs(args) {
  const tools = [];
  if (args.includes("--claude")) tools.push("claude");
  if (args.includes("--codex")) tools.push("codex");
  return tools;
}

function resolveScopeFromArgs(args) {
  if (args.includes("--project")) return "project";
  if (args.includes("--user")) return "user";
  return null;
}

function filterArgs(args) {
  return args.filter((a) => !FLAG_ARGS.includes(a) && a !== "--both");
}

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function askTool() {
  console.log(`
  Which tool?

    1) Claude Code
    2) Codex
    3) Both
`);
  const answer = await prompt("  Choose [1/2/3] (default: 1): ");
  switch (answer) {
    case "2":
      return ["codex"];
    case "3":
      return ["claude", "codex"];
    default:
      return ["claude"];
  }
}

async function askScope(toolLabel) {
  const cwd = process.cwd();
  console.log(`
  Where should ${toolLabel} skills be installed?

    1) Project   (${cwd} only)
    2) User      (available everywhere)
`);
  const answer = await prompt("  Choose [1/2] (default: 1): ");
  return answer === "2" ? "user" : "project";
}

function getSkillsDir(toolKey, scope) {
  const tool = TOOLS[toolKey];
  return scope === "project" ? tool.projectDir : tool.userDir;
}

function dirLabel(skillsDir) {
  const home = os.homedir();
  if (skillsDir.startsWith(home)) {
    return "~" + skillsDir.slice(home.length);
  }
  return skillsDir;
}

function usage() {
  console.log(`
  zodiac-skills — 12 persona-driven skills for Claude Code & Codex

  Usage:
    npx zodiac-skills                       Install all 12 (interactive)
    npx zodiac-skills install <animal...>   Install specific animals
    npx zodiac-skills uninstall <animal...> Remove specific animals
    npx zodiac-skills uninstall --all       Remove all
    npx zodiac-skills list                  Show all animals and install status

  Tool flags (skip tool prompt):
    --claude                                Claude Code
    --codex                                 Codex
    (use both flags for both)

  Scope flags (skip scope prompt):
    --user                                  Install to home dir (available everywhere)
    --project                               Install to current project only

  Animals:
    ${ANIMALS.join(", ")}

  Examples:
    npx zodiac-skills
    npx zodiac-skills --claude --project
    npx zodiac-skills --codex --user
    npx zodiac-skills install --claude --codex monkey tiger
    npx zodiac-skills list
`);
}

async function main() {
  const [, , command, ...args] = process.argv;

  switch (command) {
    case "help":
    case "--help":
    case "-h":
      usage();
      break;

    case "install": {
      const filtered = filterArgs(args);
      const animals = resolveAnimals(filtered, true);
      let tools = resolveToolsFromArgs(args);
      if (tools.length === 0) tools = await askTool();
      let scope = resolveScopeFromArgs(args);

      for (const key of tools) {
        const t = TOOLS[key];
        const s = scope || (await askScope(t.label));
        const skillsDir = getSkillsDir(key, s);
        console.log(
          `\n  Installing ${animals.length} zodiac skill(s) to ${t.label} (${s})...\n`
        );
        const count = install(animals, skillsDir);
        console.log(
          `\n  Done. ${count} skill(s) installed to ${dirLabel(skillsDir)}\n  Use /<animal> to invoke.\n`
        );
      }
      break;
    }

    case "uninstall":
    case "remove": {
      const filtered = filterArgs(args);
      const animals = resolveAnimals(filtered);
      let tools = resolveToolsFromArgs(args);
      if (tools.length === 0) tools = Object.keys(TOOLS);

      for (const key of tools) {
        const t = TOOLS[key];
        // Try both locations
        for (const scope of ["user", "project"]) {
          const skillsDir = getSkillsDir(key, scope);
          if (fs.existsSync(skillsDir)) {
            console.log(
              `\n  Removing from ${t.label} ${scope} (${dirLabel(skillsDir)})...\n`
            );
            const count = uninstall(animals, skillsDir);
            console.log(`\n  ${count} skill(s) removed.\n`);
          }
        }
      }
      break;
    }

    case "list":
    case "ls": {
      for (const key of Object.keys(TOOLS)) {
        const t = TOOLS[key];
        for (const scope of ["user", "project"]) {
          const skillsDir = getSkillsDir(key, scope);
          if (fs.existsSync(skillsDir)) {
            list(skillsDir, `${t.label} — ${scope}`);
          }
        }
      }
      break;
    }

    default: {
      let tools = resolveToolsFromArgs(command ? [command, ...args] : args);
      if (tools.length === 0) tools = await askTool();
      let scope = resolveScopeFromArgs(command ? [command, ...args] : args);

      for (const key of tools) {
        const t = TOOLS[key];
        const s = scope || (await askScope(t.label));
        const skillsDir = getSkillsDir(key, s);
        console.log(
          `\n  Installing all 12 zodiac skills to ${t.label} (${s})...\n`
        );
        const count = install(ANIMALS, skillsDir);
        console.log(
          `\n  Done. ${count} skill(s) installed to ${dirLabel(skillsDir)}\n  Use /<animal> to invoke.\n`
        );
      }
      break;
    }
  }
}

main();
