# zodiac-skills

A behavioral compiler for LLMs. Twelve `SKILL.md` files — each one rewires how a model thinks about a specific class of problem. No fine-tuning, no RAG, no vector database. Just constraints that make LLMs do what they won't do by default: disagree with themselves, admit uncertainty, check before claiming absence, and produce findings that survive contact with reality.

Works with Claude Code, Codex, Cursor, Gemini CLI, and any tool that reads `SKILL.md`.

```bash
npx zodiac-skills
```

## Proof

We ran the zodiac on real targets and verified every finding against published expert analysis. Not cherry-picked examples — full verification, including what we got wrong.

### EU AI Act — Full Regulation (573KB, 113 articles)

8 animals. 2 Rabbit-orchestrated passes. 40 findings.

| Metric | Result |
|--------|--------|
| Findings contradicted by published sources | **0 / 40** |
| Findings confirmed by legal scholarship | **17 / 40** |
| Findings ahead of published discourse | **2** (in-context learning gap, RAG blind spot) |
| Rat's prediction of notified body shortage | Confirmed 6 months later by [industry bodies](https://www.raps.org/news-and-articles/news-articles/2025/10/euro-roundup-notified-bodies-highlight-issue-that) |
| Dog's product-safety → fundamental-rights drift finding | Independently published in [Common Market Law Review](https://kluwerlawonline.com/journalarticle/Common+Market+Law+Review/62.1/COLA2025004) |
| Rat's emotion recognition scope-creep finding | Confirmed AND exceeded — [Commission guidelines](https://legalblogs.wolterskluwer.com/global-workplace-law-and-policy/the-prohibition-of-ai-emotion-recognition-technologies-in-the-workplace-under-the-ai-act/) widened the exception further than the analysis predicted |

[Full showcase](showcase/eu-ai-act-full-regulation.md) — includes verification methodology and per-finding source mapping.

### Zodiac vs. Vanilla — Controlled A/B Test

Same model (Claude Opus 4.6). Same input (Trump AI Legislative Framework, 2 days old — neither run could rely on memorized analysis). Same request: rigorous critical analysis.

| | Vanilla | Zodiac |
|---|---|---|
| Unique findings | 5 (that zodiac missed) | 10 (that vanilla missed) |
| Falsifiable claims | Low — qualitative judgments | Higher — Delete Probe, Precision Probe, Inversion Attack |
| Confidence calibration | None — uniform implicit confidence | Explicit scores per finding |
| Hedging | Moderate — "has some merit," "arguably" | Binary verdicts — Burned or Survived, no middle ground |
| Positive findings | Afterthought | Mandatory — forced genuine search for what works |
| Cross-referencing | None — sections are independent | Cross-animal tensions surfaced |

The vanilla analysis was a good essay. The zodiac was a diagnostic instrument.

[Full comparison](showcase/zodiac-vs-vanilla-comparison.md) — includes finding-by-finding breakdown and honest accounting of where vanilla outperformed zodiac.

### More Showcases

| Target | Animals | Key result |
|--------|---------|------------|
| [EU AI Act Article 5](showcase/eu-ai-act-article5.md) | Rooster, Monkey, Tiger, Pig, Dragon | Every finding verified against Commission guidelines, FPF, Verfassungsblog, law firm analyses |
| [Trump AI Framework](showcase/trump-ai-framework.md) | Rooster, Monkey, Tiger, Pig, Dragon | Delete Probe: "remove 4 of 6 prongs — nothing changes." Confirmed by CSIS, Sullivan & Cromwell |
| [Tesla Q4 2025 Earnings](showcase/tesla-q4-2025-earnings.md) | Rooster, Rat, Pig | Earnings call analysis — claims verified against SEC filings |
| [Apple Q1 2026 Earnings](showcase/apple-q1-2026-earnings.md) | Rooster, Rat, Pig | Revenue claims fact-checked, Rat traced margin consequence chains |
| [Artisan Pitch Deck](showcase/artisan-pitch-deck.md) | Rooster, Monkey, Pig | Seed deck stress-tested — unit economics and moat claims audited |
| [darktable Architecture](showcase/darktable-architecture.md) | Rooster, Monkey, Tiger | Open-source codebase architecture review — anti-fabrication rule caught 3 false absence claims |
| [Spine Swarm YC Launch](showcase/spine-swarm-yc-launch.md) | Monkey, Tiger, Rooster, Snake | YC S23 launch analyzed — technical claims vs. demo reality |
| [Anthropic Agent Skills Blog](showcase/anthropic-agent-skills-blog.md) | Rooster, Rat, Pig | Blog post claims audited against actual SDK capabilities |

