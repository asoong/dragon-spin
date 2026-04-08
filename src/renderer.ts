import { Sym, Grid, WinLine, GameState } from './types';
import { getSymbolDisplay, highlightSymbol } from './symbols';
import { NUM_REELS, NUM_ROWS } from './paylines';
import { write, writeln, moveTo, clearScreen, clearLine, Color, colorize, pad } from './terminal';

const CELL_WIDTH = 6;  // visible chars per cell

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
      const display = highlights?.has(key) ? highlightSymbol(sym) : getSymbolDisplay(sym);
      line += pad(display, CELL_WIDTH) + colorize(BOX.v, Color.cyan);
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
export function renderHUD(state: GameState, lastWin: number, hudRow: number): void {
  const totalBet = state.lines * state.betPerLine;

  write(moveTo(hudRow, 1));
  write(clearLine());
  write(
    colorize(' Credits: ', Color.dim) + colorize(String(state.credits), Color.brightYellow, Color.bold) +
    colorize('   Bet/Line: ', Color.dim) + colorize(String(state.betPerLine), Color.white) +
    colorize('   Lines: ', Color.dim) + colorize(String(state.lines), Color.white) +
    colorize('   Total Bet: ', Color.dim) + colorize(String(totalBet), Color.brightWhite)
  );

  write(moveTo(hudRow + 1, 1));
  write(clearLine());
  if (lastWin > 0) {
    write(colorize(` WIN: ${lastWin}`, Color.brightYellow, Color.bold));
  }
}

/**
 * Render win details below the grid.
 */
export function renderWinDetails(wins: WinLine[], scatterWin: number, detailRow: number): void {
  write(moveTo(detailRow, 1));

  if (wins.length === 0 && scatterWin === 0) {
    write(clearLine());
    return;
  }

  const lines: string[] = [];
  for (const w of wins.slice(0, 5)) { // show up to 5 wins
    lines.push(`  Line ${w.lineIndex + 1}: ${w.count}x ${w.symbol} = ${w.payout}`);
  }
  if (wins.length > 5) {
    lines.push(`  ... and ${wins.length - 5} more wins`);
  }
  if (scatterWin > 0) {
    lines.push(colorize(`  SCATTER BONUS! +${scatterWin}`, Color.brightCyan, Color.bold));
  }

  for (let i = 0; i < 8; i++) {
    write(moveTo(detailRow + i, 1));
    write(clearLine());
    if (i < lines.length) write(lines[i]);
  }
}

/**
 * Render the controls help bar.
 */
export function renderControls(row: number): void {
  write(moveTo(row, 1));
  write(clearLine());
  write(colorize(
    ' [SPACE] Spin  [↑/↓] Bet  [←/→] Lines  [Q] Quit',
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
  writeln();
  for (const line of title) {
    writeln(colorize(`  ${line}`, Color.brightRed, Color.bold));
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
  write(moveTo(1, 1));
  write(clearLine());
  write(colorize(
    ` ${mode.toUpperCase()} — Free Spin ${spinNum}/${totalSpins}`,
    Color.brightMagenta, Color.bold,
  ));
}

/**
 * Get the grid height in terminal rows.
 */
export function getGridHeight(): number {
  return NUM_ROWS * 2 + 1; // rows + borders
}
