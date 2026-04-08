# Dragon Spin CLI

The greatest slot machine ever built — and it runs in your terminal.

Dragon Spin CLI is a faithful recreation of the legendary Dragon Spin cabinet by Scientific Games, rebuilt from the ground up as a pure terminal experience. No browser, no GPU, no casino floor required. Just `npx dragon-spin` and you're pulling reels with mystery stacks, free spin bonuses, and jackpot picks — all rendered in glorious ANSI color.

```
╔══════════════════════════════════════╗
║         D R A G O N   S P I N        ║
║            ~ CLI Edition ~           ║
╚══════════════════════════════════════╝
```

## Quick Start

### Play instantly (once published to npm)

```bash
npx dragon-spin
```

That's it. No install, no build — npx downloads the package and runs it.

### Play from source

```bash
git clone <repo-url>
cd dragon-spin
npm install
npm run build
npm start
```

### Test npx locally (before publishing)

```bash
npm install
npm run build
npm link
npx dragon-spin
```

## Save Data

Your game is saved automatically to `~/.dragon-spin/save.json` after every spin. This includes:

- Credit balance and bet settings
- Spin history (last 500 spins)
- Session stats (total spins, total wagered, total won, biggest win)

Delete `~/.dragon-spin/save.json` to reset.

## Demo Mode

Run the game in auto-play mode with `--demo`. The game skips all menus, auto-spins every few seconds, and auto-continues through bonus rounds and jackpot picks. It exits cleanly on `SIGTERM`.

```bash
dragon-spin --demo
# or
node dist/index.js --demo
```

Demo mode writes its PID to `/tmp/dragon-spin-demo.pid` so external tools can stop it:

```bash
kill $(cat /tmp/dragon-spin-demo.pid)
```

### Use as a Claude Code "thinking" animation

You can configure [Claude Code](https://docs.anthropic.com/en/docs/claude-code) hooks to launch Dragon Spin in a separate terminal window while Claude is processing, then close it when Claude finishes responding.

Add the following to your project's `.claude/settings.json` (or `~/.claude/settings.json` for global use):

#### Terminal.app (macOS default)

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "if [ ! -f /tmp/dragon-spin-demo.pid ] || ! kill -0 $(cat /tmp/dragon-spin-demo.pid) 2>/dev/null; then osascript -e 'tell application \"Terminal\" to do script \"dragon-spin --demo\"' >/dev/null 2>&1; fi"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "if [ -f /tmp/dragon-spin-demo.pid ]; then kill $(cat /tmp/dragon-spin-demo.pid) 2>/dev/null; rm -f /tmp/dragon-spin-demo.pid; fi"
          }
        ]
      }
    ]
  }
}
```

#### iTerm2

Replace the `UserPromptSubmit` command with:

```
osascript -e 'tell application "iTerm2" to create window with default profile command "dragon-spin --demo"'
```

#### Tips

- If `dragon-spin` is not globally installed, replace it with the full path: `node /path/to/dragon-spin/dist/index.js --demo`
- To auto-close the Terminal window when the game exits: Terminal.app > Settings > Profiles > Shell > "When the shell exits" > **Close the window**
- The launch hook checks if a demo is already running to avoid opening duplicate windows

## Development

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript to dist/
npm start          # Run the game
npm run dev        # Build + run in one step
```

Zero runtime dependencies. Only `typescript` and `@types/node` as dev dependencies.
