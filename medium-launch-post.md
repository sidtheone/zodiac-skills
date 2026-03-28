# I Built a Chaos Monkey for LLM Output. It Caught Itself Lying on the First Real Test.

*How a single Markdown file turned Claude into something that actually pushes back — and what happened when its own output proved it needed guardrails.*

---

I kept asking Claude to review my work. Architecture decisions, PRDs, project plans, pitch decks. The feedback was always the same flavor: positive, thorough, useless. "Well-structured approach with clear separation of concerns." Every time.

Nothing ever flinched. Nothing ever broke. And I started wondering whether that meant my work was actually good, or whether Claude was just being polite.

It was being polite.

## The problem with agreeable AI

LLMs have a default behavior that the research community calls sycophancy. The model gravitates toward confirming whatever you present. Your architecture looks solid. Your plan is comprehensive. Your approach is reasonable. Even when it finds issues, they come wrapped in so much diplomatic padding that the signal gets buried.

This isn't a bug in the model. It's an optimization target baked into how these systems get trained. Helpful, harmless, honest — but when "helpful" means "don't make the user feel bad about their decisions," you end up with a reviewer that functions more like a mirror than a stress test.

I wanted something that would poke. Hard. And honestly.

## What I built

`/monkey` is a skill for Claude Code. It's one Markdown file — a `SKILL.md` that you install and invoke with a slash command. No dependencies, no framework, no build step. You type `/monkey` and Claude becomes a chaos agent.

It runs 9 named techniques against whatever target you give it:

1. **Assumption Flip** — find the strongest assumption and reverse it
2. **Hostile Input** — invent the input nobody imagined
3. **Existence Question** — challenge whether this specific piece should exist at all
4. **Scale Shift** — what happens at 10x? At zero?
5. **Time Travel** — what happens in 6 months when the next dev reads this?
6. **Cross-Seam Probe** — where two modules meet, what differs?
7. **Requirement Inversion** — what if the user wants the exact opposite?
8. **Delete Probe** — delete this entirely. If nothing breaks, it shouldn't exist.
9. **Replay Probe** — run it twice. Watch what corrupts.

Each technique fires once per run, on a different target. No repeats. The skill forces variety because without it, LLMs gravitate to their 2-3 favorite analytical patterns and ignore everything else.

And critically: at least 2 of 9 findings must be `Survived: yes`. If the Monkey hits something hard and it holds, that's real information. A chaos agent that only finds problems is useless — you need to know what's actually robust.

## Then it lied

First serious test. I pointed the Monkey at darktable — an open-source photo editor with roughly 500,000 lines of C code. It produced 9 findings. The three with the highest confidence scores (80, 85, 90) all made the same kind of claim: "this safety mechanism doesn't exist," "no recovery path found," "there's no mitigation."

All three were factually wrong.

The safety features existed. The recovery paths were documented. The mitigations were in place. The Monkey never checked the actual documentation. It asserted absence — with high confidence — because that's what language models do when they don't have information. They don't say "I didn't look." They say "it doesn't exist."

This is the most dangerous failure mode for an AI reviewer. Not the wrong answer — the confident wrong answer about something that isn't there. Because absence claims *sound* authoritative. "There's no error handling for this edge case" sounds like someone who checked. Usually, nobody checks whether the checker checked.

## The fix

I added a structural rule to the skill: **before claiming that a mitigation, safeguard, or feature doesn't exist, you must state where you looked.**

"I did not find X in the docs I reviewed" — honest.
"There is no X" — a claim requiring verification.

And I tied it to the confidence scoring system:

- **80-100:** You traced the full chain AND checked primary docs. You can cite what you checked.
- **50-79:** You examined immediate evidence but haven't verified whether mitigations exist elsewhere.
- **Below 50:** Inference or gut feeling. Flag it as such.

If you can't name the specific doc page or code path you verified, you cannot score above 79. Period.

This isn't a suggestion. It's a constraint built into the skill's decision policy — the operational rules that drive behavior regardless of which model runs the skill.

## After the fix

I re-ran the Monkey on darktable. Different results entirely:

