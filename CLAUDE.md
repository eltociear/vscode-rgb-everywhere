# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

- Always refer to `WORK_LOG.md` for task history and progress tracking.
- Update `WORK_LOG.md` after completing each task or making changes.

## Overview

VS Code extension that animates the status bar with continuous rainbow colors. Works by injecting JavaScript into VS Code's internal HTML.

## Commands

```bash
npm run compile      # Build (TypeScript → out/)
npm run watch        # Watch mode
npm run lint         # Run ESLint
vsce package         # Create .vsix (requires: npm i -g @vscode/vsce)
```

## After Feature Implementation

1. Bump version in `package.json` (e.g., 0.0.3 → 0.0.4)
2. Run `npm run compile`
3. Run `vsce package` to create .vsix

## Development

Launch Extension Development Host with F5 → Run `RGB Everywhere: Enable Rainbow Effect` from Command Palette → Restart VS Code

Check Output panel (`RGB Everywhere` channel) for debug logs.

## Architecture

**src/extension.ts** - Single file containing all logic

### Key Components

- `ScriptInjector` class: Core injection logic
  - `getHtmlPath()`: Locates VS Code's `workbench.html` (checks electron-browser and electron-sandbox paths)
  - `inject()`: Injects script tag and creates external JS file
  - `remove()`: Removes injection and cleans up files
  - `updateChecksum()`: Updates `product.json` checksums to prevent "corrupt installation" warning
  - `removeLegacyInjection()`: Migrates from old CHROMA-STATUSBAR markers

### File Structure

- `workbench.html`: Modified to include `<script src="./rgb-everywhere.js">`
- `rgb-everywhere.js`: External script with rainbow animation logic
- `workbench.html.rgb-backup`: Backup of original HTML

### Markers

- Current: `<!-- RGB-EVERYWHERE-START/END -->`
- Legacy (auto-migrated): `<!-- CHROMA-STATUSBAR-START/END -->`

### Injected JS Behavior

- Updates HSL hue of target elements every 50ms
- Wave effect: Each element offset by `i * 10` degrees
- Speed configurable via `rgbEverywhere.animationSpeed` setting
- Target areas configurable via `rgbEverywhere.targetAreas` (statusbar, sidebar, activitybar, titlebar, panel, editor, tabs, minimap, breadcrumbs, menubar, auxiliarybar)

## Constraints

- Requires write permission to VS Code installation directory (macOS: sudo, Windows: Administrator)
- VS Code restart required to apply changes (window reload is not sufficient)
- Auto-injection on startup when `rgbEverywhere.enabled` is true
