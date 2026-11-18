# Anti-DoomScroll

Don't let the algorithm cook. Zero rage-bait, just immaculate screen time.

Anti-DoomScroll is an enterprise-grade Edge AI Chrome Extension (Manifest V3) that moderates and purifies social media feeds in real-time. It runs a quantized Natural Language Processing (NLP) Zero-Shot Classification model locally in the browser via WebAssembly (WASM), redacting clickbait, rage-bait, and non-informative distractions while completely eliminating short-form doomscroll feeds (YouTube Shorts and Instagram Reels).

---

## What the Extension Does

- **Redacts Sensational Clickbait and Rage-Bait**: Analyzes titles and post bodies in real-time and applies an aesthetic blur overlay to uninformative or sensational content before you scroll into it.
- **Strict Study and Knowledge Focus Mode**: Automatically filters out music videos, movie trailers, celebrity gossip, serials, and beauty fluff, preserving only tutorials, coding deep dives, educational lectures, and technical knowledge.
- **Eliminates Shorts and Reels Doomscrolling**:
  - Removes YouTube Shorts shelves, sidebar buttons, and chips.
  - Removes Instagram Reels navigation icons and reel tabs.
  - Displays a full-screen Focus Shield if you navigate directly to a `/shorts/` or `/reels/` URL to break dopamine loops.
- **Interactive Manual Reveal**: Offers a clean capturing-phase "Show Video" button on redacted cards if you intentionally want to view the content.
- **Local Analytics Dashboard**: Tracks and displays "Blocked Today" and lifetime saves directly in the popup interface.

---

## How It Works

```text
Target Platform (YouTube / Instagram / Twitter)
      │
      ▼
Continuous Hydration Sweeper (Content Script)
- Watches dynamic Polymer web components without race conditions
- Extracts video titles and post text
      │
      ▼ (chrome.runtime.sendMessage)
Service Worker ML Engine (Background)
- Model: Xenova/distilbert-base-uncased-mnli (Quantized ONNX)
- Zero-Shot Classification via WebAssembly (WASM)
- Calibrated hypothesis scoring against educational vs toxic categories
      │
      ▼ (Inference Response)
DOM Redaction Handler
- Applies non-destructive CSS blur (.anti-doomscroll-redacted-card)
- Overlays redaction badge with confidence score and "Show Video" option
      │
      ▼
Popup Dashboard (React 18 + Tailwind CSS)
- Global Master Toggle
- Mode Selectors: Study Only (Default), Balanced, Strict
- Real-time statistics synced with chrome.storage.local
```

### 1. Continuous Hydration Sweeper
YouTube renders its feed asynchronously using Polymer custom elements (`<ytd-rich-item-renderer>`). When elements are added, their titles are initially blank until client-side data fetches complete. The extension uses a non-blocking sweeper running every 400ms alongside a `MutationObserver` to ensure titles are evaluated the moment they hydrate, eliminating hydration race conditions.

### 2. Edge AI Classification Engine
All classification runs 100% on-device inside the Chrome Service Worker. Model weights are fetched once from the Hugging Face CDN, cached permanently in local browser storage (IndexedDB/Cache API), and executed via ONNX Runtime Web. User feed data is never sent to any external server.

### 3. Non-Destructive DOM Redaction
Rather than reparenting or moving internal DOM nodes (which breaks Polymer and React virtual DOM reconcilers), the extension applies pure CSS styling directly to the container and places a high-z-index overlay on top.

### 4. Shorts and Reels Annihilation
Pure CSS stylesheets injected at `document_start` suppress all short-form shelves and navigation buttons before they can paint to the screen, preventing UI flicker. Direct URL access intercepts playback and renders an attention protection shield.

---

## Tech Stack

- **Extension Standard**: Chrome Extension Manifest V3 (MV3)
- **Build Pipeline**: Vite 5, TypeScript (Strict Mode), `@crxjs/vite-plugin` (Manifest V3 HMR integration)
- **Frontend Dashboard**: React 18, Tailwind CSS, PostCSS, Autoprefixer
- **Machine Learning**: `@xenova/transformers` (Transformers.js v2), ONNX Runtime Web (WASM execution)
- **Model**: `Xenova/distilbert-base-uncased-mnli` (Quantized 8-bit ONNX)
- **Persistence**: `chrome.storage.local` API

---

## Project Structure

```text
anti-doomscroll-extension/
├── dist/                          # Production extension bundle for Chrome
├── public/
│   └── anti.png                   # Extension logo assets
├── src/
│   ├── background/
│   │   ├── classifier.ts          # Singleton ML pipeline with regex & zero-shot logic
│   │   └── index.ts               # Service Worker runtime message listener
│   ├── content/
│   │   ├── extractor.ts           # Multi-platform DOM title & text extractor
│   │   ├── index.ts               # Continuous hydration sweeper & content script
│   │   ├── redaction.ts           # Non-destructive CSS blur & interactive reveal logic
│   │   └── shorts-blocker.ts      # Shorts/Reels stylesheet injector & focus shield
│   ├── popup/
│   │   ├── index.tsx              # Popup React mount entry point
│   │   └── Popup.tsx              # React 18 dashboard component
│   ├── services/
│   │   └── storage.ts             # Chrome storage service wrapper
│   ├── types/
│   │   └── index.ts               # Strict TypeScript domain interfaces
│   └── index.css                  # Tailwind CSS directive imports
├── anti.png                       # Source extension logo
├── index.html                     # Extension action popup HTML
├── manifest.json                  # Manifest V3 definition
├── package.json                   # Dependencies and build scripts
├── postcss.config.js              # PostCSS configuration
├── tailwind.config.js             # Tailwind CSS design system configuration
├── tsconfig.json                  # Strict TypeScript compiler options
└── vite.config.ts                 # Vite + CRXJS plugin build pipeline
```

---

## Installation and Setup

### Prerequisites
- Node.js version 18.0.0 or higher
- npm version 9.0.0 or higher
- Google Chrome browser

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Extension
```bash
npm run build
```
This compiles TypeScript, executes Vite, and packages the complete Manifest V3 bundle into the `dist/` directory.

For live development with hot module reloading:
```bash
npm run dev
```

### 3. Load into Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the `dist` directory located inside your project folder (`anti-doomscroll-extension/dist`).
5. The extension **Anti-DoomScroll** will now appear in your extensions list.
6. Pin the extension to your browser toolbar for easy access to the dashboard.

---

## Usage

1. **YouTube**: Open `https://www.youtube.com`. Non-study distractions (songs, trailers, gossip, clickbait) are automatically blurred with an explanation badge, while tutorials, coding, and educational videos remain visible. All YouTube Shorts are removed.
2. **Instagram**: Open `https://www.instagram.com`. Reels tabs and doomscroll navigation items are eliminated.
3. **Popup Settings**: Click the toolbar icon to toggle between **Study Only** (recommended), **Balanced**, or **Strict** modes, view blocked post statistics, or toggle the master filter.
