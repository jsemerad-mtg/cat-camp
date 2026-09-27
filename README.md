# Cat Camp

A single-file, self-contained web app (`index.html` — no build step, no dependencies).

## Deploy to Cloudflare Pages (GitHub-connected)

1. **Create a new GitHub repo** (e.g. `cat-camp`) at github.com/new — public or private, either works.
2. **Push this folder to it**, from a terminal in this folder:
   ```
   git init
   git add index.html README.md
   git commit -m "Initial Cat Camp deploy"
   git branch -M main
   git remote add origin https://github.com/<your-username>/cat-camp.git
   git push -u origin main
   ```
3. **Connect it in Cloudflare:**
   - Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
   - Select the `cat-camp` repo
   - Framework preset: **None**
   - Build command: *(leave blank)*
   - Build output directory: `/`
   - Click **Save and Deploy**
4. Cloudflare gives you a `cat-camp-xxx.pages.dev` URL — that's the live site. Every future `git push` to `main` auto-redeploys it.

## Updating later

Any time the app changes: copy the new files into this folder, commit, and push. Cloudflare Pages picks it up automatically — no dashboard steps needed after the first setup.

## Account sync (one-time setup)

The app has an optional "Create account with a PIN" feature so Eliza's points/progress can follow her across devices. It's backed by a small serverless function (`functions/api/[[path]].js`) that needs a Cloudflare KV namespace to store accounts in. One-time setup:

1. **Create the KV namespace:** Cloudflare dashboard → **Workers & Pages** → **KV** (in the left sidebar) → **Create a namespace**. Name it something like `catcamp-accounts`.
2. **Bind it to the Pages project:** go to your `cat-camp` Pages project → **Settings** → **Functions** → **KV namespace bindings** → **Add binding**.
   - Variable name: `CATCAMP_KV` (must match exactly — the code looks for this name)
   - KV namespace: the one you just created
3. **Redeploy** — trigger a new deployment (any push to `main`, or use "Retry deployment" on the latest one in the dashboard) so the binding takes effect.

Once that's done, the "Create account" flow on the Home screen (cloud icon, top-left) will work — no further setup needed. Accounts are stored as `name` + a securely hashed PIN (never the PIN itself) in that KV namespace.
