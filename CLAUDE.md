# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Docs First

**Before writing any code, read the relevant files in `docs/`.** These files define standards that all code in this repo must follow:

- `docs/ui.md` — UI component and styling standards
- `docs/data-fetching.md` — data fetching conventions (Server Components, repository pattern, auth enforcement)

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test framework is configured yet.

## Architecture

This is a **Next.js 16 App Router** project with **React 19**, **TypeScript** (strict mode), and **Tailwind CSS v4**.

**Key conventions:**
- All source lives under `src/`, with the App Router at `src/app/`
- Path alias `@/*` maps to `./src/*`
- Styling is utility-first via Tailwind CSS v4 (PostCSS-based, no `tailwind.config` file needed)
- Fonts are loaded via `next/font/google` in `src/app/layout.tsx` using Geist Sans and Geist Mono, exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`
- ESLint is configured with `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`

**App Router structure:**
- `src/app/layout.tsx` — root layout (HTML shell, font variables, global CSS import)
- `src/app/page.tsx` — home route (`/`)
- New routes are added as `src/app/<route>/page.tsx`; shared UI can go in `src/components/`

**Typescript**
- Strict mode is enabled. The project targets ES2017 with ESNext modules.

**Authentication**
- Authentication implemented with `@clerk/nextjs` (email only)
- Clerk middleware lives in `src/proxy.ts` — Next.js 16 renamed `middleware.ts` → `proxy.ts`
