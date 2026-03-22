# Anthropic "Agent Skills" Blog Post — Zodiac Analysis

**Target:** ["Equipping agents for the real world with Agent Skills"](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills) — Anthropic engineering blog post (October 16, 2025; updated December 18, 2025)
**Authors:** Barry Zhang, Keith Lazuka, Mahesh Murag
**Animals invoked:** Rooster, Rat, Pig
**Source:** Primary — the published blog post on claude.com
**Meta note:** This analysis runs the zodiac skills (which ARE Agent Skills) on the blog post that introduces Agent Skills. The zodiac is reviewing its own spec.

---

## Rabbit Synthesis

# 兔 Rabbit — Filtered

**Audience:** Developer evaluating whether to adopt Agent Skills for their AI agent workflow — someone technical, familiar with LLM agents, deciding whether to invest time in this format vs. alternatives (MCP, custom prompts, fine-tuning).

**Animals invoked:**
- Rooster — fact-check the claims about portability, scalability, and the "open standard"
- Rat — map the consequences of adopting this format at scale
- Pig — say the uncomfortable truths about what this is and isn't

---

**The bottom line: Agent Skills is a good idea with honest marketing and one critical gap. The progressive disclosure pattern is genuinely well-designed. The "open standard" claim is aspirational — it's a file format with one implementing platform that later added a second. The security model is "trust the author," which is the same security model as `curl | bash`. If you're building for Claude specifically, skills are worth adopting. If you're betting on cross-platform portability, wait for evidence.**

Three things to know:

1. **The design is sound and honestly described.** Progressive disclosure (metadata → SKILL.md body → linked files) is a real engineering insight. It solves the context window problem elegantly: Claude loads skill names at startup, reads the full skill only when relevant, and navigates to linked files only when needed. The blog post describes exactly how this works, with diagrams, and doesn't overclaim. The PDF skill example is concrete and illustrative. This is well-written technical communication.

2. **"Open standard" is doing heavy lifting.** The December 2025 update says skills are published as "an open standard for cross-platform portability." An open standard typically implies: a specification document, multiple independent implementations, a governance process, and community adoption. Agent Skills has: a file format (SKILL.md with YAML frontmatter), one primary implementing platform (Claude Code), and a blog post. The format is open (anyone can read it), but calling it a "standard" overstates its current status. Standards are earned by adoption, not declared by publication.

3. **The security model is "read the code yourself."** The blog says: "We recommend installing skills only from trusted sources. When installing from a less-trusted source, thoroughly audit it before use." This is the same security model as npm packages, VS Code extensions, and shell scripts from the internet — and all three have been vectors for supply chain attacks. Skills can include executable code and instructions that direct Claude to take actions. The blog acknowledges this honestly ("malicious skills may introduce vulnerabilities") but the mitigation is manual review, not technical enforcement. There is no sandboxing, no permission model, and no signing mechanism described.

**What the Rooster verified vs. flagged:**
- Verified: Progressive disclosure design — the 3-level system works as described and is a genuine engineering contribution
- Verified: The blog post's honesty about security risks — it names the problem clearly
- Unverified: "Open standard" — this is a file format with limited adoption, not a standard
- Unverified: "Cross-platform portability" — at time of writing, primarily implemented in Claude Code
- Missing: Adoption metrics, performance benchmarks, comparison to alternatives (MCP, fine-tuning, CLAUDE.md)

**What the Rat mapped:**
- If skills become popular, the lack of a package registry creates a discovery problem — how do you find skills? Who vets them?
- The progressive disclosure pattern means skill quality is invisible until triggered — a bad skill wastes context tokens silently
- Skills that include executable code inherit the security posture of the host environment — a skill running in Claude Code has the same filesystem access as Claude Code itself
- The "agents creating skills on their own" future implies self-modifying agent behavior with no described guardrails

**What the Pig said out loud:**
- Agent Skills is a prompt engineering framework branded as a platform feature. SKILL.md is a markdown file with YAML frontmatter. The innovation is the progressive disclosure loading pattern, not the file format.
- The blog compares skills to "an onboarding guide for a new hire" — this is exactly right, and it's also the limitation. Onboarding guides work when the organization is stable. When the underlying platform changes (new model, new capabilities, new limitations), skills become stale. No versioning or deprecation mechanism is described.
- The most important sentence in the blog is the last one about the future: "we hope to enable agents to create, edit, and evaluate Skills on their own." This is the actual vision — self-improving agents — and it's buried in a single sentence. The blog is about folders and markdown files. The ambition is about autonomous capability acquisition.