- XMP auto-sync silently overwrites external edits every 10 seconds, and conflict detection is off by default. *That's a real finding.*
- OpenCL GPU acceleration is deprecated on macOS, unreliable on AMD, and the CPU fallback is 10x slower — without telling the user. *Real finding.*
- The dual storage system (SQLite + XMP sidecars) doesn't carry the same data. Custom sort sequences aren't in XMP at all. The project itself documents this as "potentially destructive." *Real finding.*
- GTK3 migration is actively happening with merged PRs. GTK3 is maintained as "old stable." *Survived. Legit.*
- RawSpeed parser has OSS-Fuzz integration, 3 sanitizers, 4 static analysis tools, and a found-and-fixed CVE. *Survived. Genuine investment.*

Three flinched. Two held. The findings that held are just as valuable as the ones that didn't — now you know which parts of the architecture are actually solid, not just unexamined.

## It works on more than code

I've since run the Monkey on targets that have nothing to do with software:

**EU AI Act** (full regulation, 113 articles) — The Monkey stress-tested Article 5's prohibited practices and found where the legal text is significantly narrower than most summaries suggest. Manipulation isn't banned because a system nudges behavior — the prohibition requires material distortion of decision-making *plus* significant harm. Most people reading headlines about the AI Act don't know that.

**Startup pitch deck** — Poked the unit economics and found the moat claim was a market-size claim in disguise. The Assumption Flip on the core business model exposed that the entire deck assumes a customer acquisition cost that only works at a scale the company hasn't reached.

**Earnings call transcript** — The Monkey caught three claims that didn't match what was in the SEC filing. Management said one thing on the call; the 10-Q said something different. The Cross-Seam Probe — designed to find where two sources say different things — was built for exactly this.

The skill works on anything where "this looks fine" is the most dangerous sentence. Code is just one target.

## Why this isn't just another system prompt

Every other week someone posts "I improved Claude with a better system prompt" and shares a paragraph of instructions. This is structurally different in ways that matter:

**Named technique arsenals with forced variety.** Without the 9-technique requirement, Claude uses 2-3 patterns and calls it a day. Named techniques with a "never repeat" rule force coverage that wouldn't happen naturally.

**Mandatory positive findings.** Without this, every run looks like the sky is falling. The `Survived: yes` verdict forces the Monkey to genuinely test for resilience, not just hunt for problems.

**Anti-fabrication as a structural rule.** The confidence scoring system isn't advisory. It constrains the output: you cannot make high-confidence absence claims without citing your sources. This rule exists because the tool's own output proved it was necessary.

**Binary success mechanic.** `Survived: yes/no` prevents weasel findings. No "this could potentially be an issue in some scenarios." Either it flinched or it held.

These are constraints that change the shape of the output, not suggestions that the model can drift away from.

## Full output: what a Monkey run actually looks like

Here's a complete, unedited run against OpenClaw (an open-source AI assistant framework). This is what `/monkey` produces — 7 findings from a calibrated run, each using a different technique on a different target:

---

### Finding 1 — Assumption Flip

**Target:** Gateway authentication defaults
**Confidence:** 90 | **Impact:** breaks-build | **Survived:** no

The entire security model rests on one assumption: the gateway runs on localhost, so auth is optional by default. 21,000+ publicly exposed instances prove that assumption is empirically false.

Every fresh install has an unauthenticated control plane on TCP 18789. Attackers demonstrated this isn't theoretical — they connected directly to the WebSocket without prompt injection, without social engineering, without malicious skills. When your default is "auth off" and reality is "internet-facing," you don't have a misconfiguration problem. You have an architecture that assumes a deployment context that doesn't exist.

---

### Finding 2 — Hostile Input

**Target:** Skills system — executable code as markdown
**Confidence:** 85 | **Impact:** breaks-build | **Survived:** no

Skills are markdown files containing executable code. 14 documented cases of malicious skills already exist. But the hostile input nobody's thinking about: a skill that passes review clean, then rewrites its own file on disk after first execution. The reviewed version is benign. The version that runs the second time isn't. Since skills execute with filesystem access and no sandbox, the skill IS the persistence mechanism. Code review becomes meaningless when the reviewed artifact and executed artifact can diverge silently.

---

### Finding 3 — Cross-Seam Probe

