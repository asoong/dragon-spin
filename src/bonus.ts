import { Sym, Grid, BonusMode, WinLine } from './types';
import { RNG } from './rng';
import { NUM_REELS, NUM_ROWS } from './paylines';
import { spin, spinWithWilds, allPositions } from './reels';
import { evaluate } from './evaluator';
import { NON_WILD_SYMBOLS, MYSTERY_SYMBOLS } from './symbols';
import { sleep, animateReelSpin, animateWins } from './animator';
import {
  renderReelGrid, renderHUD, renderWinDetails, renderFreeSpinHeader,
  renderBonusAnnouncement, getGridHeight, renderControls, getCenteredCol,
} from './renderer';
import { write, writeln, moveTo, clearScreen, clearLine, Color, colorize, hideCursor } from './terminal';
import { waitForKey } from './input';
import { GameState } from './types';

const FREE_SPINS = 5;
const GRID_START_ROW = 3;

/**
 * Run the chosen bonus mode. Returns total bonus winnings.
 */
export async function runBonus(
  mode: BonusMode,
  state: GameState,
  rng: RNG,
): Promise<number> {
  switch (mode) {
    case 'raining-wilds':    return runRainingWilds(state, rng);
    case 'persisting-wilds': return runPersistingWilds(state, rng);
    case 'reel-blast':       return runReelBlast(state, rng);
  }
}

const MODE_LABELS: Record<BonusMode, string> = {
  'raining-wilds': 'Raining Wilds',
  'persisting-wilds': 'Persisting Wilds',
  'reel-blast': 'Reel Blast',
};

async function runRainingWilds(state: GameState, rng: RNG): Promise<number> {
  let totalWin = 0;

  for (let s = 1; s <= FREE_SPINS; s++) {
    write(clearScreen());
    renderFreeSpinHeader('Raining Wilds', s, FREE_SPINS);

    // Place 3-10 random wilds
    const numWilds = rng.int(3, 10);
    const positions = rng.shuffle(allPositions()).slice(0, numWilds) as [number, number][];

    // Show wild positions dropping in
    const emptyGrid: Grid = Array.from({ length: NUM_REELS }, () =>
      Array.from({ length: NUM_ROWS }, () => Sym.Ten)
    );
    for (const [r, row] of positions) {
      emptyGrid[r][row] = Sym.Wild;
    }

    const { grid } = spinWithWilds(rng, positions);

    await animateReelSpin(grid, rng, GRID_START_ROW, getCenteredCol());

    const result = evaluate(grid, state.lines, state.betPerLine);
    totalWin += result.totalWin;

    const hudRow = GRID_START_ROW + getGridHeight() + 1;
    renderHUD({ ...state, credits: state.credits + totalWin }, result.totalWin, hudRow);
    renderWinDetails(result.wins, result.scatterWin, hudRow + 2);

    if (result.wins.length > 0) {
      await animateWins(grid, result.wins, GRID_START_ROW, getCenteredCol());
    }

    writeln();
    write(colorize(`  Wilds placed: ${numWilds}   Spin win: ${result.totalWin}   Total bonus: ${totalWin}`, Color.brightYellow));
    await waitForKey();
  }

  return totalWin;
}

async function runPersistingWilds(state: GameState, rng: RNG): Promise<number> {
  let totalWin = 0;
  const lockedWilds: Set<string> = new Set();

  // Max new wilds per spin: [1-2, 1-2, 1-2, 1-3, 2-7]
  const wildRanges: [number, number][] = [[1, 2], [1, 2], [1, 2], [1, 3], [2, 7]];

  for (let s = 1; s <= FREE_SPINS; s++) {
    write(clearScreen());
    renderFreeSpinHeader('Persisting Wilds', s, FREE_SPINS);

    // Award new persisting wilds
    const [minW, maxW] = wildRanges[s - 1];
    const numNew = rng.int(minW, maxW);
    const available = allPositions().filter(([r, row]) => !lockedWilds.has(`${r},${row}`));
    const newWilds = rng.shuffle(available).slice(0, numNew);
    for (const [r, row] of newWilds) {
      lockedWilds.add(`${r},${row}`);
    }

    // Spin with persisting wilds locked
    const wildPositions: [number, number][] = [...lockedWilds].map(key => {
      const [r, row] = key.split(',').map(Number);
      return [r, row] as [number, number];
    });

    const { grid } = spinWithWilds(rng, wildPositions);

    await animateReelSpin(grid, rng, GRID_START_ROW, getCenteredCol(), lockedWilds);

    const result = evaluate(grid, state.lines, state.betPerLine);
    totalWin += result.totalWin;

    const hudRow = GRID_START_ROW + getGridHeight() + 1;
    renderHUD({ ...state, credits: state.credits + totalWin }, result.totalWin, hudRow);
    renderWinDetails(result.wins, result.scatterWin, hudRow + 2);

    if (result.wins.length > 0) {
      await animateWins(grid, result.wins, GRID_START_ROW, getCenteredCol());
    }

    writeln();
    write(colorize(`  Locked wilds: ${lockedWilds.size}   Spin win: ${result.totalWin}   Total bonus: ${totalWin}`, Color.brightMagenta));
    await waitForKey();
  }

  return totalWin;
}

async function runReelBlast(state: GameState, rng: RNG): Promise<number> {
  let totalWin = 0;

  for (let s = 1; s <= FREE_SPINS; s++) {
    write(clearScreen());
    renderFreeSpinHeader('Reel Blast', s, FREE_SPINS);

    // Generate 3 independent reel sets, each with their own center symbol and reels 1/5
    let setWin = 0;
    for (let set = 0; set < 3; set++) {
      // Per rules: one symbol fills ALL positions on reels 2, 3, 4 per set
      const centerSymbol = rng.pick(MYSTERY_SYMBOLS);
      const centerReel: Sym[] = Array(NUM_ROWS).fill(centerSymbol);

      const setGrid: Grid = [];
      const leftSpin = spin(rng);
      const rightSpin = spin(rng);

      setGrid[0] = leftSpin.grid[0];        // independent reel 1
      setGrid[1] = [...centerReel];          // center — all same symbol for this set
      setGrid[2] = [...centerReel];          // center — all same symbol for this set
      setGrid[3] = [...centerReel];          // center — all same symbol for this set
      setGrid[4] = rightSpin.grid[4];        // independent reel 5

      const gridRow = GRID_START_ROW + set * (getGridHeight() + 1);

      write(moveTo(gridRow - 1, getCenteredCol()));
      write(colorize(` Set ${set + 1}`, Color.dim));

      await animateReelSpin(setGrid, rng, gridRow, getCenteredCol(), undefined, [1, 2, 3]);

      const result = evaluate(setGrid, state.lines, state.betPerLine);
      setWin += result.totalWin;

      if (result.wins.length > 0) {
        await animateWins(setGrid, result.wins, gridRow, getCenteredCol());
      }
    }

    totalWin += setWin;

    const hudRow = GRID_START_ROW + 3 * (getGridHeight() + 1) + 1;
    write(moveTo(hudRow, 1));
    write(clearLine());
    write(colorize(`  Spin win: ${setWin}   Total bonus: ${totalWin}`, Color.brightCyan));

    await waitForKey();
  }

  return totalWin;
}
