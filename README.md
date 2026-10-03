# Tabspace 🎸

[tabspace.germon.me](tabspace.germon.me)

**Tabspace** is a modern, fast, and free web platform for guitar tabs, chords, and lyrics. It proxies and aggregates data from public community chord archives (Ultimate Guitar), giving guitarists and musicians a clean, ad-free playing and learning experience.

---

## ✨ Features

- **Extensive Search with Fuzzy Matching**: Search across over 1,000,000 songs and artists with instant debounced results, category filters (`All`, `Chords`, `Tabs`, `Bass`, `Ukulele`), and recent search history.
- **Accurate Chords Over Lyrics**:
  - **Interactive Hybrid Mode**: Chords anchored directly over matching syllables with responsive wrapping on mobile screens so lines never break chords apart.
  - **Classic Monospace Mode**: 1-to-1 Courier layout matching classic desktop tab formatting.
- **Smart Capo Engine**:
  - **Relative Capo Shapes**: View chord fingerings relative to the capo.
  - **No-Capo (Sounding Pitch)**: One-click switch to calculate sounding concert pitch chords (ideal for pianists or playing without a capo).
  - **Interactive Capo Slider (0–12)**: Move the capo to any fret to dynamically recalculate shapes.
- **Dynamic Transposition**: Transpose chords up or down by +/- semitones in real-time with slash chord support (`D/F#` -> `E/G#`) and intelligent key accidental selection.
- **Musician & Learning Tools**:
  - **Top Chord Gallery**: Displays fretboard diagrams for all chords used in the song.
  - **Interactive Chord Popovers**: Hover or tap any chord badge in lyrics to view finger numbers (1-4), fret positions, and open/muted string indicators.
  - **Hands-Free Auto-Scroll**: Floating controller with Spacebar play/pause and adjustable speed (1x to 10x).
  - **Font Sizing Stepper**: `A-` / `A+` controls to enlarge lyrics and chords for easy reading from a distance or on a music stand.
  - **One-Click Share & Print**: Clean printer-friendly layout for gigs and sheet music stands.

---

## 🛠 Tech Stack

- **Framework**: [SvelteKit 3](https://svelte.dev) + [Svelte 5 Runes](https://svelte.dev/docs/svelte/runes) (`$state`, `$derived`, `$props`, `$effect`)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Icons**: [Lucide Svelte](https://lucide.dev)
- **Testing**: [Vitest](https://vitest.dev) for unit testing + [Playwright](https://playwright.dev) for end-to-end testing
- **TypeScript**: Strict type definitions for chords, AST items, and API responses

---

## 🚀 Getting Started

### Install Dependencies
```bash
pnpm install
```

### Run Development Server
```bash
pnpm dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Tests
```bash
# Run all unit and e2e tests
pnpm test

# Run unit tests only
pnpm test:unit --run

# Run Playwright e2e tests
pnpm test:e2e
```

### Type Checking & Build
```bash
# Run Svelte and TypeScript diagnostics
pnpm check

# Production build for Cloudflare Workers
pnpm build
```

---

## ☁️ Cloudflare Workers Deployment

Tabspace is configured to deploy directly to **Cloudflare Workers** with static assets at **`tabspace.germon.me`**.

### Configuration (`wrangler.jsonc`)
```jsonc
{
  "name": "tabspace",
  "main": ".svelte-kit/cloudflare/_worker.js",
  "compatibility_date": "2026-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "binding": "ASSETS",
    "directory": ".svelte-kit/cloudflare"
  },
  "routes": [
    {
      "pattern": "tabspace.germon.me",
      "custom_domain": true
    }
  ]
}
```

### GitHub Actions CI/CD
The repository includes automated CI/CD in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) that:
1. Validates code on Pull Requests (`pnpm check`, `pnpm test:unit`, `pnpm build`).
2. Automatically deploys to Cloudflare Workers on merges to the `main` branch.

To enable automated deployment in your GitHub repository:
1. Navigate to your repository **Settings** > **Secrets and variables** > **Actions**.
2. Add `CLOUDFLARE_API_TOKEN` (an API Token generated from Cloudflare dashboard with **Workers Scripts: Edit** permissions).

### Manual Deployment
```bash
pnpm build
npx wrangler deploy
```

