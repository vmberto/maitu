# Places Lists and Smart Place discovery: handoff

Updated: 2026-10-16. Repository: `vmberto/maitu`, branch `main`.
Production: <https://maitu.umbertobarrosf.workers.dev/>.
Implementation baseline before this handoff: `dc6ea8d`.

## Current product state

Places List remains a distinct list type. Its entries are ordinary tasks, with Location enabled by default. Existing task titles, tags, completion, offline storage and synchronization continue to use the existing task model. The map is available through the list header; the earlier request for an always-visible map was superseded by the request to remove the map above the list.

At the user's request, this handoff change hides the Smart Place input and removes automatic URL interception from the bottom input. The bottom placeholder is **Add place…**. Pasted URLs now save as ordinary item titles; they do not start discovery. Users can still set a location through task details. Existing saved locations and tags are retained.

The Smart Place component, backend, parsers and backend tests remain in the repository for future work. Four browser scenarios for its hidden UI are explicitly skipped, with their assertions retained as restoration references. Active browser coverage verifies normal Places creation, default Location, map navigation, offline operation and pasted URLs without discovery requests.

**Smart discovery is not production-validated or ready to re-enable.** Its latest reported failure is a Jina Reader HTTP 429 even after the user configured a key. Hiding the interface does not fix that provider failure. The authenticated backend remains available; this change is a UI pause, not an API shutdown.

## Intended Smart Place behavior

The user wants to paste a venue name, caption, Google search/Maps URL or Instagram link and get a real venue with:

- A canonical task title.
- Coordinates locating that venue on the map.
- Relevant existing task tags, when supported, such as Breakfast, Dinner, Burger or Museum.
- Automatic addition only for a clear, verified match; review or an actionable failure for ambiguity.

Returning an arbitrary geocoder result is unacceptable. The screenshot supplied by the user showed a search for “clarice bistro” returning **Le Bistrot du Marché in Montguyon, France**. That was the central quality failure: a search result was being treated as venue identification.

The user initially accepted a low-cost metered API, then requested an open-source/free alternative. The current implementation uses Cloudflare-hosted Llama and Jina Reader. Do not quietly introduce another paid provider. Free allowances have limits; an open-source model does not make hosted inference or web research unlimited.

## Architecture and code map

### UI and data

- `types/main.ts` and `src/lib/list-types.ts`: Places list type and default task add-ons.
- `src/routes/tasks/+page.svelte`: ordinary task creation and the bottom input. The Smart Place mount and URL interception have been removed here.
- `src/lib/SmartPlaceInput.svelte`: retained discovery form, paste/Enter handling, candidate review, source links and auto-add behavior. It is currently unmounted.
- `src/lib/smart-place.ts`: `SmartPlace` extends a task location with tags; normalization trims and deduplicates at most five tags, each at most 30 characters.
- `src/lib/location.ts`: validates coordinates, source and identifiers, parses pasted coordinates and explicit Google pins. A map camera center is not accepted as a venue pin.

A resolved venue's name becomes the existing task title. Location is stored in the existing task location field; tags are stored in the existing task tags field. There is no separate place-item schema.

### Endpoint and resolution

`src/routes/api/places/+server.ts` authenticates the session and checks same-origin POST requests. It bounds input and JSON sizes and returns private, non-cacheable responses. POST invokes Smart Place resolution; GET retains the older manual location lookup.

`src/lib/smart-place.server.ts` implements the current discovery flow:

1. Accept explicitly supplied coordinates or a supported explicit map pin directly.
2. Require the Workers AI binding for researched resolution.
3. Retrieve public evidence through `researchPlace`.
4. Run `@cf/meta/llama-3.1-8b-instruct-fp8` once, with JSON-object mode, temperature 0, a 700-token output limit and a 25-second timeout.
5. Validate the returned venue identity, address, city, source references and tag evidence against retrieved text. Model output alone is not evidence.
6. Use a unique published venue pin when available. Otherwise query Photon only after researching identity, and require a matching city, street address and venue name.
7. Return no accepted venue when the evidence or coordinates are insufficient. Conflicting pins require review.

