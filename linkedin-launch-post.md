My AI kept telling me my architecture was fine.

So I built a tool that makes it stop being polite.

/monkey is a single Markdown file you install into Claude Code. It runs 9 chaos techniques against whatever you point it at — code, PRDs, pitch decks, legal docs, earnings calls, project plans.

First real test: it reviewed an open-source project and confidently claimed three safety features didn't exist.

All three existed. It never checked the docs.

That failure became the most important feature. Now the skill has an anti-fabrication rule: before claiming something doesn't exist, you must say where you looked. "I did not find" is honest. "There is none" requires receipts.

After the fix, it found real issues on every target I've thrown at it. Architecture gaps in open-source projects. Narrow legal text that most AI Act summaries get wrong. Earnings call claims that don't match the SEC filing. Pitch deck moats that are market-size claims in disguise.

It also says when things hold up. At least 2 of 9 findings must be positive. A chaos agent that only attacks is useless — you need to know what's actually solid.

Free, open source, one file:
npx zodiac-skills install monkey

Type /monkey on anything. See what flinches.

github.com/sidhartharora/zodiac-skills

#ClaudeCode #AITools #DevTools #OpenSource #LLM
