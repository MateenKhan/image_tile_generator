# Working on this repo

TilePrint splits an uploaded image into printable page tiles. Vite + React, no server.

- **Before every push**, run locally and see both pass:
  - `npm run build`
  - `npm run test:e2e` (runs on a desktop and a phone; starts its own dev server on port 4300)
- **Every change ships with its e2e test** in `e2e/` (kebab-case `*.spec.ts`), written red first.
- **The repo is public.** Never commit secrets, API keys, server addresses, hostnames of
  machines, usernames or deploy keys. They live in GitHub Actions secrets only.
- Pushing to `main` deploys the site. Deploy notes: `deploy/README.md`.
- Sizes are in inches. "Print width/height" is the finished size of the joined pages;
  `utils/tileLayout.ts` is the one place that decides pages across/down — the preview and the
  splitter both use it.
