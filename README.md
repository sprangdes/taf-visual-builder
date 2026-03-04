# TAF Visual Builder

A web-based visual editor for composing TAF (Terminal Aerodrome Forecast) messages.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Development Notes](#development-notes)
- [Build & Preview](#build--preview)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

TAF Visual Builder helps users create and edit TAF forecasts through an interactive timeline and structured weather input sections (wind, visibility/weather, clouds). The app generates TAF text in real time and supports one-click copy.

## Key Features

- Interactive timeline to create/select forecast change ranges.
- Section-based editor for:
  - Wind
  - Visibility and weather phenomena
  - Cloud layers
- Change type switching (`TEMPO`, `BECMG`, `FM`).
- Real-time TAF text generation.
- Clipboard copy for generated TAF.

## Tech Stack

- React 19
- TypeScript 5
- Vite 8
- Tailwind CSS 4
- ESLint 9

## Requirements

- Node.js `22.22.0` (recommended; configured via Volta)
- npm `10+`

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open the local URL shown by Vite (default: `http://localhost:5173`).

## Available Scripts

- `npm run dev`: start Vite dev server.
- `npm run build`: run TypeScript type check (`--noEmit`) and production build.
- `npm run preview`: preview production build locally.
- `npm run lint`: run ESLint.

## Project Structure

```text
src/
  components/
    buttons/
    ChangeEditor.tsx
    CloudSection.tsx
    IssueTimeInput.tsx
    Timeline.tsx
    VisibilitySection.tsx
    WindSection.tsx
  constants/
    ui.ts
    weather.ts
  hooks/
    useHoverTooltip.ts
    useTimeRange.ts
  types/
    taf.ts
  utils/
    taf.ts
    time.ts
    ui.ts
    weather.ts
  TafBuilder.tsx
  main.tsx
  index.css
```

## Development Notes

- `TafBuilder.tsx` is the container/page-level orchestrator.
- Business logic is separated into `utils/` and `hooks/`.
- UI is modularized under `components/`.
- Shared types are centralized in `types/taf.ts`.

## Build & Preview

Build production assets:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Troubleshooting

- If `node` version mismatches, switch to Node `22.22.0`.
- If dependencies are stale, remove `node_modules` and reinstall.
- If style changes do not apply, restart the dev server.

## Contributing

1. Create a feature branch.
2. Keep changes scoped and modular.
3. Run `npm run lint` and `npm run build` before opening a PR.
4. Provide clear PR descriptions and screenshots for UI changes.

## License

No license file is currently defined in this repository.
Add a `LICENSE` file if you plan to distribute this project.
