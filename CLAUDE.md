# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A collection of Claude Code skills ("the zodiac") — persona-driven prompts that break specific LLM behavioral defaults. Each animal is a standalone skill in its own directory with a single `SKILL.md` file.

## Repo Structure

```
<animal>/SKILL.md          — The skill definition (frontmatter + prompt)
zodiac-skills-workspace/   — Eval outputs and iteration artifacts (not shipped)
```

Each `SKILL.md` follows a consistent format:
- YAML frontmatter: `name`, `description` (trigger phrases and use-case summary)
- Character identity and the LLM default it breaks
- Phase 0: Load `VALUES.md` from the user's repo
- Arsenal of named techniques (varies per animal)
- Output format with a binary success mechanic field
- Rules section constraining behavior

## The Animals (Current)

| Animal | Role | Default Broken | Success Field | Findings |
|--------|------|----------------|---------------|----------|
| Monkey (猴) | Chaos Agent | Agreeableness/sycophancy | `Survived: yes/no` | 7 |
| Ox (牛) | First Principles | Pattern matching | `Warranted: yes/no` | 5 |
| Tiger (虎) | Solution Attacker | Premature convergence | `Burned: yes/no` | 5 |
| Snake (蛇) | Scope Killer | Scope creep | `Earned: yes/no` | 5 |
| Dog (狗) | Drift Detector | Recency bias/context drift | `Aligned: yes/no/ambiguous` | 5 |
| Rat (鼠) | Consequence Mapper | Linear thinking | `Contained: yes/no` | 5 |
| Pig (猪) | Truth-Teller | Political hedging | `Hedged: yes/no` | 5 |
| Rabbit (兔) | The Filter | Audience-blind verbosity | N/A (orchestrator) | N/A |
| Dragon (龙) | The Visionary | Short-term thinking | `Farsighted: yes/no` | 5 |
| Horse (马) | The Sprinter | Analysis paralysis | `Clear: yes/no` | 5 |
| Goat (羊) | The Wanderer | Convergent thinking | `Fertile: yes/no` | 5 |
| Rooster (鸡) | The Critic | Epistemic recklessness | `Verified: yes/no` | 5 |

## Key Design Principles to Preserve

1. **Character wants what the instruction asks for** — the persona's motivation aligns with the analytical task. The Monkey doesn't "try" to find flaws; she *wants* chaos.
2. **Named technique arsenals with "never repeat"** — forces variety. Without this, LLMs gravitate to 2-3 patterns.
3. **Binary success mechanic prevents confirmation bias** — `Survived: yes` is a valid exit, not a failure to find problems.
4. **Anti-scope rules** — each animal has explicit boundaries ("you don't fix things", "you don't propose alternatives").
5. **Calibrated honesty** — each animal must produce at least some positive findings (e.g., Monkey aims for 2/7 `Survived: yes`).

## Installing

```bash
npx zodiac-skills                              # Install all 12 (interactive)
npx zodiac-skills install monkey tiger snake   # Install specific animals
npx zodiac-skills list                         # Show install status for all targets
npx zodiac-skills uninstall --all              # Remove all

# Tool flags:
npx zodiac-skills --claude                     # Claude Code only
npx zodiac-skills --codex                      # Codex only
npx zodiac-skills --claude --codex             # Both

# Scope flags:
npx zodiac-skills --user                       # User-level (available everywhere)
npx zodiac-skills --project                    # Project-level (current dir only)
```

**User-level** installs to `~/.claude/skills/` or `~/.agents/skills/`. **Project-level** installs to `.claude/skills/` or `.agents/skills/` in the current directory. Use `/<animal>` to invoke.

**Evals:** `zodiac-skills-workspace/evals.json` contains test prompts for each skill. Trigger eval queries live in `zodiac-skills-workspace/trigger-evals/`. Iteration outputs live in `zodiac-skills-workspace/iteration-N/`.

## When Creating or Modifying a Skill

- Keep the single-file `SKILL.md` convention — one file per animal, no supporting files
- The `description` field in frontmatter must include trigger phrases (these drive skill invocation)
- Every technique must be named and distinct — no two techniques should test the same thing from the same angle
- The success mechanic field must be binary and must allow a "clean bill of health" verdict
- Anti-scope constraints are mandatory — each animal must state what it does NOT do
- Phase 0 (load `VALUES.md`) is standard across all animals
- Monkey produces 7 findings; all others produce 5
