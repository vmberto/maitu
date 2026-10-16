# maitu

An offline-first SvelteKit app for task lists, timelines and task locations. Svelte 5, SvelteKit 3, Tailwind CSS, MongoDB and a native service worker. Leaflet loads when opening a list's map.

## Scheduling and reminders

Create a task first, then enable **Schedule & Reminder** under Options → Add-ons. The scheduling panel appears below Description and tags, alongside other enabled add-ons. A scheduled date is optional, and its time is optional. Undated tasks retain manual ordering; scheduled tasks use chronological ordering. Overdue tasks appear first, followed by undated tasks, Today, and a collapsed Upcoming section. All Tasks includes future tasks. Today, This Week (Monday–Sunday), This Month, and Upcoming filter by calendar date in the device's timezone; Upcoming means dates after today. Completed tasks retain their existing completion section, subject to the selected date filter. Notes are not scheduled.

Date-only tasks retain their selected calendar day. Timed tasks keep their IANA timezone and are displayed in the viewing device's timezone. Invalid daylight-saving times are rejected; repeated times use the earlier instant. Task fields `schedule` and `reminder` are optional, validated, and synced through the existing offline outbox, with no task migration required. A reminder has its own UTC instant, timezone and unique ID; removing the scheduled date does not remove the reminder, and disabling a reminder does not remove the date. Clones do not copy reminders.

Push setup requires an online browser, permission and a production service worker. Vite development mode does not generate `/sw.js`; the app explains this before requesting permission. To test push on localhost, run `npm run build:local` and then `npm start`, using the values in `.env`. The local server also needs a scheduler or a manual authenticated call to `/api/reminders/run` to send due reminders. Users explicitly select a reminder date **and time**. Each registered device receives the reminder; up to 20 devices per account are supported. Notifications open the corresponding task. Chromium, Firefox and Safari push endpoints are accepted; iPhone/iPad users must install the web app on their Home Screen. Denied permission does not block scheduling. Offline changes take effect on the server after sync; the receiving device suppresses notifications canceled by its own unsynced edits.

Configure delivery before deploying:

1. Run `node scripts/generate-push-keys.mjs` privately. Keep the generated public/private key pair stable; changing it requires resubscribing devices.
2. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (a real `mailto:` contact), `CRON_SECRET`, and `APP_ORIGIN` (the public HTTPS origin) as deployment environment variables/secrets. Never commit the private key or cron secret. `.env.example` lists the names.
3. Cloudflare builds wrap the SvelteKit worker with a scheduled handler, using the same worker and MongoDB. `wrangler.jsonc` runs it once per minute. For Node or Vercel, configure a server-side scheduler to GET `/api/reminders/run` every minute with `Authorization: Bearer <CRON_SECRET>`; do not run browser timers for delivery.
4. Set these values in the deployed Worker’s runtime **Settings → Variables and Secrets**, not only build variables or a local `.env`. The push endpoint reads Cloudflare bindings directly and reports missing setting names without exposing values.
5. Enable reminders on each device through the scheduling panel. The API reports missing server configuration rather than pretending notifications are enabled.

`pushSubscriptions` stores account-scoped device subscriptions. `reminderDeliveries` uses per-task/reminder/device IDs, atomic two-minute leases, retry backoff (up to eight attempts), and 30-day receipt retention. MongoDB indexes are created by the runner. Successful devices are not retried, expired endpoints are removed, and completed/deleted/archived tasks and archived lists are rechecked before sending. Runs rotate through due tasks in batches of 100 and stop after roughly 45 seconds; large backlogs may take several runs. The service worker keeps the last 200 delivery IDs to suppress duplicate display. Changing a reminder creates a new ID; changing a scheduled date leaves its independent reminder intact.

Delivery is best effort: minute-level polling and push providers/browser/OS settings can delay it, and provider acceptance cannot prove the notification was seen. Cancellation cannot recall a push already accepted by the provider. A crash between accepting and recording a send can cause a retry; notification IDs suppress ordinary duplicates, but exactly-once delivery is not guaranteed. Browser tests stub subscription and OS display APIs; encryption, authorization, retries, cancellation and routing are tested separately. Live device delivery requires a configured deployment.

## Run

Use Node.js 22.12 or newer (CI uses Node 24).

```sh
npm ci
npm run dev
npm run check
npm run test:unit
npm run test:e2e
npm run build
npm start
```

Development opens on `http://127.0.0.1:3000`. Restart a previously running development server after the migration. Production defaults to port 3000; `PORT` and `HOST` can override it. Development does not install a service worker; offline browser tests build and run production separately on port 3200.

