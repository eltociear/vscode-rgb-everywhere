# 🌈 VSCode RGB Everywhere

Turns your entire VS Code UI into a dynamic RGB light show.
Pure gaming aesthetics — everywhere. Not just your status bar.

---

## ✨ Features

- Full-UI rainbow color animation
- Status bar, activity bar, title bar, tabs — **everything can glow**
- Configurable animation speed
- Optional wave/stagger effect
- Auto-inject on startup
- Automatic safe backups of modified files

---

## 🚀 Usage

Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run:

| Command | Description |
|---------|-------------|
| **RGB Everywhere: Enable Rainbow Effect** | Injects scripts + enables animation |
| **RGB Everywhere: Disable Rainbow Effect** | Restores original UI |
| **RGB Everywhere: Check Status** | Shows whether injection is active |

> ⚠️ **Restart VS Code** after enabling/disabling to apply changes.

---

## ⚙️ Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `rgbEverywhere.enabled` | boolean | `true` | Auto-inject RGB animation on startup |
| `rgbEverywhere.animationSpeed` | number | `2` | Animation cycle time in seconds (0.5–10) |

---

## 🔐 Requirements

This extension modifies internal VS Code files.
**Admin privileges are required.**

- **macOS:**
  ```bash
  sudo chown -R $(whoami) "/Applications/Visual Studio Code.app"
  ```
- **Windows:**
  Run VS Code **as Administrator**

---

## 🛠️ Troubleshooting

- Check **Output → RGB Everywhere** for debug logs
- Use **Check Status** to confirm injection state
- Original `workbench.html` is backed up as `workbench.html.rgb-backup`

---

## ⚠️ Notes

- VS Code may show an *“installation is corrupt”* warning
  → checksums are auto-patched, but some builds may still show it once
- Effect applies **after a full VS Code restart**
- All changes are reversible via Disable command

---

## 🧠 How It Works

1. Finds VS Code’s `workbench.html`
2. Creates a safe backup
3. Injects a `<script>` tag pointing to `rgb-everywhere.js`
4. JS animates UI colors via HSL hue shifting (every 50ms)
5. `product.json` checksums are updated to avoid integrity errors

---

## 📄 License

MIT
