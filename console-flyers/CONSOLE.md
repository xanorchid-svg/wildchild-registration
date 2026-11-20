# Lili's Wild Console (Vercel project `wildchild-console`)

Deployed with the Vercel API. The live deployment contains index.html, package.json, api/*, scripts/*.
Files here are the ones changed on Nov 17, 2026 (the rest are only in the deployment: api/_auth.js, _data.js,
login.js, logins.js, logout.js, todo.js, scripts/fetch-flyers.mjs, flodesk-sync.mjs, notify-lili.mjs).

- `index.html` here is the patched page. The deployment keeps the older index.html and applies
  `scripts/patch-index.mjs` at build time (same result).
- `api/intake.js`: one entry point for every channel (Instagram, WhatsApp, Email, Website, Other).
  Auth: console session cookie or `x-intake-key` (env INTAKE_KEY). Saves `intake/<id>.json` in Vercel Blob,
  adds the family to Flodesk "<Channel> inquiries" + "New inquiries" once (marker `flodesk/<id>.json`),
  emails Lili for Instagram/Other (marker `notified/<id>.json`).
- `api/inquiries.js` merges `_data.js` (legacy) with `intake/` blobs; `api/update.js` accepts both.
- `api/checked.js`: inbox check heartbeat (`meta/last-checked.json`).

- Nov 19: `api/registrations.js` + `scripts/patch-index-5.mjs` add the **Registered** tab (families signed up per class/event, counts by age group, filters, add form). Data in Blob `registrations/all.json`.

- Nov 20: `scripts/patch-index-6.mjs` (Logins page: discount codes under their own heading, "Add a code") and `api/logins.js` (Brightwheel added to the default logins; entries can be kind "code"; codes listed in CODES are added when missing). Keep real codes and passwords out of this public repo: they live only in the deployment and in Blob `vault/logins.json`.
