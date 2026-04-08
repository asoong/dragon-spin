# Dragon Spin CLI

A CLI recreation of the Dragon Spin slot machine game, inspired by the original Scientific Games Interactive title.

## Project Overview

This is a terminal-based slot machine game featuring:
- 5 reels, 3 rows, 30 paylines
- Mystery Stacked Reels mechanic
- Dragon Spin Bonus Feature with 3 free game modes
- Left-to-right payline evaluation with wild substitution

## Game Symbols

**High-value:** Wild, Red Dragon, Blue Dragon, Purple Dragon, Green Dragon
**Low-value:** Ace (A), King (K), Queen (Q), Jack (J), Ten (10)
**Special:** Bonus (scatter, reels 2/3/4 only)

## Paytable (multipliers x line bet)

| Symbol         | 5-of-a-kind | 4-of-a-kind | 3-of-a-kind |
|----------------|-------------|-------------|-------------|
| Wild           | x50         | x20         | x5          |
| Red Dragon     | x50         | x20         | x5          |
| Blue Dragon    | x50         | x20         | x5          |
| Purple Dragon  | x50         | x20         | x5          |
| Green Dragon   | x50         | x20         | x5          |
| Ace            | x30         | x10         | x5          |
| King           | x20         | x10         | x2          |
| Queen          | x20         | x10         | x2          |
| Jack           | x20         | x10         | x2          |
| Ten            | x20         | x10         | x2          |
| Bonus (scatter)| x30 (3 on reels 2,3,4) | — | — |

## Key Mechanics

- **Paylines:** 30 fixed paylines, all pays left-to-right except scatter
- **Wild:** Substitutes for all symbols except Bonus
- **Mystery Stacked Reels:** Each reel has stacked mystery positions replaced by 1 of 2-3 random symbols per spin (any symbol except Bonus; Wild only via mystery stacks)
- **Bonus Trigger:** 3 Bonus scatters on reels 2, 3, and 4

## Bonus Modes (Dragon Spin Wheel selects one)

1. **Raining Wilds** — 5 free spins, 3-10 random wilds placed each spin
2. **Persisting Wilds** — 5 free spins, wilds lock in place for remaining spins
3. **Reel Blast** — 5 free spins on 3 reel sets sharing a center reel (reels 2-4)

## Game Modes

### New Game
The player starts fresh and goes through a setup flow:
1. **Choose starting credits** — pick an amount to begin with (e.g., 100, 500, 1000, 5000)
2. **Choose lines** — select how many paylines to play (1-30)
3. **Choose bet per line** — select the wager per active line
4. Game begins after setup

### Continue Game
The player resumes a previous session from a local save file:
- On launch, if a save file exists, the player is prompted: "New Game" or "Continue"
- The save file stores:
  - Current credit balance
  - Lines and bet-per-line settings
  - Spin history (each spin's reel result, win amount, bonus triggers)
  - Session stats (total spins, total wagered, total won, biggest win)
  - Timestamp of last play
- Save file location: `~/.dragon-spin/save.json`
- The game auto-saves after every spin
- Spin history enables future features like replay, stats dashboards, and analytics

## Tech Stack

- **Runtime:** Node.js (TypeScript)
- **Distribution:** npm package, runnable via `npx dragon-spin`
- **Terminal UI:** Ink (React for CLI) or blessed/blessed-contrib for rich terminal rendering
- **Animations library:** Terminal animations using ANSI escape sequences / cursor manipulation

## Package Setup

- `package.json` with `"bin"` field pointing to the CLI entry point
- `tsconfig.json` for TypeScript compilation
- Shebang (`#!/usr/bin/env node`) on the entry script
- `"name": "dragon-spin"` so it works with `npx dragon-spin`

## Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev          # Run in development mode
npm start            # Run the compiled game
npx dragon-spin     # Run as npx package (after publish or local link)
npm link             # Link locally for npx testing
```

## CLI Animations

The game should include terminal animations to recreate the slot machine feel:

- **Reel spinning:** Symbols scroll vertically through each reel column with staggered stop times (left reel stops first, right reel last)
- **Win highlighting:** Winning payline symbols flash or change color when a win is evaluated
- **Mystery stack reveal:** Mystery positions show a placeholder character, then resolve to the chosen symbol with a brief reveal animation
- **Dragon Spin Wheel:** Animated spinner that cycles through the 3 bonus mode names before landing on one
- **Bonus intro/outro:** Transition animations when entering and exiting free game modes
- **Raining Wilds:** Wild symbols visually "drop" onto the reels before the spin
- **Persisting Wilds:** Locked wilds glow or pulse to distinguish them from regular symbols
- **Reel Blast:** Three reel sets rendered side-by-side or sequentially with the shared center reel highlighted
- **Coin/credit tally:** Win amounts count up numerically after each spin

All animations should use ANSI colors, Unicode box-drawing characters, and cursor positioning for smooth rendering in modern terminals.