The model does not supply trusted latitude/longitude. This protects against plausible but invented coordinates. Strict source checks can also reject legitimate venues when a page's formatting or address spelling differs; improve this with fixtures rather than weakening identity validation broadly.

`src/lib/place-research.server.ts` handles research:

- Google search links contribute their search query.
- Public links are read through the fixed host `r.jina.ai`.
- Search currently reads a public DuckDuckGo result page through Jina, then follows up to two relevant source links. This is **not** Jina's `s.jina.ai` search API.
- `JINA_API_KEY`, when present, is sent as a Bearer header to Jina. It is not sent to the model, client or destination websites.
- Instagram profile handles can seed research when the profile is blocked or has a generic title. Handles are not proof of identity. Posts, reels and reserved Instagram paths do not qualify for this profile fallback.
- URLs are validated against private hosts, credentials and unsupported ports. Fetches use manual redirects, bounded bodies, per-request timeouts and a shared 35-second deadline. Retrieved page text is capped before model use.
- Explicit Google pins and DuckDuckGo map annotations can provide coordinates; map camera centers are excluded.

`src/lib/place-inclusion.server.ts` retains the older geocoding path and shared bounded JSON reader. Photon defaults to `https://photon.komoot.io/`, with an optional `PHOTON_URL` override. `src/lib/place-inclusion.ts` provides public URL validation and query extraction.

### Runtime, persistence and deployment

- `src/lib/runtime-env.server.ts`: reads bindings from `cloudflare:workers`, with compatibility for older platform-based tests and Node execution.
- MongoDB helpers use request-scoped connections on Workers and keep pooling on Node. See the `withMongoDb` implementation and its tests.
- `wrangler.jsonc`: Worker `maitu`, `AI` binding, `nodejs_compat`, assets, observability and reminder cron.
- `vite.config.ts`: Cloudflare production adapter, Node for E2E/local execution and the existing Vercel option.
- Git pushes to `main` trigger Cloudflare Workers Builds. A successful build/deploy check does not prove a signed-in live place lookup works.

## Confirmed failures and fixes

### Worker fetch redirect handling

The Workers runtime rejected `redirect: 'error'` before the intended lookup. Calls were changed to manual redirect handling with response checks. This affected place research/geocoding and related fetch code. A Workers runtime reproduction established the issue.

### Missing runtime binding despite configured AI

SvelteKit 3 / adapter-cloudflare 8 no longer expose bindings through the old `event.platform.env` assumption. Runtime bindings must be read from `cloudflare:workers`. Earlier mocks supplied the old interface and therefore missed the production problem. The runtime environment helper and a real Miniflare object-binding regression now cover this distinction.

### Llama structured response rejection: AI-5025

Cloudflare rejected the earlier `json_schema` request. The selected model is now requested with `response_format: { type: 'json_object' }`; application validation enforces the fields and evidence. Do not restore the unsupported schema format just because another provider supports it.

### Sync Worker exception: hung request / error 1101

The user supplied a production exception for `GET /api/sync`: “The Workers runtime canceled this request because it detected that your Worker's code had hung and would never generate a response.” The request terminated after roughly 4 ms wall time, not after a long geocoding timeout.

The code cached a MongoDB connection/promise globally across Worker requests. Workers cannot reuse request-bound I/O this way. Database operations were migrated to request-scoped Worker connections, with cleanup on success and failure; Node keeps its pool. Tests cover independent concurrent requests and cleanup. This was a separate persistence issue, not evidence that an AI lookup caused the sync failure. Signed-in production database behavior was not independently verified by the assistant.

### Jina key propagation

The newer research path originally omitted the configured Jina key, although the legacy path supported it. Commit `1230e9b` forwards `env.JINA_API_KEY` to all reader calls in that flow. Tests cover the header. The user said they were deploying their primary Jina key as a Worker secret.

### Instagram profile rejected before research

`https://www.instagram.com/claricebistroecafe` produced “Paste a place name, caption or a readable public link.” Generic/blocked Instagram pages did not yield a useful query. Commit `dc6ea8d` adds the validated profile-handle fallback and compact-name matching. Tests still reject unrelated profile identities. This fixes query seeding, not Instagram access or reader quota.

