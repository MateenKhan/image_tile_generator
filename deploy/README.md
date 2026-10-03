# Deploying

Every push to `main` builds the site and copies `docs/` over SSH to the VPS
([workflow](../.github/workflows/deploy.yml)). Redeploy by hand: **Actions →
Deploy site → Run workflow**.

## One-time setup

1. Cloudflare DNS: `A` record `image-tile` → `<vps-ip>`, proxied.
2. On the VPS, as root:
   ```bash
   bash /root/add-site.sh image-tile.jugaaadi.com
   cat /root/vps_deploy
   ```
3. GitHub → **Settings → Secrets and variables → Actions**:

   | Secret | Value |
   | --- | --- |
   | `SSH_HOST` | `<vps-ip>` |
   | `SSH_USER` | `deploy` |
   | `SSH_PRIVATE_KEY` | the key printed in step 2, `BEGIN`/`END` lines included |

4. Run the workflow, then `curl -I https://image-tile.jugaaadi.com/`.

Never inline an API key into this build: everything Vite bundles is public.
