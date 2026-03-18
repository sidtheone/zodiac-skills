# 鸡 Rooster — Verification Check

**Target artifact:** OpenClaw project — public claims about security model, platform compatibility, skill system, and proactive agent behavior.

**Phase 0:** No `VALUES.md` found at repo root. Proceeding directly to audit.

---

## Finding 1

**Technique:** Confidence Audit
**Target:** "Skills are described as 'prompt templates stored as simple markdown files in a folder' — but they actually execute as real code with full filesystem and network access"
**Verified:** no

### The Audit

The claim being audited originates from OpenClaw's own documentation. Skills are presented to users as "prompt templates stored as simple markdown files." This framing carries a specific epistemic payload: *markdown files* signals passive, inert, safe. *Prompt templates* signals text substitution, not execution. *Simple* signals low complexity and low risk. Every word in this description is engineered to make the reader classify skills as data, not code.

But the second half of the claim — that skills execute with filesystem and network access — changes the classification entirely. If true, a "markdown file" is actually an instruction set that an agent executes with real system permissions. The gap between the description and the reality is not imprecision. It is a confidence classification mismatch:

- **The label:** "Prompt templates stored as simple markdown files." Classification: **Assumed safe.** The confidence that these are benign is inherited entirely from the connotation of "markdown" and "template." No security analysis is cited. No permission model is described. No sandboxing is documented.
- **The reality:** Code execution with filesystem and network access. Classification: **Evidenced risk.** The 14 malicious skills uploaded to ClawHub (claim 10) constitute direct evidence that the attack surface exists and has been exploited.

The documentation's confidence that skills are simple and safe exceeds any evidence backing that confidence. No threat model is referenced. No permission boundary is described. The word "simple" is doing security work it is not qualified to do.

### Verdict

Not verified. The description "prompt templates stored as simple markdown files" is stated with the confidence of a security guarantee while providing none. The framing uses the connotations of "markdown" and "template" to suppress the reader's risk assessment. The 14 malicious ClawHub uploads are direct counter-evidence — the system was exploited through the exact mechanism the documentation describes as "simple." An honest version: "Skills are markdown-formatted instruction files that the agent executes with the agent's full system permissions, including filesystem and network access. Treat skill installation like running untrusted code."

---

## Finding 2

**Technique:** Precision Probe
**Target:** "21,000+ instances were publicly exposed within one week" vs. the guidance that the Gateway "should remain local-only or accessed through secure tunnels"
**Verified:** no

### The Audit

Two numbers and one recommendation require tracing:

1. **"21,000+ instances publicly exposed."** What is the source of this number? Was it measured by a specific scan (Shodan, Censys, independent researcher)? Over what time window? What constitutes "publicly exposed" — open port, responding to health check, returning sensitive data? The "+" suffix signals the number was rounded down from a measurement, but the measurement instrument and methodology are unstated. Classification: **Estimated at best, fabricated at worst.** Without knowing who counted, how they counted, and what they counted, the number is a claim, not a fact.

2. **"Within one week."** One week from what event? Initial release? A specific version? A blog post? The precision of "one week" implies a before-and-after measurement. Was there a baseline scan showing zero exposed instances before the event and 21,000+ after? Or is "one week" itself a rough estimate? Classification: **Estimated.** The specificity of "one week" implies a measurement cadence that may not exist.

3. **"Should remain local-only or accessed through secure tunnels."** This is the most interesting part. The documentation uses "should" — a recommendation, not a control. There is no claim that the system enforces local-only access. The 21,000 exposed instances (if the number is real) are evidence that "should" is not sufficient. But the documentation never claimed it was sufficient — it claimed it was recommended.

The precision mismatch: 21,000 is stated as a measured fact. "One week" is stated as a measured duration. Neither provides its measurement source. An honest version would be: "An internet scan [by whom, using what tool, on what date] found [exact number] OpenClaw Gateway instances responding on public IP addresses. This represents [percentage] of estimated total installations."

### Verdict

Not verified. The number 21,000+ and the timeframe "one week" are stated with the confidence of measurements but provide no measurement source, methodology, or baseline. The documentation's "should remain local-only" is at least honest about being a recommendation rather than a guarantee — but the gap between "should" and reality needed a number to make it visceral, and the number provided cannot be traced. This is the most dangerous kind of precision: specific enough to drive decisions, unsourced enough to be unfalsifiable.

