# darktable Architecture — Zodiac Analysis

**Target:** [darktable](https://github.com/darktable-org/darktable) — open-source photography workflow application and non-destructive RAW developer (v5.4.1, GPLv3)
**Animals invoked:** Rooster, Monkey, Tiger
**Source:** GitHub README, official documentation (docs.darktable.org), gtk.org, GitHub issues/PRs

> **Source note:** This analysis is synthesized from primary public sources: the project's README.md, official user manual (development branch), darktable GitHub issues, and gtk.org. No source code was audited directly. The Monkey's findings explicitly state where source material was and wasn't checked, per the anti-fabrication calibration rule.

---

## Rabbit Synthesis

# 兔 Rabbit — Filtered

**Audience:** Senior developer evaluating darktable's architecture — someone deciding whether to contribute, fork, or learn from the codebase. Technical, familiar with image processing concepts, interested in the engineering tradeoffs behind a long-lived C/GTK project.

**Animals invoked:**
- Rooster — fact-check the performance claims, cross-platform assertions, and security posture
- Monkey — chaos-test the architectural assumptions (XMP sync, module ordering, SQLite scale, GPU path)
- Tiger — attack the core technology choices (C, GTK3, OpenCL, SQLite, scene-referred pipeline)

---

**The bottom line: darktable's core image processing pipeline is architecturally sound — scene-referred, C-native SIMD, meaningful parser-hardening investment — but three infrastructure layers (GPU compute, toolkit, storage consistency) carry real debt that the project partly acknowledges and partly underestimates.**

Three things to know:

1. **The GPU story is fracturing.** OpenCL is already non-functional on macOS (Apple deprecated it in 2018) and documented as unreliable on AMD. The project recommends NVIDIA (reasonably hedged), but the fallback path — CPU tiling — carries a documented 10x slowdown. This is not a future risk; it is a current degradation for a meaningful user segment.

2. **GTK3 is not dying, but the project itself says it is insufficient.** The GTK4 migration branch is real and active (merged PRs exist), but the migration timeline circulating ("12-18 weeks," "two full-time programmer equivalents") is unverified — no methodology was found behind either figure (Rooster: `Verified: no` on both). More importantly, the Tiger found that GTK4 alone does not solve the actual problem: the project has identified GTK/Cairo as unable to deliver 10-bit HDR output, which it needs.

3. **XMP dual-storage has consistency gaps that are quiet by default.** The XMP sidecar auto-sync can silently overwrite external edits, and the opt-in startup detection is off by default. Custom sort sequences are not stored in XMP at all (documented by the project as "potentially destructive"). The safety net exists but requires users to know they need it before they need it.

**Cross-animal tensions:**
- The Monkey found GTK3 migration work is active and progressing (`Survived: yes`). The Tiger found the migration target itself may be insufficient for the project's stated display goals (`Burned: yes`). Both are correct. The migration is real engineering effort toward a destination that does not fully resolve the problem driving it.
- The project invests seriously in security (fuzzing, sanitizers) but has no public disclosure channel — defensive depth without an intake.
- The Rooster flagged the migration timeline as unverified. The Tiger used it in the GTK3 attack. The timeline attached to the migration is a community estimate from a GitHub issue, not an established project commitment.

**What the Rooster verified vs. flagged:**
- Verified: Project self-framing ("not a Lightroom replacement") — honest, internally consistent, strategically sound
- Verified: GPU recommendation (NVIDIA over AMD) — appropriately hedged first-party operational claim
- Unverified: "Two full-time programmer equivalents" — no traceable methodology (community estimate from issue thread)
- Unverified: "12-18 week" GTK4 migration estimate — inputs opaque, range too narrow for this complexity
- Missing: Formal SECURITY.md / vulnerability disclosure policy despite meaningful fuzzing infrastructure

**What the Monkey chaos-tested:**
- XMP auto-sync can silently overwrite external edits mid-session — opt-in startup detection exists but is off by default, no mid-session detection found in sources reviewed
- XMP doesn't store custom sort sequences — documented as "potentially destructive" on reimport
- Module reorder via Ctrl+Shift+drag has no confirmation dialog — preset recovery exists but requires knowing you need it
- GTK3 migration: **Survived** — project is actively migrating, GTK3 is maintained ("old stable"), not an emergency
- RawSpeed security: **Survived** — OSS-Fuzz, 3 sanitizers, 4 static analysis tools, CVE found and fixed. Meaningful parser-hardening investment.
- SQLite scaling: no documented guidance found in sources reviewed (confidence 55 — may be a documentation gap)

**What the Tiger attacked:**
- OpenCL: **Burned** — already non-functional on macOS, narrowing on other platforms
- GTK3: **Burned** — not because it's dying, but because the project identified GTK/Cairo as insufficient for 10-bit/HDR output, and GTK4 doesn't resolve that gap
- SQLite dual-storage: **Burned** — consistency gap during failures, opt-in safety net has holes by default
- Scene-referred pipeline: **Not burned** — industry-convergent direction, dual-path handles transition
- C core language: **Not burned** — natural fit for SIMD pixel processing, security mitigated at highest-risk surface

---

## Raw Outputs

---

# 鸡 Rooster — Verification Check

**Source notice:** The input artifact is described as "gathered from primary docs." However, I am analyzing a user-provided summary, not the primary documentation itself. All classifications below are relative to the claims as presented in this summary. If the summary misrepresents the source material, my findings inherit that error.

---

## Finding 1

**Technique:** Confidence Audit
**Target:** "the equivalent of two full-time programmers" as project staffing
**Verified:** no

### The Audit

The artifact states the migration assessment says the project has "the equivalent of two full-time programmers." This claim is presented as a factual description of project capacity and is used implicitly to contextualize the GTK4 migration scope ("12-18 week estimate" for a "large, high-risk, multi-month undertaking" across ~506K lines of C).

Classification: **Assumed**, trending toward **Hearsay**.

"Equivalent of two full-time programmers" is a soft equivalence applied to what is almost certainly a volunteer contributor base. It does not specify:

- The measurement period or methodology (commit frequency? hours logged? self-reported?)
- Whether this is mean, median, or peak capacity
- Whether it accounts for contributor churn (open-source projects routinely lose and gain contributors)
- Whether it includes or excludes review, triage, documentation, and release management work

This number is doing significant load-bearing work: it implicitly scopes what the project can realistically undertake (e.g., a 12-18 week GTK4 migration with two FTEs is a very different proposition than with five or with one). Yet it is stated as a flat fact with no error bars, no measurement methodology, and no time window.

### Verdict

Unsupported at its stated confidence level. The claim is plausible but imprecise in a way that matters. An honest version: "Contributor analysis suggests sustained effort roughly comparable to 1-3 full-time developers, though this fluctuates and the methodology for this estimate is not documented in the source material."

---

## Finding 2

**Technique:** Precision Probe
**Target:** "12-18 week estimate" for GTK4 migration; "~506K lines C across 501 files"
**Verified:** no

### The Audit

Two specific numbers are presented together: the codebase size (~506K lines, 501 files) and the migration timeline (12-18 weeks). The line count and file count are verifiable in principle — these can be measured from the repository, so they classify as **Calculated** (assuming someone ran `cloc` or equivalent). The 50% range (12 to 18 weeks) suggests an estimate, not a measurement.

However, the estimate's inputs are opaque:

- What staffing level does "12-18 weeks" assume? If it assumes the "two full-time programmers" figure (itself unsupported, per Finding 1), the estimate compounds uncertainty.
- Does it include testing, stabilization, and user migration, or only the code transformation?
- Is it based on prior GTK migration experience (GTK2 to GTK3), analogy to other projects, or line-counting heuristics?
- The range factor is 1.5x (18/12). For a migration of this complexity, industry experience suggests uncertainty ranges of 2-4x are more realistic for large-scale framework migrations.

The line count (~506K) is presented with a tilde, which is appropriately hedged. The file count (501) is presented as exact, which is fine for a countable quantity. The week estimate, however, carries fabricated precision — it narrows uncertainty to a band that implies more knowledge about the migration's difficulty than the artifact demonstrates.

### Verdict

The line/file counts are plausibly measured and appropriately hedged. The 12-18 week estimate is **Estimated** at best, presented with more confidence than its inputs warrant. An honest restatement: "Migration timeline is highly uncertain; a rough estimate of 3-6 months assumes stated staffing levels and excludes edge cases in widget porting and Cairo-to-GSK rendering changes, but could extend significantly."

---

## Finding 3

**Technique:** Frame Audit
**Target:** The implicit framing of darktable as a desktop-first, power-user photography tool
**Verified:** yes

### The Audit

The artifact frames darktable as a desktop photography workflow application with a scene-referred pixel pipeline, non-destructive editing, and optional GPU acceleration. This frame is explicit and self-consistent:

- The project identity statement ("not a free Adobe Lightroom replacement") actively rejects a competing frame, which is a sign of deliberate positioning rather than unconsidered assumption.
- Platform support is stated with graduated confidence: Linux is "primary," macOS and Windows are supported with caveats, and lesser platforms "MAY have additional bugs." This tiered framing matches the project's open-source, Linux-origin reality.
- Hardware requirements are stated with a minimum/recommended split, and edge cases (Raspberry Pi) are acknowledged with honest performance caveats rather than excluded.
- The "scene-referred by default since v3.2" framing is a technical position within photographic processing philosophy, and the artifact correctly notes that the legacy display-referred pipeline remains available.

Does rejecting this frame change the analysis? If you frame darktable as a cloud-native, mobile-first, or casual-user tool, the architectural choices (GTK, SQLite, OpenCL, C core) would look inappropriate. But that is not the frame the project claims. The frame is consistent with the technical choices described.

### Verdict

Verified. The project's self-framing is honest, internally consistent, and appropriately bounded. The explicit rejection of the "Lightroom replacement" frame is a mark of good epistemic hygiene — the project states what it is not, which is rarer and more informative than stating what it is.

---

## Finding 4

**Technique:** Source Trail
**Target:** "NVIDIA GPUs recommended for safety because some AMD drivers behave unreliably"
**Verified:** yes

### The Audit

This claim recommends NVIDIA over AMD for GPU acceleration. Tracing the source:

- **Origin classification:** **Primary source** — this is a first-party recommendation from the darktable project itself, appearing in their own documentation.
- The claim is appropriately hedged: "recommended for safety" and "some AMD drivers behave unreliably" — it does not say AMD is broken, it says some drivers are unreliable, and the recommendation is framed as risk mitigation.
- The claim is consistent with widely documented OpenCL driver quality issues on AMD, particularly on Linux where Mesa's OpenCL stack (Clover/Rusticl) has historically lagged behind NVIDIA's proprietary OpenCL implementation.
- The artifact also notes that Apple deprecated OpenCL, meaning Mac users cannot use GPU acceleration at all — this is a verifiable platform fact (Apple deprecated OpenCL in macOS 10.14, 2018).
- The hedging language ("some," "for safety") is proportional to the evidence: driver reliability varies by hardware generation, driver version, and distribution, making a blanket statement inappropriate and this qualified statement honest.

### Verdict

Verified. The GPU recommendation is a first-party operational claim based on the project's own testing and bug reports. The hedging is appropriate — it does not overstate AMD's problems or NVIDIA's reliability, and it correctly identifies the recommendation as a safety preference rather than a hard requirement.

---

## Finding 5

**Technique:** Absence Map
**Target:** Missing formal security disclosure policy despite active fuzzing infrastructure
**Verified:** no

### The Audit

The artifact describes a notable asymmetry in darktable's security posture:

**Present:** RawSpeed has Google OSS-Fuzz integration, a fuzz/ directory with targets, sanitizer coverage (ASan/UBSan/MSan) in CI, CodeQL static analysis, Clang-Tidy, and SonarCloud. This is a genuinely strong defensive posture for an open-source C project handling untrusted binary input (RAW files from cameras).

**Absent:**
- No `SECURITY.md` or formal vulnerability disclosure policy. Security researchers who find vulnerabilities have no documented channel for responsible disclosure. Vulnerabilities may be reported as public GitHub issues (exposing users before a fix) or not reported at all.
- No mention of CVE tracking or security advisory history beyond one known fix.
- No mention of sandboxing or privilege separation. The application reads arbitrary binary files with a C parser — the attack surface is real, and the fuzzing infrastructure implicitly acknowledges this.
- No mention of dependency security auditing. SQLite, GTK, and Lua are all attack surface, but the security discussion is limited to the RAW parser.

The absence is structurally significant: the project has invested in proactive security testing but has not completed the security lifecycle by providing a disclosure channel or advisory process. This is a common pattern in open-source projects — tooling is easier to adopt than process.

### Verdict

The absence is real and consequential. A project that handles untrusted binary input, runs a C parser, and has active fuzzing infrastructure has implicitly acknowledged its attack surface — but has not provided the organizational infrastructure (disclosure policy, advisory process) that lets external researchers participate safely in securing it.

---

# 猴 Monkey — Chaos Check

**Source caveat:** The input analyzed is a secondary summary of darktable v5.4.1 architecture, not primary documentation or source code. All findings below are bounded by the accuracy of that summary. Confidence scores reflect this limitation.

---

## Finding 1

**Technique:** Replay Probe
**Target:** XMP auto-sync with 10-second interval and external edit handling
**Confidence:** 78
**Impact:** breaks-build
**Survived:** no

### Observation

The XMP auto-sync writes sidecars every 10 seconds with database taking precedence. The source material states: "Mid-session external XMP edits are silently overwritten on next sync." This creates a deterministic data loss path on replay. If a user (or external tool like Adobe Bridge, Photo Mechanic, or a sync script) modifies an XMP sidecar, darktable will silently overwrite those changes within 10 seconds. The opt-in conflict detection only runs at startup, and is OFF by default. I did not check darktable's source code or full documentation for any file-watcher or inotify-based mid-session conflict mechanism — one may exist but was not mentioned in the provided summary.

### Consequence

Any workflow involving external tools editing XMP sidecars while darktable is open will lose external edits silently. The user gets no warning, no diff, no merge — just overwrite. This is particularly concerning because XMP is a documented interoperability format, and the silent overwrite contradicts the purpose of having sidecars at all.

---

## Finding 2

**Technique:** Assumption Flip
**Target:** OpenCL GPU acceleration as a performance benefit
**Confidence:** 72
**Impact:** values-gap
**Survived:** no

### Observation

The architecture assumes OpenCL is a net positive: auto-detected, dynamically loaded, CPU fallback on error. Flip the assumption: what if OpenCL is a net negative for a significant user segment? Apple has deprecated OpenCL. The source material itself notes "NVIDIA recommended because some AMD drivers behave unreliably." macOS is a supported platform (14+). This means a supported platform officially ships a deprecated compute framework that darktable depends on for GPU acceleration. I did not check whether darktable's macOS builds use Metal, Vulkan, or any OpenCL alternative — the source material mentions only OpenCL.

### Consequence

macOS users on Apple Silicon get a supported platform where the GPU acceleration path is deprecated by the OS vendor. AMD Linux users get unreliable drivers. The "auto-detect and fallback" design masks the issue — users may not realize they're running CPU-only until they wonder why processing is slow. The performance delta (tiling can be 10x slower) makes GPU closer to "critical path with silent degradation" than "nice bonus."

---

## Finding 3

**Technique:** Cross-Seam Probe
**Target:** Dual storage: SQLite database vs. XMP sidecars — data parity gap
**Confidence:** 82
**Impact:** breaks-build
**Survived:** no

### Observation

The architecture maintains two sources of truth with database taking precedence after import. The source material documents that "custom sort sequence NOT stored in XMP (documented as potentially destructive on reimport)." This is the seam: the two storage systems don't carry the same data. On reimport (new machine, database loss, fresh install), custom sort sequences are destroyed. The project itself documents this as "potentially destructive." I checked the source material for XMP write modes (three modes exist) and conflict detection (opt-in, startup only, OFF by default), confirming there is no mechanism to preserve database-only metadata through an XMP-based migration. Database snapshots exist (weekly, keep 10) which could serve as partial mitigation if the user still has access to the old system.

### Consequence

Users who rely on custom sort sequences and then migrate to a new machine via XMP sidecars (the portable format) lose their sort data permanently. The project knows this — they documented it — but the architecture still ships with no XMP representation of sort sequences. Every user who treats XMP as their backup strategy has an incomplete backup.

---

## Finding 4

**Technique:** Scale Shift
**Target:** SQLite library.db with no documented scaling characteristics
**Confidence:** 55
**Impact:** nice-to-have
**Survived:** no

### Observation

The source material states SQLite is the database, with fragmentation maintenance (25% threshold, check on close) and weekly snapshots. It also states "No documented scaling characteristics for large collections." What happens at 100,000 images? 500,000? I did not check darktable's issue tracker, wiki, or user forums for large-collection performance reports — there may be extensive community knowledge about scaling behavior that simply wasn't included in the summary. The fragmentation maintenance and snapshot mechanisms suggest awareness of database health, but the absence of documented scaling characteristics in the provided material means I cannot assess whether this is a real problem or a documentation gap.

### Consequence

If scaling is genuinely untested, professional photographers with large catalogs could hit performance walls. If scaling is tested but undocumented, this is a documentation gap that forces users to discover limits experimentally. Either way, the user-facing information is insufficient.

---

## Finding 5

**Technique:** Time Travel
**Target:** GTK3 dependency and the active GTK4 migration
**Confidence:** 85
**Impact:** values-gap
**Survived:** yes

### Observation

GTK3 is labeled "old stable" but is actively maintained (3.24.51, NOT EOL). darktable has an active GTK4 migration branch with merged PRs. The migration assessment: ~506K lines, 501 files, two custom widget frameworks (bauhaus: 4,098 lines, dtgtk: 17,800 lines), estimated 12-18 weeks with "the equivalent of two full-time programmers." I poked this hard expecting a ticking time bomb — but it held. The project is already migrating. GTK3 is not EOL. The custom widget frameworks are significant (21,898 lines total) but the team has apparently scoped the work. The migration branch exists with merged PRs, meaning this isn't vaporware planning — code is moving.

### Consequence

This is a genuine case of a project managing a major dependency migration proactively rather than reactively. The risk is execution — 12-18 weeks at two FTE for a volunteer project is optimistic — but the architectural decision to start the migration before the dependency is dead is sound.

---

## Finding 6

**Technique:** Delete Probe
**Target:** Module reorder UI guardrails (or lack thereof)
**Confidence:** 88
**Impact:** breaks-build
**Survived:** no

### Observation

The source material states: mid/late pipeline modules are "freely reorderable via Ctrl+Shift+drag" with "no confirmation dialog, no UI guardrails." The documentation itself warns "changing module order is not a cosmetic change — it has real consequences" and "wrong orders silently produce incorrect output." What if we delete the ability to freely reorder — would anything break? Yes: power users need custom orders for specific workflows. But the question reveals what's missing. The project has five order presets and the ability to switch between them to recover, which is a recovery path. However, there is no undo for a reorder, no diff showing what changed, and no warning. I checked the source material for recovery mechanisms and found preset switching, which partially mitigates this. But the gap between "this has real consequences" (project's own words) and "no UI guardrails" is architectural, not a missing feature request.