Create a root `.env` with `MONGODB_URI` and a `SECRET_KEY` containing at least 32 bytes. An optional `PHOTON_URL` overrides place search. Secrets remain server-side. When self-hosting behind an HTTPS proxy, set `ORIGIN` to the public app URL so cookie security and origin checks use the correct URL. Existing users, JWT sessions, lists and tasks retain their MongoDB formats. No database migration is required.

## Offline behavior

IndexedDB remains `maitu-offline` version 1 with the existing `accounts` store and per-user keys. Each edit and its outbox entry are saved in one transaction. Reads start from device data, without waiting for the network. Focus, reconnect and background sync retry queued changes; receipts prevent duplicate writes after lost responses. Concurrent edits require an explicit conflict choice.

Lists remain fully visible. Active and completed tasks reveal batches of 20 on scroll. Completion is saved immediately, with a three-second visual delay before moving the row. Completed checkboxes are disabled and tasks cannot be reopened from task options. Completed tasks show a total count, are sorted by completion time newest first, and reveal additional batches automatically on scroll. Timeline entries display time and text without item-detail drawers. Hold a list or todo row briefly to drag it; moving before the hold finishes preserves normal scrolling. Keyboard users can focus the hidden Reorder control and use arrow keys. New todos and subtasks are committed with Enter or blur; clearing an existing todo title deletes it on blur, including its subtasks, through the durable outbox. Task and list details use bottom sheets, while account options use a right sidebar. Both support backdrop dismissal, Escape and header swipes, with background scrolling locked through exit. Dragged rows float above their placeholder and neighboring rows animate into their new order. Task details include editable subtasks, tags, cloning with subtasks, and optional location blocks. Archived lists are read-only, including their tasks and timeline entries.

Tasks & Notes lists (`type: mixed`) share the existing task records and offline outbox. Create one from New List, or enable it in an existing list's settings. List types are Tasks, Notes, Tasks & Notes, Places List, and Timeline. New List and List Settings use five square tiles to select a type. Timeline is available only when creating a list and is always disabled in List Settings. A list containing tasks (including archived and related tasks) cannot become Notes; a list containing notes cannot become Tasks or Places List. Either can become Tasks & Notes, and empty lists can switch between Tasks, Notes, and Tasks & Notes. These rules apply offline and on the server, preserving legacy Notes entries when enabling Tasks & Notes. Tasks / Notes tabs use the list color and share a full-width divider with the date filter. The filter appears only after a task has been scheduled, retaining that history after removing its date or scheduling add-on; the creation row says Add note in Notes and Add task in Tasks. Missing entry types retain task behavior. The expandable Options panel supports conversion, archive/restore, move, clone, and delete. Related Tasks is an optional add-on; existing child tasks remain visible, and removing the add-on is blocked locally and on the server until its list is empty. Location, Related Tasks, and Schedule & Reminder can be enabled independently from Options. Every enabled add-on has a top-right three-dot menu for removal; Related Tasks remains protected while it contains children. Scheduling’s expand/collapse control sits beside its menu. Scheduling is added after task creation; existing schedules and reminders remain visible. Removing its add-on clears both the schedule and reminder. Description and tags appear before all enabled add-ons. The tag input follows existing tags and fills the remaining row width. Tags have no entry-actions menu. Descriptions use one live editor with Cmd/Ctrl+B for bold and - followed by a space for bullet lists, preserving Markdown in storage. Pasted URLs show compact hostname chips that open the full destination in a new tab. The item title and contents scroll together; related tasks, tags, location, and options use shared section spacing. Notes never have completion status. Their related tasks appear in Tasks with the parent note's title; archiving a note leaves those tasks visible. Every item can be archived or restored from Options. Archived Items is available from each list header and from the lists menu. The dedicated page groups entries by list and supports opening details and restoring items, including offline. The expandable Archived Items section appears only in task views; Notes lists and the Notes tab use the dedicated Archived Items page. Related tasks can be archived individually from their details, and Notes lists use the same note rows and detail drawer as Tasks & Notes, with no task tab or completion controls. Timeline remains a separate type with its original date and time layout. Deleting an entry still deletes its children, as before. Tasks and notes can be reordered within their own tabs. Content pages and drawers include extra space below their final item.

Places List (`type: places`) keeps the existing task model and completion behavior. New tasks default to the Location add-on, which can still be removed. The map opens from the list header’s map button, including before any locations are saved. Ordinary tasks still use the normal creation row and work offline.

