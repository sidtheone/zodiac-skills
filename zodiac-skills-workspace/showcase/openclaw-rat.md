# 鼠 Rat — Consequence Map

**Target System:** OpenClaw — open-source personal AI assistant framework
**Change Under Analysis:** Adding sandboxing to the skills execution system (containerizing or restricting skill code from direct filesystem/network access)
**Phase 0:** No `VALUES.md` found. Proceeding without stated team values.

---

## Finding 1

**Technique:** Blast Radius
**Target:** Sandboxing the Code Executor that runs skill code — restricting filesystem and network access for all skill execution
**Contained:** no

### The Chain

**1-hop:** The 20+ existing skills that currently rely on direct filesystem and network access stop working. Every skill that reads local files, accesses API keys from persistent memory storage paths, makes HTTP requests to external services, or interacts with Chrome/Chromium via local protocols will hit sandbox permission boundaries. Skills installed from ClawHub and skills written locally are affected identically. The Code Executor itself needs refactoring — it currently hands raw code to the runtime with no isolation layer, and now it must broker every I/O call through a sandbox boundary.

**2-hop:** The 20+ messaging channel integrations depend on skills executing actions on their behalf. A Slack skill that reads a credential file, calls the Slack API, and posts a message is now three sandbox violations. The integrations don't just fail — they fail *silently or partially*. A skill that successfully constructs a message but cannot reach the network will appear to succeed from the LLM's perspective (code ran, no exception if the sandbox swallows errors), but the message never arrives. The LLM's persistent memory records that the action was taken. The user sees nothing. The system's state diverges from reality. Meanwhile, ClawHub — the skills marketplace — now has a registry full of skills that are incompatible with the sandboxed runtime. Every skill listing that advertises filesystem or network capabilities is now false advertising. ClawHub has no metadata field distinguishing "sandbox-compatible" from "sandbox-incompatible" skills.

**3-hop:** The Cron & Heartbeat system schedules skill executions for future runs. Skills that were scheduled *before* sandboxing was enabled will execute *after* sandboxing is enabled — but they were authored, tested, and scheduled assuming unsandboxed execution. The heartbeat fires every 30 minutes. On the first heartbeat after sandbox deployment, every scheduled skill that touches the filesystem or network fails. But worse: the cron system doesn't know *why* a skill failed. It retries. It retries again. The retry storm hits the sandbox broker layer (whatever mediates permission requests), and the system that was designed to be a quiet background assistant is now burning cycles on 30-minute retry loops for skills that will never succeed under the new security model. The user's scheduled automations — the ones they set up and forgot about, the ones that "just work" — stop working on a day the user isn't paying attention.

### Verdict

Not contained. The team is framing this as a security change to the Code Executor, but the blast radius extends through ClawHub's entire skill catalog, through scheduled tasks in the Cron & Heartbeat system, and through the LLM's persistent memory (which will accumulate false records of "completed" actions that the sandbox silently blocked). The change boundary is "Code Executor," but the consequence boundary is "every system that assumes skill code can touch the world."

---

## Finding 2

**Technique:** Failure Chain
**Target:** The partial-deployment window where sandboxing is enabled but skill code has not been updated to use sandbox-aware APIs
**Contained:** no

### The Chain

Step 1 succeeds: The sandbox is deployed around the Code Executor. The runtime now intercepts filesystem and network syscalls from skill code. A permission model exists — some form of allow/deny for specific paths and hosts.

Step 2 fails: A skill attempts to read `~/.openclaw/credentials.json` to retrieve an API key for an external service. The sandbox denies the read. But here's the failure chain — the skill was written by a community developer on ClawHub who didn't handle permission errors (why would they? permissions never failed before). The skill catches the generic exception, logs "credential file not found," and proceeds with a `null` API key. It then makes a network call to the external service with no authentication. The external service returns a 401. The skill interprets this as "service is down" and writes to persistent memory: "Service X is currently unavailable — will retry on next heartbeat."

System state after partial failure: Persistent memory now contains a false record. The credential file exists and is valid — the sandbox just blocked access to it. The external service is operational — the skill just called it without auth. On the next heartbeat (30 minutes later), the skill runs again. Same chain. Same false record. Persistent memory now has two entries claiming Service X is down. The LLM, reading persistent memory for context in the next user interaction, tells the user: "I've been unable to reach Service X — it appears to be experiencing an outage." The user contacts Service X's support team. There is no outage.