## The Animals

Each animal is a single `SKILL.md` file that breaks one specific LLM default. No dependencies. No supporting files. One file, one behavioral change.

| Animal | Breaks | What it does |
|--------|--------|-------------|
| [猴 Monkey](monkey/) | Agreeableness | Stress-tests assumptions from 9 angles. `Survived: yes/no` |
| [牛 Ox](ox/) | Pattern matching | Questions whether the chosen pattern is warranted. `Warranted: yes/no` |
| [虎 Tiger](tiger/) | Premature convergence | Attacks the solution from multiple angles to find fatal flaws. `Burned: yes/no` |
| [蛇 Snake](snake/) | Scope creep | Cuts everything that hasn't earned its place. `Earned: yes/no` |
| [鼠 Rat](rat/) | Linear thinking | Maps second and third-order consequences. `Contained: yes/no` |
| [狗 Dog](dog/) | Context drift | Detects when a project has wandered from original intent. `Aligned: yes/no` |
| [猪 Pig](pig/) | Political hedging | Says what everyone's thinking but nobody will say. `Hedged: yes/no` |
| [兔 Rabbit](rabbit/) | Audience-blind output | Orchestrates other animals, shapes output for the reader. |
| [龙 Dragon](dragon/) | Short-term thinking | Analyzes decisions for reversibility, lock-in, and compounding. `Farsighted: yes/no` |
| [马 Horse](horse/) | Analysis paralysis | Cuts through overthinking to identify what's actually blocking. `Clear: yes/no` |
| [羊 Goat](goat/) | Convergent thinking | Explores alternatives nobody considered. `Fertile: yes/no` |
| [鸡 Rooster](rooster/) | Epistemic recklessness | Fact-checks claims and audits evidence. `Verified: yes/no` |

The binary success mechanic (`Survived: yes` is a valid exit) prevents confirmation bias — the animals don't manufacture findings when there's nothing to find.

## How It Works

**Decision Policy is load-bearing, persona is flavor.** Each SKILL.md has operational rules — what to distrust, what evidence to require, when the anti-scope kicks in ("you don't fix things," "you don't propose alternatives"). These rules drive behavior across any model. The character voice (enthusiastic Monkey, methodical Ox, silent Snake) adds tone but doesn't carry the instruction.

**Named technique arsenals with "never repeat."** Without named techniques, LLMs gravitate to 2-3 analytical patterns. Each animal has a named arsenal (Assumption Flip, Hostile Input, Delete Probe, Scale Shift...) that forces variety. The Monkey uses 9 distinct techniques; every other animal uses 5.

**Anti-fabrication on absence claims.** Before an animal claims something doesn't exist, it must state where it looked. "I did not find X in Y" is honest. "There is no X" is a claim requiring verification. This rule was added after the Monkey's three highest-confidence findings on darktable were factually wrong — they asserted absence without checking primary docs.

**The Rabbit orchestrates.** It picks which animals to run, calibrates finding counts to target density (fewer high-quality findings on thin targets), decomposes document-sized targets into sections, and synthesizes cross-animal output into a shaped deliverable. Raw outputs go to file; conversation stays lean.

## Install

```bash
npx zodiac-skills
```

Interactive prompts for tool and scope:

```
  Which tool?
    1) Claude Code
    2) Codex
    3) Both

  Where should skills be installed?
    1) User      (available everywhere)
    2) Project   (current directory only)
```

Or skip prompts:

```bash
npx zodiac-skills --claude --user              # Claude Code, user-level
npx zodiac-skills --codex --project            # Codex, project-level
npx zodiac-skills --claude --codex --user      # Both tools, user-level
npx zodiac-skills install monkey tiger snake   # Specific animals
npx zodiac-skills list                         # Check what's installed
npx zodiac-skills uninstall --all              # Remove all
```

## Usage

Invoke by name:

```
/monkey — chaos check this architecture
/tiger — attack this migration plan
/snake — cut this PRD to MVP
/rat — map consequences of this API change
/rooster — verify these performance claims
/rabbit — review this proposal (picks animals, shapes output)
```

The Rabbit is the front door for multi-animal analysis. Give it a target, it picks the right animals, runs them, and delivers a synthesized result shaped for your audience:

```
/rabbit — review this 50-page architecture doc
```

Rabbit decomposes the target into sections, selects animals per-section, calibrates finding counts to density, and outputs ~1200 words to conversation with full raw outputs saved to `rabbit-output/`.

## License

MIT
