const ESC = '\x1b';
const CSI = `${ESC}[`;

export const Color = {
  reset:    `${CSI}0m`,
  bold:     `${CSI}1m`,
  dim:      `${CSI}2m`,
  blink:    `${CSI}5m`,
  inverse:  `${CSI}7m`,

  red:           `${CSI}31m`,
  green:         `${CSI}32m`,
  yellow:        `${CSI}33m`,
  blue:          `${CSI}34m`,
  magenta:       `${CSI}35m`,
  cyan:          `${CSI}36m`,
  white:         `${CSI}37m`,

  brightRed:     `${CSI}91m`,
  brightGreen:   `${CSI}92m`,
  brightYellow:  `${CSI}93m`,
  brightBlue:    `${CSI}94m`,
  brightMagenta: `${CSI}95m`,
  brightCyan:    `${CSI}96m`,
  brightWhite:   `${CSI}97m`,

  bgRed:     `${CSI}41m`,
  bgGreen:   `${CSI}42m`,
  bgYellow:  `${CSI}43m`,
  bgBlue:    `${CSI}44m`,
  bgMagenta: `${CSI}45m`,
  bgCyan:    `${CSI}46m`,
  bgWhite:   `${CSI}47m`,
} as const;

export function moveTo(row: number, col: number): string {
  return `${CSI}${row};${col}H`;
}

export function moveUp(n = 1): string {
  return `${CSI}${n}A`;
}

export function moveDown(n = 1): string {
  return `${CSI}${n}B`;
}

export function clearScreen(): string {
  return `${CSI}2J${CSI}H`;
}

export function clearLine(): string {
  return `${CSI}2K`;
}

export function hideCursor(): string {
  return `${CSI}?25l`;
}

export function showCursor(): string {
  return `${CSI}?25h`;
}

export function write(s: string): void {
  process.stdout.write(s);
}

export function writeln(s: string = ''): void {
  process.stdout.write(s + '\n');
}

export function colorize(text: string, ...codes: string[]): string {
  return codes.join('') + text + Color.reset;
}

export function pad(text: string, width: number, align: 'left' | 'center' | 'right' = 'center'): string {
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  const diff = width - stripped.length;
  if (diff <= 0) return text;
  if (align === 'left') return text + ' '.repeat(diff);
  if (align === 'right') return ' '.repeat(diff) + text;
  const left = Math.floor(diff / 2);
  return ' '.repeat(left) + text + ' '.repeat(diff - left);
}
