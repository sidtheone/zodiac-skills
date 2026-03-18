# 鸡 Rooster — Verification Check

**Target artifact:** OpenClaw project — ten claims about the heartbeat system, malicious skill counts, platform routing, Censys exposure data, and autonomous agent behavior.

**Phase 0:** No `VALUES.md` found at repo root. Proceeding directly to audit.

---

## Finding 1

**Technique:** Confidence Audit
**Target:** The heartbeat system "runs every 30 minutes, reading through all the agent's files to determine if there's something it should do for you"
**Verified:** yes

### The Audit

The claim asserts three things: (a) a 30-minute interval, (b) reading "all the agent's files," and (c) autonomous determination of action.

Classification of each sub-claim:

- **"Every 30 minutes."** Classification: **Evidenced.** OpenClaw's own documentation confirms the default heartbeat interval is 30 minutes (or 60 minutes for OAuth-based setups). The Gateway configuration exposes this as a tunable parameter. The number is a default, not a fabrication — it is a configuration value documented in the source and adjustable by the user. Stating a default as a fact about system behavior is accurate, provided the reader understands it is a default, not an invariant. The documentation makes this clear.

- **"Reading through all the agent's files."** Classification: **Reasoned, with an important qualification.** The heartbeat reads `HEARTBEAT.md`, which is a structured checklist. It does not scan every file in the workspace directory on every tick. The agent reads the heartbeat checklist, then may access other files as needed to complete the tasks on that checklist. "Reading through all the agent's files" is a simplification that overstates the scope of the default read operation. An honest version: "reads the heartbeat checklist and accesses whatever files are needed to evaluate its tasks." The difference matters because "all files" implies surveillance-level scanning, while the actual behavior is task-directed file access.

- **"Determine if there's something it should do for you."** Classification: **Evidenced.** This is an accurate description of the heartbeat's documented behavior. The agent evaluates its checklist, and if nothing requires action, returns `HEARTBEAT_OK`, which the Gateway suppresses. The decision logic is real, the suppression mechanism is documented, and the "do nothing" path is a genuine exit. This is not a fabricated capability claim — it is a description of implemented behavior with a verifiable control flow.

The claim's overall confidence level is slightly above what its evidence warrants. Two of three sub-claims check out. The middle sub-claim — "all the agent's files" — inflates the scope of the read operation. But the inflation is in the direction of making the system sound *more* intrusive than it is, not less. This is the unusual case: confidence overstatement that makes the product look worse, not better.

### Verdict

Verified, with a minor precision caveat. The 30-minute default and the autonomous action-determination are both documented and implemented. "Reading through all the agent's files" is an overstatement — the heartbeat reads a specific checklist file and then accesses other files as needed. The claim is honest in its direction (this system does act autonomously) and imprecise in its scope (it does not blindly read everything). The confidence approximately matches the evidence. This one earns its assertion.

---

## Finding 2

**Technique:** Precision Probe
**Target:** "14 malicious skills were uploaded" to ClawHub, cited as the scope of the supply chain incident
**Verified:** no

### The Audit

The number 14 appears in the claim as a specific count of malicious skills uploaded to ClawHub. Let us trace this number and test its precision.

- **Source of "14."** Tom's Hardware reported that "at least 14 malicious skills" were uploaded to ClawHub between January 27 and 29, 2026. The report was based on research by OpenSourceMalware. Classification: **Measured, but with a critical caveat.** The number was a count at a point in time during an active campaign, not a final tally. Tom's Hardware itself qualified it with "at least" — the measurement was explicitly a lower bound.

- **What happened after the count of 14.** Koi Security conducted a comprehensive audit of all 2,857 skills on ClawHub and identified 341 malicious entries. Of those, 335 used fake prerequisites to install Atomic Stealer (AMOS) malware on macOS. The activity was codenamed ClawHavoc. Separately, CyberPress reported 1,184 malicious skills in a later sweep. The number did not stabilize at 14. It did not stabilize at 341. The real measurement trajectory was: 14 -> 341 -> 1,184.

