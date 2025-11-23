# 🌈 VSCode RGB Everywhere

Turns your entire VS Code UI into a dynamic RGB light show. Pure gaming aesthetics—everywhere.

## Features

- Rainbow color animation on all status bar items
- Configurable animation speed
- Wave effect with staggered color offsets

## Usage

Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

| Command | Description |
|---------|-------------|
| `RGB Everywhere: Enable Rainbow Effect` | Enable animation |
| `RGB Everywhere: Disable Rainbow Effect` | Disable animation |
| `RGB Everywhere: Check Status` | Check injection status |

**Restart VS Code after enabling/disabling.**

### Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `rgbEverywhere.enabled` | boolean | `true` | Enable rainbow animation |
| `rgbEverywhere.animationSpeed` | number | `2` | Animation cycle time in seconds (0.5-10) |

## Requirements

**Admin privileges required** - This extension modifies VS Code's internal files.

- **macOS**: `sudo chown -R $(whoami) "/Applications/Visual Studio Code.app"`
- **Windows**: Run VS Code as Administrator

## Notes

- "Installation is corrupt" warning is expected and can be dismissed
- Effect only applies after full VS Code restart (not window reload)

## How It Works

Injects JavaScript into VS Code's `workbench.html` that cycles HSL hue values on status bar elements every 50ms.

## License

MIT