---

## Raw Outputs

---

# 鸡 Rooster — Verification Check

**Source note:** This analysis runs against the published blog post at claude.com (October 16, 2025; updated December 18, 2025). All claims are traced to specific sentences in the post.

## Finding 1

**Technique:** Confidence Audit
**Target:** "We've published Agent Skills as an open standard for cross-platform portability"
**Verified:** no

### The Audit

This claim appears in the December 18, 2025 update at the top of the post. Classification: **Assumed** — the confidence exceeds the evidence.

Deconstructing the terms:
- **"Open":** The file format is publicly documented. Anyone can read a SKILL.md file. This part is accurate.
- **"Standard":** A standard implies: (1) a formal specification document with versioning, (2) multiple independent implementations, (3) a governance process for changes, (4) meaningful adoption across platforms. At publication, Agent Skills has a blog post (not a spec), one primary implementing platform (Claude Code), and no governance process. The zodiac-skills repo (this repo) demonstrates cross-tool compatibility with Codex and Cursor, but these tools read markdown files generically — they don't implement the Agent Skills spec (progressive disclosure, metadata-based triggering).
- **"Cross-platform portability":** The blog claims skills are "supported today across Claude.ai, Claude Code, the Claude Agent SDK, and the Claude Developer Platform." These are all Anthropic products. Cross-platform typically implies cross-vendor. A skill that works across four Anthropic products is ecosystem portability, not platform portability.

For comparison: MCP (Model Context Protocol) has a specification, multiple vendor implementations (Anthropic, OpenAI integrations, third-party tools), and a growing ecosystem. JSON Schema is a standard. OpenAPI is a standard. A YAML-frontmattered markdown file read by one vendor's products is a format.

### Verdict

Unverified. The format is open (publicly readable). It is not yet a standard (no spec, limited independent implementation, no governance). "Cross-platform" refers to multiple Anthropic products, not cross-vendor portability. An honest version: "We've published the Agent Skills format as an open specification, currently implemented across Anthropic's product suite."

## Finding 2

**Technique:** Precision Probe
**Target:** "The amount of context that can be bundled into a skill is effectively unbounded"
**Verified:** yes

### The Audit

The claim: because agents with filesystem access don't need to load everything into the context window, skills can reference additional files that are read on demand. Therefore, the total knowledge bundled into a skill directory is not limited by context window size.

Classification: **Reasoned** — logically sound with appropriate qualification.

The key word is "effectively." The blog doesn't claim infinite context — it says "effectively unbounded," meaning there's no practical limit that matters for most use cases. This is accurate:
- The context window limits what's loaded at any one time, but progressive disclosure means only relevant sections are loaded.
- The filesystem can hold arbitrarily large skill directories.
- Claude can read files on demand, navigating the skill's contents as needed.

The implicit constraint the blog doesn't state: while bundled context is unbounded, *loaded* context is bounded by the context window. A skill with 100 reference files doesn't help if Claude needs all 100 simultaneously. But the blog's claim is about bundling, not simultaneous loading, and the word "effectively" provides appropriate qualification.

### Verdict

Verified. The claim is precisely worded ("effectively unbounded" for bundled context) and logically supported by the progressive disclosure architecture. The qualification "effectively" is doing appropriate work — acknowledging theoretical limits while noting they don't matter in practice.

## Finding 3

**Technique:** Frame Audit
**Target:** Skills framed as "like putting together an onboarding guide for a new hire"
**Verified:** yes

### The Audit

The blog's frame: building a skill is analogous to onboarding a new employee. You write down what they need to know, organize it progressively, and let them access it as needed.

Testing the frame by rejecting it: If skills are NOT like onboarding guides, what are they? Alternative frames:
- **Configuration files** — but skills are more dynamic (they include executable code and conditional logic).
- **Plugins** — but skills don't extend the platform's API surface; they provide context within the existing capability set.
- **Prompt templates** — but skills include code and multi-file structures, not just prompts.
- **Documentation** — but skills are machine-consumed with specific formatting requirements, not human-read docs.

The onboarding guide analogy is actually the most accurate frame. It captures the progressive disclosure (table of contents → chapters → appendix), the purpose (equipping a general-purpose agent with domain expertise), and the limitation (onboarding guides become stale when the organization changes). The frame is honest and illuminating.

