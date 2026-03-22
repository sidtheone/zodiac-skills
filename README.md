# zodiac-skills

Twelve animals. Twelve LLM defaults. Pick the ones your AI won't break on its own.

## The Problem

LLMs have behavioral defaults baked in by RLHF training — agreeableness, pattern matching, scope creep, premature convergence, context drift, linear thinking. Instructions like "be honest" or "think critically" don't fix these because the defaults run deeper than instruction-following.

**Characters fix what instructions can't.** A persona gives the LLM permission to behave differently by making the behavior *in-character* rather than rule-violating. The Monkey doesn't TRY to find flaws — she WANTS chaos. Finding flaws is her nature, not her task.

## The Animals

Each animal is a self-contained skill that breaks one specific LLM default.

| Animal | Persona | Breaks | Success Mechanic |
|--------|---------|--------|------------------|
| [猴 Monkey](monkey/) | Chaos Agent | Agreeableness / sycophancy | `Survived: yes/no` |
| [鼠 Rat](rat/) | Consequence Mapper | Linear thinking | `Contained: yes/no` |
| [牛 Ox](ox/) | First Principles | Pattern matching | `Warranted: yes/no` |
| [虎 Tiger](tiger/) | Solution Attacker | Premature convergence | `Burned: yes/no` |
| [兔 Rabbit](rabbit/) | The Filter | Audience-blind output | `Landed: yes/no` |
| [龙 Dragon](dragon/) | The Visionary | Short-term thinking | `Farsighted: yes/no` |
| [蛇 Snake](snake/) | Scope Killer | Scope creep / completionism | `Earned: yes/no` |
| [马 Horse](horse/) | The Sprinter | Analysis paralysis | `Clear: yes/no` |
| [羊 Goat](goat/) | The Wanderer | Convergent thinking | `Fertile: yes/no` |
| [鸡 Rooster](rooster/) | The Critic | Epistemic recklessness | `Verified: yes/no` |
| [狗 Dog](dog/) | Drift Detector | Recency bias / context drift | `Aligned: yes/no` |
| [猪 Pig](pig/) | The Truth-Teller | Political hedging | `Hedged: yes/no` |

## Design Principles

1. **Character wants what the instruction asks for.** The Monkey doesn't try to find flaws — she wants chaos. The Snake doesn't try to cut scope — excess disgusts her.
2. **Named techniques force variety.** Without them, LLMs gravitate to 2-3 patterns. Named technique arsenals with "never repeat" forces unfamiliar angles.
3. **Success mechanics prevent confirmation bias.** "Survived: yes" is a valid exit that isn't "I found nothing." Removes pressure to manufacture findings.
4. **Anti-scope prevents drift.** "You don't fix things" keeps the Monkey in observation mode. "You don't propose alternatives" keeps the Ox on foundations.
5. **Emotional register constrains output.** Enthusiastic (Monkey) produces bolder findings. Methodical (Ox) produces deeper analysis. Silent (Snake) produces precision.

## Install

```bash
npx zodiac-skills
```

You'll be prompted to choose the tool and scope:

```
  Which tool?
    1) Claude Code
    2) Codex
    3) Both

  Where should Claude Code skills be installed?
    1) User      (available everywhere)
    2) Project   (current directory only)
```

Or skip the prompts with flags:

```bash
npx zodiac-skills --claude --user              # Claude Code, user-level
npx zodiac-skills --codex --project            # Codex, project-level
npx zodiac-skills --claude --codex --user      # Both tools, user-level
```

Install specific animals:

```bash
npx zodiac-skills install monkey tiger snake
```

Check what's installed:

```bash
npx zodiac-skills list
```

Uninstall:

```bash
npx zodiac-skills uninstall monkey tiger
npx zodiac-skills uninstall --all
```

## Usage

Invoke by name or by trigger phrase:

```
/monkey — chaos check this plan
/ox — is this pattern warranted here?
/tiger — attack this solution
/snake — cut this down to MVP
/dog — have we drifted from the original plan?
/rat — map the consequences of this migration
/pig — give it to me straight
/rabbit — review this and make it readable
/dragon — what does this decision lock in?
/horse — are we overthinking this?
/rooster — verify these claims
/goat — what else could this be?
```

### Rabbit as orchestrator

The Rabbit is unique — it invokes other animals and reshapes their output for your audience. Use it as the front door when you want multiple perspectives without reading 150+ lines of raw findings:

```
/rabbit — review this architecture proposal
```

Rabbit picks the right animals (maybe Tiger + Snake + Rat), runs them, and delivers a synthesized result shaped for whoever's reading. Raw animal outputs are collapsed below if you want the reasoning.

Snake produces 165 lines of scope analysis. Rabbit turns it into:

```
## Cut now
- Audit logging (enterprise feature, 0 users reading logs)
- Rate limiting (no abuse at this scale)
- Nginx container (duplicates middleware.ts headers)

## Keep
Dashboard, charts, pipeline, auth, validation, Postgres

Full analysis below if you want the reasoning.
```

15 lines instead of 165. Same substance.

## License

MIT
