import { Sym, Grid, WinLine } from './types';
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
 * Show winning paylines on the grid with line connectors.
 */
export async function animateWins(
  grid: Grid,
  winLines: WinLine[],
  gridStartRow: number,
  gridStartCol: number,
): Promise<void> {
  // Show grid with all win lines drawn
  renderReelGrid(grid, gridStartRow, gridStartCol, winLines);
  await sleep(2000);
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
 * Animate a horizontal mini game selector reel.
 * Shows a scrolling strip of mini game names that decelerates and lands on the chosen one.
 * The center position is the "selected" slot, framed by markers.
 */
const MINI_GAME_DESCRIPTIONS: Record<string, string[]> = {
  'RAINING WILDS': [
    '5 free spins — 3 to 10 random WILD placed each spin.',
    'Wilds are held until all wins are evaluated.',
    'Mystery stacks exclude WILD. No BONUS symbols.',
  ],
  'PERSISTING WILDS': [
    '5 free spins — wilds lock in place for all remaining spins.',
    'New wilds added each spin: 1-2, 1-2, 1-2, 1-3, then 2-7.',
    'No regular WILD or BONUS. PERSISTING WILD only.',
  ],
  'REEL BLAST': [
    '5 free spins on 3 reel sets simultaneously.',
    'Reels 2, 3, and 4 are shared across all 3 sets.',
    'Triple the winning opportunities! No BONUS symbols.',
  ],
};

export async function animateMiniGameReel(
  options: string[],
  chosenIndex: number,
  row: number,
): Promise<void> {
  const VISIBLE = 3; // show 3 slots: left | CENTER | right
  const SLOT_W = 18;

  // Build a long strip that ends with chosenIndex in the center
  // Spin through 8 full cycles + land on chosen for a longer roll
  const totalStops = options.length * 8 + chosenIndex;

  // Draw the frame (static borders around center slot)
  const frameRow = row;
  const centerCol = Math.floor((process.stdout.columns || 80) / 2);
  const leftEdge = centerCol - Math.floor((VISIBLE * SLOT_W) / 2);

  // Top/bottom borders
  const topBorder = '┌' + '─'.repeat(SLOT_W) + '┬' + '─'.repeat(SLOT_W) + '┬' + '─'.repeat(SLOT_W) + '┐';
  const botBorder = '└' + '─'.repeat(SLOT_W) + '┴' + '─'.repeat(SLOT_W) + '┴' + '─'.repeat(SLOT_W) + '┘';

  write(moveTo(frameRow, leftEdge));
  write(colorize(topBorder, Color.brightYellow));
  write(moveTo(frameRow + 2, leftEdge));
  write(colorize(botBorder, Color.brightYellow));

  // Arrow markers pointing to center
  const arrowCol = leftEdge + SLOT_W + Math.floor(SLOT_W / 2);
  write(moveTo(frameRow - 1, arrowCol));
  write(colorize('  ▼', Color.brightYellow, Color.bold));
  write(moveTo(frameRow + 3, arrowCol));
  write(colorize('  ▲', Color.brightYellow, Color.bold));

  for (let stop = 0; stop <= totalStops; stop++) {
    const centerIdx = stop % options.length;
    const leftIdx = (stop - 1 + options.length) % options.length;
    const rightIdx = (stop + 1) % options.length;

    const slots = [leftIdx, centerIdx, rightIdx];

    // Render the 3 visible slots
    write(moveTo(frameRow + 1, leftEdge));
    let line = colorize('│', Color.brightYellow);
    for (let s = 0; s < VISIBLE; s++) {
      const name = options[slots[s]];
      const padded = name.length > SLOT_W ? name.slice(0, SLOT_W) : name;
      const leftPad = Math.floor((SLOT_W - padded.length) / 2);
      const rightPad = SLOT_W - padded.length - leftPad;

      if (s === 1) {
        // Center slot — highlighted
        line += colorize(' '.repeat(leftPad) + padded + ' '.repeat(rightPad), Color.bold, Color.brightWhite, Color.bgMagenta);
      } else {
        // Side slots — dimmed
        line += colorize(' '.repeat(leftPad) + padded + ' '.repeat(rightPad), Color.dim);
      }
      line += colorize('│', Color.brightYellow);
    }
    write(line);

    // Deceleration: fast for most of the roll, then dramatically slow down
    const progress = stop / totalStops;
    // Use a cubic curve so it stays fast longer and brakes hard at the end
    const curve = progress * progress * progress;
    const speed = 30 + Math.floor(curve * 600);
    await sleep(speed);
  }

  // Final flash on the selected option
  for (let flash = 0; flash < 3; flash++) {
    write(moveTo(frameRow + 1, leftEdge + SLOT_W + 2));
    const name = options[chosenIndex];
    const padded = name.length > SLOT_W ? name.slice(0, SLOT_W) : name;
    const leftPad = Math.floor((SLOT_W - padded.length) / 2);
    const rightPad = SLOT_W - padded.length - leftPad;

    write(colorize(' '.repeat(leftPad) + padded + ' '.repeat(rightPad), Color.bold, Color.brightYellow, Color.bgMagenta));
    await sleep(200);
    write(moveTo(frameRow + 1, leftEdge + SLOT_W + 2));
    write(colorize(' '.repeat(leftPad) + padded + ' '.repeat(rightPad), Color.bold, Color.brightWhite, Color.bgMagenta));
    await sleep(200);
  }

  // Show description of the selected mini game
  const desc = MINI_GAME_DESCRIPTIONS[options[chosenIndex]];
  if (desc) {
    const descStartRow = frameRow + 5;
    for (let i = 0; i < desc.length; i++) {
      write(moveTo(descStartRow + i, leftEdge + 2));
      write(clearLine());
      write(colorize(`  ${desc[i]}`, Color.brightCyan));
    }
  }

  await sleep(500);
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
