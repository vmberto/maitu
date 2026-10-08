# maitu

An offline-first SvelteKit app for task lists, timelines and task locations. Svelte 5, SvelteKit 3, Tailwind CSS, MongoDB and a native service worker. Leaflet loads on the map route.

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

The map is scoped to its list, with blue todo and green completed markers, a searchable locations drawer, and links between tasks and map cards. Coordinates can be pasted as a single latitude/longitude pair. Map tiles and place search require a network connection; saved location data and the map interface remain available offline.

## Installed-app upgrade

The manifest identity, scope and start URL remain `/`. Production generates a standalone classic worker at `/sw.js`, preserving the URL used by installed versions. The compatibility copy is made before deployment compression and hashing. Updates wait for the user's Update action.

Old app caches are removed only after every open window confirms the current build. Older windows keep their caches until they close or upgrade. API responses and authenticated page data are never precached. Local account data and queued changes are not deleted during updates.

Logout locks device access while preserving pending edits for the next sign-in. Signing out offline cannot revoke the server cookie until reconnecting. Persistent-storage permission is requested; browser storage may still be evicted by the browser.

## Deployment and checks

Builds use adapter-node locally and adapter-vercel with Node 24 when `VERCEL` is set. `vercel.json` selects SvelteKit and the root build command. The existing CI workflow uses the same root checks. No deployment is performed by the migration itself.

Unit tests exercise IndexedDB transactions, sync validation, account ownership, conflict/version handling, location parsing and real password/JWT login behavior with MongoDB mocked. Browser tests use real IndexedDB, service workers and production routing with mocked API transport, including a classic-worker upgrade with pending edits and multiple app windows. They do not write to production MongoDB.

The browser owns the installed PWA's extensions and three-dot controls. Theme metadata matches the app header; app code cannot hide those controls. App gestures and shortcuts prevent page zoom while Leaflet retains its own zoom controls.