The corruption compounds: every 30-minute heartbeat adds another false "service down" record to persistent memory. The LLM's confidence that Service X is broken increases with each record. By the time someone investigates, persistent memory contains 48 entries (24 hours of heartbeats) all confirming an outage that never happened.

### Verdict

Not contained. The failure chain shows that sandboxing without updating skill error handling creates a *state corruption* problem, not just a "skill doesn't work" problem. The partial failure pathway — sandbox denies access, skill misinterprets denial as a different kind of failure, skill writes incorrect state to persistent memory, LLM acts on incorrect state — is not a hypothetical edge case. It's the default path for every skill that was written before sandboxing existed, which is every skill.

---

## Finding 3

**Technique:** Dependency Inversion
**Target:** What depends on *unsandboxed execution* as an assumed capability — not what the sandbox restricts, but what breaks when the assumption of unrestricted access is removed
**Contained:** no

### The Chain

The obvious dependents of unsandboxed execution are skills themselves. But inverting the dependency reveals three non-obvious consumers of the "skills can do anything" property:

**Dependent 1: The LLM's autonomous code authoring.** The LLM doesn't just execute pre-written skills — it writes, saves, and executes code autonomously via the Code Executor. The LLM was trained (via its system prompt and in-context behavior patterns) to write code that reads files, makes network calls, and manipulates the filesystem. When it generates a Python snippet to answer a user query — say, "read my calendar file and summarize today's events" — it writes code that calls `open('/path/to/calendar.ics')`. Under sandboxing, this code fails. But the LLM doesn't know the sandbox exists. It has no model of sandbox permissions. It will generate the same code, watch it fail, attempt to debug it (maybe it's a path issue?), generate a slightly different version, watch that fail, and enter a retry loop. The user asked for their calendar summary and instead watches the LLM argue with an invisible wall.

**Dependent 2: Browser control.** Skills interact with Chrome/Chromium via local protocols — likely DevTools Protocol over a local WebSocket or Unix socket. The sandbox, if it restricts network access, blocks localhost and Unix socket connections. Browser control doesn't look like "network access" from the skill author's perspective — it's a local IPC mechanism. But from the sandbox's perspective, a WebSocket connection to `localhost:9222` is a network call. The entire browser automation capability — one of OpenClaw's distinguishing features — goes dark. And this isn't a skill-by-skill problem: browser control is a *platform capability* that multiple skills compose on top of. Every skill that automates browser tasks — form filling, web scraping, automated testing — loses its foundation.

**Dependent 3: Inter-skill communication.** If skills communicate via shared filesystem state (writing output files that other skills read) or via network calls to the Gateway's WebSocket on port 18789, the sandbox blocks both pathways. Skills that were designed as pipelines — skill A fetches data, writes to a file, skill B reads the file and processes it — break at the handoff point. The Gateway itself, running on `localhost:18789`, becomes unreachable from inside the sandbox if outbound network access is restricted. Skills can no longer report their status, send messages through channel integrations, or coordinate with the central control plane.

### Verdict

Not contained. The dependency inversion reveals that "unsandboxed execution" isn't just a security posture — it's an *implicit API contract* that the LLM's code generation, browser control, and inter-skill communication all depend on. Sandboxing doesn't just restrict skills; it severs the communication pathways that make OpenClaw a coherent system rather than a collection of isolated scripts. The team is thinking about what skills access. They need to think about what accesses skills — and what accesses what skills access.

---

## Finding 4

**Technique:** The Tuesday Problem
**Target:** Temporal edge cases during and after sandbox rollout — what happens when sandboxed and unsandboxed execution coexist in time
**Contained:** no

### The Chain

**The Deploy Day Problem:** Sandboxing is enabled at 2:00 PM on a Tuesday. The cron system has a job scheduled for 2:30 PM — a skill that backs up the user's notes directory to a cloud storage service. This skill was scheduled last Thursday. It has run successfully every day since. At 2:30 PM, it runs inside the sandbox for the first time. It cannot read the notes directory. It cannot reach the cloud storage API. The backup fails. No backup is created. But the cron system marks the job as "executed" (it did execute — it just failed). The user's daily backup chain, which has been running for months, has a gap. If the user needs to restore from today's backup next week, it doesn't exist.

