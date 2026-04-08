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

/**
 * Estimate the display width of a string, accounting for emoji (2 columns each)
 * and stripping ANSI escape codes.
 */
export function displayWidth(text: string): number {
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, '');
  let w = 0;
  for (const ch of stripped) {
    const code = ch.codePointAt(0) ?? 0;
    // Emoji and wide chars generally have codepoints above 0x1F000 or in specific ranges
    // Also catch variation selectors (0xFE0F) and combining marks
    if (code >= 0x1F000 || (code >= 0x2600 && code <= 0x27BF) || (code >= 0x2B50 && code <= 0x2B55) ||
        (code >= 0x1F300 && code <= 0x1FAFF) || code === 0xFE0F || code === 0x20E3 ||
        (code >= 0x1F170 && code <= 0x1F251)) {
      w += 2;
    } else if (code > 0x7F && code < 0xFE00) {
      // Most other non-ASCII might be single width, skip variation selectors
      w += 1;
    } else if (code !== 0xFE0F && code !== 0x200D) {
      // Skip zero-width joiners and variation selectors
      w += 1;
    }
  }
  return w;
}

export function pad(text: string, width: number, align: 'left' | 'center' | 'right' = 'center'): string {
  const w = displayWidth(text);
  const diff = width - w;
  if (diff <= 0) return text;
  if (align === 'left') return text + ' '.repeat(diff);
  if (align === 'right') return ' '.repeat(diff) + text;
  const left = Math.floor(diff / 2);
  return ' '.repeat(left) + text + ' '.repeat(diff - left);
}
