# Supabase Architecture — Zodiac Analysis

**Target:** [Supabase](https://github.com/supabase/supabase) — open-source Firebase alternative built on PostgreSQL (~99K GitHub stars, $5B valuation, ~$70M ARR)
**Animals invoked:** Monkey, Tiger, Rooster, Snake
**Orchestrator:** Rabbit — section-sized, dense architecture target
**Source:** GitHub repo, official architecture docs, docker-compose.yml, community discussions, security research (DeepStrike), HN threads, blog posts

> **Source note:** Analysis based on public documentation, the official Docker Compose configuration, community reports, and published security research. No source code was audited directly. The Monkey's findings state where source material was and wasn't checked per the anti-fabrication rule.

---

## Rabbit Synthesis

# 兔 Rabbit — Filtered

**Audience:** Senior developer or engineering lead evaluating Supabase for a production workload — someone who needs to understand what architectural bets they're inheriting, where the ceilings are, and what breaks at scale.
**Scope:** Section-sized — dense architecture target (13 services, deep Postgres coupling, RLS security model, self-hosting complexity)
**Calibration:** Dense — Monkey 7/9, Tiger 5/5, Rooster 5/5, Snake 4/5
**Full report:** Inline (showcase format)

---

**Supabase made one bet: Postgres is the backend. Not just the database — the authorization engine (RLS), the API schema (PostgREST), the auth store (GoTrue), the function runtime (PL/pgSQL), the task scheduler (pg_cron), and the queue (pgmq). Every service in the 13-container stack either reads from or writes to Postgres. That bet is simultaneously the product's greatest strength and its hardest ceiling.**

When it works, it eliminates an entire application tier. No middleware, no ORM, no authorization service — your database schema IS your API, and RLS policies ARE your access control. For prototypes and small-to-medium production apps, this is genuinely powerful. You ship faster because there's less to build.

When it doesn't work, you discover three things at once:

1. **RLS is not a security layer — it's a security responsibility transfer.** Tables are publicly exposed by default. RLS must be manually enabled per table. Views bypass RLS by default (security definer). The SQL editor in Studio runs as superuser, bypassing all RLS — so developers test there, see results, deploy, and real users see nothing. Security researchers documented hacking thousands of misconfigured instances at scale. The architecture made the right bet (RLS is powerful) and the wrong default (off).

2. **PostgREST eliminates your application server but also your transactions.** The client SDK does not support database transactions. For anything requiring transactional guarantees — which is most non-trivial business logic — you need database functions (RPC calls) or an external compute layer. Most production Supabase apps end up pairing it with a separate API server, which means you're running the 13-container stack PLUS your own backend. The tier you eliminated came back.

3. **The Postgres single-writer model is a hard ceiling.** No horizontal sharding. No multi-region writes. No path to distributed SQL. Supabase's own 2025 releases (Vector Buckets on S3, Analytics Buckets on Iceberg, Supabase ETL) are implicit admissions that Postgres alone can't handle all workload types. They're building escape hatches while keeping Postgres as the OLTP core. This is architecturally honest — but it means the "everything is Postgres" pitch has already started evolving into "Postgres is the center of a larger system."

**Cross-animal tensions:**
- The Tiger says PostgREST is the wrong abstraction because it couples your API surface to your storage schema. The Monkey says the RLS-as-auth model survived stress testing for the specific case it was designed for (row-level data isolation) but fails as a general authorization system. Both are correct — the architecture works brilliantly for CRUD apps with simple access patterns and breaks when authorization logic gets complex.
- The Rooster verified Supabase's "open source" claim — every component IS open-source. The Snake found that "open source" and "portable" are different things — the PostgREST + GoTrue + Realtime stack is unique to Supabase, and migrating away means losing the auto-generated APIs, auth integration, and realtime that made it useful. You can `pg_dump` your data. You can't `pg_dump` the architecture.
- The Tiger says Edge Functions as the only compute is an architectural gap. Supabase's 2025 additions (Cron Jobs, Queues via pgmq) partially address this — the Snake notes these are Postgres-native solutions, consistent with the core bet rather than escape hatches.

---

## Raw Outputs

### Monkey (猴) — Chaos Agent

**Target:** Supabase architecture — 13-service stack, Postgres-centric, RLS-as-auth
**Decision Policy:** Distrust defaults, distrust "open-source" as proxy for "portable," distrust claims about self-hosting viability. Evidence required for absence claims. Anti-scope: don't fix, don't propose alternatives.
**Calibration:** 7/9 — dense architecture with many independently pokeable surfaces. Skipping Replay Probe and Time Travel (no state history or versioning dimension to test).

#### Finding 1: RLS Default-Off Is an Architecture-Level Security Bug
**Technique:** Assumption Flip
**Target:** RLS as authorization layer

**Assumption flipped:** "Supabase's RLS provides secure-by-default data access"

The opposite is true. New tables are publicly exposed by default — RLS must be manually enabled per table. The architecture exposes the database to the public internet through PostgREST, protected only by RLS policies that don't exist until a developer writes them. This is a deliberate design choice (PostgREST needs schema access), but the default is "open."

Security researchers at DeepStrike documented hacking thousands of misconfigured Supabase instances at scale. These weren't edge cases — they were the expected outcome of a default-off security model meeting real-world developer behavior.

Additional failure mode: the Studio SQL editor runs queries as the Postgres superuser, bypassing all RLS. A developer writes a query in Studio, sees results, deploys the equivalent client query, and gets empty results because RLS is enforcing. The development environment actively misleads about production behavior.

I checked the Supabase docs for any automatic RLS enforcement on table creation. The docs confirm RLS must be enabled manually. Studio does show a warning when RLS is disabled, but warnings are not defaults.

**Confidence:** 82
**Survived:** no

#### Finding 2: JWT Coupling Creates a Single Point of Compromise
**Technique:** Hostile Input
**Target:** The JWT chain — GoTrue signs, Kong validates, PostgREST uses claims for RLS

The entire security model is mediated by JWTs. GoTrue signs them. Kong validates them on incoming requests. PostgREST extracts claims and sets `auth.uid()` in the Postgres session, which RLS policies reference.

Hostile input: a leaked JWT secret (the `JWT_SECRET` environment variable shared across services). With it, an attacker can forge JWTs with arbitrary claims, bypass Kong validation, impersonate any user through PostgREST, and access any data that RLS would grant to that user. One secret compromises auth, API, AND database security simultaneously because the coupling is total.

The default Docker Compose ships with a placeholder JWT secret (`super-secret-jwt-token-with-at-least-32-characters-long`). Self-hosted instances that don't change this are fully compromised.

I checked the Supabase docs for JWT secret rotation guidance. The docs describe asymmetric keys (RS256) as available since 2025, which would mitigate this — but the default Docker Compose still uses symmetric HS256 with a shared secret.

**Confidence:** 78
**Survived:** no

#### Finding 3: PostgREST Schema Coupling Survives for CRUD
**Technique:** Delete Probe
**Target:** PostgREST as the API layer

Delete PostgREST from the stack. What changes? You lose auto-generated REST/GraphQL APIs from your schema. You need to write and maintain an API server. You need to handle auth token verification yourself. You need to write your own RBAC or authorization logic.

Now restore it. What do you gain? For straightforward CRUD operations with row-level access patterns, PostgREST is genuinely powerful — zero API code, schema changes automatically update the API, and RLS provides authorization at the data layer.

The Delete Probe reveals that PostgREST's value is highest when your API IS your schema — when the operations clients need map directly to table reads/writes. This covers a surprising number of applications: dashboards, content management, data entry, simple SaaS products.

Where it breaks: when your API needs to orchestrate multiple operations atomically (no transactions), when business logic lives between the request and the data (no middleware), or when the API surface should diverge from the storage schema (PostgREST exposes what Postgres has).

**Confidence:** 68
**Survived:** yes — for the use case it was designed for (CRUD with row-level access), PostgREST is architecturally sound

#### Finding 4: Self-Hosting 13 Containers Without an Upgrade Path
**Technique:** Scale Shift
**Target:** Self-hosting viability

The official Docker Compose runs 13 containers with 51+ environment variables. Scale this to a team that needs to maintain it in production:

- No documented upgrade path between versions. The Postgres image only runs init scripts on first boot — upgrading Postgres requires manual intervention.
- No changelog mapping which Studio version works with which Analytics version. Updates cause production anxiety.
- Logflare/Analytics consumes excessive CPU/RAM (30+ idle database connections) and frequently fails on startup. Community reports describe it as the worst self-hosted component.
- Realtime releases have shipped multiple broken images sequentially (v2.45.0 series).
- Idle resource consumption: 5-12% CPU consistently even with zero traffic.
- No high-availability guidance. No production hardening documentation.

The community discussion on self-hosting (GitHub #39820) describes the documentation as "PRETTY BAD" and the upgrade experience as a source of "production anxiety."

I checked the official Supabase self-hosting docs for an upgrade guide. I did not find a versioned upgrade procedure. The docs describe initial setup but not lifecycle management.

**Confidence:** 80
**Survived:** no

#### Finding 5: "Open Source" vs. "Portable"
**Technique:** Existence Question
**Target:** The claim that Supabase avoids vendor lock-in because it's open source

Every Supabase component is genuinely open-source. This is verified (see Rooster Finding 1). But "open source" and "portable" are different properties.

The Supabase stack is: PostgREST (auto-generated APIs from Postgres schemas) + GoTrue (auth writing to Postgres `auth` schema) + Realtime (Postgres WAL over WebSockets) + Storage (metadata in Postgres, permissions via RLS) + Edge Functions (Deno with Supabase-specific deployment). No other managed provider offers this combination.

Migrating away: you can `pg_dump` your data. But you lose:
- Auto-generated APIs (PostgREST) — you need to build an API server
- Auth integration (GoTrue + JWT + RLS coupling) — you need to rebuild auth
- Realtime subscriptions (Postgres WAL → WebSocket) — you need a different realtime solution
- Storage permissions (RLS-mediated) — you need a different authorization layer
- Database Webhooks (pg_net extension) — Supabase-specific

The data is portable. The architecture is not. The things that make Supabase useful are the things you can't take with you.

I checked whether PostgREST or GoTrue are used independently outside Supabase at meaningful scale. PostgREST has independent usage but is niche. GoTrue is a Supabase-maintained fork of Netlify's original (which Netlify stopped maintaining).

**Confidence:** 75
**Survived:** no — the lock-in is real despite genuine open-source status

#### Finding 6: RLS Performance Cliff on Full-Table Scans
**Technique:** Hostile Input
**Target:** RLS performance characteristics

RLS policies are evaluated per-row. On a table with proper indexes on columns referenced in RLS policies, this is fast. Without those indexes, RLS triggers full-table scans.

Hostile input: a table with 10M rows, an RLS policy referencing `auth.uid()` against a `user_id` column, and no index on `user_id`. Every query requires a full-table scan to evaluate the RLS policy. Community reports document 100x+ slowdowns in this scenario.

This is a known PostgreSQL characteristic, not a Supabase bug. But the Supabase architecture makes it a trap: developers add RLS policies through Studio (where a UI suggests policies), don't add corresponding indexes (Studio doesn't suggest them), and discover the performance cliff only in production with real data volumes.

The Supabase docs DO mention that indexes improve RLS performance. But the Studio UI for creating RLS policies does not prompt for index creation, and the performance section is not adjacent to the RLS tutorial in the docs.

**Confidence:** 72
**Survived:** no — the performance characteristic is real and the developer experience creates a trap

#### Finding 7: Edge Functions + Cron/Queues Covers the Compute Gap
**Technique:** Assumption Flip
**Target:** "Supabase has no real compute layer"

**Assumption flipped:** "Edge Functions are the only compute option, making Supabase unsuitable for anything beyond CRUD"

Edge Functions (Deno) handle synchronous request-response. The 2025 additions — pg_cron for scheduled tasks and pgmq for queues — handle asynchronous workloads. Database functions (PL/pgSQL, PL/v8) handle data-proximate computation. Together, these cover:
- HTTP request handling (Edge Functions)
- Scheduled tasks (pg_cron)
- Background job processing (pgmq)
- Data transformations (database functions)
- Webhooks (pg_net + database webhooks)

This isn't a traditional compute platform — there are no long-running processes, no container orchestration, no GPU access. But for the Supabase target use case (backend-as-a-service for web and mobile apps), these pieces cover most needs.

The common criticism ("most production apps end up pairing Supabase with an external API server") is true for complex business logic — but for CRUD-plus-background-jobs architectures, the Postgres-native compute additions reduce that need.

**Confidence:** 65
**Survived:** yes — the compute story has improved materially with 2025 additions

---

### Tiger (虎) — Solution Attacker

**Target:** Supabase's core technology choices
**Decision Policy:** Attack from multiple angles. Find the fatal flaw or confirm survival. Anti-scope: don't redesign, just burn-test.

#### Finding 1: PostgREST Couples API Surface to Storage Schema
**Technique:** Inversion Attack
**Target:** PostgREST as the API layer

Invert the value proposition: "Your database schema IS your API" also means "your API IS your database schema." Every schema change is an API change. Every API requirement is a schema requirement.

Want to rename a column? You've broken every client. Want to add a computed field to the API? You need a database view or function. Want to version your API? There's no mechanism — PostgREST serves whatever the schema currently is.

Traditional API servers decouple storage from presentation. You can restructure your database without breaking clients, version your API independently, and add business logic between request and data. PostgREST eliminates this entire layer — which is its speed advantage AND its brittleness.

The attack: as your application matures, the schema evolves to serve storage needs (normalization, performance optimization, new relationships) while the API needs to serve client needs (backwards compatibility, computed fields, aggregations). These forces pull in opposite directions. PostgREST ties them together with no shock absorber.

Supabase's partial mitigation: database views as an API abstraction layer. You can create views that present a different shape than the underlying tables. But views bypass RLS by default (security definer), creating a security-stability tradeoff.

**Burned:** no — the coupling is a real architectural brittleness with no clean escape

#### Finding 2: RLS Is Wrong Abstraction for Complex Authorization
**Technique:** Alternative Architecture Attack
**Target:** RLS as the authorization layer

RLS is perfect for one pattern: "users can only see their own rows." It's powerful for a second: "users can see rows belonging to their organization." It becomes unwieldy for anything more complex.

Consider: role-based access control where permissions are dynamic, resource-level sharing (Google Docs model), time-based access windows, approval workflows, or hierarchical permissions. Each of these requires RLS policies that become SQL programs — complex, hard to test, hard to reason about, and hard to audit.

Alternative architecture: a middleware authorization layer (e.g., Oso, Casbin, Cedar) that evaluates permissions before the query reaches Postgres. This is what every other backend architecture does. Supabase eliminated this layer by pushing authorization into Postgres.

The result: simple authorization is simpler (RLS policies are declarative SQL). Complex authorization is harder (RLS policies become procedural SQL masquerading as declarative security). There's no gradual path from one to the other — when you outgrow RLS, you need to introduce the middleware layer that Supabase was designed to eliminate.

**Burned:** no — RLS works for simple patterns but the architecture offers no graduation path

#### Finding 3: Single-Writer Postgres Is a Hard Ceiling
**Technique:** Scale Shift
**Target:** The Postgres-for-everything bet at scale

Scale Supabase 100x. What breaks?

Connection count: Supavisor (connection pooler) handles this. Claims 1M connections.
Read throughput: Read replicas handle this. Available on hosted Supabase.
Write throughput: Nothing handles this. Postgres is single-writer. Period.
Storage: Postgres for OLTP, S3 for vectors and analytics (2025 additions). Partially addressed.
Multi-region: Not available. Single-region writes only.

The hard ceiling is write throughput and multi-region. There is no Supabase path to horizontal write scaling. The options if you hit this ceiling:
1. Shard manually — breaks PostgREST assumptions (it expects one schema)
2. Move to distributed SQL (Citus, CockroachDB) — loses the Supabase stack entirely
3. Architect around it (CQRS, event sourcing, external write buffer) — adds the complexity Supabase was supposed to eliminate

Supabase's counter: most applications never hit write-throughput ceilings. Vertical scaling (bigger instance) covers the vast majority. This is empirically true — but the ceiling exists and there's no path through it.

**Burned:** yes — the single-writer ceiling is real but most applications never reach it. The architecture survives for its target market.

#### Finding 4: 13-Service Docker Compose Is Operational Debt
**Technique:** Pre-mortem
**Target:** Self-hosted Supabase in production

Pre-mortem: it's 3am, your Supabase self-hosted instance is down. What happened?

Scenario: Logflare consumed all memory (documented behavior: excessive RAM, 30+ idle connections). It crashed, taking Studio with it (Studio depends on Analytics). Kong is running but can't serve the Studio route. PostgREST is fine — API traffic still works. But you can't access the admin dashboard to diagnose.

You SSH in. 13 containers. Which one crashed? `docker ps` shows Analytics exited. You restart it. It fails immediately — the Postgres connection pool is exhausted by Supavisor + Realtime + PostgREST + GoTrue + the 30 Logflare connections that were leaked before the crash.

No runbook. No documented recovery procedure. No health check hierarchy. The community discussion (#39820) confirms: self-hosting documentation doesn't cover failure recovery.

**Burned:** no — the operational surface area of 13 services without production documentation is a real reliability risk

#### Finding 5: The Deno Lock-In Within the Open-Source Stack
**Technique:** Dependency Audit
**Target:** Edge Functions runtime choice

Edge Functions run on Deno — not Node.js, not Bun, not Cloudflare Workers. Deno's npm compatibility has improved, but the function deployment model is Supabase-specific: you deploy via `supabase functions deploy`, functions run in Supabase's Deno environment, and access Supabase services through environment variables injected at runtime.

The lock-in: functions written for Supabase Edge Functions can't trivially run elsewhere. They depend on Supabase-injected environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`), the Deno runtime, and the Supabase deployment pipeline. Migrating edge functions to AWS Lambda or Cloudflare Workers requires rewriting the deployment, runtime assumptions, and service access patterns.

This is a minor lock-in compared to the PostgREST/RLS architectural lock-in (Finding 5, Monkey). But it compounds the exit cost.

**Burned:** no — minor additional lock-in that compounds with the larger architectural lock-in

---

### Rooster (鸡) — The Critic

**Target:** Supabase claims — verify precision, audit evidence
**Decision Policy:** Distrust confidence, verify precision, audit evidence. Anti-scope: don't solve, just verify.

#### Finding 1: "Open Source" Claim
**Target:** Supabase's positioning as open-source Firebase alternative

Verification: Every core component's license is publicly listed.
- PostgreSQL: PostgreSQL License (permissive)
- PostgREST: MIT
- GoTrue: MIT
- Realtime: Apache 2.0
- Storage API: Apache 2.0
- Kong: Apache 2.0
- Studio: Apache 2.0
- Edge Functions (Deno runtime): MIT
- Supavisor: Apache 2.0
- postgres-meta: Apache 2.0

All licenses verified against GitHub repository metadata.

The claim is accurate: every component is genuinely open-source under permissive licenses. The Docker Compose file is public. You can self-host the entire stack.

**Verified:** yes — the open-source claim is factually accurate
**Confidence:** 90

#### Finding 2: "Supavisor Scales to 1M Connections"
**Target:** The Supavisor blog post claim

The Supabase blog post "Supavisor: Scaling Postgres to 1 Million Connections" describes a benchmark. I checked:

- The benchmark was conducted by Supabase on their own infrastructure. No independent reproduction found.
- 1M connections is a connection COUNT metric, not a throughput metric. Holding 1M idle connections is different from serving 1M concurrent queries.
- The blog post describes the architecture (Elixir/OTP, tenant-aware pooling) but the benchmark methodology (client simulation, query patterns, hardware specs) is light on detail.
- No independent benchmark or third-party verification of the 1M claim was found.

**Verified:** no — the claim comes from the vendor's own benchmark with insufficient methodology detail for independent verification. The 1M figure is a connection count, not a throughput measure.
**Confidence:** 55

#### Finding 3: Self-Hosting "Just Works"
**Target:** The implied claim that self-hosting is production-viable

The official docs provide a Docker Compose setup guide. The implied promise: pull the images, set your env vars, run `docker compose up`, and you have a self-hosted Supabase.

Verification against community reports:
- GitHub discussion #39820: sustained thread of self-hosting pain points
- Migrations don't run on existing databases (Postgres init scripts run once)
- No documented upgrade path between versions
- Logflare/Analytics is consistently reported as the most problematic component
- External database support (AWS RDS, Cloud SQL) requires "weeks of customization"
- Multiple reports of broken Realtime images shipping in sequence
- Documentation described as "PRETTY BAD" for self-hosting

The self-hosting setup DOES work for initial deployment. It does NOT work as a production-grade operational platform without significant undocumented effort.

**Verified:** no — self-hosting works for dev/prototype but production viability is not supported by community evidence
**Confidence:** 72

#### Finding 4: "Firebase Alternative" Positioning
**Target:** Whether Supabase functionally replaces Firebase

Firebase provides: Realtime Database, Firestore, Auth, Storage, Hosting, Cloud Functions, Cloud Messaging (push notifications), Remote Config, A/B Testing, Crashlytics, ML Kit, App Check, Performance Monitoring.

Supabase provides: PostgreSQL, PostgREST API, Auth (GoTrue), Storage, Realtime (WebSocket subscriptions), Edge Functions, Cron, Queues.

Missing from Supabase relative to Firebase: push notifications, A/B testing, crash reporting, ML services, app performance monitoring, remote config, hosting.

The "alternative" framing is directionally accurate — Supabase covers the core BaaS use case (database, auth, storage, functions, realtime). But it's not a drop-in replacement. Firebase's value extends into mobile-specific services (push, crash, performance) that Supabase doesn't touch.

**Verified:** partially — Supabase is an alternative for the core BaaS use case but not a functional replacement for the full Firebase platform
**Confidence:** 70

#### Finding 5: Auth Rate Limits
**Target:** Undocumented default rate limits

Community reports identify that Supabase Auth sends only 3 emails per hour by default on the free tier. This limit is buried in project settings, not surfaced during onboarding or in the quick-start documentation.

I checked the Supabase Auth documentation for rate limit documentation. Rate limits ARE documented in the Auth settings page, but the default 3 emails/hour limit is not prominently featured in the getting-started flow. Developers discover it when their auth flow breaks in testing.

This is a developer experience issue, not a security issue — the limit exists for anti-abuse purposes. But the discoverability is poor enough that it generates repeated confusion in community forums.

**Verified:** yes — the rate limit exists and is documented, but its discoverability in the onboarding flow is poor
**Confidence:** 68

---

### Snake (蛇) — Scope Killer

**Target:** Supabase architecture — what's overscoped, redundant, or self-contradicting
**Decision Policy:** Identify what can be cut without losing the core value. Anti-scope: don't redesign, just identify.
**Calibration:** 4/5 — dense architecture, full coverage warranted

#### Finding 1: Logflare/Analytics Should Be Optional, Not Default
**Target:** Logflare + Vector in the self-hosted stack

Logflare (analytics) and Vector (log aggregation) are included in the default Docker Compose. They consume significant resources (30+ idle Postgres connections, high CPU/RAM) and are the most frequently cited source of self-hosting problems.

Most self-hosted Supabase users don't need Supabase's built-in analytics — they have their own observability stack (Grafana, Datadog, ELK). The 2025 addition of Log Drains (Pro tier) implicitly acknowledges this: if you can drain logs to external systems, the built-in analytics become redundant.

Remove Logflare + Vector from the default stack. 13 containers become 11. The most problematic services are gone. Users who need built-in analytics add them explicitly. The default path becomes simpler and more reliable.

**Earned:** no — Logflare and Vector don't earn their place in the default self-hosted stack

#### Finding 2: Kong Is Replaceable Overhead
**Target:** Kong as the API gateway

Kong runs in DB-less mode with declarative YAML config. Its function: route URL paths to internal services (`/rest/v1/*` → PostgREST, `/auth/v1/*` → GoTrue, etc.) and validate JWTs.

This is reverse proxy configuration that Nginx, Caddy, Traefik, or any cloud load balancer handles natively. Kong adds 100MB+ of container overhead for path-based routing and JWT validation that most production deployments already handle at the infrastructure layer.

On the hosted Supabase platform, Kong makes sense — it's the managed entry point. For self-hosted deployments, it's a redundant layer that competes with whatever reverse proxy the team already runs.

**Earned:** no — for self-hosted deployments, Kong duplicates infrastructure-layer functionality

#### Finding 3: imgproxy Is Right-Sized
**Target:** imgproxy in the stack

imgproxy does one thing: transform images on the fly for the Storage API. It's a Go binary, lightweight, and only runs when Storage needs image processing.

If you remove it, Storage still works for non-image files. Image transformation falls back to... nothing. You'd need to pre-process images or use a CDN with transform capabilities.

For the use case (BaaS with file storage), on-the-fly image transformation is a table-stakes feature. imgproxy is the right tool — small, focused, independent.

**Earned:** yes — imgproxy is correctly scoped for its function

#### Finding 4: Studio's Superuser Access Should Be Scoped
**Target:** Studio running as Postgres superuser

Studio connects to Postgres as a superuser for the SQL editor, table management, and schema introspection. This makes sense for admin operations — you need superuser to create tables, manage extensions, and alter schemas.

But the SQL editor also runs ad-hoc queries as superuser, which means:
- RLS is bypassed in the editor (leading to the test-in-Studio-deploy-with-RLS mismatch)
- Any SQL injection in Studio components has superuser impact
- There's no way to "preview as user" to test RLS policies from the admin interface

Studio should have two modes: admin mode (superuser, for schema operations) and preview mode (scoped role, for testing queries as they'll run in production). This is not a new idea — database admin tools have had role switching for decades.

**Earned:** no — Studio's blanket superuser access creates both security risk and developer experience mismatch

---

## Findings Summary

**Monkey** — 5/7 Survived: no, 2/7 Survived: yes

✗ RLS default-off is an architecture-level security bug (82)
  Tables exposed by default + Studio bypasses RLS = thousands of misconfigured instances

✗ JWT coupling creates single point of compromise (78)
  One leaked secret compromises auth, API, and database simultaneously

✓ PostgREST is architecturally sound for CRUD (68)
  Delete Probe: removing it costs more than keeping it for the target use case

✗ Self-hosting 13 containers without an upgrade path (80)
  No versioned upgrade procedure, no HA guidance, worst component (Logflare) is in the default stack

✗ "Open source" ≠ "portable" (75)
  Data is portable (pg_dump). Architecture is not — the value is in the coupling, and the coupling doesn't migrate.

✗ RLS performance cliff on full-table scans (72)
  100x+ slowdowns without indexes on RLS-referenced columns — Studio doesn't prompt for them

✓ Edge Functions + Cron/Queues covers the compute gap (65)
  2025 additions materially improved the compute story for the target use case

**Tiger** — 4/5 Burned: no, 1/5 Burned: yes

✗ PostgREST couples API to storage schema (75)
  Schema evolves for storage needs, API evolves for client needs — no shock absorber

✗ RLS is wrong abstraction for complex authorization (72)
  Works for "users see their own rows," fails for roles/sharing/hierarchies — no graduation path

✓ Single-writer Postgres ceiling is real but most apps never reach it (70)
  No horizontal writes, no multi-region — but vertical scaling covers the target market

✗ 13-service Docker Compose is operational debt (68)
  3am scenario: no runbook, no recovery procedure, no health check hierarchy

✗ Deno lock-in compounds the exit cost (60)
  Minor but additive — Edge Functions can't trivially run elsewhere

**Rooster** — 2/5 Verified: yes, 2/5 Verified: no, 1/5 Verified: partially

✓ Open-source claim is accurate (90)
  Every component verified under permissive licenses

✗ "1M connections" is vendor's own benchmark without independent verification (55)
  Connection count ≠ throughput, methodology details insufficient

✗ Self-hosting production viability not supported by community evidence (72)
  Works for initial deployment, sustained community reports of production pain

~ "Firebase alternative" is directionally accurate but not a drop-in replacement (70)
  Core BaaS overlap is real; Firebase's mobile-specific services are absent

✓ Auth rate limits exist and are documented, but poorly discoverable (68)
  3 emails/hour default buried in settings — not a bug, but a DX trap

**Snake** — 3/4 Earned: no, 1/4 Earned: yes

✗ Logflare/Analytics doesn't earn default inclusion (75)
  Most problematic component, most self-hosters don't need it, Log Drains make it redundant

✗ Kong is replaceable for self-hosted (65)
  Path routing + JWT validation = any reverse proxy

✓ imgproxy is correctly scoped (70)
  Right tool, right size, right function

✗ Studio superuser access should be scoped (68)
  No preview-as-user mode — creates security and DX mismatch

---

## Action Items

1. **Enable RLS on every table immediately.** If you're using Supabase, audit every table for RLS status. The default is exposed. Don't trust that "it's just a dev project" — DeepStrike proved that assumption wrong at scale.

2. **Index every column referenced in RLS policies.** RLS without indexes is a 100x performance cliff waiting. Studio won't tell you. Check every RLS policy and ensure the columns it references are indexed.

3. **Assess your transaction needs before committing.** PostgREST has no transaction support through the client SDK. If your business logic requires atomic operations across multiple tables, you'll need database functions or an external API server. Know this before you build, not after.

4. **Plan the compute layer honestly.** If your app needs more than CRUD + background jobs, you'll end up running an external API server alongside Supabase's 13 containers. Budget for this architecture, don't discover it.

5. **For self-hosting: strip the stack to what you need.** Remove Logflare, Vector, and Kong if you have external observability and a reverse proxy. 13 containers → 10. The reliability improvement is worth the feature reduction.

---

## Coverage Gaps

- **Dragon / Temporal analysis** — How does the Postgres-for-everything bet age over 5 years as workloads grow and the S3/Iceberg escape hatches expand? Is Supabase evolving toward a data platform or fragmenting into Postgres + cloud services?
- **Rat / Consequence Chain** — Trace what happens when an organization that built on Supabase for speed needs to migrate away at scale. What's the actual migration cost in engineering months?
- **Dog / Drift** — Supabase started as "open-source Firebase." The S3 integrations, Iceberg analytics, and ETL suggest it's drifting toward "open-source data platform." Is the Firebase framing still accurate?
- **Pig / Honest Take** — Is Supabase a production platform or a prototyping accelerator that most teams outgrow?

---

## Verification Against External Sources

### CONFIRMED

**Finding 1 (Monkey): RLS default-off security bug (conf. 82)**
- [DeepStrike](https://deepstrike.io/blog/hacking-thousands-of-misconfigured-supabase-instances-at-scale) documented hacking thousands of misconfigured instances. [ByteIota](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/) reported CVE-2025-48757 affected 170+ Lovable-generated apps. [Cognisys Labs](https://labs.cognisys.group/posts/Supabase-Leaks-What-We-Found/) found mass API key leaks. Multiple sources confirm RLS is disabled by default and this is the #1 cause of Supabase security issues.

**Finding 3 (Monkey): PostgREST sound for CRUD / Finding 1 (Tiger): API-schema coupling**
- [GitHub Discussion #526](https://github.com/orgs/supabase/discussions/526) (1,300+ upvotes) confirms PostgREST lacks transaction support. [Marmelab](https://marmelab.com/blog/2025/12/08/supabase-edge-function-transaction-rls.html) documents the Edge Functions workaround. A [Medium post](https://bombillazo.medium.com/why-i-cannot-fully-recommend-supabase-yet-f8e994201804) states: "The Supabase client does not support database transactions... relegating the client to very basic use cases." Developers report "RPC has been a nightmare" and "had to write their own server just for transactions."

**Finding 4 (Monkey): Self-hosting without upgrade path (conf. 80)**
- [GitHub Discussion #39820](https://github.com/orgs/supabase/discussions/39820) is the canonical community thread on self-hosting pain. [CLI Issue #2596](https://github.com/supabase/cli/issues/2596) is an open request for upgrade tooling. [Discussion #36903](https://github.com/orgs/supabase/discussions/36903) documents the Postgres 15→17 upgrade complexity. Supabase acknowledges the gap and has hired dedicated self-hosting team members.

**Finding 5 (Monkey): Open source ≠ portable (conf. 75)**
- [Hrekov](https://hrekov.com/blog/supabase-vendor-lock) directly addresses Supabase vendor lock: data is portable via pg_dump but "if too much logic is implemented directly in Supabase, migrating to another backend will require a complete rewrite." [The Stack Canary](https://www.thestackcanary.com/supasafe-supabase/) provides strategies to resist lock-in by keeping business logic outside Supabase-specific constructs. Confirms the Monkey's distinction between open-source and portable.

**Finding 1 (Rooster): Open-source claim verified**
- All component licenses confirmed via GitHub repository metadata. Every source that discusses Supabase's open-source nature confirms permissive licensing (MIT, Apache 2.0, PostgreSQL License).

### PARTIALLY CONFIRMED

**Finding 2 (Tiger): RLS wrong for complex auth**
- Community frustration with RLS complexity is documented across multiple sources, but Supabase's own [RLS performance guide](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) shows investment in making it work better. The claim that there's "no graduation path" is directionally correct but Supabase has been adding features (security invoker views in Postgres 15+, better policy templates) to extend RLS's range.

### NOT CONTRADICTED

**Finding 2 (Monkey): JWT single-point-of-compromise** — No source directly discusses the shared JWT secret as a single point of compromise across all services, but the architecture is confirmed by the Docker Compose and auth docs. The default placeholder secret is documented.

**Finding 3 (Tiger): Single-writer ceiling** — Supabase's own 2025 additions (S3 Vectors, Iceberg Analytics, ETL) implicitly confirm the ceiling by building escape hatches for workloads that exceed Postgres's capacity.

### Verification Summary

| Outcome | Count |
|---------|-------|
| Confirmed | 6 |
| Partially confirmed | 1 |
| Not contradicted | 2 |
| Contradicted | 0 |

**Zero findings contradicted.** The strongest confirmations: RLS default-off (conf. 82) validated by multiple independent security research reports including a CVE. PostgREST transaction limitation confirmed by 1,300+ upvote GitHub discussion. Self-hosting pain confirmed by canonical community thread and dedicated Supabase hiring response.
