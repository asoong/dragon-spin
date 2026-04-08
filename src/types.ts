export enum Sym {
  Wild = 'WILD',
  RedDragon = 'RED',
  BlueDragon = 'BLU',
  PurpleDragon = 'PUR',
  GreenDragon = 'GRN',
  Ace = 'A',
  King = 'K',
  Queen = 'Q',
  Jack = 'J',
  Ten = '10',
  Bonus = 'BNS',
  Mystery = '???',
}

export type BonusMode = 'raining-wilds' | 'persisting-wilds' | 'reel-blast';

export type Grid = Sym[][];  // [reel][row] — 5 reels, 3 rows

export interface WinLine {
  lineIndex: number;
  symbol: Sym;
  count: number;
  positions: [number, number][];  // [reel, row] pairs in the win
  payout: number;
}

export interface SpinOutcome {
  grid: Grid;
  mysteryResolutions: (Sym | null)[];
  wins: WinLine[];
  scatterWin: number;
  totalWin: number;
  bonusTriggered: boolean;
}

export interface GameState {
  credits: number;
  lines: number;
  betPerLine: number;
  history: SpinRecord[];
  stats: SessionStats;
  lastPlayed: string;
}

export interface SpinRecord {
  grid: Grid;
  bet: number;
  win: number;
  bonus: boolean;
  time: string;
}

export interface SessionStats {
  spins: number;
  wagered: number;
  won: number;
  biggestWin: number;
}
