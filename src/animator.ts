import { Sym, Grid } from './types';
import { RNG } from './rng';
import { NUM_REELS, NUM_ROWS } from './paylines';
import { MYSTERY_SYMBOLS } from './symbols';
import { write, moveTo, clearLine, Color, colorize } from './terminal';
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
  for (let flash = 0; flash < 4; flash++) {
    // Show highlighted
    renderReelGrid(grid, gridStartRow, gridStartCol, new Set(winPositions.map(p => `${p[0]},${p[1]}`)));
    await sleep(300);
    // Show normal
    renderReelGrid(grid, gridStartRow, gridStartCol);
    await sleep(200);
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
 * Animate a pearl appearing on the grid and flying to the pot.
 */
export async function animatePearlToPot(
  pearlReel: number,
  pearlRow: number,
  gridStartRow: number,
  gridStartCol: number,
  potRow: number,
  potCol: number,
): Promise<void> {
  const CELL_WIDTH = 8;
  const startR = gridStartRow + 1 + pearlRow * 2; // account for borders
  const startC = gridStartCol + 1 + pearlReel * (CELL_WIDTH + 1);

  // Flash pearl on the grid cell
  for (let flash = 0; flash < 3; flash++) {
    write(moveTo(startR, startC));
    write(colorize(' 🦪  ', Color.bold, Color.bgCyan));
    await sleep(150);
    write(moveTo(startR, startC));
    write('        ');
    await sleep(100);
  }

  // Fly pearl from grid position to pot
  const steps = 8;
  const dr = (potRow - startR) / steps;
  const dc = (potCol - startC) / steps;

  for (let i = 0; i <= steps; i++) {
    const r = Math.round(startR + dr * i);
    const c = Math.round(startC + dc * i);

    // Clear previous position
    if (i > 0) {
      const prevR = Math.round(startR + dr * (i - 1));
      const prevC = Math.round(startC + dc * (i - 1));
      write(moveTo(prevR, prevC));
      write('  ');
    }

    write(moveTo(r, c));
    write(colorize('🦪', Color.bold));
    await sleep(50);
  }

  // Clear final position
  write(moveTo(Math.round(potRow), Math.round(potCol)));
  write('  ');
}

/**
 * Animate the pot exploding.
 */
export async function animatePotExplode(
  potRow: number,
  potCol: number,
): Promise<void> {
  const frames = [
    ['     🏺     '],
    ['    💥🏺💥    '],
    ['   💥💥💥💥💥   '],
    ['  ✨💥🔥💥✨  '],
    [' ✨✨🔥🔥🔥✨✨ '],
    ['✨✨✨🔥🔥🔥✨✨✨'],
    ['  ✨✨💫💫✨✨  '],
    ['    ✨💫✨    '],
    ['      ★      '],
  ];

  for (const frame of frames) {
    write(moveTo(potRow, potCol - 6));
    write(clearLine());
    write(colorize(frame[0], Color.brightYellow, Color.bold));
    await sleep(120);
  }
  await sleep(300);
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
