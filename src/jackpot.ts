import { JackpotTier, GameState } from './types';
import { RNG } from './rng';
import { write, writeln, moveTo, clearScreen, clearLine, Color, colorize, pad } from './terminal';
import { waitForKey, prompt } from './input';
import { sleep } from './animator';

const PEARL_SPAWN_CHANCE = 0.15;
const POT_EXPLODE_CHANCE = 0.10;
const MAX_PEARLS = 10;
const BOARD_SIZE = 12; // 4 columns x 3 rows

const TIER_LABELS: Record<JackpotTier, string> = {
  mini: 'MINI',
  minor: 'MINOR',
  major: 'MAJOR',
  jackpot: 'JACKPOT',
};

const TIER_COLORS: Record<JackpotTier, string> = {
  mini: Color.brightCyan,
  minor: Color.brightGreen,
  major: Color.brightYellow,
  jackpot: Color.brightRed,
};

const TIER_MULTIPLIERS: Record<JackpotTier, number> = {
  mini: 10,
  minor: 25,
  major: 100,
  jackpot: 500,
};

export function checkPearlSpawn(rng: RNG): boolean {
  return rng.chance(PEARL_SPAWN_CHANCE);
}

export function checkPotExplode(pearlCount: number, rng: RNG): boolean {
  if (pearlCount >= MAX_PEARLS) return true;
  return rng.chance(POT_EXPLODE_CHANCE);
}

export function generateJackpotBoard(rng: RNG): JackpotTier[] {
  const tiers: JackpotTier[] = ['mini', 'minor', 'major', 'jackpot'];
  const board: JackpotTier[] = [];
  for (const tier of tiers) {
    board.push(tier, tier, tier);
  }
  return rng.shuffle(board);
}

export function getJackpotPayout(tier: JackpotTier, totalBet: number): number {
  return TIER_MULTIPLIERS[tier] * totalBet;
}

const BOARD_COLS = 4;
const BOARD_ROWS = 3;
const CELL_W = 12;
const BOARD_START_ROW = 6;

function getBoardCol(): number {
  const termWidth = process.stdout.columns || 80;
  const boardWidth = BOARD_COLS * CELL_W;
  return Math.max(1, Math.floor((termWidth - boardWidth) / 2));
}

function renderJackpotBoard(
  board: JackpotTier[],
  revealed: Set<number>,
  startRow: number,
  startCol: number,
): void {
  for (let r = 0; r < BOARD_ROWS; r++) {
    write(moveTo(startRow + r * 2, startCol));
    write(clearLine());
    let line = '';
    for (let c = 0; c < BOARD_COLS; c++) {
      const idx = r * BOARD_COLS + c;
      const num = String(idx + 1).padStart(2, ' ');
      if (revealed.has(idx)) {
        const tier = board[idx];
        const label = TIER_LABELS[tier];
        const color = TIER_COLORS[tier];
        line += colorize(pad(label, CELL_W), Color.bold, color);
      } else {
        line += colorize(pad(`[${num}] 🔮`, CELL_W), Color.dim);
      }
    }
    write(line);

    // Spacer row
    write(moveTo(startRow + r * 2 + 1, startCol));
    write(clearLine());
  }
}

function renderTierCounts(
  counts: Record<JackpotTier, number>,
  row: number,
): void {
  write(moveTo(row, getBoardCol()));
  write(clearLine());
  const tiers: JackpotTier[] = ['mini', 'minor', 'major', 'jackpot'];
  let line = '';
  for (const tier of tiers) {
    const label = TIER_LABELS[tier];
    const color = TIER_COLORS[tier];
    const dots = '●'.repeat(counts[tier]) + '○'.repeat(3 - counts[tier]);
    line += colorize(`${label} ${dots}  `, color);
  }
  write(line);
}

