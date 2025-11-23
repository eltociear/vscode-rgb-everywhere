# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

VS Code extension that animates the status bar with continuous rainbow colors. Works by injecting JavaScript into VS Code's internal HTML.

## Commands

```bash
npm run compile      # Build (TypeScript → out/)
npm run watch        # Watch mode
npm run lint         # Run ESLint
vsce package         # Create .vsix (requires: npm i -g @vscode/vsce)
```

## Development

Launch Extension Development Host with F5 → Run `RGB Everywhere: Enable Rainbow Effect` from Command Palette → Restart VS Code

## Architecture

**src/extension.ts** - Single file containing all logic

- `ScriptInjector` class: Locates VS Code's `workbench.html` and injects/removes script tags
- Injected JS: Updates HSL hue of `.part.statusbar *` elements every 50ms
- Markers: `<!-- RGB-EVERYWHERE-START/END -->` identify injection boundaries

## Constraints

- Requires write permission to VS Code installation directory (macOS: sudo, Windows: Administrator)
- VS Code restart required to apply changes
- "Installation is corrupt" warning is expected behavior