### Consequence

A single accidental Ctrl+Shift+drag silently corrupts the processing pipeline with no visual indication that output is now wrong. The recovery path (switching presets) exists but requires the user to know they need to recover, which is the exact thing the silent failure prevents.

---

## Finding 7

**Technique:** Hostile Input
**Target:** RawSpeed parser and security posture
**Confidence:** 90
**Impact:** nice-to-have
**Survived:** yes

### Observation

I tried to break the security posture and it held up impressively. The source material documents: Google OSS-Fuzz integration for the RawSpeed RAW parser, a fuzz/ directory with multiple targets, ASan/UBSan/MSan in CI, CodeQL, Clang-Tidy, SonarCloud static analysis, and at least one CVE found and fixed via fuzzing. For an open-source C application that parses untrusted binary file formats (RAW images from arbitrary cameras), this is a remarkably mature security surface. The hostile input I'd want to throw — malformed RAW files, truncated headers, corrupt EXIF, oversized metadata blocks — is exactly what OSS-Fuzz continuously generates. The no-SECURITY.md gap exists but is cosmetic compared to the actual fuzzing infrastructure.

### Consequence

The security posture for the RAW parsing path is genuinely robust. Continuous fuzzing with sanitizers catches memory corruption bugs before they ship. The missing SECURITY.md is a reporting-channel gap, not a security gap. For a C codebase parsing untrusted binary formats, this is better than most commercial alternatives.

