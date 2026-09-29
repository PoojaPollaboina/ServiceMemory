# HANDOFF.md — ServiceMemory (permanent technical state)

Source-of-truth priority: source code > migrations > HANDOFF.md > CONTINUE.md > ARCHITECTURE.md > README.md > chat.
**No secrets belong in this file.**

## Purpose
Hackathon MVP (HackWith Hyderabad 3.0, theme "AI Agents That Learn Using Hindsight"). Field-service
technicians receive evidence-based recommendations recalled from organizational memory, do the work,
confirm the outcome, and that outcome is retained so future recalls improve.

## Fixed architecture (do not change without a documented reason)
- PostgreSQL/Supabase = transactional source of truth ("what happened").
- Hindsight (Cloud) = organizational memory ("what did we learn"). No local/JSON/localStorage substitute.
- LLM (OpenRouter / Nemotron via `lib/llm.ts`) = extraction + reasoning.
- Technician = source of truth for physical work. LLM may never override the technician's outcome
  (enforced in both `assembleExperience` in `lib/experience.ts` and `extractExperience` in `lib/llm.ts`).
- Loop: Service Request → Hindsight Recall → Recommendation → Technician Action → Verified Outcome →
  PostgreSQL → Experience Extraction → Hindsight Retain → Future Recall.

## Stack
Next.js 15 (App Router), React 19, TypeScript, Tailwind 3, Supabase (`@supabase/supabase-js`),
`@vectorize-io/hindsight-client@0.10.1`, zod, vitest, tsx. Node 22.
LLM: OpenRouter OpenAI-compatible API (`fetch`-based, no SDK dep) · model: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`.

## Hindsight integration (VERIFIED against installed 0.10.1 type declarations AND live Cloud)
- Client: `new HindsightClient({ baseUrl, apiKey })`. Cloud URL `https://api.hindsight.vectorize.io`.
- One org bank (`HINDSIGHT_BANK_ID`, default `servicememory-org`), created via `createBank(id, { reflectMission, retainMission })`
  (`name`/`mission` are deprecated in the SDK; we use the new fields). createBank is create-or-update.
- **retain** is synchronous by default (LLM fact extraction; can take many seconds; writes are never auto-retried).
  We pass a natural-language narrative + `timestamp`, `context`, `documentId = service-job:<jobId>`, `tags`, string `metadata`.
  Same documentId replaces previous facts => idempotent.
- **recall** filtered with `tags:["asset:<CODE>"]`, `tagsMatch:"any_strict"`, `budget:"mid"`. Result fields used:
  `id, text, type, occurred_start, document_id, tags`.
- Tags: `asset:<CODE>` (uppercase, via `assetTag()`), `asset-type:*`, `outcome:*`, `intervention:*`.
- Unavailable Hindsight: recall returns `{available:false}` (never throws, never fabricate a recommendation);
  store throws `HindsightUnavailableError` (job stays saved; experience marked failed; retry later).
- Not used / unverified: `reflect` (exists, `.text`), mental models, async retain, includeChunks.

## LLM integration (lib/llm.ts — migrated to OpenRouter, Phase 6+)
- Transport: native `fetch` against `https://openrouter.ai/api/v1/chat/completions`.
  No SDK dependency. Key: `OPENROUTER_API_KEY`. Model: `OPENROUTER_MODEL`.
  Optional `OPENROUTER_BASE_URL` override. Hard 60 s `AbortSignal.timeout` per call.
