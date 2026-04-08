import { Grid, WinLine, Sym } from '../src/types';
import { getCellConnections } from '../src/renderer';

const CELL_W = 10;
const NUM_REELS = 5;
const NUM_ROWS = 3;

const SYM_LABELS: Record<string, string> = {
  'WILD': 'WILD',
  'RED':  'RED ',
  'BLU':  'BLU ',
  'PUR':  'PUR ',
  'GRN':  'GRN ',
  'A':    ' A  ',
  'K':    ' K  ',
  'Q':    ' Q  ',
  'J':    ' J  ',
  '10':   ' 10 ',
  'BNS':  'BNS ',
  '???':  '??? ',
};

/**
 * Render the grid with connection lines (──, /, \) as plain ASCII.
 * Mirrors what renderReelGrid draws, but without ANSI codes or cursor movement.
 */
export function renderPlainGrid(grid: Grid, winLines: WinLine[]): string {
  const lineColors = ['c'];
  const lines: string[] = [];

  lines.push('┌' + Array(NUM_REELS).fill('─'.repeat(CELL_W)).join('┬') + '┐');

  for (let row = 0; row < NUM_ROWS; row++) {
    let topLine = '│';
    let symLine = '│';
    let botLine = '│';

    for (let reel = 0; reel < NUM_REELS; reel++) {
      const conns = getCellConnections(reel, row, winLines, lineColors);

      // Top connector row
      const topChars = new Array(CELL_W).fill(' ');
      for (const c of conns) {
        if (c.incoming === 1) topChars[1] = '\\';
        if (c.outgoing === -1) topChars[CELL_W - 2] = '/';
      }
      topLine += topChars.join('') + '│';

      // Symbol row with horizontal line segments
      const label = SYM_LABELS[grid[reel][row]] || '????';
      let left = '   ';
      let right = '   ';
      for (const c of conns) {
        if (c.incoming === 0) left = '── ';
        if (c.outgoing === 0) right = ' ──';
      }
      symLine += left + label + right + '│';

      // Bottom connector row
      const botChars = new Array(CELL_W).fill(' ');
      for (const c of conns) {
        if (c.incoming === -1) botChars[1] = '/';
        if (c.outgoing === 1) botChars[CELL_W - 2] = '\\';
      }
      botLine += botChars.join('') + '│';
    }

    lines.push(topLine, symLine, botLine);
    if (row < NUM_ROWS - 1) {
      lines.push('├' + Array(NUM_REELS).fill('─'.repeat(CELL_W)).join('┼') + '┤');
    }
  }

  lines.push('└' + Array(NUM_REELS).fill('─'.repeat(CELL_W)).join('┴') + '┘');
  return lines.join('\n');
}

/**
 * Print two grids side by side for visual comparison.
 */
export function printComparison(actual: string, expected: string): string {
  const leftLines = actual.split('\n');
  const rightLines = expected.split('\n');
  const maxLeft = Math.max(...leftLines.map(l => l.length));
  const gap = '    ';
  const out: string[] = [];

  out.push('ACTUAL'.padEnd(maxLeft) + gap + 'EXPECTED');
  out.push('─'.repeat(maxLeft) + gap + '─'.repeat(Math.max(...rightLines.map(l => l.length), 0)));

  const maxLines = Math.max(leftLines.length, rightLines.length);
  for (let i = 0; i < maxLines; i++) {
    const l = (leftLines[i] || '').padEnd(maxLeft);
    const r = rightLines[i] || '';
    out.push(l + gap + r);
  }

  return out.join('\n');
}