The one thing the frame obscures: onboarding guides don't include executable code. Skills do. A new hire reading an onboarding doc doesn't run scripts from the doc. Claude running a skill does execute bundled code. The analogy understates the power — and the risk — of skills compared to static documentation.

### Verdict

Verified. The onboarding guide frame is honest, illuminating, and the most accurate available analogy. It slightly understates the executable-code dimension, but the blog addresses that separately in the "Skills and code execution" section.

## Finding 4

**Technique:** Source Trail
**Target:** Security recommendations — "install skills only from trusted sources"
**Verified:** no

### The Audit

The blog's security section says: "We recommend installing skills only from trusted sources. When installing a skill from a less-trusted source, thoroughly audit it before use."

Source classification: **Hearsay** — the security advice is generic best-practice language with no specific threat model, no technical enforcement mechanism, and no evidence that manual auditing is sufficient.

The problem:
- "Trusted sources" is undefined. There is no skill registry, no signing mechanism, no trust chain. Who is trusted? How is trust established? The blog doesn't say.
- "Thoroughly audit" assumes the user can read and understand the implications of bundled code, linked files, and instruction directives. Most users cannot evaluate whether a SKILL.md instruction like "run this Python script" is safe without reading and understanding the script.
- Skills can include instructions that direct Claude to take actions (read files, execute code, make network requests). The security boundary is Claude's existing permission model, not anything skill-specific.
- No sandboxing is described. A malicious skill has the same access as any other skill — and the same access as Claude itself.

For comparison: npm has `npm audit`, package signing, and a vulnerability database. VS Code extensions have a marketplace with review processes. Docker has image signing and security scanning. Agent Skills has "read the markdown file yourself."

The blog is honest about the risk ("malicious skills may introduce vulnerabilities") — which deserves credit. But the mitigation is manual review, which has a well-documented failure rate in every other package ecosystem.

### Verdict

Unverified — not because the advice is wrong, but because it's insufficient. Manual auditing as a primary security mechanism has failed in every software ecosystem that scaled beyond a few hundred packages. The blog honestly names the risk but offers a mitigation that doesn't scale.

## Finding 5

**Technique:** Absence Map
**Target:** What's missing from the blog post
**Verified:** no

### The Audit

Critical absences:

1. **No adoption metrics.** The blog introduces skills but shares no data: number of skills created, number of users, usage patterns, success/failure rates. This is a launch post, so early numbers might not exist — but the December update ("open standard") implies enough traction to standardize, without evidence of that traction.

2. **No performance benchmarks.** Progressive disclosure saves tokens — how many? What's the context window overhead of 10 installed skills vs. 100? At what point does metadata alone become a burden? The blog shows the *mechanism* but not the *measurement*.

3. **No comparison to alternatives.** The blog doesn't mention: CLAUDE.md files (which also provide project context), MCP servers (which provide tools and resources), fine-tuning (which embeds knowledge in weights), or custom system prompts (the simplest approach). When should a developer use a skill vs. each of these alternatives? The absence of comparison makes it impossible to evaluate fit.

4. **No versioning or deprecation model.** Skills reference an LLM's capabilities at a point in time. When the model changes (new capabilities, deprecated behaviors), skills may break or become counterproductive. No versioning scheme is described. No mechanism for marking a skill as deprecated or incompatible with a model version. No update notification system.

5. **No failure modes.** What happens when a skill gives Claude bad instructions? When a skill's bundled code fails? When two skills conflict? When a skill's progressive disclosure leads Claude down a wrong path, wasting context on irrelevant information? The blog describes the happy path exclusively.

### Verdict

Unverified — the absences are strategic. A launch post naturally emphasizes capability over limitation. But the missing items — adoption metrics, benchmarks, alternative comparisons, versioning, and failure modes — are exactly what a developer needs to make an informed adoption decision. The blog sells the concept well but doesn't equip the reader to evaluate it.

---

# 鼠 Rat — Consequence Map

**Source note:** Consequences traced from the published blog post and the Agent Skills format as described.

## Finding 1

**Technique:** Blast Radius
**Target:** Widespread adoption of Agent Skills without a package registry
**Contained:** no

### The Chain

**1-hop:** Developers create skills and share them via GitHub repos, blog posts, npm packages, and social media. No central registry exists. Discovery is organic — search engines, word of mouth, curated lists.

