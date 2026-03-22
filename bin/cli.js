#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");

const TARGETS = {
  claude: {
    label: "Claude Code",
    dir: path.join(os.homedir(), ".claude", "skills"),
    invoke: "/<animal>",
  },
  codex: {
    label: "Codex",
    dir: path.join(os.homedir(), ".agents", "skills"),
    invoke: "/<animal>",
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

function resolveTargetsFromArgs(args) {
  const targets = [];
  if (args.includes("--claude")) targets.push("claude");
  if (args.includes("--codex")) targets.push("codex");
  return targets;
}

function filterArgs(args) {
  return args.filter(
    (a) => a !== "--claude" && a !== "--codex" && a !== "--both"
  );
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

async function askTarget() {
  console.log(`
  Where would you like to install?

    1) Claude Code   (~/.claude/skills/)
    2) Codex         (~/.agents/skills/)
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

function usage() {
  console.log(`
  zodiac-skills — 12 persona-driven skills for Claude Code & Codex

  Usage:
    npx zodiac-skills                       Install all 12 (interactive)
    npx zodiac-skills install <animal...>   Install specific animals
    npx zodiac-skills uninstall <animal...> Remove specific animals
    npx zodiac-skills uninstall --all       Remove all
    npx zodiac-skills list                  Show all animals and install status

  Target flags (skip interactive prompt):
    --claude                                Install to Claude Code only
    --codex                                 Install to Codex only
    (use both flags for both targets)

  Animals:
    ${ANIMALS.join(", ")}

  Examples:
    npx zodiac-skills
    npx zodiac-skills install monkey tiger snake
    npx zodiac-skills --codex
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
      let targets = resolveTargetsFromArgs(args);
      if (targets.length === 0) targets = await askTarget();

      for (const key of targets) {
        const t = TARGETS[key];
        console.log(
          `\n  Installing ${animals.length} zodiac skill(s) to ${t.label}...\n`
        );
        const count = install(animals, t.dir);
        console.log(
          `\n  Done. ${count} skill(s) installed to ${t.dir}\n  Use ${t.invoke} to invoke.\n`
        );
      }
      break;
    }

    case "uninstall":
    case "remove": {
      const filtered = filterArgs(args);
      const animals = resolveAnimals(filtered);
      let targets = resolveTargetsFromArgs(args);
      if (targets.length === 0) targets = Object.keys(TARGETS);

      for (const key of targets) {
        const t = TARGETS[key];
        console.log(
          `\n  Removing from ${t.label} (${t.dir})...\n`
        );
        const count = uninstall(animals, t.dir);
        console.log(`\n  ${count} skill(s) removed.\n`);
      }
      break;
    }

    case "list":
    case "ls": {
      for (const key of Object.keys(TARGETS)) {
        const t = TARGETS[key];
        list(t.dir, t.label);
      }
      break;
    }

    default: {
      let targets = resolveTargetsFromArgs(
        command ? [command, ...args] : args
      );
      if (targets.length === 0) targets = await askTarget();

      for (const key of targets) {
        const t = TARGETS[key];
        console.log(
          `\n  Installing all 12 zodiac skills to ${t.label}...\n`
        );
        const count = install(ANIMALS, t.dir);
        console.log(
          `\n  Done. ${count} skill(s) installed to ${t.dir}\n  Use ${t.invoke} to invoke.\n`
        );
      }
      break;
    }
  }
}

main();
