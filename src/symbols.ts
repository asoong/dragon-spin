import { Sym } from './types';
import { Color, colorize } from './terminal';

interface SymbolMeta {
  label: string;      // 4-char display label
  display: string;    // colorized label for rendering
  color: string;      // primary color code
}

const meta: Record<Sym, SymbolMeta> = {
  [Sym.Wild]:         { label: 'WILD', color: Color.brightYellow, display: '' },
  [Sym.RedDragon]:    { label: ' RED', color: Color.brightRed,    display: '' },
  [Sym.BlueDragon]:   { label: ' BLU', color: Color.brightBlue,   display: '' },
  [Sym.PurpleDragon]: { label: ' PUR', color: Color.brightMagenta,display: '' },
  [Sym.GreenDragon]:  { label: ' GRN', color: Color.brightGreen,  display: '' },
  [Sym.Ace]:          { label: '  A ', color: Color.white,        display: '' },
  [Sym.King]:         { label: '  K ', color: Color.white,        display: '' },
  [Sym.Queen]:        { label: '  Q ', color: Color.white,        display: '' },
  [Sym.Jack]:         { label: '  J ', color: Color.white,        display: '' },
  [Sym.Ten]:          { label: ' 10 ', color: Color.white,        display: '' },
  [Sym.Bonus]:        { label: ' BNS', color: Color.brightCyan,   display: '' },
  [Sym.Mystery]:      { label: ' ???', color: Color.dim,          display: '' },
};

// Build display strings
for (const key of Object.values(Sym)) {
  const m = meta[key];
  m.display = colorize(m.label, Color.bold, m.color);
}

export function getSymbolDisplay(sym: Sym): string {
  return meta[sym].display;
}

export function getSymbolLabel(sym: Sym): string {
  return meta[sym].label;
}

export function getSymbolColor(sym: Sym): string {
  return meta[sym].color;
}

export function highlightSymbol(sym: Sym): string {
  const m = meta[sym];
  return colorize(m.label, Color.bold, Color.bgYellow, Color.red);
}

/** All regular symbols that can appear through mystery stacks (excludes Bonus, Mystery) */
export const MYSTERY_SYMBOLS: Sym[] = [
  Sym.Wild,
  Sym.RedDragon,
  Sym.BlueDragon,
  Sym.PurpleDragon,
  Sym.GreenDragon,
  Sym.Ace,
  Sym.King,
  Sym.Queen,
  Sym.Jack,
  Sym.Ten,
];

/** Regular symbols excluding Wild (for raining wilds mystery resolution) */
export const NON_WILD_SYMBOLS: Sym[] = MYSTERY_SYMBOLS.filter(s => s !== Sym.Wild);
