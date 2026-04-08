import { Sym, Grid, WinLine, GameState } from './types';
import { getSymbolDisplay } from './symbols';
import { NUM_REELS, NUM_ROWS } from './paylines';
import { write, writeln, moveTo, clearScreen, clearLine, Color, colorize, pad } from './terminal';

const CELL_WIDTH = 8; // visible chars per cell
const CELL_HEIGHT = 3; // top connector, symbol, bottom connector

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
 * For a given cell [reel, row], find all win line connections and return
 * the incoming direction (from prev reel) and outgoing direction (to next reel).
 * Returns arrays since multiple win lines can pass through the same cell.
 */
interface CellConnection {
  incoming: number; // row diff from prev reel: -1=from above, 0=same, 1=from below, NaN=none
  outgoing: number; // row diff to next reel: -1=going up, 0=same, 1=going down, NaN=none
  color: string;
}

export function getCellConnections(
  reel: number,
  row: number,
  winLines: WinLine[],
  lineColors: string[],
): CellConnection[] {
  const connections: CellConnection[] = [];

  for (let wi = 0; wi < winLines.length; wi++) {
    const wl = winLines[wi];
    const color = lineColors[wi % lineColors.length];

    const posIdx = wl.positions.findIndex(p => p[0] === reel && p[1] === row);
    if (posIdx === -1) continue;

    const incoming = posIdx > 0
      ? wl.positions[posIdx][1] - wl.positions[posIdx - 1][1]
      : NaN;

    const outgoing = posIdx < wl.positions.length - 1
      ? wl.positions[posIdx + 1][1] - wl.positions[posIdx][1]
      : NaN;

    // Independently suppress each direction for multi-row jumps (±2).
    // This avoids orphaned connectors: if outgoing is valid but the next
    // cell's incoming would be a multi-row jump, the next cell simply
    // won't draw its incoming — but we still draw the valid side here.
    connections.push({
      incoming: (isNaN(incoming) || (incoming >= -1 && incoming <= 1)) ? incoming : NaN,
      outgoing: (isNaN(outgoing) || (outgoing >= -1 && outgoing <= 1)) ? outgoing : NaN,
      color,
    });
  }

  return connections;
}

const WIN_LINE_COLORS = [
  Color.brightWhite,
];

/**
 * Build the symbol row content for a cell, including horizontal line segments
 * that pass through the symbol when the line is horizontal.
 */
function buildSymbolRow(
  sym: Sym,
  connections: CellConnection[],
): string {
  const display = getSymbolDisplay(sym);
  // CELL_WIDTH=8: [L1 L2 SYMBOL(4) R1 R2]
  // Layout: 2 line chars + 4 symbol + 2 line chars = 8

  let leftLine = '  ';   // 2 chars
  let rightLine = '  ';  // 2 chars

  for (const conn of connections) {
    if (conn.incoming === 0) {
      leftLine = colorize('──', Color.bold, conn.color);
    }
    if (conn.outgoing === 0) {
      rightLine = colorize('──', Color.bold, conn.color);
    }
  }

  const symPadded = pad(display, 4);
  return leftLine + symPadded + rightLine;
}

/**
 * Build a connector row (top or bottom of cell) showing diagonal line characters.
 */
function buildConnectorRow(
  connections: CellConnection[],
  position: 'top' | 'bottom',
): string {
  const chars = new Array(CELL_WIDTH).fill(' ');
  const charColors = new Array(CELL_WIDTH).fill('');

  for (const conn of connections) {
    if (position === 'top') {
      // Top-left: only \ when line came from exactly 1 row above
      if (conn.incoming === 1) {
        chars[1] = '\\';
        charColors[1] = conn.color;
      }
      // Top-right: only / when line going exactly 1 row up
      if (conn.outgoing === -1) {
        chars[CELL_WIDTH - 2] = '/';
        charColors[CELL_WIDTH - 2] = conn.color;
      }
    } else {
      // Bottom-left: only / when line came from exactly 1 row below
      if (conn.incoming === -1) {
        chars[1] = '/';
        charColors[1] = conn.color;
      }
      // Bottom-right: only \ when line going exactly 1 row down
      if (conn.outgoing === 1) {
        chars[CELL_WIDTH - 2] = '\\';
        charColors[CELL_WIDTH - 2] = conn.color;
      }
    }
  }

  let result = '';
  for (let i = 0; i < CELL_WIDTH; i++) {
    if (charColors[i]) {
      result += colorize(chars[i], Color.bold, charColors[i]);
    } else {
      result += chars[i];
    }
  }
  return result;
}

/**
 * Render the reel grid at a specific screen position.
 * Each cell is 3 rows tall: top connector, symbol, bottom connector.
 * winLines: optional winning paylines to draw line connectors.
 */
