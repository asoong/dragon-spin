import { Sym, Grid } from './types';
import { RNG } from './rng';
import { NUM_REELS, NUM_ROWS } from './paylines';
import { MYSTERY_SYMBOLS } from './symbols';
import { write, moveTo } from './terminal';
import { renderReelGrid } from './renderer';

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Animate reels spinning with staggered stops.
 * gridStartRow/gridStartCol: where the grid is rendered on screen.
 */
export async function animateReelSpin(
  finalGrid: Grid,
  rng: RNG,
  gridStartRow: number,
  gridStartCol: number,
): Promise<void> {
  const stopped: boolean[] = new Array(NUM_REELS).fill(false);
  const displayGrid: Grid = Array.from({ length: NUM_REELS }, () =>
    Array.from({ length: NUM_ROWS }, () => rng.pick(MYSTERY_SYMBOLS))
  );

  const totalFrames = 20;
  const stopInterval = 3; // frames between each reel stopping

  for (let frame = 0; frame < totalFrames; frame++) {
    // Update spinning reels with random symbols
    for (let r = 0; r < NUM_REELS; r++) {
      if (!stopped[r]) {
        for (let row = 0; row < NUM_ROWS; row++) {
          displayGrid[r][row] = rng.pick(MYSTERY_SYMBOLS);
        }
      }
    }

    // Check if any reel should stop this frame
    for (let r = 0; r < NUM_REELS; r++) {
      if (!stopped[r] && frame >= (r + 1) * stopInterval + 5) {
        stopped[r] = true;
        displayGrid[r] = [...finalGrid[r]];
      }
    }

    // Render current state
    write(moveTo(gridStartRow, gridStartCol));
    renderReelGrid(displayGrid, gridStartRow, gridStartCol);

    await sleep(60);
  }

  // Ensure final state is shown
  write(moveTo(gridStartRow, gridStartCol));
  renderReelGrid(finalGrid, gridStartRow, gridStartCol);
}

/**
 * Flash winning positions on the grid.
 */
export async function animateWins(
  grid: Grid,
  winPositions: [number, number][],
  gridStartRow: number,
  gridStartCol: number,
): Promise<void> {
  for (let flash = 0; flash < 3; flash++) {
    // Show highlighted
    renderReelGrid(grid, gridStartRow, gridStartCol, new Set(winPositions.map(p => `${p[0]},${p[1]}`)));
    await sleep(250);
    // Show normal
    renderReelGrid(grid, gridStartRow, gridStartCol);
    await sleep(150);
  }
  // End with highlighted
  renderReelGrid(grid, gridStartRow, gridStartCol, new Set(winPositions.map(p => `${p[0]},${p[1]}`)));
}

/**
 * Animate the Dragon Spin bonus wheel.
 */
export async function animateDragonWheel(
  chosenIndex: number,
): Promise<void> {
  const options = ['RAINING WILDS', 'PERSISTING WILDS', 'REEL BLAST'];
  const totalCycles = 20 + chosenIndex;

  write('\n');
  for (let i = 0; i < totalCycles; i++) {
    const current = i % 3;
    const speed = 50 + Math.floor((i / totalCycles) * 200); // slow down
    write(`\r   >>> ${options[current].padEnd(20)} <<<   `);
    await sleep(speed);
  }
  write(`\r   >>> ${options[chosenIndex].padEnd(20)} <<<   \n`);
}

/**
 * Animate credit counter counting up.
 */
export async function animateCredits(
  from: number,
  to: number,
  row: number,
  col: number,
): Promise<void> {
  const diff = to - from;
  if (diff <= 0) return;

  const steps = Math.min(diff, 20);
  const increment = Math.max(1, Math.floor(diff / steps));

  let current = from;
  for (let i = 0; i < steps; i++) {
    current = Math.min(current + increment, to);
    write(moveTo(row, col));
    write(`Credits: ${current}    `);
    await sleep(40);
  }
  write(moveTo(row, col));
  write(`Credits: ${to}    `);
}