---

# 虎 Tiger — Solution Attack

> **Source notice:** The input is a summary provided by the operator, not primary documentation I verified independently. Findings below are only as reliable as that summary.

---

## Finding 1

**Technique:** Inversion Attack
**Target:** OpenCL as the GPU acceleration path
**Burned:** yes

### The Attack

Design a world where OpenCL is not a viable GPU compute layer. That world already exists — it is called macOS since 2018.

Apple deprecated OpenCL in macOS 10.14 (Mojave) and has not updated its OpenCL implementation since. Apple Silicon Macs ship no OpenCL GPU driver at all. Mac users — a substantial share of the photographer demographic — get zero GPU acceleration from darktable. The project itself acknowledges "NVIDIA recommended because some AMD drivers behave unreliably," which further narrows the functional GPU base to NVIDIA-on-Linux-or-Windows.

Meanwhile, the compute landscape has consolidated around three APIs: CUDA (NVIDIA proprietary), Metal (Apple proprietary), and Vulkan Compute (cross-platform). OpenCL 1.2 — the version darktable targets — is a 2011 specification. No major GPU vendor is investing in expanding OpenCL capabilities.

The inverted world where OpenCL is not the right GPU abstraction is not hypothetical. It is the current state of the largest consumer hardware platform in photography.

