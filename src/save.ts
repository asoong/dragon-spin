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
    fs.mkdirSync(SAVE_DIR, { recursive: true, mode: 0o700 });
  }
  state.lastPlayed = new Date().toISOString();
  fs.writeFileSync(SAVE_FILE, JSON.stringify(state, null, 2), { encoding: 'utf-8', mode: 0o600 });
}

function isValidGameState(obj: unknown): obj is GameState {
  if (typeof obj !== 'object' || obj === null) return false;
  const s = obj as Record<string, unknown>;

  if (typeof s.credits !== 'number' || !Number.isFinite(s.credits) || s.credits < 0) return false;
  if (typeof s.lines !== 'number' || !Number.isInteger(s.lines) || s.lines < 1 || s.lines > 23) return false;
  if (typeof s.betPerLine !== 'number' || !Number.isInteger(s.betPerLine) || s.betPerLine < 1) return false;
  if (!Array.isArray(s.history)) return false;
  if (typeof s.lastPlayed !== 'string') return false;

  if (typeof s.stats !== 'object' || s.stats === null) return false;
  const st = s.stats as Record<string, unknown>;
  if (typeof st.spins !== 'number' || !Number.isFinite(st.spins)) return false;
  if (typeof st.wagered !== 'number' || !Number.isFinite(st.wagered)) return false;
  if (typeof st.won !== 'number' || !Number.isFinite(st.won)) return false;
  if (typeof st.biggestWin !== 'number' || !Number.isFinite(st.biggestWin)) return false;

  return true;
}

export function loadGame(): GameState | null {
  if (!saveExists()) return null;
  try {
    const data = fs.readFileSync(SAVE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!isValidGameState(parsed)) return null;
    // Backward compatibility for saves without pearl/jackpot fields
    if ((parsed as any).pearlCount === undefined) (parsed as any).pearlCount = 0;
    if ((parsed.stats as any).jackpotWins === undefined) (parsed.stats as any).jackpotWins = 0;
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
