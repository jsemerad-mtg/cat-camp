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

Any time the app changes: copy the new `index.html` into this folder, commit, and push. Cloudflare Pages picks it up automatically — no dashboard steps needed after the first setup.
