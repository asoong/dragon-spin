import { Sym, Grid } from './types';
import { RNG } from './rng';
import { MYSTERY_SYMBOLS, NON_WILD_SYMBOLS } from './symbols';
import { NUM_REELS, NUM_ROWS } from './paylines';

const M = Sym.Mystery;
const B = Sym.Bonus;

/**
 * Reel strips for the base game.
 * Mystery (M) symbols appear in stacks of 3.
 * Bonus only on reels 2, 3, 4.
 */
const BASE_STRIPS: Sym[][] = [
  // Reel 1 (no bonus)
  [M, M, M, Sym.Ace, Sym.King, Sym.Queen, Sym.RedDragon,
   M, M, M, Sym.Jack, Sym.Ten, Sym.GreenDragon, Sym.Ace,
   M, M, M, Sym.King, Sym.BlueDragon, Sym.Queen, Sym.Jack, Sym.PurpleDragon, Sym.Ten, Sym.Ace],

  // Reel 2 (has bonus)
  [M, M, M, Sym.King, Sym.Ace, B, Sym.RedDragon,
   M, M, M, Sym.Queen, Sym.Jack, Sym.GreenDragon, Sym.Ten,
   M, M, M, Sym.Ace, Sym.BlueDragon, Sym.King, Sym.Queen, Sym.PurpleDragon, Sym.Jack, Sym.Ten],

  // Reel 3 (has bonus)
  [M, M, M, Sym.Queen, Sym.King, Sym.Ace, Sym.BlueDragon,
   M, M, M, Sym.Jack, B, Sym.PurpleDragon, Sym.Ten,
   M, M, M, Sym.King, Sym.RedDragon, Sym.Ace, Sym.Queen, Sym.GreenDragon, Sym.Jack, Sym.Ten],

  // Reel 4 (has bonus)
  [M, M, M, Sym.Ace, Sym.Jack, B, Sym.GreenDragon,
   M, M, M, Sym.King, Sym.Queen, Sym.RedDragon, Sym.Ten,
   M, M, M, Sym.Ace, Sym.PurpleDragon, Sym.King, Sym.Jack, Sym.BlueDragon, Sym.Queen, Sym.Ten],

  // Reel 5 (no bonus)
  [M, M, M, Sym.King, Sym.Queen, Sym.Jack, Sym.BlueDragon,
   M, M, M, Sym.Ace, Sym.Ten, Sym.RedDragon, Sym.King,
   M, M, M, Sym.Queen, Sym.GreenDragon, Sym.Ace, Sym.Jack, Sym.PurpleDragon, Sym.Ten, Sym.King],
];

/**
 * Pick a random window of NUM_ROWS symbols from a reel strip (wrapping).
 */
function pickWindow(strip: Sym[], rng: RNG): Sym[] {
  const start = rng.int(0, strip.length - 1);
  const window: Sym[] = [];
  for (let i = 0; i < NUM_ROWS; i++) {
    window.push(strip[(start + i) % strip.length]);
  }
  return window;
}

/**
 * Resolve mystery symbols in a reel window.
 * All mystery symbols on one reel become the same randomly chosen symbol.
 * Returns the resolved window and the chosen mystery symbol (or null if no mystery).
 */
function resolveMystery(
  window: Sym[],
  rng: RNG,
  allowedSymbols: Sym[] = MYSTERY_SYMBOLS,
): { resolved: Sym[]; mysterySymbol: Sym | null } {
  const hasMystery = window.some(s => s === Sym.Mystery);
  if (!hasMystery) return { resolved: window, mysterySymbol: null };

  const chosen = rng.pick(allowedSymbols);
  const resolved = window.map(s => s === Sym.Mystery ? chosen : s);
  return { resolved, mysterySymbol: chosen };
}

export interface SpinConfig {
  strips?: Sym[][];
  mysteryPool?: Sym[];
}

/**
 * Generate a complete spin result for the base game.
 */
export function spin(rng: RNG, config: SpinConfig = {}): { grid: Grid; mysteryResolutions: (Sym | null)[] } {
  const strips = config.strips ?? BASE_STRIPS;
  const pool = config.mysteryPool ?? MYSTERY_SYMBOLS;
  const grid: Grid = [];
  const mysteryResolutions: (Sym | null)[] = [];

  for (let r = 0; r < NUM_REELS; r++) {
    const window = pickWindow(strips[r], rng);
    const { resolved, mysterySymbol } = resolveMystery(window, rng, pool);
    grid.push(resolved);
    mysteryResolutions.push(mysterySymbol);
  }

  return { grid, mysteryResolutions };
}

/**
 * Generate a grid with specific wild positions pre-placed (for raining wilds).
 */
export function spinWithWilds(
  rng: RNG,
  wildPositions: [number, number][],
): { grid: Grid; mysteryResolutions: (Sym | null)[] } {
  const { grid, mysteryResolutions } = spin(rng, { mysteryPool: NON_WILD_SYMBOLS });

  for (const [reel, row] of wildPositions) {
    grid[reel][row] = Sym.Wild;
  }

  return { grid, mysteryResolutions };
}

/**
 * Get all valid grid positions [reel, row].
 */
export function allPositions(): [number, number][] {
  const positions: [number, number][] = [];
  for (let r = 0; r < NUM_REELS; r++) {
    for (let row = 0; row < NUM_ROWS; row++) {
      positions.push([r, row]);
    }
  }
  return positions;
}

export { BASE_STRIPS };
