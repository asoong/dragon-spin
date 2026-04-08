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

## Tech Stack

TBD — CLI application (language to be decided)

## Development Commands

TBD