## Open blocker: authenticated reader still returns 429

Latest user-visible error:

> The public reader rate limit was reached. Set the Worker secret JINA_API_KEY to use your own Jina account allowance, or try later. (WEB-HTTP-429-429)

Inputs reported during this investigation included:

- `clarice bistro recife`
- A Google search URL with `q=clarice+bistro`
- `https://www.instagram.com/claricebistroecafe`
- Earlier, a Google search URL with `q=terraco+da+praca`

**What is known:** the reader returned HTTP 429, and code now has a path to send the configured key.

**What is not known:** whether the failing deployed request saw that secret, whether it sent an authenticated request, and whether the exact key has hit a request-rate or account/balance limit. No production authenticated reader response was captured by the assistant. Do not describe any one of these possibilities as a confirmed root cause.

The current error wording is misleading for authenticated failures because it always recommends setting the key. Logs include sanitized numeric error references but do not distinguish authenticated and anonymous reader requests. This is the first diagnostic gap to fix when resuming. Never log the key or ask the user to paste it into chat.

Public search-page rendering is another reliability risk. Research found that otherwise equivalent DuckDuckGo URL encodings could return different page structures, including whether map annotations were present. This public page route is brittle and should not be treated as a guaranteed search API.

## Public evidence found for the Clarice example

Public research retrieved evidence identifying **Clarice Bistrô e Café**, at **Avenida Doutor Seixas, 48, Recife**, with coverage from Folha de Pernambuco and restaurant directories. Published map annotations included approximately `-8.030953, -34.924978` and `-8.0310648, -34.9248608` in different retrieved results. These differ by around 18 metres: retain their source context and investigate precision rather than hardcoding either as an authoritative coordinate.

Retrieved descriptions supported breakfast/brunch/dinner categories. Browser fixtures demonstrate saving Breakfast and Dinner tags, but those fixtures are not proof of successful live Llama classification. No successful complete authenticated production lookup was verified.

## Configuration and cost boundaries

Required for current researched discovery:

- Cloudflare Workers AI binding named **AI**.
- Worker secret **JINA_API_KEY** for the user's reader allowance. Anonymous access is possible but hit rate limits in production.
- Existing application session/authentication and MongoDB configuration.

`OPENAI_API_KEY` is not required by the current resolver; OpenAI was replaced. Ordinary OpenAI API billing is separate from a Plus subscription. If reconsidering subscription-backed integration later, consult current official eligibility rather than assuming arbitrary hosted apps can use a Plus plan.

At investigation time, Workers AI documented a free daily allowance of 10,000 Neurons; behavior beyond that depends on the account plan. Jina also has request and balance limits. Check the current provider dashboards and documentation before promising free operation. The app does not implement an account-wide spending cap.

The assistant had no authenticated Wrangler deployment session or Cloudflare dashboard access. Do not assume local CLI access to production secrets. Browser automation did not provide an authenticated production session; do not extract cookies or forge authentication to work around this.

## Commit history for reconstruction

Read these commits in chronological order:

- `b3c1f79` — Places list.
- `e636c11` — Fix Cloudflare redirect handling for place search.
- `b2e90a5` — Use grounded GPT discovery for Places lists.
- `6fbca25` — Explain OpenAI billing and rate limit failures.
- `0cc80dd` — Use Cloudflare Llama for Smart Place inclusion.
- `4a27536` — Read Worker bindings through the SvelteKit 3 runtime.
- `b0820c6` — Distinguish Cloudflare inference and response failures.
- `8dcb240` — Scope MongoDB connections to each Cloudflare request.
- `7ea0734` — Use supported JSON mode for Cloudflare Llama.
- `1c897b9` — Research venue sources and save Smart Place titles and tags.
- `c8cd243` — Expose public reader failures and allow cold page loads.
- `1230e9b` — Use configured Jina credentials for place research.
- `dc6ea8d` — Research Instagram profile links when page titles are unavailable.

