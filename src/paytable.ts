import { Sym } from './types';

type PayEntry = { 3: number; 4: number; 5: number };

const LINE_PAYS: Partial<Record<Sym, PayEntry>> = {
  [Sym.Wild]:         { 3: 5,  4: 20, 5: 50 },
  [Sym.RedDragon]:    { 3: 5,  4: 20, 5: 50 },
  [Sym.BlueDragon]:   { 3: 5,  4: 20, 5: 50 },
  [Sym.PurpleDragon]: { 3: 5,  4: 20, 5: 50 },
  [Sym.GreenDragon]:  { 3: 5,  4: 20, 5: 50 },
  [Sym.Ace]:          { 3: 5,  4: 10, 5: 30 },
  [Sym.King]:         { 3: 2,  4: 10, 5: 20 },
  [Sym.Queen]:        { 3: 2,  4: 10, 5: 20 },
  [Sym.Jack]:         { 3: 2,  4: 10, 5: 20 },
  [Sym.Ten]:          { 3: 2,  4: 10, 5: 20 },
};

export const SCATTER_PAY_MULTIPLIER = 30;

export function getLinePay(symbol: Sym, count: number): number {
  if (count < 3 || count > 5) return 0;
  const entry = LINE_PAYS[symbol];
  if (!entry) return 0;
  return entry[count as 3 | 4 | 5];
}
