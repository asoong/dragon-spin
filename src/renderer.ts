import { Sym, Grid, WinLine, GameState } from './types';
import { getSymbolDisplay, highlightSymbol } from './symbols';
import { NUM_REELS, NUM_ROWS } from './paylines';
import { write, writeln, moveTo, clearScreen, clearLine, Color, colorize, pad } from './terminal';

const CELL_WIDTH = 8;  // visible chars per cell (wider for emoji)

/** Total visual width of the grid in columns */
export function getGridWidth(): number {
  return NUM_REELS * (CELL_WIDTH + 1) + 1;
}

/** Compute a column offset to center the grid horizontally */
export function getCenteredCol(): number {
  const termWidth = process.stdout.columns || 80;
  return Math.max(1, Math.floor((termWidth - getGridWidth()) / 2));
}

const BOX = {
  tl: '┌', tr: '┐', bl: '└', br: '┘',
  h: '─', v: '│',
  tj: '┬', bj: '┴', lj: '├', rj: '┤', cross: '┼',
};

function horizontalBorder(left: string, mid: string, right: string): string {
  const segment = BOX.h.repeat(CELL_WIDTH);
  return left + Array(NUM_REELS).fill(segment).join(mid) + right;
}

/**
 * Render the reel grid at a specific screen position.
 */
export function renderReelGrid(
  grid: Grid,
  startRow: number,
  startCol: number,
  highlights?: Set<string>,
): void {
  const lines: string[] = [];

  lines.push(colorize(horizontalBorder(BOX.tl, BOX.tj, BOX.tr), Color.cyan));

  for (let row = 0; row < NUM_ROWS; row++) {
    let line = colorize(BOX.v, Color.cyan);
    for (let reel = 0; reel < NUM_REELS; reel++) {
      const sym = grid[reel][row];
      const key = `${reel},${row}`;
      const isHighlighted = highlights?.has(key);
      const display = isHighlighted ? highlightSymbol(sym) : getSymbolDisplay(sym);
      const cell = pad(display, CELL_WIDTH);
      // Fill entire cell background when highlighted
      line += (isHighlighted ? Color.bgYellow + cell + Color.reset : cell) + colorize(BOX.v, Color.cyan);
    }
    lines.push(line);

    if (row < NUM_ROWS - 1) {
      lines.push(colorize(horizontalBorder(BOX.lj, BOX.cross, BOX.rj), Color.cyan));
    }
  }

  lines.push(colorize(horizontalBorder(BOX.bl, BOX.bj, BOX.br), Color.cyan));

  for (let i = 0; i < lines.length; i++) {
    write(moveTo(startRow + i, startCol));
    write(clearLine());
    write(lines[i]);
  }
}

/**
 * Render the HUD (credits, bet, lines, last win).
 */
export function renderHUD(state: GameState, lastWin: number, hudRow: number, col?: number): void {
  const totalBet = state.lines * state.betPerLine;
  const c = col ?? getCenteredCol();

  write(moveTo(hudRow, c));
  write(clearLine());
  write(
    colorize('Credits: ', Color.dim) + colorize(String(state.credits), Color.brightYellow, Color.bold) +
    colorize('   Bet/Line: ', Color.dim) + colorize(String(state.betPerLine), Color.white) +
    colorize('   Lines: ', Color.dim) + colorize(String(state.lines), Color.white) +
    colorize('   Total Bet: ', Color.dim) + colorize(String(totalBet), Color.brightWhite)
  );

  write(moveTo(hudRow + 1, c));
  write(clearLine());
  if (lastWin > 0) {
    write(colorize(`WIN: ${lastWin}`, Color.brightYellow, Color.bold));
  }
}

/**
 * Render win details below the grid.
 */
export function renderWinDetails(wins: WinLine[], scatterWin: number, detailRow: number, col?: number): void {
  const c = col ?? getCenteredCol();

  write(moveTo(detailRow, c));

  if (wins.length === 0 && scatterWin === 0) {
    write(clearLine());
    return;
  }

  const lines: string[] = [];
  for (const w of wins.slice(0, 5)) { // show up to 5 wins
    lines.push(`Line ${w.lineIndex + 1}: ${w.count}x ${getSymbolDisplay(w.symbol)} = ${w.payout}`);
  }
  if (wins.length > 5) {
    lines.push(`... and ${wins.length - 5} more wins`);
  }
  if (scatterWin > 0) {
    lines.push(colorize(`SCATTER BONUS! +${scatterWin}`, Color.brightCyan, Color.bold));
  }

  for (let i = 0; i < 8; i++) {
    write(moveTo(detailRow + i, c));
    write(clearLine());
    if (i < lines.length) write(lines[i]);
  }
}

/**
 * Render the controls help bar.
 */
export function renderControls(row: number, col?: number): void {
  const c = col ?? getCenteredCol();
  write(moveTo(row, c));
  write(clearLine());
  write(colorize(
    '[SPACE] Spin  [↑/↓] Bet  [←/→] Lines  [Q] Quit',
    Color.dim,
  ));
}

/**
 * Render the title banner.
 */
export function renderTitle(): void {
  write(clearScreen());
  const title = [
    '╔══════════════════════════════════════╗',
    '║         D R A G O N   S P I N       ║',
    '║            ~ CLI Edition ~           ║',
    '╚══════════════════════════════════════╝',
  ];
  const termWidth = process.stdout.columns || 80;
  const titleWidth = title[0].length;
  const leftPad = Math.max(0, Math.floor((termWidth - titleWidth) / 2));
  writeln();
  for (const line of title) {
    writeln(' '.repeat(leftPad) + colorize(line, Color.brightRed, Color.bold));
  }
  writeln();
}

/**
 * Render bonus mode announcement.
 */
export function renderBonusAnnouncement(mode: string): void {
  writeln();
  writeln(colorize('  ★ ★ ★  DRAGON SPIN BONUS!  ★ ★ ★', Color.brightYellow, Color.bold));
  writeln(colorize(`  >>> ${mode.toUpperCase()} <<<`, Color.brightCyan, Color.bold));
  writeln();
}

/**
 * Render free spins header.
 */
export function renderFreeSpinHeader(mode: string, spinNum: number, totalSpins: number): void {
  const c = getCenteredCol();
  write(moveTo(1, c));
  write(clearLine());
  write(colorize(
    `${mode.toUpperCase()} — Free Spin ${spinNum}/${totalSpins}`,
    Color.brightMagenta, Color.bold,
  ));
}

/**
 * Get the grid height in terminal rows.
 */
export function getGridHeight(): number {
  return NUM_ROWS * 2 + 1; // rows + borders
}
