# I Built 12 Markdown Files That Make LLMs Think Differently. Then I Verified Every Finding Against Published Experts.

## The problem isn't intelligence. It's behavior.

LLMs are smart enough. GPT-4, Claude, Gemini — they have the knowledge to produce expert-level analysis. They just won't. Not because they can't, but because RLHF training baked in behavioral defaults that get in the way:

- **Agreeableness.** Ask an LLM to review your architecture and it finds 3 issues, then spends 400 words reassuring you it's "a solid foundation." The issues were the point. The reassurance is the default.
- **Pattern matching.** Ask why you chose Redis and it gives you the median Stack Overflow answer. It doesn't ask whether you need a cache at all.
- **Premature convergence.** It picks the first plausible approach and defends it. It never attacks its own solution.
- **Scope creep.** Ask for an MVP and it adds error handling for scenarios that can't happen, feature flags you'll never use, and an abstraction layer for a one-time operation.
- **Political hedging.** Every opinion is wrapped in "it depends," "there are tradeoffs," and "both approaches have merits." Even when one approach is clearly better.

Instructions like "be honest" or "think critically" don't fix these. The defaults run deeper than instruction-following. Telling a model to "be critical" is like telling someone to "be funny" — the instruction doesn't produce the behavior.

## Constraints fix what instructions can't

I built 12 `SKILL.md` files — one for each behavioral default. Each file is a set of constraints that rewire how a model approaches a specific class of problem. No fine-tuning. No RAG. No vector database. Just markdown files that any LLM-powered tool can read.

I call them the zodiac. Each animal breaks one default:

- The **Monkey** breaks agreeableness — she stress-tests assumptions from 9 named angles (Assumption Flip, Hostile Input, Delete Probe, Scale Shift...) and must produce a binary verdict: `Survived: yes` or `Survived: no`. She can't hide in "it depends."
- The **Rooster** breaks epistemic recklessness — before stating any fact, he must show where he verified it. "I did not find X in Y" is honest. "There is no X" requires proof.
- The **Tiger** breaks premature convergence — she attacks solutions from multiple angles to find fatal flaws. If the solution survives, `Burned: yes` is a valid exit. The Tiger doesn't manufacture findings.
- The **Rat** breaks linear thinking — he traces second and third-order consequences that the direct analysis misses.
- The **Rabbit** orchestrates — she picks which animals to run, calibrates finding counts to target density, and synthesizes cross-animal output into a shaped deliverable.

Seven more animals round out the set: Ox (pattern matching), Snake (scope creep), Dog (context drift), Pig (hedging), Dragon (short-term thinking), Horse (analysis paralysis), Goat (convergent thinking).

Each animal is a single file. No dependencies. They work across Claude Code, Codex, Cursor, Gemini CLI, and any tool that reads markdown skill files.

## Why constraints work where instructions fail

The key insight isn't the character or the Chinese zodiac framing — that's flavor. The load-bearing part is the **Decision Policy** in each SKILL.md: operational rules that tell the model what to distrust, what evidence to require, when the anti-scope kicks in, and what calibration targets to hit.

Three mechanisms do the heavy lifting:

**Named technique arsenals with "never repeat."** Without named techniques, LLMs gravitate to 2-3 analytical patterns regardless of what you ask. The Monkey has 9 named techniques. Every other animal has 5. Each technique forces a different cognitive approach. Hostile Input makes you think about adversarial use. Delete Probe makes you ask what happens if you remove the thing entirely. Scale Shift makes you ask what breaks at 100x. The model can't fall back to its comfortable pattern because the technique names force it onto unfamiliar ground.

**Binary success mechanics.** Every finding ends with a verdict: `Survived: yes/no`, `Burned: yes/no`, `Verified: yes/no`. The model can't hedge with "this has some merit" or "there are tradeoffs." It must commit. And crucially, the positive verdict is a valid exit — `Survived: yes` means "I stress-tested this and it held up." This prevents the pile-on effect where every analysis is purely negative because the model thinks criticism is what you asked for.

**Anti-fabrication on absence claims.** Before any animal claims something doesn't exist, it must state where it looked. This rule was added after the Monkey's three highest-confidence findings on the darktable open-source project were factually wrong — they asserted that security features were absent without checking the primary documentation, where those features were clearly described. The rule forces "I did not find X in Y" instead of "there is no X."

## The proof: 40 findings on the EU AI Act, verified against published experts

Theory is nice. I wanted proof.

I ran the full zodiac on the EU AI Act — the complete regulation, 113 articles, 573KB of legal text. The Rabbit orchestrator decomposed it into sections, picked 8 animals, ran two passes, and produced 40 findings.