The commit containing this report then hides discovery UI and restores ordinary bottom-field creation. Older GPT code and the earlier page integration can be inspected through Git history; the current resolver does not call GPT.

## Validation and its limits

Validation for this handoff change:

- `npm run check`: zero errors and warnings.
- `npm run test:unit`: all 113 tests passed across 17 files.
- Focused Chrome Places List browser checks: both passed, including hidden discovery and ordinary URL creation.
- `npm run build:cloudflare`: passed (existing large-chunk warning).
- The four retained Smart Place UI scenarios remain intentionally skipped. No live reader/model lookup was attempted for this UI pause.

Before this UI pause, recorded validation included unit coverage of research, identity checks, coordinate rules, tags, provider errors and runtime bindings; focused browser scenarios covered title/location/tag persistence using mocked HTTP results. The latest Instagram change passed 19 focused tests and Svelte checking/building. Earlier full-suite results and individual browser runs are historical evidence, not proof that the final deployed resolver worked.

A Miniflare test verifies real Worker binding access. An attempted harness around the entire built Worker failed to start Miniflare; it did not establish a full authenticated runtime integration. Local public Reader requests succeeded in cases where the deployed user request returned 429. Local success is not production success.

Known unrelated browser-suite failures previously included a startup JavaScript gzip limit near 55 KB and a reminder timezone expectation. Re-evaluate them on the current build before treating them as current failures. Build and Playwright both write `.svelte-kit`; run those operations sequentially.

Useful commands:

```sh
npm run check
npm run test:unit
npm run test:e2e -- --project=Chrome --grep 'Places List'
npm run build:cloudflare
```

The hidden Smart Place browser scenarios are intentionally skipped and cannot validate a future remount until re-enabled. Temporary live-research fixtures and screenshots under `/tmp` are disposable, not repository artifacts or production proof.

## Resume plan

1. Keep the UI hidden while diagnosing the reader. Add safe diagnostics for whether a key exists and whether the request uses authentication, alongside the existing HTTP/provider codes. Distinguish authenticated and anonymous failure messages. Do not log raw credentials, cookies or unrestricted provider bodies.
2. Inspect the exact deployed key's dashboard limits/balance and confirm the active Worker version receives the secret. Test a single authenticated reader request inside the deployed runtime with the user's authorized access. Verify without exposing the key.
3. Determine whether the public search-page approach is adequate. If changing providers or using Jina's dedicated search API, evaluate current costs and quotas explicitly; do not introduce it as a supposedly unlimited free fallback.
4. Run live acceptance checks for a Google search URL, plain name plus city, the Clarice Instagram profile and a direct venue website. Include unrelated same-category venues, ambiguous names, conflicting pins, blocked pages, missing keys and exhausted allowance. Fail safely rather than adding a wrong venue.
5. Verify canonical title, independently sourced coordinates and supported tags in the saved ordinary task, including offline reload and map position. Retain source links for review. Do not infer cuisine, meal categories or coordinates merely from the venue handle.
6. Only after live reliability is demonstrated, restore the `SmartPlaceInput` import/mount in the tasks page. Its `onadd(place, source)` callback must save `place.name`, normalized location and `place.tags` through the existing task engine. Restore bottom-field URL routing deliberately, if still desired, with a mounted component and input clearing only after successful save.
7. Re-enable the four retained browser scenarios and update the active “hidden” regression for the restored behavior. Keep backend validation and runtime tests. Confirm Cloudflare deployment separately from local mocks.

## References

These are useful starting points; provider documentation and pricing may change:

- [SvelteKit 3 migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)
- [Workers AI bindings](https://developers.cloudflare.com/workers-ai/configuration/bindings/)
- [Selected Llama model](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/)
- [Workers AI errors](https://developers.cloudflare.com/workers-ai/platform/errors/)
- [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [MongoDB on Workers](https://developers.cloudflare.com/workers/databases/third-party-integrations/mongodb/)
- [Workers exceptions](https://developers.cloudflare.com/workers/observability/errors/)
- [Jina Reader](https://jina.ai/reader/)
- [Jina pricing and account limits](https://jina.ai/api-dashboard/pricing/)