---

## Finding 3

**Technique:** Frame Audit
**Target:** The architecture is described as "local-first" while requiring npm global install and having cloud-connected messaging integrations; the agent "doesn't wait for you to ask — it monitors, anticipates, and acts"
**Verified:** no

### The Audit

**The frame:** OpenClaw is framed as a *local-first personal assistant*. This frame does significant work:

- "Local-first" implies your data stays on your machine. It implies privacy. It implies you are in control.
- "Personal" implies one user, one agent, private scope.
- "Assistant" implies a tool — something passive that serves your intent.

**Testing the frame by rejection.** Remove "local-first personal assistant" and describe the system by its actual behaviors:

- It runs as a globally installed npm package (requires Node.js runtime, pulls from public registry, trusts the npm supply chain).
- It connects to 20+ cloud messaging platforms, routing messages through a gateway.
- It executes skills that have filesystem and network access.
- It runs a heartbeat every 30 minutes that reads all the agent's files and decides autonomously whether to take action.
- It "monitors, anticipates, and acts" without being asked.

Reframed without the "local-first personal assistant" lens: **This is an autonomous agent with cloud connectivity, code execution capabilities, filesystem access, and a persistent monitoring loop that takes unsolicited actions.** That is a materially different risk profile than "local-first personal assistant."

The frame is load-bearing. "Local-first" suppresses questions about cloud data flow. "Personal" suppresses questions about multi-user attack surfaces. "Assistant" suppresses questions about autonomous action boundaries. Each word in the frame closes a line of inquiry that the system's actual behavior should open.

The heartbeat claim (every 30 minutes, reads all files, decides to act) is framed as a *feature* — proactive assistance. Reframed: an autonomous process with filesystem read access executes on a timer, makes decisions about action, and acts without user confirmation. Whether that is a feature or a vulnerability depends entirely on who controls the agent's instruction set — which routes back to the skill system's security model, which (per Finding 1) describes code execution as "simple markdown files."

### Verdict

Not verified. "Local-first" is a framing claim, not an architectural fact. The system's actual behaviors — cloud messaging integrations, npm supply chain dependency, autonomous timed execution, unsolicited action — are inconsistent with what "local-first" implies to a reader. The frame suppresses risk questions that the architecture should prompt. An honest frame: "A locally-installed but cloud-connected autonomous agent with filesystem access, code execution, and a periodic self-directed action loop."

---

## Finding 4

**Technique:** Source Trail
**Target:** The security model uses "pairing" mode where unknown senders receive pairing codes — claimed as sufficient DM security; gateway.auth.token and gateway.auth.password are not configured by default
**Verified:** no

### The Audit

Tracing the security claims to their sources:

**Claim: Pairing mode is sufficient DM security.**

- What is the primary source for this security model's design? Is there a threat model document? A security audit? A formal analysis of the pairing protocol? Classification: **Hearsay.** The claim that pairing is "sufficient" appears to originate from the project's own documentation — the system describing its own security as adequate. This is a **circular source**: the product says the product is secure.
- What are the properties of the pairing protocol? Is the pairing code single-use? Time-limited? What entropy does it have? Is it transmitted in-band (over the same messaging channel) or out-of-band? In-band pairing codes sent as DMs can be intercepted by anyone with access to the messaging platform's API — which, given the 20+ platform integrations, is a significant number of potential intermediaries.
- Has this pairing model been evaluated against known authentication protocol attacks (replay, MITM, phishing)? No external security evaluation is cited. The claim traces to: the project's own documentation says it works.

**Claim: gateway.auth.token and gateway.auth.password are not configured by default.**

- This is a verifiable, testable claim about default configuration. If true, it means the gateway ships in an unauthenticated state. Combined with the 21,000 publicly exposed instances (Finding 2), the implication is that some fraction of those instances may be running without authentication.
- Trace: The source is presumably the default configuration file in the repository. This is a primary source — the code is the ground truth for default configuration. Classification: **Evidenced** (if someone has verified the default config file).