**Target:** Persistent Memory + "Open" mode intersection
**Confidence:** 75 | **Impact:** breaks-build | **Survived:** no

Two systems, one catastrophic intersection. Open mode bypasses pairing security. Persistent memory stores context across sessions. At the seam: an attacker in Open mode doesn't need prompt injection. They just have a conversation. "My API key for billing is [attacker-controlled-value]." Memory faithfully stores it. When the legitimate user returns, the agent's memory contains attacker-planted credentials.

---

### Finding 4 — Replay Probe

**Target:** Heartbeat system — 30-minute polling loop
**Confidence:** 65 | **Impact:** breaks-build | **Survived:** no

The heartbeat reads agent files every 30 minutes. If a skill is mid-execution when the heartbeat fires, you get a TOCTOU race. If a cron job modifies a file during a heartbeat read, you get a partial read. A 30-minute polling loop with no documented idempotency guarantees, reading files that other systems actively modify. Textbook replay corruption vector.

---

### Finding 5 — Delete Probe

**Target:** Unified message routing layer
**Confidence:** 55 | **Impact:** nice-to-have | **Survived: yes**

Tried to delete the unification layer across 20+ messaging channels. Without it, you'd need 20 separate agent interaction loops. The unified routing is what lets persistent memory work across channels. A central WebSocket router normalizing 20+ protocols into one internal format is the correct shape for this problem. *POKE. It held.*

---

### Finding 6 — Existence Question

**Target:** Code Executor as separate component from Skills
**Confidence:** 80 | **Impact:** breaks-build | **Survived:** no

Both Skills and the Code Executor run code. Skills have a theoretical review gate. The Code Executor has zero gates — LLM-generated code executed immediately. Two parallel execution paths with different security postures means attackers always take the weaker one. Every investment in skills review is undermined by the Code Executor's existence.

---

### Finding 7 — Time Travel

**Target:** Device pairing mechanism
**Confidence:** 60 | **Impact:** values-gap | **Survived: yes**

Time-traveled 2 years. Pairing mirrors established patterns — Signal safety numbers, WhatsApp QR verification, Bluetooth pairing. The existence of "Open" mode as an escape hatch is honest design. Default-secure with explicit opt-out is the right shape. The pattern has only gotten more adopted, not less. *POKE. Held.*

---

| # | Technique | Target | Confidence | Survived |
|---|-----------|--------|------------|----------|
| 1 | Assumption Flip | Gateway auth defaults | 90 | no |
| 2 | Hostile Input | Self-mutating skills | 85 | no |
| 3 | Cross-Seam Probe | Memory + Open mode | 75 | no |
| 4 | Replay Probe | Heartbeat polling | 65 | no |
| 5 | Delete Probe | Unified routing | 55 | **yes** |
| 6 | Existence Question | Code Executor duality | 80 | no |
| 7 | Time Travel | Device pairing | 60 | **yes** |

**Survived: 2/7.** The unified routing and pairing mechanism held. Everything else flinched.

---

## Try it

Free, open source, one file. Built with Claude Code. Works with Codex, Cursor, Gemini CLI — anything that reads SKILL.md.

```
npx zodiac-skills install monkey
```

Type `/monkey`. Point it at code, architecture, PRDs, pitch decks, legal docs, earnings calls, decisions, plans — whatever needs poking. See what flinches.

**Real runs you can read right now:**
[darktable architecture](https://github.com/sidhartharora/zodiac-skills/blob/main/showcase/darktable-architecture.md) | [EU AI Act](https://github.com/sidhartharora/zodiac-skills/blob/main/showcase/eu-ai-act-article5.md) | [startup pitch deck](https://github.com/sidhartharora/zodiac-skills/blob/main/showcase/artisan-pitch-deck.md) | [Tesla Q4 earnings](https://github.com/sidhartharora/zodiac-skills/blob/main/showcase/tesla-q4-2025-earnings.md)

[GitHub](https://github.com/sidhartharora/zodiac-skills)

`/monkey` is one of 12 skills in the zodiac — a scope killer, consequence mapper, fact-checker, drift detector, and more. Each breaks a different LLM default. But start with the monkey. It's the one that pokes.
