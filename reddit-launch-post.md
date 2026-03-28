# I built a chaos monkey for Claude Code. It caught itself lying on the first real test.

I got tired of Claude telling me everything looked great. Architecture reviews, PRDs, project plans, pitch decks — all came back polished, positive, and basically useless. "Well-structured approach with clear separation of concerns" — cool, but what's actually going to break?

So I built `/monkey`. It's a skill for Claude Code — one Markdown file, nothing else. You install it, type `/monkey`, and Claude stops being polite. It runs 9 different attack techniques against whatever you point it at — code, docs, plans, decisions, anything. Flip your strongest assumption, invent hostile inputs, ask what happens if you just delete the thing entirely, time-travel 6 months and see what aged badly. Stuff like that.

The interesting part is what happened when I tested it.

## It lied

First real test was darktable — open-source photo editor, ~500K lines of C. The Monkey came back with 9 findings. The three highest-confidence ones (80, 85, 90) all said the same kind of thing: "this safety feature doesn't exist," "no recovery mechanism found," "there's no mitigation for this."

All three were wrong. The features existed. The Monkey never actually checked the docs — it just asserted that things weren't there with full confidence. Which is exactly what LLMs do when they don't know something. They don't say "I didn't check." They say "it doesn't exist."

So I added a rule to the skill itself: before you claim something doesn't exist, you have to say where you looked. "I did not find" is fine. "There is none" requires you to cite what you checked. If you can't name the specific doc or code path, your confidence can't go above 79.

After that fix, the re-run on darktable was actually useful:

- XMP auto-sync silently overwrites external edits every 10 seconds, conflict detection is off by default — *that's a real problem*
- OpenCL is deprecated on macOS and flaky on AMD, fallback is 10x slower and users don't get told — *real problem*
- GTK3 migration is actively happening with merged PRs — *held up under pressure, legit*
- RawSpeed parser security has OSS-Fuzz, 3 sanitizers, 4 static analysis tools — *held up, genuine investment*

The fixed version found real things AND honestly said what was solid. That's the whole point — a chaos agent that can say "this survived" is more useful than one that just attacks everything.

I've since run it on a bunch of non-code targets too. EU AI Act (full regulation, 113 articles) — the Monkey stress-tested Article 5 prohibitions and caught where the legal text is narrower than most summaries make it sound. A startup pitch deck — it poked the unit economics and found the moat claim didn't hold. An earnings call transcript — caught three claims that didn't match the SEC filing. It works on anything where "this looks fine" is the dangerous sentence.

## Why it's not just another system prompt

I know, I know. "I put instructions in a markdown file and Claude got better" — every other post here. But this one failed first and the fix is structural, not vibes.

The skill forces 9 different techniques per run — you can't just run your favorite attack angle 9 times. At least 2 of 9 findings have to be positive, so it can't just trash everything. And the anti-fabrication rule means high-confidence claims need receipts.

These aren't suggestions to the model. They're constraints that change the output shape. The 9-technique rule exists because without it, Claude gravitates to 2-3 patterns and ignores the rest. The mandatory positive findings exist because without them, every run looks like the sky is falling.

## It also attacked this post

I ran `/monkey` on the Reddit post itself before posting. It told me polished posts don't drive installs (fair), that "works everywhere" is an overclaim when I've only tested on Claude (fair), and that the opt-in design is correct because sometimes you actually want your AI to agree with you (held up).

4 of 9 things about the post survived. I'm posting it anyway.

## Try it

It's free, open source, one markdown file. Built with Claude Code.

```
npx zodiac-skills install monkey
```

Type `/monkey` in Claude Code. Point it at code, architecture, PRDs, pitch decks, legal docs, decisions, plans — whatever you need poked. See what flinches.

[GitHub](https://github.com/sidhartharora/zodiac-skills)

Some real runs if you want to see actual output before installing: [darktable architecture](https://github.com/sidhartharora/zodiac-skills/blob/main/showcase/darktable-architecture.md) | [EU AI Act Article 5](https://github.com/sidhartharora/zodiac-skills/blob/main/showcase/eu-ai-act-article5.md) | [startup pitch deck](https://github.com/sidhartharora/zodiac-skills/blob/main/showcase/artisan-pitch-deck.md) | [Tesla earnings](https://github.com/sidhartharora/zodiac-skills/blob/main/showcase/tesla-q4-2025-earnings.md)

Part of a bigger set of 12 skills (the "zodiac") but the monkey works on its own. The rest are things like a scope killer, a consequence mapper, a fact-checker — each one breaks a different LLM default. But start with the monkey. It's the fun one.
