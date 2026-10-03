# Deploying

The site is a **static** Vite build: plain HTML, CSS and JS. Nothing runs
server-side.

**How it deploys:** every push to `main` runs
[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml). GitHub's
runner builds the site into `docs/` and copies it over SSH to
`/var/www/sites/image-tile.jugaaadi.com` on the VPS. The server's nginx serves
any `/var/www/sites/<domain>` folder by its host name, and Coolify's Traefik
routes the domain to that nginx. Redeploy by hand from **Actions → Deploy site
→ Run workflow**.

This repo is public: no server address, user or key is written here. They
live only in the repository's secrets.

---

## One-time setup for this site

The VPS already has the `deploy` user, the shared nginx and Coolify's Traefik
(set up for the other `*.jugaaadi.com` static sites). A new site needs three
things.

### 1. DNS

Cloudflare → DNS → an `A` record named `image-tile`, pointing at the VPS,
proxied.

### 2. Register the domain on the VPS

Copy [`add-site.sh`](add-site.sh) to the server and run it as root:

```bash
bash add-site.sh image-tile.jugaaadi.com
```

It creates the web root and the Traefik router file. Nothing restarts. The
domain answers with a placeholder page until the first deploy.

### 3. Repository secrets

GitHub → this repo → **Settings → Secrets and variables → Actions → New
repository secret**:

| Secret | Value |
| --- | --- |
| `SSH_HOST` | the VPS address |
| `SSH_USER` | `deploy` |
| `SSH_PRIVATE_KEY` | the private half of the deploy key whose public half is in the `deploy` user's `authorized_keys` |
| `SSH_PORT` | only if not `22` |

GitHub masks secrets in logs. The `deploy` user can write only to the web
roots.

---

## Checking a deploy

```bash
curl -I https://image-tile.jugaaadi.com/
```

- **Placeholder page:** the workflow has not run yet, or failed. Check the
  Actions tab.
- **Cloudflare 526:** no certificate yet. Wait 2–3 minutes after `add-site.sh`.
- **Cloudflare 502:** the Traefik router file is missing; re-run `add-site.sh`.

## Do not put API keys in this build

Anything Vite inlines at build time ends up in the public JavaScript. Never
add a `define` that reads a secret, and never commit a `.env` with one.
