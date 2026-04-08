# Dragon Spin CLI

A terminal-based recreation of the Dragon Spin slot machine.

```
╔══════════════════════════════════════╗
║         D R A G O N   S P I N       ║
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

### Publish to npm

```bash
npm login
npm publish
```

The `prepublishOnly` script auto-compiles TypeScript before publishing. The `files` field ensures only the compiled `dist/` is shipped — no source code, no `node_modules`.

## How to Play

### Starting a Game

When you launch, you'll be prompted to start a **New Game** or **Continue** a saved session.

**New Game** walks you through setup:
1. Pick your starting credits (100 / 500 / 1,000 / 5,000)
2. Pick how many paylines to play (1–30)
3. Pick your bet per line (1 / 2 / 5 / 10 / 25)

**Continue** loads your last session from `~/.dragon-spin/save.json`. The game auto-saves after every spin.

### Controls

| Key | Action |
|-----|--------|
| `Space` or `Enter` | Spin the reels |
| `↑` / `↓` | Increase / decrease bet per line |
| `←` / `→` | Decrease / increase number of active paylines |
| `Q` | Quit (game is auto-saved) |

### Reading the Display

```
┌────────┬────────┬────────┬────────┬────────┐
│   🔴   │   K    │   💚   │   A    │   🟢   │
├────────┼────────┼────────┼────────┼────────┤
│   🐲   │   Q    │   🔵   │   10   │   🔴   │
├────────┼────────┼────────┼────────┼────────┤
│   A    │   🟣   │   J    │   K    │   Q    │
└────────┴────────┴────────┴────────┴────────┘
```

- 🐲 **Wild** — Substitutes for all symbols except Bonus
- 🔴 🔵 🟣 🟢 **Dragons** — Red, Blue, Purple, Green (highest value)
- A K Q J 10 **Cards** — Ace, King, Queen, Jack, Ten (lower value)
- 💚 **Bonus** — Green emerald scatter (appears on reels 2, 3, 4 only)
- 🫧 **Mystery** — Pearl (resolves to a random symbol when the reels spin)

The HUD below the grid shows your current credits, bet per line, active lines, total bet, and last win.

### Winning

Wins pay **left to right** on active paylines. You need **3 or more** matching symbols in a row starting from the leftmost reel. Wild counts as any symbol.

Only the highest win per payline is paid. After a spin, winning lines flash to show you what hit.

### Mystery Stacked Reels

Each reel has hidden "mystery" positions. When you spin, all mystery positions on a single reel transform into the same randomly chosen symbol. This can create big stacked wins when multiple reels reveal the same symbol.

### Dragon Spin Bonus

Land **3 BNS** symbols on reels 2, 3, and 4 to trigger the Dragon Spin Bonus. A wheel spins to select one of three free game modes:

#### Raining Wilds (5 free spins)
3–10 Wild symbols randomly drop onto the reels before each spin. More wilds = more chances for big wins.

#### Persisting Wilds (5 free spins)
Wild symbols that appear get **locked in place** for the remaining free spins. By the final spin, the reels can be loaded with wilds.

#### Reel Blast (5 free spins)
Play on **3 reel sets simultaneously**, all sharing the same center reels (2, 3, 4). Three sets of wins evaluated per spin.

### Paytable

Payouts are multiplied by your bet per line:

| Symbol | 5x | 4x | 3x |
|--------|---:|---:|---:|
| Wild | 50 | 20 | 5 |
| Red Dragon | 50 | 20 | 5 |
| Blue Dragon | 50 | 20 | 5 |
| Purple Dragon | 50 | 20 | 5 |
| Green Dragon | 50 | 20 | 5 |
| Ace | 30 | 10 | 5 |
| King | 20 | 10 | 2 |
| Queen | 20 | 10 | 2 |
| Jack | 20 | 10 | 2 |
| Ten | 20 | 10 | 2 |

**Scatter:** 3 Bonus symbols pay 30x your total bet (in addition to any line wins).

## Save Data

Your game is saved automatically to `~/.dragon-spin/save.json` after every spin. This includes:
- Credit balance and bet settings
- Spin history (last 500 spins)
- Session stats (total spins, total wagered, total won, biggest win)

Delete `~/.dragon-spin/save.json` to reset.

## Development

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript to dist/
npm start          # Run the game
npm run dev        # Build + run in one step
```

Zero runtime dependencies. Only `typescript` and `@types/node` as dev dependencies.
