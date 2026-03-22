# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A collection of agent skills ("the zodiac") — cross-model prompts that break specific LLM behavioral defaults. Compatible with Claude Code, Codex, Cursor, Gemini CLI, and any tool that reads `SKILL.md`. Each animal is a standalone skill in its own directory with a single `SKILL.md` file.

## Repo Structure

```
<animal>/SKILL.md          — The skill definition (frontmatter + prompt)
zodiac-skills-workspace/   — Eval outputs and iteration artifacts (not shipped)
```

Each `SKILL.md` follows a consistent format:
- YAML frontmatter: `name`, `description` (trigger phrases and use-case summary)
- One-line role statement and the LLM default it breaks
- **Decision Policy** — operational rules: what to distrust, evidence requirements, anti-scope, calibration targets
- Phase 0: Load `VALUES.md` from the user's repo
- Named techniques (varies per animal)
- Output format with a binary success mechanic field and justified counts
- Rules section constraining behavior

## The Animals (Current)

| Animal | Role | Default Broken | Success Field | Findings |
|--------|------|----------------|---------------|----------|
| Monkey (猴) | Chaos Agent | Agreeableness/sycophancy | `Survived: yes/no` | 9 |
| Ox (牛) | First Principles | Pattern matching | `Warranted: yes/no` | 5 |
| Tiger (虎) | Solution Attacker | Premature convergence | `Burned: yes/no` | 5 |
| Snake (蛇) | Scope Killer | Scope creep | `Earned: yes/no` | 5 |
| Dog (狗) | Drift Detector | Recency bias/context drift | `Aligned: yes/no/ambiguous` | 5 |
| Rat (鼠) | Consequence Mapper | Linear thinking | `Contained: yes/no` | 5 |
| Pig (猪) | Truth-Teller | Political hedging | `Hedged: yes/no` | 5 |
| Rabbit (兔) | Orchestrator | Audience-blind verbosity | N/A (orchestrator) | N/A |
| Dragon (龙) | The Visionary | Short-term thinking | `Farsighted: yes/no` | 5 |
| Horse (马) | The Sprinter | Analysis paralysis | `Clear: yes/no` | 5 |
| Goat (羊) | The Wanderer | Convergent thinking | `Fertile: yes/no` | 5 |
| Rooster (鸡) | The Critic | Epistemic recklessness | `Verified: yes/no` | 5 |

## Key Design Principles to Preserve

1. **Decision Policy is load-bearing, persona is flavor** — operational rules (what to distrust, evidence requirements, anti-scope) drive behavior across all models. Character voice adds tone but doesn't carry the instruction.
2. **Named technique arsenals with "never repeat"** — forces variety. Without this, LLMs gravitate to 2-3 patterns.
3. **Binary success mechanic prevents confirmation bias** — `Survived: yes` is a valid exit, not a failure to find problems.
4. **Anti-scope rules in Decision Policy** — each animal has explicit boundaries ("you don't fix things", "you don't propose alternatives").
5. **Calibrated honesty** — each animal must produce at least some positive findings (e.g., Monkey aims for 2/9 `Survived: yes`).
6. **Justified output counts** — finding counts are explained ("9 findings = full technique coverage"), not ceremonial.
7. **Anti-fabrication on absence claims** (Monkey, Tiger, Rat) — before claiming a mitigation/feature/safeguard DOESN'T exist, must state where they looked. "I did not find" is honest; "there is none" is a claim requiring verification. Confidence 80+ requires citing the specific doc/code checked. Added after the darktable showcase exposed that the Monkey's three highest-confidence findings (80, 85, 90) were factually wrong because they asserted absence without checking primary docs.
8. **Rabbit never upgrades confidence** — if an animal says `Verified: no` or gives confidence 55, the Rabbit synthesis must preserve that hedge. Simplifying language is not the same as upgrading certainty. Added after A/B testing showed the Rabbit was promoting hedged animal findings into confident headline assertions.
9. **Rabbit orchestrates, not just filters** — the Rabbit controls scope (decompose document-sized targets into sections), selection (which animals), calibration (finding counts and technique focus per animal based on target density), and output (synthesis + findings summary + action items in conversation, raw outputs to file). v3.0 upgrade after testing showed single-pass analysis on dense documents covered <10% of material.
10. **Conversation output is lean, file is complete** — Rabbit outputs ~1200 words to conversation (synthesis, 2-line findings summary, action items, coverage gaps). Full raw animal outputs go to `rabbit-output/` file. Added after 4-animal runs produced ~5000+ words that buried the actionable content.

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
- **Decision Policy section is mandatory** — must include: what to distrust, evidence requirements, positive verdict targets, anti-scope constraints
- Character voice: 2-3 sentences max, behavioral directive not theatrical monologue
- Every technique must be named and distinct — no two techniques should test the same thing from the same angle
- The success mechanic field must be binary and must allow a "clean bill of health" verdict
- Output counts must be justified (why this number), not ceremonial
- No follow-up CTAs ("Want me to go deeper?") — the user asks if they want more
- Phase 0 (load `VALUES.md`) is standard across all animals
- Monkey produces 9 findings; all others produce 5
