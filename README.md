
<p align="center">
  <img src="https://raw.githubusercontent.com/vmberto/maitu/main/public/icons/apple-touch-icon.png" alt="MAITU Logo" width="100" />
</p>

# maitu

an full-stack application designed to help you save, track, and achieve your goals. Whether you're setting personal milestones or professional targets, this app provides a simple and intuitive interface to keep you on track.

## Features

- **Flexible Categorization**: Organize your tasks by lists.
- **Tasks Tracking**: Create, manage, and track your progress on multiple tasks and subtasks.
- **(TODO) Reminders**: Set reminders to keep yourself motivated and on schedule.
- **(TODO) Progress Visualization**: Get a clear view of your progress with visual graphs and statistics.

## Tech Stack

_maitu_ is built using modern web technologies: TypeScript, Next.js 16, Tailwind CSS and MongoDB.

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" alt="TypeScript" width="60" />
  <img src="https://www.hacksoft.io/_next/image?url=https%3A%2F%2Fwww.datocms-assets.com%2F98835%2F1684410508-image-7.png&w=640&q=75" alt="Next.js" width="60" />
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Tailwind_CSS_Logo.svg/1024px-Tailwind_CSS_Logo.svg.png" alt="Tailwind CSS" width="60" />
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" width="60" />
  <img src="https://cdn.icon-icons.com/icons2/3053/PNG/512/mongodb_compass_macos_bigsur_icon_189933.png" alt="MongoDB" width="60" />
  <img src="https://cdn.freebiesupply.com/logos/large/2x/jest-logo-png-transparent.png" alt="Jest" width="60" />
  <img src="https://playwright.dev/img/playwright-logo.svg" alt="Playwright" width="60" />
</p>


## Appearance

Dark Mode is available in the user settings menu. The app follows the system appearance until you choose a mode, then remembers that choice on the device across offline navigation, reloads and sign-ins.

## Offline-first behavior

Sign in online once and wait for “All changes synced” before going offline. The production service worker precaches the lists, tasks, timeline and login shells plus their assets. Core screens read account data from IndexedDB before contacting the server. Development mode deliberately disables the service worker; use `npm run build && npm start` to test caching.

Edits and pending operations are committed together before “Saved on device” appears. Each account has its own data and queue. Unsent edits to the same item are coalesced; an operation that has been sent is immutable so a lost acknowledgement can be retried safely. Sync runs on launch, reconnect, focus and every 30 seconds while visible. Closing the app pauses sync; pending edits remain saved and resume when it opens again. Background Sync is not required. Routine sync status, “Sync now” and the device export live in user settings. Background refreshes do not show a global header; offline access, authentication/network problems and genuine conflicts remain visible. Snapshot refreshes replace existing todos in place, preserving their positions, and append newly received items. Edits made during a snapshot fetch are flushed promptly after that fetch completes.

The server validates ownership and allowed fields, applies updates conditionally against entity versions, and retains operation receipts and deletion tombstones. Concurrent edits stop at a visible conflict prompt; device changes remain available until the user chooses a version. Deletes queue descendants before their parent. Core links use native browser history to switch the shared app shell between lists, tasks and timeline without requesting HTML or RSC. The local data provider remains mounted across navigation, including browser Back/Forward. Direct opens and reloads still use the precached shell, with a brief skeleton while device storage opens.

Logout locks local access but retains account data and pending changes for the next sign-in. Logging out offline cannot revoke the server cookie until the app reaches the server; local locking still applies. Export a device backup before clearing browser storage. Persistent-storage permission is requested on a best-effort basis; the browser may still evict data. Device backups contain private task data and should be stored accordingly.

New service workers wait for explicit activation or until old app tabs close. “Update app” activates the waiting worker and reloads; committed edits survive in IndexedDB. The IndexedDB schema is version 1; future schema changes must migrate the account store, including pending operations, rather than deleting it. Old caches containing personalized HTML/RSC are removed on activation.

### Setup and checks

Use Node.js 22 or later. Configure `MONGODB_URI` and a random `SECRET_KEY` of at least 32 bytes in `.env.local`. The database collections remain `users`, `lists` and `todos`; legacy entities without a version are treated as version 0. No database-wide migration is needed. New sessions include only the public profile, never password hashes.

```sh
npm ci
npm run lint
npm run test:unit -- --runInBand
npx playwright install chromium
npm run test:e2e
```

Playwright builds and runs the production app. Offline tests use a simulated sync transport while exercising the real service worker, IndexedDB, UI and queue. Server authorization, version checks, sanitization and retry receipts have separate unit tests. The existing real-database login tests run only when both database and session-secret configuration are present; they require the seeded `test@user.com` account in `maitu_e2e`.

This implementation pulls a full account snapshot on each sync and stores operation receipts on each entity. For substantially larger accounts, move to paginated changes with a server cursor and transactional receipt retention. Do not prune receipts/tombstones without a policy that accounts for devices that have been offline for a long time.

Some dependency advisories remain in the build-time glob stack (`braces`, pulled in by Tailwind 3 and test/lint tooling); the available automated fix requires broader tooling upgrades. No forced Tailwind migration is included here.