**The Version Coexistence Problem:** OpenClaw likely doesn't have atomic deployment. During the rollout window, some components are sandboxed and some aren't. The Gateway on port 18789 is still unsandboxed (it's the control plane, not a skill). A skill running in the sandbox tries to connect to the Gateway to report its status. The connection is blocked. The Gateway doesn't receive a heartbeat from the skill. The Gateway's monitoring thinks the skill crashed. It may attempt to restart it. Now you have two instances of the skill — the original (blocked by the sandbox) and the restart (also blocked by the sandbox). Both are trying to do the same work. Neither can communicate with the Gateway.

**The Day-After Problem:** Day 1 post-deploy, the user installs a new skill from ClawHub. The skill was uploaded yesterday (pre-sandbox). It was tested by its author in an unsandboxed environment. The skill's ClawHub listing says "reads your local config files to customize behavior." The user installs it. It can't read config files. The user doesn't know why. The ClawHub listing doesn't mention sandbox compatibility because sandbox compatibility didn't exist when the skill was published. The user opens a GitHub issue: "Skill X doesn't work." The skill author responds: "Works on my machine" (they're running an older, unsandboxed version). This isn't a single support ticket — it's the template for every skill-related issue filed for the next six months.

### Verdict

Not contained. The Tuesday Problem reveals that sandboxing creates three distinct temporal failure modes: the cut-over moment (scheduled jobs that straddle the boundary), the coexistence window (mixed sandboxed/unsandboxed components), and the long tail (ClawHub skills authored before sandboxing that are installed after sandboxing). The team is planning a point-in-time change, but the consequences are distributed across time — past schedules, present deployment, and future installations.

---

## Finding 5

**Technique:** Rollback Trace
**Target:** Rolling back the sandbox after it's been deployed and users have adapted to it
**Contained:** yes

### The Chain

Walk the rollback step by step.

**Step 1: Disable the sandbox.** The Code Executor returns to unsandboxed execution. All skill code runs with full filesystem and network access. This step is reversible — the sandbox is a runtime wrapper, and removing it returns the system to its prior state.

**Step 2: Skills that were updated to work with sandbox APIs.** During the sandboxed period, some skill authors updated their code to use sandbox-aware permission request APIs (if such APIs were provided). These updated skills now contain sandbox API calls that don't exist in the unsandboxed runtime. But this is a *graceful* failure: if the sandbox API was designed as a passthrough (request permission, receive grant, proceed), removing the sandbox means the permission layer is gone but the underlying operation still works. The API calls either no-op or fail, but the actual filesystem/network operations succeed because there's no sandbox to block them. This is contained *if* the sandbox API was designed as an additive layer rather than a replacement for direct I/O.

**Step 3: ClawHub metadata.** If the team added sandbox compatibility metadata to ClawHub during the sandboxed period (marking skills as "sandbox-compatible" or "requires filesystem access"), this metadata is now meaningless but not harmful. It's a vestigial field. Skills that were marked "sandbox-compatible" still work fine unsandboxed. No data corruption.

**Step 4: Persistent memory.** Any false records written during the sandboxed period (per Finding 2) still exist in persistent memory. Rolling back the sandbox doesn't clean persistent memory. But the new unsandboxed skill executions will produce *correct* records going forward, and the LLM will eventually weight recent accurate records over older false ones. The contamination fades but doesn't vanish instantly.

**Step 5: Security posture.** The 14 malicious skills that motivated sandboxing are still on ClawHub. Rolling back re-exposes the system to the exact threat that triggered the change. But this is a *known* consequence, not a hidden one. The team made a deliberate tradeoff.

### Verdict

Contained. The rollback path is clean. The sandbox is an additive runtime layer, and removing it returns the system to its prior state without irreversible side effects. The worst artifact of rollback — contaminated persistent memory from false failure records — is self-healing over time. This is a well-structured change from a reversibility standpoint: deploying it may cause the consequences mapped in Findings 1-4, but *un*-deploying it doesn't compound those consequences further.

---

*Want me to trace the full dependency graph for a specific component? I can map every downstream consumer and their failure modes.*