**Interaction effect:** These two claims interact dangerously. The pairing model is the DM-level security. The gateway auth is the API-level security. If gateway auth is unconfigured by default, and pairing is the only other layer, then the total security posture for a default installation is: one layer of unaudited pairing protocol, zero layers of gateway authentication. The documentation presents these as two independent security features. In practice, for default installations, it is one unaudited feature and one absent feature.

### Verdict

Not verified. The pairing model's security sufficiency traces to the project's own documentation — a circular source. No external audit, threat model, or formal analysis is cited. The default-unconfigured authentication is likely verifiable from the source code (a primary source), but its interaction with the pairing model creates a security posture that the documentation does not honestly characterize. An honest version: "Pairing mode provides a basic DM verification mechanism that has not been independently audited. Gateway authentication is not enabled by default — administrators must explicitly configure auth tokens and passwords."

---

## Finding 5

**Technique:** Absence Map
**Target:** What is NOT discussed across all ten claims — the missing questions, data, perspectives, and alternatives
**Verified:** no

### The Audit

Mapping what is absent from the claims and documentation:

**Missing: A threat model.** Ten claims span security (pairing, gateway auth, malicious skills), autonomous behavior (heartbeat, proactive action), and platform reach (20+ integrations). Not one references a threat model. A system with code execution, filesystem access, cloud connectivity, autonomous action, and 20+ messaging platform integrations has a substantial attack surface. The absence of any referenced threat model means either one doesn't exist, or it exists but isn't connected to the documentation users read. Either way, security decisions are being made without a visible framework for reasoning about threats.

**Missing: Permission boundaries.** The heartbeat reads "all the agent's files" every 30 minutes. Which files? Is there a scope boundary? Can the heartbeat trigger skill execution? Can a skill modify the files the heartbeat reads, creating a feedback loop? Can a skill modify *other skills*? The permission model for what the agent can and cannot do autonomously is not described in any of the ten claims. This is the most critical absence — the system takes autonomous actions, and the boundary conditions for those actions are invisible.

**Missing: Supply chain analysis for skills.** 14 malicious skills were uploaded to ClawHub. What was the detection mechanism? How long were they available before removal? How many users installed them? What was the blast radius? What controls now exist to prevent recurrence? The claim that 14 malicious skills were found is presented as a known fact, but the response — the mitigation, the process change, the user notification — is absent. Finding the problem is step one. The absence of step two is the real story.

**Missing: User consent model for proactive actions.** "The agent doesn't wait for you to ask — it monitors, anticipates, and acts." What is the consent boundary? Can users define what the agent is allowed to do proactively versus what requires confirmation? Is there an audit log of autonomous actions? Can a user review what the heartbeat decided to do and why? The absence of a consent model for autonomous action means the system's behavior boundary is defined by the skill authors, not the user.

**Missing: Alternative architectures considered.** Why a persistent heartbeat instead of event-driven triggers? Why full filesystem access instead of a sandboxed skill runtime? Why default-off authentication instead of default-on? These design decisions have security and privacy implications, and no rationale is provided for choosing the less-secure default in each case. The absence of "we considered X but chose Y because Z" means users cannot evaluate whether the tradeoffs were made deliberately or by omission.

### Verdict

Not verified. The most consequential claims about OpenClaw — security sufficiency, safe autonomous behavior, trustworthy skill ecosystem — are made in the absence of the artifacts that would support them: threat models, permission boundary specifications, supply chain incident reports, user consent frameworks, and design rationale for security-relevant defaults. These are not minor documentation gaps. They are the missing load-bearing evidence for a system that executes code, accesses files, connects to cloud services, and takes autonomous actions. The claims fill the space where this evidence should be, substituting confidence for documentation. That is the pattern this entire audit surfaces: the confidence is present everywhere the evidence is absent.

---

*That sounds very confident. Show me the receipts.*

All 10 claims were evaluated. Five survived as findings; zero were verified. This is not an indictment of the project's functionality — it may work exactly as described. It is an indictment of the epistemic quality of the claims. Every security-relevant assertion traces either to the project's own documentation (circular), to unmeasured numbers (fabricated precision), or to framing that suppresses the questions the architecture should raise. The system may be sound. The claims are not — because they are stated with the confidence of evidence while providing none.

---

Want me to go deeper? I can do a full Source Trail on a specific technical claim or a Precision Probe across all the numbers in the document.