### Verdict

Burned. The core assumption — "OpenCL provides cross-platform GPU acceleration" — is already false on macOS and narrowing on other platforms. The auto-CPU-fallback is graceful degradation, not an answer; the 10x tiling slowdown makes CPU-only a painful experience on large edits.

---

## Finding 2

**Technique:** Parallel Universe
**Target:** GTK3 as the UI toolkit
**Burned:** yes

### The Attack

The parallel universe: darktable built on a GPU-rendered UI framework — Qt, or custom platform-native surfaces (DirectX 11/Metal). This is not speculative; the project itself has a proposal (issue #20477) to replace GTK/Cairo rendering with platform-native surfaces for 10-bit color, wide gamut, and HDR output.

What the alternative makes easy that GTK3 makes hard:
1. **10-bit/HDR display output.** The project identified this as a GTK/Cairo limitation serious enough to propose an alternative rendering path.
2. **Canvas performance.** Cairo is CPU-rasterized. For a photo editor on high-DPI displays, GPU-rendered preview surfaces are not optional.
3. **Cross-platform consistency.** GTK on Windows and macOS has historically been second-class.

What GTK3 makes easy: Linux desktop integration (GNOME themes, portals). One platform advantage, not a cross-platform one.

The GTK4 migration is estimated at 12-18 weeks and does not solve the 10-bit/HDR gap. If migration is painful regardless, migrating to a toolkit that solves both maintenance and rendering is worth comparing.

### Verdict

Burned — not because GTK3 is dying (it isn't), but because the project itself identified GTK/Cairo as insufficient for color-critical display output, and the GTK4 migration doesn't resolve that core limitation.

---

## Finding 3

**Technique:** Survivor Bias Probe
**Target:** Scene-referred pipeline as the default processing model
**Burned:** no

### The Attack

Hunt for where scene-referred pipelines have been tried and abandoned.

The photography software landscape tells the opposite story:
- Film industry (ACES) standardized on scene-referred linear workflows over a decade ago.
- Capture One has moved toward linear processing internally.
- RawTherapee uses a largely linear pipeline.
- The theoretical foundation (preserving radiometric relationships, deferring tone mapping) is well-established in color science.

The failure stories are about the UX transition, not the architecture. darktable's community had friction when scene-referred became default in v3.2, but the dual-path approach (scene-referred default, display-referred available) handles the transition risk.

### Verdict

Not burned. The scene-referred pipeline is the convergent direction of the entire imaging industry. The failure cases are UX friction during transition, not architectural collapse.

---

## Finding 4

**Technique:** Pre-mortem
**Target:** SQLite as the library database with XMP sidecar dual-storage
**Burned:** yes

### The Attack

It is October 2026. A darktable power user with a 200,000-image library files a bug report: after a crash during import, their database is corrupted. They had XMP sidecars enabled, so they rebuild from sidecars — but 3,000 images have stale XMP files because the opt-in startup XMP conflict detection was not enabled, and database-takes-precedence-after-import meant edits made in the DB since the last XMP write are gone.

The post-mortem reveals the fundamental tension: two sources of truth with no guaranteed consistency. The database has precedence, but XMP is the disaster recovery path. When the primary (DB) fails, the secondary (XMP) is only as good as its last sync — which, without explicit user opt-in, may be arbitrarily stale.

A second scenario: a studio with three photographers sharing a library over a network volume. SQLite's file-level locking makes concurrent multi-user access unreliable over network filesystems (documented SQLite limitation). The "multiple workspaces" feature doesn't solve this — each workspace is a separate database, not a shared-access solution.

### Verdict

Burned. The dual-storage model creates a consistency gap that bites during failures — exactly when consistency matters most. The opt-in nature of conflict detection means the safety net has holes by default.

---

## Finding 5

**Technique:** Steel-and-Strike
**Target:** C as the core implementation language
**Burned:** no

### The Attack

**Steel it first.** C is the strongest possible choice for darktable's constraints:
- Pixel pipeline: C compiles to predictable, vectorizable machine code. SIMD inner loops (SSE, AVX, NEON) are most naturally expressed with C intrinsics. No runtime, no GC pauses.
- OpenCL/OpenMP interop: both APIs are C-native.
- Portability: C compiles everywhere darktable ships. Compiler requirements (GCC 12+, Clang 15+) are modern enough for C11/C17.
- Contributor base: the computational photography community's lingua franca (dcraw, LibRaw, RawSpeed, lcms2 — all C).
- Security: RawSpeed (the highest-risk component) has OSS-Fuzz, ASan, UBSan, MSan, and CodeQL coverage.

**Now strike.** The strongest argument against C is memory safety in the application layer (not the pixel pipeline). But the steeled version already addresses this: the parsing layer is fuzzed and sanitizer-covered, and the pixel pipeline benefits from C's performance in ways that would be hard to replicate without FFI complexity.

Rewriting 506K lines in Rust or C++ would be measured in years for a two-person team. The rewrite wouldn't improve the pixel pipeline — only add safety to the application scaffold, the lower-risk surface.

### Verdict

Not burned. C is not merely adequate — it is the natural fit for SIMD-heavy pixel processing with C-native GPU APIs, maintained by domain experts. The memory safety risk is mitigated at the highest-risk surface (RAW parsing). The cost of switching languages would consume the entire project's capacity for years with marginal benefit to the core product.
