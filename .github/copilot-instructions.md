# GitHub Copilot Instructions for Easy Tracker

This repository contains an Obsidian plugin called "Easy Tracker" - a simple habit tracker and check-in logger.

## Quick Reference

- **Primary language**: TypeScript
- **Build tool**: esbuild
- **Package manager**: npm
- **Target platform**: Obsidian (desktop and mobile)
- **Key files**: See detailed instructions in `AGENTS.md` at repository root

## High-Level Guidelines

1. **Follow Obsidian plugin conventions**: All code must work within Obsidian's plugin API and constraints
2. **Maintain mobile compatibility**: The plugin is not desktop-only (`isDesktopOnly: false`)
3. **Keep dependencies minimal**: Prefer browser-compatible packages; avoid large dependencies
4. **Preserve existing functionality**: This is a working plugin - make surgical, minimal changes
5. **Use existing code patterns**: Follow the patterns established in the codebase for consistency

## Development Workflow

- Install: `npm install`
- Build: `npm run build`
- Watch mode: `npm run dev`
- Lint: `eslint main.ts` (or `eslint ./src/` if code is organized into src/)

## Important Constraints

- Never commit `main.js`, `node_modules/`, or other build artifacts (check `.gitignore`)
- Keep `manifest.json` version and `id` stable - these are critical for users
- All user-facing strings should support i18n (check `locales.ts`)
- Settings must persist via `loadData()`/`saveData()` 
- Commands need stable IDs - don't rename after release

## Code Organization

Currently, the main source files are at the repository root (`main.ts`, `utils.ts`, `daily-overview.ts`, `locales.ts`). When adding new features, consider organizing code into separate modules following the structure recommended in `AGENTS.md`.

For complete and detailed instructions, **always refer to `AGENTS.md`** in the repository root.