- **Precision analysis.** "14 malicious skills" is not a wrong number. It was the correct count on approximately January 29. But stating it in present context — as the characterization of the ClawHub supply chain incident — is like saying "3 cases of COVID were reported in Wuhan." Technically true at one instant. Catastrophically misleading as a summary. The number 14 anchors the reader's risk assessment at a scale that is 1-2 orders of magnitude below the actual scope.

  | Timestamp | Count | Source |
  |-----------|-------|--------|
  | Jan 27-29 | 14 | Tom's Hardware / OpenSourceMalware |
  | Early Feb | 341 | Koi Security audit of full ClawHub |
  | Later Feb | 1,184 | CyberPress / ClawHavoc tracking |

- **What an honest range looks like.** "Between January 27 and late February 2026, security researchers identified between 341 and 1,184 malicious skills on ClawHub, beginning with an initial discovery of 14 on January 29. The campaign was ongoing at the time of measurement."

### Verdict

Not verified. The number "14" is a real measurement from a real source, but it is a snapshot from the first 48 hours of a campaign that ultimately produced 341-1,184 confirmed malicious entries. Using "14" to characterize the incident is fabricated precision through omission — it selects the smallest legitimate number from a rapidly escalating series and presents it as the scope. This is more misleading than stating no number at all, because the specificity of "14" creates false confidence that the problem was contained at that scale. It was not.

---

## Finding 3

**Technique:** Frame Audit
**Target:** "The project supports 20+ messaging platforms with unified routing"
**Verified:** no

### The Audit

**The frame:** OpenClaw is framed as a *unified multi-platform messaging gateway*. The "20+" number and the word "unified" do specific framing work:

- "20+" implies broad, mature platform coverage — a system that has achieved critical mass across the messaging landscape.
- "Unified routing" implies a single, consistent integration architecture — messages from all platforms are treated equivalently by one routing layer.

**Testing the frame by rejection.** Remove "unified" and examine what "20+ messaging platforms" actually means architecturally:

The documentation distinguishes between **built-in/native channels** (WhatsApp, Telegram, Discord, Slack, IRC, Google Chat, Signal) and **plugin/separately-installed channels** (Feishu, Mattermost, Microsoft Teams, LINE, Nextcloud Talk, Matrix, Nostr, Tlon, and others). These are not equivalent categories. A built-in channel is maintained by the core team, tested against the Gateway's protocol, and updated with releases. A plugin channel is maintained by a third party, may lag behind protocol changes, and has its own dependency chain.

Counting both categories as a single number and calling the result "unified" is a framing choice that suppresses a question users should be asking: *which of these 20+ integrations are first-class, and which are community-maintained plugins that might break on upgrade?*

**The deeper frame problem.** "Supports 20+ messaging platforms" frames platform count as a feature. But each additional platform integration is also an additional:

- Attack surface (each platform's API is a potential ingress point for malicious messages)
- Authentication boundary (each platform has its own identity model; "pairing" must work across all of them)
- Maintenance burden (platform API changes can break integrations)
- Trust dependency (messages routed from 20+ platforms all converge on one agent with filesystem and code execution access)

The frame presents breadth as capability. An alternative frame presents the same breadth as exposure. Neither frame is wrong, but the project's positioning exclusively uses the capability frame and never acknowledges the exposure frame. This is not a lie — it is a sales pitch occupying the space where a risk assessment should also live.

**Does the answer change when the frame is rejected?** Yes. "A single agent with filesystem access and code execution that accepts instructions from 20+ messaging platforms, some maintained by the core team and some by third-party plugin authors" prompts fundamentally different security questions than "20+ platforms with unified routing." The frame is load-bearing.

### Verdict

Not verified. "20+ messaging platforms with unified routing" conflates first-party and third-party integrations into a single count and frames breadth exclusively as capability rather than exposure. The routing is not architecturally "unified" — it spans built-in channels and separately-installed plugins with different maintenance and security characteristics. The framing suppresses the question: how does the security model scale across 20+ inbound message sources, each with its own trust boundary, all converging on one agent with system-level permissions? That question has no visible answer in the documentation, which means the frame is doing load-bearing work the architecture has not backed up.

---

## Finding 4

**Technique:** Source Trail
**Target:** "21,000+ instances were publicly exposed within one week" — the Censys analysis measured this
**Verified:** yes

### The Audit

Tracing the claim to its origin, hop by hop:

**Hop 1: The primary source.** Censys published a blog post titled "OpenClaw in the Wild: Mapping the Public Exposure of a Viral AI Assistant." Censys is a search engine for internet-connected devices — scanning publicly routable IP addresses and identifying services by their responses is its core product. This is not a secondary source reporting someone else's findings. Censys performed the measurement using its own infrastructure.

**Hop 2: The methodology.** Censys identified exposed instances through HTML title queries targeting "Moltbot Control" and "clawdbot Control" landing pages (reflecting the project's prior names). The scan targeted TCP port 18789, which is OpenClaw's documented default Gateway port. The methodology is straightforward banner/title matching — a standard technique for internet-wide service enumeration that Censys has applied to thousands of services. The approach has known limitations (it misses instances on non-standard ports or behind non-standard configurations) but is well-established.

**Hop 3: The specific number.** Censys reported 21,639 publicly exposed instances as of January 31, 2026. This is not "21,000+" — it is a precise count rounded in the claim. The original measurement is more precise than the version being audited. Classification: **Measured.** The rounding is conservative (toward less precision), which is the honest direction to round.

**Hop 4: The "one week" timeframe.** Censys tracked adoption growth from approximately 1,000 instances to over 21,000 in under a week. This implies at least two measurement points — a baseline and the January 31 snapshot. Internet-wide scanning services like Censys typically run periodic scans (daily or more frequently), making a week-over-week comparison methodologically sound for their platform.

**Hop 5: Independent corroboration.** The Censys findings were cited by Acronis TRU in their security report, and independently corroborated by reporting from Reco AI, Conscia, Dark Reading, SecurityWeek, Bitsight, CyberPress, and Cisco Blogs. The Acronis TRU report adds geographic distribution data (US, China, Singapore as top concentrations) and cloud provider analysis, suggesting access to either independent scan data or detailed Censys results.

**Source classification:** Primary source (Censys performed the measurement). Standard methodology (banner/title scanning on known port). Precise count available (21,639, rounded to 21,000+ in the claim). Independent corroboration from multiple security research organizations. Growth trajectory supported by periodic scan data.

This is what evidence looks like.

### Verdict

Verified. The 21,000+ figure traces to a primary source (Censys) using a documented, standard methodology (HTML title matching on TCP/18789), producing a precise count (21,639) as of a specific date (January 31, 2026). The "one week" growth trajectory is supported by periodic scan comparisons. The claim is corroborated by multiple independent security research organizations. The confidence matches the evidence. The claim that was rounded *down* from its source measurement rather than up is a small but genuine epistemic signal — someone was being careful with this number.

---

## Finding 5

**Technique:** Absence Map
**Target:** "The agent doesn't wait for you to ask — it monitors, anticipates, and acts" combined with "pairing mode where unknown senders receive pairing codes — claimed as sufficient DM security"
**Verified:** no

### The Audit

These two claims — autonomous action and DM-based pairing security — are presented as independent features in the documentation. But they interact, and the interaction creates absences that neither claim addresses alone.

**Missing: Autonomous action audit trail.** The heartbeat system acts without user prompting. The agent "monitors, anticipates, and acts." What record exists of what the agent decided to do and why? The documentation describes `HEARTBEAT_OK` as the suppressed response when nothing needs doing — but what is logged when the agent *does* act? Is there a reviewable history of autonomous decisions? Can a user reconstruct, after the fact, what the agent did at 3:17 AM and why? The absence of a documented audit mechanism for autonomous actions means the user cannot distinguish between "the agent helpfully sent a reminder" and "a compromised skill used the heartbeat to exfiltrate data." Both look like the agent acting proactively. One is a feature. One is a breach.

**Missing: Pairing protocol specification.** The pairing mode is described as a mechanism where unknown senders receive pairing codes. What is absent: the protocol specification. What is the code's entropy? Is it time-bounded? How many attempts before lockout? Is the code transmitted in-band (over the same messaging channel) or out-of-band? If in-band, anyone with read access to the messaging platform's API can intercept the code. Given that OpenClaw connects to 20+ messaging platforms, each with its own API access model, the attack surface for pairing code interception is the union of all those platforms' security models. None of this analysis is present in the documentation.

**Missing: Interaction model between autonomous action and compromised pairing.** If an attacker successfully pairs with the agent via a messaging platform, what autonomous actions become available to them? Can a paired device trigger skill installation? Can it modify `HEARTBEAT.md`? Can it add tasks to the heartbeat checklist that will execute every 30 minutes with the agent's full permissions? The intersection of "anyone can attempt pairing" and "the agent acts autonomously on its checklist" creates an attack path that neither feature's documentation addresses: pair -> modify checklist -> wait 30 minutes -> agent executes attacker's task with full system access.

**Missing: Revocation and de-pairing.** If a device is paired and later compromised, what is the revocation mechanism? Can paired devices be listed and individually revoked? Is there a notification when a new device pairs? The documentation describes pairing as a one-time event. The absence of de-pairing documentation means the security model may be append-only — once paired, always paired — which means a single compromised pairing persists indefinitely.

**Missing: Rate limiting on pairing attempts.** If pairing codes are short (4-6 digits) and there is no rate limit on attempts, brute-force pairing is feasible. If the code is sent as a DM on a messaging platform, the attacker can read the code from the platform (if they have API access) or brute-force it (if they don't). The absence of documented rate limiting or lockout means we cannot evaluate whether pairing is a speed bump or a wall.

### Verdict

Not verified. The autonomous action system and the pairing security model are documented as independent features, but their interaction creates an attack surface that neither feature's documentation addresses. The most critical absences: no documented audit trail for autonomous actions, no public pairing protocol specification, no analysis of how a compromised pairing interacts with the heartbeat's autonomous execution, no revocation mechanism documentation, and no rate limiting specification for pairing attempts. These are not edge-case omissions. They are the core questions that any security review of "autonomous agent + DM-based authentication" would ask first. Their absence means the security model cannot be evaluated — which is different from saying it is insecure, but is itself an epistemic failure. A security claim that cannot be verified is not a security claim. It is a promise.

---

*That sounds very confident. Show me the receipts.*

Five claims audited. Two verified: the Censys 21,000+ exposure measurement traces to a primary source with a documented methodology and independent corroboration (Finding 4), and the heartbeat's 30-minute cycle with autonomous action determination is accurately described with a minor scope overstatement (Finding 1). Three were not verified: the "14 malicious skills" count understates the actual scope by 1-2 orders of magnitude (Finding 2), "20+ platforms with unified routing" conflates architecturally distinct integration tiers and frames exposure as pure capability (Finding 3), and the intersection of autonomous agent action with DM pairing security has critical undocumented gaps that prevent evaluation (Finding 5).

The pattern across the unverified findings is consistent: where the evidence is strongest (Censys scan data), the claims are most honest. Where the evidence would be most uncomfortable (supply chain breach scale, security model gaps), the claims are most imprecise. That correlation is worth noticing.

---

Want me to go deeper? I can do a full Source Trail on a specific technical claim or a Precision Probe across all the numbers in the document.

Sources:
- [Censys: OpenClaw in the Wild](https://censys.com/blog/openclaw-in-the-wild-mapping-the-public-exposure-of-a-viral-ai-assistant/)
- [Acronis TRU: OpenClaw Architecture, Adoption, and Security Risks](https://www.acronis.com/en/tru/posts/openclaw-agentic-ai-in-the-wild-architecture-adoption-and-emerging-security-risks/)
- [Tom's Hardware: Malicious OpenClaw Skill Targets Crypto Users](https://www.tomshardware.com/tech-industry/cyber-security/malicious-moltbot-skill-targets-crypto-users-on-clawhub)
- [The Hacker News: 341 Malicious ClawHub Skills](https://thehackernews.com/2026/02/researchers-find-341-malicious-clawhub.html)
- [CyberPress: ClawHavoc 1,184 Malicious Skills](https://cyberpress.org/clawhavoc-poisons-openclaws-clawhub-with-1184-malicious-skills/)
- [OpenClaw Heartbeat Documentation](https://docs.openclaw.ai/gateway/heartbeat)
- [OpenClaw Security Documentation](https://docs.openclaw.ai/gateway/security)
- [OpenClaw Chat Channels Documentation](https://docs.openclaw.ai/channels)
- [DeepWiki: OpenClaw Authentication and Device Pairing](https://deepwiki.com/openclaw/openclaw/2.2-authentication-and-device-pairing)
- [OpenClaw GitHub README](https://github.com/openclaw/openclaw/blob/main/README.md)
