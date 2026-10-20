# PWA Installation Lock — Africhiko

Installation is protected infrastructure. Branding and feature work must not replace or rewrite the native browser installation flow.

## Protected behavior
- Capture Chromium's `beforeinstallprompt` early, retain the event, and call its native `prompt()` directly from the explicit branded Install click.
- Desktop/Android install UI appears only when the retained native prompt exists and calls the native prompt directly. The install card is small, dismissible, and non-blocking. No fake native prompt or dead install button.
- While the native prompt is available or being invoked, hide the service-worker Refresh banner so it cannot reload the page and interrupt the one-shot install event.
- iPhone/iPad browsers receive a small, dismissible install card; its optional instructions explain Share → Add to Home Screen. Do not show these instructions on desktop or Android.
- Never auto-open the detailed installation instructions or block normal browsing with an install promotion. Dismissal is remembered for seven days. Keep embedded-browser handoff separate and preserve the current URL.
- Keep one authoritative controller in `src/app/pwa-register.tsx`; do not add a second controller or install modal elsewhere.
- When investigating a stale install screen, inspect the deployed Git commit and service-worker cache first. Keep Africhiko's cache namespace unique and increment its version when shell/runtime assets change.

## Service-worker resilience (release-blocking)

Firebase background messaging is optional to installation and offline navigation. Its CDN scripts and configuration route must be loaded inside a guarded `try/catch`; a failed `importScripts()` must not abort the service-worker file before the core `install`, `activate`, `fetch` and `message` handlers register. When changing the shell/runtime worker, increment the Africhiko cache version so clients activate the repaired worker and retire stale shell caches through the normal activation path.

`npm run verify:identity` also runs `scripts/verify-pwa-install.mjs`. That test executes the worker with a simulated Firebase import failure and asserts that the core PWA lifecycle handlers still register. It also checks that the Refresh banner is gated while native installation is available/in progress. Browser-native installation still depends on Chrome's own eligibility checks; source tests do not replace Android/iOS device QA.

## Release blockers
The following must fail `npm run verify:identity` if they reappear anywhere in active UI source:
- “If your browser provides a native install prompt”
- “Chrome install option”
- “If neither option appears, Chrome has not marked this site installable”
- generic Chrome/Edge menu directions as a replacement for a native prompt
- “No app-store search needed. Your browser will guide the installation.”
- custom desktop/Android installation explainer screens or buttons that do not invoke the native prompt

## Required checks
Run `npm run verify:identity`, `npx tsc --noEmit`, lint and build. Then test desktop Chromium with prompt available/unavailable, Android Chrome and iPhone/iPad Safari separately. A clean build does not prove device installation; report that QA separately.