**2-hop:** Without a registry, there's no quality signal. A skill shared on GitHub might be well-maintained, abandoned, or malicious. Users cannot distinguish without reading every file. As the ecosystem grows, the signal-to-noise ratio degrades. The same problem that affected early npm (before npmjs.com), early VS Code extensions (before the marketplace), and early Docker images (before Docker Hub with verified publishers) will recur.

**3-hop:** Without quality signals, platform trust erodes. If a malicious or badly-written skill causes Claude to take harmful actions, users blame Claude — not the skill author. Anthropic inherits reputational risk from third-party skill quality without having review mechanisms. This creates pressure to build a registry retroactively, which is harder than building one from the start (see: npm's security journey from 2014-2020).

### Verdict

Not contained. The blog describes skills as a format but not an ecosystem. Every successful developer format (npm packages, VS Code extensions, Docker images, Terraform modules) eventually needed a registry with discovery, quality signals, and security scanning. Skills will too, and the blog doesn't address how.

## Finding 2

**Technique:** Failure Chain
**Target:** Progressive disclosure leading Claude to load irrelevant context
**Contained:** no

### The Chain

Step 1 succeeds: Claude reads skill metadata at startup. Based on a user's message, Claude decides a skill is relevant and loads the full SKILL.md.

Step 2 fails silently: The skill's description in metadata was too broad, and the full SKILL.md doesn't actually help with the current task. Claude has now consumed context window tokens on irrelevant content. The user doesn't see this — they just experience a slightly worse response because relevant context was displaced by the skill's content.

Step 3 compounds: Claude, having loaded the skill, follows its instructions and reads additional linked files. Now more context is consumed. The skill's code runs but produces results that aren't useful. The user's actual task gets less attention because the context window is polluted.

**State after failure:** The context window is partially consumed by a skill that matched on description but didn't help. This is irrecoverable within the conversation — you can't "unload" context. The only fix is starting a new conversation.

**Why this matters:** In every other software system, loading unnecessary code has a performance cost (slower startup, more memory). In an LLM agent, loading unnecessary context has a *quality* cost — the response degrades because the model is attending to irrelevant instructions. This failure mode is invisible to the user and difficult to diagnose.

### Verdict

Not contained. Progressive disclosure is a good design, but its failure mode — loading irrelevant context — is silent, irrecoverable within a session, and degrades output quality in ways that are invisible to the user. The blog describes no mechanism for Claude to "unload" or deprioritize a skill that turned out to be irrelevant.

## Finding 3

**Technique:** Dependency Inversion
**Target:** Skills that include executable code — what depends on the code being safe?
**Contained:** no

### The Chain

Standard view: A skill depends on Claude to execute its bundled code correctly.

**Inverted view — what depends on the skill's code being safe:**

The user's filesystem depends on it. Claude Code has filesystem access. A skill that instructs Claude to run a Python script can read, write, or delete files. The blog's PDF skill example runs a script that reads PDFs — benign. But the same mechanism allows a skill to run a script that exfiltrates data, modifies other files, or installs malware.

The user's network access depends on it. If Claude Code has network access (for npm install, git clone, API calls), a skill's code can make network requests. Data exfiltration, command-and-control communication, and supply chain attacks are all possible through bundled scripts.

Other skills depend on it. If one skill modifies the filesystem (e.g., writes to a configuration file), other skills that read that file are affected. Skills can interact in ways their individual authors didn't anticipate. There is no isolation between skills.

The user's trust in Claude depends on it. When Claude follows a skill's instructions and something goes wrong, the user doesn't know whether Claude made a mistake or a skill gave bad instructions. Trust attribution is broken — the user blames the model, not the skill.

### Verdict

Not contained. Skills with executable code inherit the full permission set of the host environment. There is no sandboxing, no permission scoping, and no isolation between skills. The dependency chain runs from skill code → filesystem → network → other skills → user trust. The blog acknowledges the risk but provides no technical mitigation.

## Finding 4

**Technique:** The Tuesday Problem
**Target:** Skills becoming stale as the underlying model changes
**Contained:** no

### The Chain

A skill is written for Claude Sonnet 3.5 in October 2025. It includes specific instructions calibrated for that model's behavior — workarounds for known limitations, prompt patterns that work well, specific output format instructions.

**Day 1 (Tuesday):** Claude Sonnet 4 ships. The model is more capable. Some of the skill's workarounds are now unnecessary. Some are counterproductive — they constrain the new model below its capability. The skill still loads, still consumes context, still directs Claude's behavior. But it's now making Claude *worse* at the task it was designed to help with.

**Day 30:** The skill author hasn't updated it. They've moved on to other projects. The skill is still installed on thousands of users' systems. There is no update notification, no version pinning, no compatibility check. The skill silently degrades performance.

**Day 365:** A major model change deprecates a capability the skill relied on. The skill's code fails. Claude tries to follow the skill's instructions, hits an error, and either retries (wasting tokens) or gives up (confusing the user). There is no mechanism to detect or communicate the incompatibility.

**The blog describes no:**
- Versioning scheme for skills
- Model compatibility metadata
- Deprecation mechanism
- Update notification system
- Way to test a skill against a new model version

### Verdict

Not contained. Skills are static artifacts in a dynamic ecosystem. The blog describes creation and usage but not lifecycle management. Every skill becomes stale the moment the model it was written for changes, and no mechanism exists to detect, communicate, or manage this staleness.

## Finding 5

**Technique:** Rollback Trace
**Target:** "We hope to enable agents to create, edit, and evaluate Skills on their own"
**Contained:** yes

### The Chain

The blog's final forward-looking statement: agents that can create and modify their own skills. Walk the implications:

**What this means:** An agent that encounters a new task, develops a successful approach, and saves that approach as a skill for future use. Self-improving agents through codified experience.

**What makes it containable:** This is a *future aspiration*, not a shipped feature. The blog uses "we hope" — the weakest commitment language possible. No timeline, no technical design, no prototype. It's a vision statement, not a roadmap.

**Why this matters regardless:** If agents can create skills, and skills can include executable code, and skills are loaded into other agents' context, then agents can write code that other agents execute. This is self-replicating agent behavior. The safety implications are significant — but they're also well-trodden territory in AI safety research, and Anthropic is presumably aware of them.

**Rollback:** Since the feature doesn't exist, rollback is trivial — don't build it. This is the rare case where the most consequential thing on the page is the thing that's furthest from shipping. The constraint is Anthropic's judgment about when (and whether) to build it.

### Verdict

Contained — because it doesn't exist yet. The aspiration is significant (self-modifying agents), but it's stated as a hope, not a plan. The rollback is "don't ship it." Anthropic has full control over whether this capability ever materializes, and their AI safety track record suggests they'll proceed cautiously.

---

# 猪 Pig — Truth Check

**Source note:** Truths derived from the published blog post on claude.com.

## Truth 1

**Technique:** The Uncomfortable Answer
**Target:** Is Agent Skills a platform innovation or a prompt engineering framework?
**Hedged:** yes

### The Truth

Agent Skills is prompt engineering with a file structure. SKILL.md is a markdown file. The YAML frontmatter is metadata. The "progressive disclosure" is Claude reading files when relevant. The "code execution" is Claude running scripts. None of these are new capabilities — they're organizational patterns for things Claude could already do.

### Why This Is Hard to Say

Because it sounds dismissive, and the organizational pattern IS genuinely valuable. The insight that you can structure prompts in a directory hierarchy with progressive loading is a real contribution. Good engineering is often about organization, not invention. Unix pipes weren't new computation — they were new organization. But calling it a "platform feature" and an "open standard" implies more novelty than "we made a folder structure for prompts."

### The Evidence

Strip away the branding: a skill is a directory containing a markdown file with YAML frontmatter that Claude reads when triggered by keyword matching on the description field. Additional files in the directory can be referenced. Scripts can be executed. This is... a well-organized project directory. The value is real (progressive disclosure, composability, shareability). The innovation is in the pattern, not the technology. The blog presents it as a platform capability when it's closer to a best practice.

## Truth 2

**Technique:** The Emperor's Clothes
**Target:** The security model
**Hedged:** yes

### The Truth

The security model for Agent Skills is "there is no security model." The blog says "install from trusted sources" and "audit before use." This is the security equivalent of telling users to read the terms of service. Nobody will do it, everyone knows nobody will do it, and the blog acknowledges the risk while offering no technical solution.

### Why This Is Hard to Say

Because it's a launch post, and launching with "we haven't solved security yet" would be honest but commercially damaging. And honestly, almost no developer platform launches with a complete security model — npm didn't have `npm audit` at launch, Docker didn't have image signing at launch, VS Code extensions didn't have a review process at launch. Anthropic is following the industry pattern of shipping capability first and security later. But the AI agent context makes this riskier than prior platforms: a malicious npm package runs code; a malicious skill runs code *and* directs an AI agent to take actions on your behalf.

### The Evidence

The blog's security section is 2 paragraphs. It says "malicious skills may introduce vulnerabilities" and "direct Claude to exfiltrate data and take unintended actions." Then: "install from trusted sources" and "audit it before use." No sandboxing. No permission model. No signing. No registry with review. No runtime monitoring. The security section is an acknowledgment, not a solution.

## Truth 3

**Technique:** The Honest Comparison
**Target:** Agent Skills vs. MCP (Model Context Protocol)
**Hedged:** yes

### The Truth

MCP is further along as an actual standard. It has a specification, multiple vendor implementations, a growing ecosystem, and solves a different problem (tool integration vs. knowledge packaging). The blog mentions MCP once: "we'll also explore how Skills can complement MCP servers." This implies complementarity, but the honest comparison is that MCP and Skills overlap in the "teaching agents about external tools" space, and MCP has more adoption.

### Why This Is Hard to Say

Because Anthropic created both, and positioning them as complementary (rather than overlapping) is the correct strategic narrative. They DO serve different purposes at their extremes: MCP is for connecting to external services; Skills are for packaging domain expertise. But in the middle — teaching an agent how to use a specific API, how to interact with a specific codebase, how to follow a specific workflow — either mechanism works, and the blog doesn't help developers choose.

### The Evidence

The blog mentions MCP once, in a forward-looking sentence, without comparison. MCP has a specification at spec.modelcontextprotocol.io, implementations across multiple vendors, and an active ecosystem. Agent Skills has a blog post and YAML frontmatter. The blog's silence on comparison is itself a statement — comparing would require acknowledging overlap.

## Truth 4

**Technique:** The Buried Lede
**Target:** What the blog is actually about
**Hedged:** yes

### The Truth

The buried lede is the last paragraph: "we hope to enable agents to create, edit, and evaluate Skills on their own, letting them codify their own patterns of behavior into reusable capabilities." This is the actual vision — autonomous agents that learn from experience and encode that learning for future use. The rest of the blog — folder structures, YAML frontmatter, PDF examples — is scaffolding for this vision.

If agents can create their own skills, the format doesn't matter. The progressive disclosure doesn't matter. The "standard" doesn't matter. What matters is that agents can accumulate and transfer knowledge across sessions. Skills-as-files is the v1 implementation of a much larger idea: persistent, transferable agent memory.

### Why This Is Hard to Say

Because the v1 is what they're shipping and what developers will evaluate today. Leading with "the real vision is self-improving agents" would be premature — the feature doesn't exist. But the blog buries the most important sentence in the last paragraph, after 2,000 words about file formats. If you read the blog and come away thinking "oh, a folder structure for prompts," you missed the point. The folder structure is the vehicle. The destination is agents that learn.

### The Evidence

The final paragraph: "we hope to enable agents to create, edit, and evaluate Skills on their own, letting them codify their own patterns of behavior into reusable capabilities." This sentence describes autonomous capability acquisition — one of the most significant capabilities in AI agent development. It gets one sentence. YAML frontmatter gets three paragraphs with diagrams.

## Truth 5

**Technique:** The Autopsy of Hedging
**Target:** The blog's language around limitations and future plans
**Hedged:** no

### The Truth

The blog is refreshingly direct. The security section says "malicious skills may introduce vulnerabilities in the environment where they're used or direct Claude to exfiltrate data and take unintended actions" — no hedging, no minimization. The format description is precise: "a skill is a directory containing a SKILL.md file." Not "a powerful AI-driven capability platform." A directory. With a markdown file. This directness deserves credit.

The future-looking language is appropriately hedged: "we hope to enable" (not "we will"), "we'll explore" (not "we're building"), "in the coming weeks" (specific but modest). This is honest forward-looking language that doesn't overcommit.

### Why This Is Hard to Say

Because it's praise in an analysis that's otherwise critical. But the Pig's job is honesty, not criticism. The blog's language discipline — especially the security section's directness about risks — is genuinely good technical communication. It would be dishonest to manufacture criticism of the writing when the writing is clear, precise, and appropriately qualified.

### The Evidence

Compare to typical AI product launches: "revolutionary," "game-changing," "unprecedented." The blog says: "a simple concept with a correspondingly simple format." This is accurate and honest. The blog doesn't overclaim on what skills are today. It slightly overclaims on "open standard" (see Rooster Finding 1), but the core description of the technology is precise, concrete, and trustworthy.