export function renderReelGrid(
  grid: Grid,
  startRow: number,
  startCol: number,
  winLines?: WinLine[],
): void {
  const outputLines: string[] = [];
  const wl = winLines ?? [];

  outputLines.push(colorize(horizontalBorder(BOX.tl, BOX.tj, BOX.tr), Color.cyan));

  for (let row = 0; row < NUM_ROWS; row++) {
    // Top connector row
    let topLine = colorize(BOX.v, Color.cyan);
    for (let reel = 0; reel < NUM_REELS; reel++) {
      const conns = getCellConnections(reel, row, wl, WIN_LINE_COLORS);
      topLine += buildConnectorRow(conns, 'top');
      topLine += colorize(BOX.v, Color.cyan);
    }
    outputLines.push(topLine);

    // Symbol row with horizontal line segments
    let symLine = colorize(BOX.v, Color.cyan);
    for (let reel = 0; reel < NUM_REELS; reel++) {
      const sym = grid[reel][row];
      const conns = getCellConnections(reel, row, wl, WIN_LINE_COLORS);
      symLine += buildSymbolRow(sym, conns);
      symLine += colorize(BOX.v, Color.cyan);
    }
    outputLines.push(symLine);

    // Bottom connector row
    let botLine = colorize(BOX.v, Color.cyan);
    for (let reel = 0; reel < NUM_REELS; reel++) {
      const conns = getCellConnections(reel, row, wl, WIN_LINE_COLORS);
      botLine += buildConnectorRow(conns, 'bottom');
      botLine += colorize(BOX.v, Color.cyan);
    }
    outputLines.push(botLine);

    if (row < NUM_ROWS - 1) {
      outputLines.push(colorize(horizontalBorder(BOX.lj, BOX.cross, BOX.rj), Color.cyan));
    }
  }

  outputLines.push(colorize(horizontalBorder(BOX.bl, BOX.bj, BOX.br), Color.cyan));

  for (let i = 0; i < outputLines.length; i++) {
    write(moveTo(startRow + i, startCol));
    write(clearLine());
    write(outputLines[i]);
  }
}

/**
 * Render the HUD (credits, bet, lines, last win).
 */
function toDollars(credits: number): string {
  return '$' + (credits / 100).toFixed(2);
}

export function renderHUD(state: GameState, lastWin: number, hudRow: number, col?: number): void {
  const totalBet = state.lines * state.betPerLine;
  const c = col ?? getCenteredCol();

  write(moveTo(hudRow, c));
  write(clearLine());
  write(
    colorize('Credits: ', Color.dim) + colorize(String(state.credits), Color.brightYellow, Color.bold) +
    colorize(` (${toDollars(state.credits)})`, Color.brightYellow) +
    colorize('   Bet/Line: ', Color.dim) + colorize(String(state.betPerLine), Color.white) +
    colorize('   Lines: ', Color.dim) + colorize(String(state.lines), Color.white) +
    colorize('   Total Bet: ', Color.dim) + colorize(String(totalBet), Color.brightWhite) +
    colorize(` (${toDollars(totalBet)})`, Color.white)
  );

  write(moveTo(hudRow + 1, c));
  write(clearLine());
  if (lastWin > 0) {
    write(colorize(`WIN: ${lastWin} (${toDollars(lastWin)})`, Color.brightYellow, Color.bold));
  }
}

/**
 * Render win details below the grid.
 */
export function renderWinDetails(wins: WinLine[], scatterWin: number, detailRow: number, col?: number): void {
  const c = col ?? getCenteredCol();
  const colWidth = Math.floor(getGridWidth() / 2);

  // Clear the win detail area (up to 6 rows)
  for (let i = 0; i < 6; i++) {
    write(moveTo(detailRow + i, c));
    write(clearLine());
  }

  if (wins.length === 0 && scatterWin === 0) {
    return;
  }

  const entries: string[] = [];
  for (const w of wins.slice(0, 10)) { // show up to 10 wins across 2 columns
    entries.push(`Line ${w.lineIndex + 1}: ${w.count}x ${getSymbolDisplay(w.symbol)} = ${w.payout}`);
  }
  if (wins.length > 10) {
    entries.push(`... +${wins.length - 10} more`);
  }
  if (scatterWin > 0) {
    entries.push(colorize(`SCATTER! +${scatterWin}`, Color.brightCyan, Color.bold));
  }

  // Render in 2 columns
  const rows = Math.ceil(entries.length / 2);
  for (let i = 0; i < rows; i++) {
    write(moveTo(detailRow + i, c));
    const left = pad(entries[i], colWidth, 'left');
    const rightIdx = i + rows;
    const right = rightIdx < entries.length ? entries[rightIdx] : '';
    write(left + right);
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
  // Each row = 3 lines (top connector, symbol, bottom connector)
  // Plus borders between rows and top/bottom borders
  // = top border + (3 rows × 3 lines) + (2 mid borders) + bottom border
  return 1 + NUM_ROWS * CELL_HEIGHT + (NUM_ROWS - 1) + 1;
}