- `generateRecommendation(input)`: Only called when Hindsight available. Evidence cited as [E#].
  Returns `{ok:false}` on HTTP error, timeout, non-JSON, or Zod validation failure. Never throws.
  System prompt: only cite recalled evidence, no invented events, return pure JSON.
- `extractExperience(input)`: Extracts structured experience from a completed job.
  Zod-validates with `ExperienceExtractionSchema`. Double-checks outcome matches technician's.
  Returns `{ok:false}` on any failure. Never throws.
- `parseModelJson()`: strips `<think>…</think>` reasoning blocks (Nemotron emits these)
  and markdown fences before JSON.parse.
- `resetLlmForTests()` is exported as a no-op; test isolation uses `vi.stubGlobal('fetch', …)`.

## API routes (all server-side only — API keys never reach the browser)
- `GET /api/assets` — list all assets
- `GET /api/users` — list technicians (role=technician)
- `POST /api/requests` — create request + recall + recommend (returns {request, asset, memory, recommendation})
- `GET /api/requests` — list open/in-progress requests
- `GET /api/requests/[id]` — single request with asset join
- `POST /api/jobs` — create job (transitions request to in_progress)
- `POST /api/jobs/[id]/complete` — complete job → LLM extract → upsertExperience → Hindsight retain
- `GET /api/health` — health check (Hindsight + Supabase)

## Database (supabase/migrations/0001_init.sql)
users, assets, service_requests, service_jobs, experiences (+ RLS enabled, no policies: server/service-role only).
Extras beyond the spec: `service_requests.current_measurement`, `measurement_name/unit` on requests+jobs,
`experiences` table (structured JSONB + hindsight_status pending|stored|failed), and SQL function
`complete_service_job(...)` = atomic completion that raises `ALREADY_COMPLETED` on duplicates.

## UI pages
- `/` — dashboard: metrics, learning-loop pipeline, list of open requests
- `/requests/new` — new request form: asset picker, problem, priority, measurement →
  calls POST /api/requests → shows recalled evidence count + LLM recommendation with [E#] highlighting
- `/requests/[id]` — request detail: asset card + embedded `JobCompletionForm` (client component) →
  complete job → shows pipeline result: PostgreSQL ✓ → LLM extraction ✓ → Hindsight status

## Files
- `lib/env.ts` lazy zod env validation (server only) · `lib/types.ts` row types · `lib/supabase.ts` service-role client
- `lib/db.ts` data layer (assets, requests, jobs, completion RPC, experiences)
- `lib/experience.ts` extraction schema, `assembleExperience`, `percentChange`
- `lib/hindsight.ts` the ONLY Hindsight module: ensureBank, storeServiceExperience, recallAssetExperience,
  buildMemoryContext, buildExperienceNarrative, hasExperienceDocument, hindsightHealth
- `lib/llm.ts` Anthropic client: generateRecommendation, extractExperience (with Zod validation)
- `app/api/*` all route handlers (server-side)
- `app/page.tsx` dashboard (server component)
- `app/requests/new/page.tsx` new request form (client component)
- `app/requests/[id]/page.tsx` request detail (server component)
- `app/requests/[id]/JobCompletionForm.tsx` completion form (client component)
- `scripts/verify-hindsight.ts` live verification (8 checks, separate `-verify` bank)
- `tests/experience.test.ts` · `tests/hindsight.test.ts` · `tests/llm.test.ts` (25 tests total)

## Status
| Phase | State |
|---|---|
| 1 Architecture + Hindsight verification | done |
| 2 Project init | done |
| 3 DB schema + data layer | done (not run against live Supabase yet) |
| 4 Hindsight integration | done + **VERIFIED against live Cloud** |
| 5 Service-request workflow + routes | **done** |
| 6 Recall → Recommendation (lib/llm.ts) | **done** |
| 7 Completion → PostgreSQL (atomic) | **done** (via complete route) |
| 8 Experience extraction + Hindsight retain | **done** (in complete route) |
| 9 Timeline / learned pattern | not started |
| 10 Full UI polish | basic done; timeline not started |
| 11 Seed script | not started |
| 12 Additional tests (DB, security) | partially done |
| 13 README / ARCHITECTURE | pending |
| 14 Final instructions | pending |

## Known issues / risks
- Supabase NOT run against a live instance yet (migration in `supabase/migrations/0001_init.sql`).
  Run the SQL in the Supabase editor and fill in SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
  Also need ANTHROPIC_API_KEY with a real model access.
- Retain latency (sync LLM extraction) may be long; timeout is 90s.
  The completion route does block — if this is slow, move retain to a background queue (Phase 8 improvement).
- `lib/db.ts` untested without a Supabase instance.
- No auth on routes (Phase 5 spec said to add auth, but for hackathon MVP we skip; technician_id is
  sent from the client form — in production add session cookies or JWT).
- Technician list requires at least one user with role='technician' in the DB.

## Commands
`npm install` · `npm run typecheck` · `npm test` · `npm run build` · `npm run verify:hindsight` · `npm run seed` (not yet written)

## Environment variables (names only; see .env.example)
HINDSIGHT_BASE_URL, HINDSIGHT_API_KEY, HINDSIGHT_BANK_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
OPENROUTER_API_KEY, OPENROUTER_MODEL (default: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free),
OPENROUTER_BASE_URL (optional, defaults to https://openrouter.ai/api/v1)