Then I verified every single finding against published legal scholarship, law firm analyses, Commission guidelines, and policy commentary.

**Results:**

- **0 out of 40 findings were contradicted** by any published source
- **17 out of 40 were directly confirmed** by legal scholarship
- **2 findings were ahead of the published discourse** — legal practitioners hadn't surfaced them yet
- The **Rat predicted** that the EU would face a conformity assessment bottleneck because notified bodies didn't exist at scale. Six months later, the European Association of Medical Devices Notified Bodies publicly warned that a shortage "could massively hinder" AI regulation.
- The **Dog found** that the Act drifted fundamentally from its 2021 origins — from a product-safety regulation to a fundamental-rights regulation without updating its enforcement tools. This exact finding was independently published as a peer-reviewed article in the *Common Market Law Review* under the title "The EU AI Act: Between the rock of product safety and the hard place of fundamental rights."

The Dog's finding (confidence 80) was reached by a markdown file running on an LLM. The same conclusion was reached by legal scholars through traditional academic research. Both arrived at the same place independently.

## The A/B test: zodiac vs. a well-prompted vanilla LLM

The strongest objection to this approach is: "Can't you just prompt well?"

I tested it. Same model (Claude Opus 4.6). Same input (the Trump National AI Legislative Framework, released 2 days earlier — neither run could rely on memorized prior analysis). Same request: rigorous critical analysis.

The vanilla prompt wasn't lazy — it was a "you are a senior policy analyst" system prompt with explicit instructions to be thorough, critical, and unhedged.

**Result:** Both analyses reached the same directional conclusions. The vanilla correctly identified every major structural weakness. But:

- The zodiac produced **10 findings the vanilla missed** — including a deletion test ("remove 4 of 6 prongs — nothing changes"), a regulatory vacuum compounding mechanism (three specific feedback channels), and the EO foundation fragility (the entire framework rests on an executive order a future administration can revoke day one).
- The vanilla produced **5 findings the zodiac missed** — including AI-generated CSAM as an enforcement gap and data privacy absence.
- The zodiac's findings were **falsifiable** (the Delete Probe invites you to try it yourself), **confidence-calibrated** (82 on the deletion test, 55 on the patchwork analysis), and **binary** (Burned or Survived, not "has some merit").
- The vanilla's findings were qualitative judgments presented with uniform implicit confidence.

The vanilla analysis was a good essay. The zodiac was a diagnostic instrument. The difference isn't what the model knows — it's how the constraints force it to deploy what it knows.

## What I learned building this

**Decision Policy is load-bearing, persona is flavor.** Early versions had elaborate character descriptions. They didn't change the output. What changed the output was the operational rules: "distrust claims of absence," "require evidence for confidence above 80," "anti-scope: you don't fix things." The Monkey's character (enthusiastic, chaos-loving) makes the output more readable. The Decision Policy (what to distrust, what evidence to require) makes it more correct.

**Named techniques are the single biggest lever.** Without them, every animal produced 2-3 variations of the same finding regardless of target. With them, the Monkey produces 9 genuinely different findings because each technique forces a different cognitive approach. The "never repeat" constraint is essential — without it, the model gravitates back to its comfortable patterns by finding 3.

**The Rabbit orchestrator changed everything.** Individual animals produce good findings on focused targets. But on large targets (a 113-article regulation, a full architecture review), a single animal produces shallow coverage that feels thorough. The Rabbit decomposes the target, selects animals per-section, calibrates finding counts to density, and synthesizes across animals — surfacing cross-animal tensions that are the most valuable output. "The Tiger says the architecture is fundamentally wrong. The Dog says it drifted from a better original design. They disagree on what 'right' looks like."

**Anti-fabrication rules are non-negotiable.** The darktable showcase was the turning point. The Monkey's three highest-confidence findings (80, 85, 90) were factually wrong — they claimed security features didn't exist without checking the docs where those features were described. After adding the rule "before claiming absence, state where you looked," false absence claims dropped to near zero. Confidence 80+ now requires citing the specific source checked.

## Try it

```
npx zodiac-skills
```

Installs the 12 animals as skills for Claude Code, Codex, or both. Use `/monkey` to chaos-test, `/tiger` to attack a solution, `/rabbit` to run a full orchestrated analysis.

The code, all showcases (EU AI Act, A/B test, earnings calls, architecture reviews, pitch decks), and the full methodology are on GitHub:

**github.com/sidtheone/zodiac-skills**

Each animal is a single markdown file. Read them — the mechanism is transparent. If you can write a better Decision Policy for the Monkey, the Monkey gets better. That's the whole point: the quality comes from the constraints, and the constraints are editable.

---

*MIT licensed. Works with any tool that reads SKILL.md files.*