### Smart Place inclusion

Places lists keep normal tasks with Location enabled by default. The map opens from the list header; it is not shown above the list.

Smart Place inclusion researches pasted venue text, captions and public URLs. Google search links contribute their query; public search results are read through Jina Reader, and up to two relevant source pages are followed. The public reader uses `JINA_API_KEY` when configured; otherwise it uses the lower anonymous IP-based allowance. For production, add a free Jina key as a Worker secret named `JINA_API_KEY`. No credentials are sent to the client, model or destination websites. Llama receives those retrieved pages and resolves a canonical venue name, street address, city and up to five relevant tags. Each field and tag quote must be supported by its cited retrieved page. Saved tags use the existing task tags field; the canonical venue name becomes the task title.

Coordinates come from explicit pins on retrieved pages (including Google Maps pins and DuckDuckGo venue map markers), never from Llama's memory or map camera centers. If no pin is published, Photon/OpenStreetMap is used only after the venue identity and address have been researched. Candidates must match the researched venue and city; unrelated nearest-text matches are discarded. Conflicting pins or multiple matching venues require review. Unresolved identities or missing coordinates do not create a task. Source links are displayed. Explicit pasted coordinates and full map pins bypass research.

The Workers AI binding named `AI` is declared in `wrangler.jsonc`. No OpenAI key is used. `@cf/meta/llama-3.1-8b-instruct-fp8` uses its supported JSON-object mode, one inference call per lookup and a 700-token output cap. Workers AI includes a daily free allowance; on a Paid Workers account, usage above that allowance is billed. The app does not enforce an account-wide spending cap. Local Node development has no AI binding; Wrangler authentication is required for local real inference.

`POST /api/places` accepts `{ input: string }` up to 4,096 characters and returns `{ places, autoAdd, sources, message }`; each candidate can include `tags`. Research requests have a shared 35-second deadline, inference a 25-second response deadline, and the client waits up to 80 seconds. Requests and provider response sizes are bounded. The authenticated `GET ?q=` Location search remains the existing Photon search. Its optional settings are `PHOTON_URL` and `JINA_API_KEY`. All responses are private/no-store and all app-side provider fetches use fixed/configured hosts and manual redirect handling.

Public search and reader pages may be blocked, rate-limited or incomplete, so research availability is best effort. Private posts and image/video content are not accessible; paste their captions or a venue website instead. When research cannot verify a venue, it asks for more context rather than substituting another business. Saved tasks and locations remain available offline; discovery and map tiles require a connection.

## Installed-app upgrade

The manifest identity, scope and start URL remain `/`. Production generates a standalone classic worker at `/sw.js`, preserving the URL used by installed versions. The compatibility copy is made before deployment compression and hashing. Updates wait for the user's Update action.

Old app caches are removed only after every open window confirms the current build. Older windows keep their caches until they close or upgrade. API responses and authenticated page data are never precached. Local account data and queued changes are not deleted during updates.

Logout locks device access while preserving pending edits for the next sign-in. Signing out offline cannot revoke the server cookie until reconnecting. Persistent-storage permission is requested; browser storage may still be evicted by the browser.

## Deployment and checks

Cloudflare database operations use a fresh MongoDB client per request and close it afterward. Workers cannot reuse sockets or pending connection promises across requests; Node deployments retain the existing shared pool. Direct Worker connections add connection setup latency.

Builds use adapter-node locally and adapter-vercel with Node 24 when `VERCEL` is set. `vercel.json` selects SvelteKit and the root build command. The existing CI workflow uses the same root checks. No deployment is performed by the migration itself.

Unit tests exercise IndexedDB transactions, sync validation, account ownership, conflict/version handling, location parsing and real password/JWT login behavior with MongoDB mocked. Browser tests use real IndexedDB, service workers and production routing with mocked API transport, including a classic-worker upgrade with pending edits and multiple app windows. They do not write to production MongoDB.

The browser owns the installed PWA's extensions and three-dot controls. Theme metadata matches the app header; app code cannot hide those controls. App gestures and shortcuts prevent page zoom while Leaflet retains its own zoom controls.

## UI organization

Shared controls and their styles live in `src/lib/ui`: Button (including action rows), Tabs, Section, Disclosure, Icon, and RichTextEditor. Shared button and drawer CSS lives there too; `src/styles/app.css` retains page layout and task-row styling. New shared controls should reuse these components rather than adding global overrides. The rich editor is loaded independently so its download does not block the rest of the item drawer.