export async function runJackpotGame(state: GameState, rng: RNG): Promise<number> {
  const board = generateJackpotBoard(rng);
  const revealed = new Set<number>();
  const counts: Record<JackpotTier, number> = { mini: 0, minor: 0, major: 0, jackpot: 0 };
  const totalBet = state.lines * state.betPerLine;
  let wonTier: JackpotTier | null = null;

  write(clearScreen());

  const col = getBoardCol();

  // Title
  write(moveTo(2, col));
  write(colorize('★ ★ ★  JACKPOT PICK  ★ ★ ★', Color.brightYellow, Color.bold));
  write(moveTo(3, col));
  write(colorize('Pick orbs to reveal tiers — 3 matching wins!', Color.dim));

  // Show payout table
  write(moveTo(4, col));
  write(colorize(
    `MINI: ${totalBet * 10}  MINOR: ${totalBet * 25}  MAJOR: ${totalBet * 100}  JACKPOT: ${totalBet * 500}`,
    Color.dim,
  ));

  renderJackpotBoard(board, revealed, BOARD_START_ROW, col);
  renderTierCounts(counts, BOARD_START_ROW + BOARD_ROWS * 2 + 1);

  const promptRow = BOARD_START_ROW + BOARD_ROWS * 2 + 3;

  while (!wonTier) {
    // Use readline prompt for reliable multi-digit input
    const answer = await prompt('  Pick an orb (1-12): ');
    const num = parseInt(answer, 10);
    if (isNaN(num) || num < 1 || num > 12) {
      write(moveTo(promptRow + 1, col));
      write(clearLine());
      write(colorize('Please enter a number 1-12', Color.brightRed));
      await sleep(800);
      write(moveTo(promptRow + 1, col));
      write(clearLine());
      continue;
    }
    const pick = num - 1;
    if (revealed.has(pick)) {
      write(moveTo(promptRow + 1, col));
      write(clearLine());
      write(colorize('Already revealed! Pick another.', Color.brightRed));
      await sleep(800);
      write(moveTo(promptRow + 1, col));
      write(clearLine());
      continue;
    }

    revealed.add(pick);
    const tier = board[pick];
    counts[tier]++;

    // Animate reveal
    const r = Math.floor(pick / BOARD_COLS);
    const c = pick % BOARD_COLS;
    const cellRow = BOARD_START_ROW + r * 2;
    const cellCol = col + c * CELL_W;

    // Flash effect
    for (let flash = 0; flash < 3; flash++) {
      write(moveTo(cellRow, cellCol));
      write(colorize(pad('???', CELL_W), Color.bold, Color.bgYellow));
      await sleep(100);
      write(moveTo(cellRow, cellCol));
      write(pad(' ', CELL_W));
      await sleep(80);
    }

    // Show revealed board
    renderJackpotBoard(board, revealed, BOARD_START_ROW, col);
    renderTierCounts(counts, BOARD_START_ROW + BOARD_ROWS * 2 + 1);

    // Check for 3-match
    if (counts[tier] >= 3) {
      wonTier = tier;
    }
  }

  const payout = getJackpotPayout(wonTier, totalBet);
  const color = TIER_COLORS[wonTier];

  // Clear prompt and show result
  write(moveTo(promptRow, 1));
  write(clearLine());
  write(moveTo(promptRow + 1, 1));
  write(clearLine());

  write(moveTo(promptRow, col));
  write(colorize(`★ ${TIER_LABELS[wonTier]} JACKPOT! ★`, Color.bold, color));
  write(moveTo(promptRow + 1, col));
  write(colorize(`You won ${payout} credits!`, Color.bold, Color.brightYellow));
  write(moveTo(promptRow + 3, col));
  write(colorize('Press any key to continue...', Color.dim));

  await waitForKey();

  return payout;
}

export function renderPearlPot(pearlCount: number, row: number, col: number): void {
  write(moveTo(row, col));
  write(clearLine());
  const filled = Array(pearlCount).fill('⭐').join(' ');
  const empty = Array(MAX_PEARLS - pearlCount).fill('○').join(' ');
  const separator = pearlCount > 0 && pearlCount < MAX_PEARLS ? ' ' : '';
  write(colorize(' 🎰  ', Color.brightCyan) + filled + separator + empty + colorize(`  ${pearlCount}/${MAX_PEARLS}`, Color.dim));
}
