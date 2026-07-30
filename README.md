# VoltLog

**Track. Understand. Save.** — a premium, offline-first Progressive Web App for logging daily electricity meter readings.

## Features

- Mechanical-meter style reading input (integer digits black, decimal digit red)
- Fully offline: all data stored in IndexedDB, no login required
- Daily / weekly / monthly / yearly usage, averages, high/low day
- Line + bar charts (recharts)
- Editable Bangladesh residential slab tariff → estimated monthly cost
- Configurable daily reminder with 2/3/5/10-minute repeat until today's reading is saved
- Export / import JSON, export CSV, full reset
- Installable PWA with manifest + service worker

## Local development

```bash
bun install
bun run dev
```

## Deploy to GitHub Pages

1. Create a new repository on GitHub, for example `voltlog`.
2. Upload all files from this project to the repository's `main` branch.
3. Make sure this file exists in GitHub: `.github/workflows/deploy.yml`.
4. Go to **Settings → Pages → Source → GitHub Actions**.
5. Go to **Actions → Deploy to GitHub Pages** and wait for the green check mark.

This project uses TanStack Start + Nitro static output. The deploy workflow uploads `.output/public` to GitHub Pages and automatically sets the correct base path for a repository URL such as `https://username.github.io/voltlog/`.

Use this workflow at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: "pages"
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest
      - name: Install dependencies
        run: bun install --frozen-lockfile
      - name: Build
        run: bun run build
        env:
          GITHUB_PAGES: "true"
      - name: Setup Pages
        uses: actions/configure-pages@v5
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .output/public
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

6. Open the published URL in Chrome on Android → menu → **Add to Home screen**.

## Data & privacy

All readings live in your browser's IndexedDB. Nothing leaves your device unless you export the backup file yourself.