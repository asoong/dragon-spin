import { Sym, Grid, WinLine, SpinOutcome } from './types';
import { PAYLINES } from './paylines';
import { getLinePay, SCATTER_PAY_MULTIPLIER } from './paytable';

/**
 * Evaluate a single payline for a win.
 * Finds the longest left-to-right run of matching symbols (wilds count as matches).
 * Wild substitutes for everything except Bonus.
 */
function evaluateLine(grid: Grid, payline: number[], lineIndex: number, betPerLine: number): WinLine | null {
  const symbols: Sym[] = payline.map((row, reel) => grid[reel][row]);

  // Find the match symbol: first non-wild symbol from the left
  let matchSymbol: Sym | null = null;
  for (const s of symbols) {
    if (s === Sym.Bonus) break;   // Bonus breaks the chain
    if (s !== Sym.Wild) {
      matchSymbol = s;
      break;
    }
  }

  // All wilds from the left (before any non-wild)
  if (matchSymbol === null) {
    if (symbols[0] === Sym.Wild) {
      matchSymbol = Sym.Wild;
    } else {
      return null;
    }
  }

  // Count consecutive matches from left
  let count = 0;
  const positions: [number, number][] = [];
  for (let reel = 0; reel < symbols.length; reel++) {
    const s = symbols[reel];
    if (s === matchSymbol || s === Sym.Wild) {
      count++;
      positions.push([reel, payline[reel]]);
    } else {
      break;
    }
  }

  if (count < 3) return null;

  const multiplier = getLinePay(matchSymbol, count);
  if (multiplier === 0) return null;

  return {
    lineIndex,
    symbol: matchSymbol,
    count,
    positions,
    payout: multiplier * betPerLine,
  };
}

/**
 * Count scatter (Bonus) symbols on reels 2, 3, 4 (indices 1, 2, 3).
 */
function countScatters(grid: Grid): number {
  let count = 0;
  for (const reelIdx of [1, 2, 3]) {
    for (const sym of grid[reelIdx]) {
      if (sym === Sym.Bonus) count++;
    }
  }
  return count;
}

/**
 * Evaluate all wins for a spin.
 */
export function evaluate(
  grid: Grid,
  linesPlayed: number,
  betPerLine: number,
): { wins: WinLine[]; scatterWin: number; totalWin: number; bonusTriggered: boolean } {
  const wins: WinLine[] = [];

  // Evaluate each active payline
  for (let i = 0; i < linesPlayed; i++) {
    const win = evaluateLine(grid, PAYLINES[i], i, betPerLine);
    if (win) wins.push(win);
  }

  // Scatter evaluation
  const scatterCount = countScatters(grid);
  const totalBet = linesPlayed * betPerLine;
  const scatterWin = scatterCount >= 3 ? SCATTER_PAY_MULTIPLIER * totalBet : 0;
  const bonusTriggered = scatterCount >= 3;

  const lineWinTotal = wins.reduce((sum, w) => sum + w.payout, 0);

  return {
    wins,
    scatterWin,
    totalWin: lineWinTotal + scatterWin,
    bonusTriggered,
  };
}
