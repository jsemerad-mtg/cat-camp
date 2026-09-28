# Cat Camp

A self-contained web app (`public/index.html` — no build step, no dependencies) deployed as a Cloudflare **Worker** with static assets.

## Why a Worker (not Pages)

This project was created through Cloudflare's "Workers & Pages" flow, but ended up
provisioned as a plain **Worker**, not a **Pages** project (you can tell from the
`workers.dev` domain and the version-based deploy history in the dashboard).
Plain Workers don't support the `functions/` auto-routing convention Pages has,
so the account-sync API needs to be wired up explicitly — that's what
`wrangler.jsonc` and `src/worker.js` do below.

## Project layout

- `public/index.html` — the whole app (UI, game logic, everything client-side).
- `src/worker.js` — the Worker's entry point. Handles `/api/account`, `/api/login`,
  and `/api/save` (the account-sync backend), then falls back to serving
  `public/index.html` for everything else.
- `wrangler.jsonc` — tells Cloudflare how to build and deploy this Worker,
  including the static assets directory and the KV namespace binding.

## One-time setup: Deploy command

Because this is a Worker (not Pages), Cloudflare's GitHub-connected build needs
to be told to run `wrangler deploy` explicitly:

1. Cloudflare dashboard → your `cat-camp` Worker → **Settings** → **Builds**
   (or wherever the build/deploy configuration lives for this project).
2. Set:
   - **Build command**: *(leave blank)*
   - **Deploy command**: `npx wrangler deploy`
3. Save. The next push to `main` will use this to actually deploy the Worker
   script + assets, instead of Cloudflare's default zero-config static-only
   behavior (which is what was silently ignoring the API before).

## Updating later

Any time the app changes: update `public/index.html` (and/or `src/worker.js`),
commit, and push. Cloudflare picks it up automatically — no dashboard steps
needed after the one-time setup above.

## Account sync (KV)

The app has an optional "Create account with a PIN" feature so a child's
points/progress can follow them across devices. It's backed by the
`/api/*` routes in `src/worker.js`, which need a Cloudflare KV namespace.

`wrangler.jsonc` already declares the binding:

```jsonc
"kv_namespaces": [
  { "binding": "CATCAMP_KV", "id": "<your namespace id>" }
]
```

Replace `<your namespace id>` with the ID of your KV namespace (Cloudflare
dashboard → **Workers & Pages** → **KV** → click your namespace → copy its ID).
Once that's in place and deployed, the "Create account" flow on the Home
screen will work — no further setup needed. Accounts are stored as `name` +
a securely hashed PIN (never the PIN itself) in that KV namespace.
