import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { GameState } from './types';

const SAVE_DIR = path.join(os.homedir(), '.dragon-spin');
const SAVE_FILE = path.join(SAVE_DIR, 'save.json');

export function saveExists(): boolean {
  return fs.existsSync(SAVE_FILE);
}

export function saveGame(state: GameState): void {
  if (!fs.existsSync(SAVE_DIR)) {
    fs.mkdirSync(SAVE_DIR, { recursive: true });
  }
  state.lastPlayed = new Date().toISOString();
  fs.writeFileSync(SAVE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export function loadGame(): GameState | null {
  if (!saveExists()) return null;
  try {
    const data = fs.readFileSync(SAVE_FILE, 'utf-8');
    const parsed = JSON.parse(data) as GameState;
    // Backward compatibility for saves without pearl/jackpot fields
    if (parsed.pearlCount === undefined) parsed.pearlCount = 0;
    if (parsed.stats.jackpotWins === undefined) parsed.stats.jackpotWins = 0;
    return parsed;
  } catch {
    return null;
  }
}

export function deleteSave(): void {
  if (fs.existsSync(SAVE_FILE)) {
    fs.unlinkSync(SAVE_FILE);
  }
}

export function createFreshState(credits: number, lines: number, betPerLine: number): GameState {
  return {
    credits,
    lines,
    betPerLine,
    history: [],
    pearlCount: 0,
    stats: { spins: 0, wagered: 0, won: 0, biggestWin: 0, jackpotWins: 0 },
    lastPlayed: new Date().toISOString(),
  };
}
