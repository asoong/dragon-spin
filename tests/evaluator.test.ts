import { describe, it, expect } from 'vitest';
import { evaluate } from '../src/evaluator';
import { getCellConnections } from '../src/renderer';
import { Sym, Grid } from '../src/types';
import { renderPlainGrid, printComparison } from './helpers';

const LINE_COLORS = ['\x1b[1;97m'];

// ─── Grid definitions ────────────────────────────────────────────────

/**
 * invalid_lines_kings.png (Reel Blast Set 3)
 *
 *        Reel 0   Reel 1   Reel 2   Reel 3   Reel 4
 * row 0:  K        K        K        K        K
 * row 1:  BLU      K        K        K        GRN
 * row 2:  Q        K        K        K        GRN
 */
const KINGS_GRID: Grid = [
  [Sym.King, Sym.BlueDragon, Sym.Queen],
  [Sym.King, Sym.King, Sym.King],
  [Sym.King, Sym.King, Sym.King],
  [Sym.King, Sym.King, Sym.King],
  [Sym.King, Sym.GreenDragon, Sym.GreenDragon],
];

/**
 * invalid_lines_wild.png (Raining Wilds — Free Spin 3/5)
 *
 *        Reel 0   Reel 1   Reel 2   Reel 3   Reel 4
 * row 0:  GRN      WILD     WILD     A        WILD
 * row 1:  K        RED      10       WILD     WILD
 * row 2:  WILD     WILD     J        PUR      WILD
 */
const WILD_GRID: Grid = [
  [Sym.GreenDragon, Sym.King, Sym.Wild],
  [Sym.Wild, Sym.RedDragon, Sym.Wild],
  [Sym.Wild, Sym.Ten, Sym.Jack],
  [Sym.Ace, Sym.Wild, Sym.PurpleDragon],
  [Sym.Wild, Sym.Wild, Sym.Wild],
];

/**
 * invalid_lines_last_wild.png
 *
 *        Reel 0   Reel 1   Reel 2   Reel 3   Reel 4
 * row 0:  WILD     J        WILD     WILD     GRN
 * row 1:  A        GRN      WILD     WILD     A
 * row 2:  K        10       A        A        WILD
 */
const LAST_WILD_GRID: Grid = [
  [Sym.Wild, Sym.Ace, Sym.King],
  [Sym.Jack, Sym.GreenDragon, Sym.Ten],
  [Sym.Wild, Sym.Wild, Sym.Ace],
  [Sym.Wild, Sym.Wild, Sym.Ace],
  [Sym.GreenDragon, Sym.Ace, Sym.Wild],
];

/**
 * invalid_lines_wild_red_emerald.png (Raining Wilds — Free Spin 5/5)
 *
 *        Reel 0   Reel 1   Reel 2   Reel 3   Reel 4
 * row 0:  WILD     A        WILD     RED      WILD
 * row 1:  GRN      BNS      WILD     10       10
 * row 2:  WILD     RED      K        K        10
 */
const WILD_RED_EMERALD_GRID: Grid = [
  [Sym.Wild, Sym.GreenDragon, Sym.Wild],
  [Sym.Ace, Sym.Bonus, Sym.RedDragon],
  [Sym.Wild, Sym.Wild, Sym.King],
  [Sym.RedDragon, Sym.Ten, Sym.King],
  [Sym.Wild, Sym.Ten, Sym.Ten],
];

// ─── Test suites ─────────────────────────────────────────────────────

describe('evaluate – kings grid', () => {
  const result = evaluate(KINGS_GRID, 30, 1);

  const EXPECTED_KINGS = [
    '┌──────────┬──────────┬──────────┬──────────┬──────────┐',
    '│          │          │          │          │          │',
    '│    K   ──│──  K   ──│──  K   ──│──  K   ──│──  K     │',
    '│        \\ │        \\ │ /      \\ │ /        │ /        │',
    '├──────────┼──────────┼──────────┼──────────┼──────────┤',
    '│          │ \\      / │ \\      / │ \\      / │          │',
    '│   BLU    │    K   ──│──  K   ──│──  K     │   GRN    │',
    '│          │        \\ │ /      \\ │ /        │          │',
    '├──────────┼──────────┼──────────┼──────────┼──────────┤',
    '│          │          │ \\      / │          │          │',
    '│    Q     │    K     │──  K   ──│──  K     │   GRN    │',
    '│          │          │          │          │          │',
    '└──────────┴──────────┴──────────┴──────────┴──────────┘',
  ].join('\n');

  it('visual output', () => {
    const actual = renderPlainGrid(KINGS_GRID, result.wins);
    console.log('\n[KINGS GRID]\n' + printComparison(actual, EXPECTED_KINGS));
    expect(actual).toBe(EXPECTED_KINGS);
  });

  it('finds exactly 10 winning lines', () => {
    expect(result.wins.length).toBe(10);
  });

  it('correct winning line indices', () => {
    const indices = result.wins.map(w => w.lineIndex).sort((a, b) => a - b);
    expect(indices).toEqual([1, 3, 5, 9, 13, 17, 21, 23, 27, 29]);
  });

  it('all wins are King', () => {
    for (const w of result.wins) expect(w.symbol).toBe(Sym.King);
  });

  it('8 × 5-of-kind (20) + 2 × 4-of-kind (10) = 180 total', () => {
    const five = result.wins.filter(w => w.count === 5);
    const four = result.wins.filter(w => w.count === 4);
    expect(five.length).toBe(8);
    expect(four.length).toBe(2);
    for (const w of five) expect(w.payout).toBe(20);
    for (const w of four) expect(w.payout).toBe(10);
    expect(result.totalWin).toBe(180);
  });

  it('no scatter', () => {
    expect(result.scatterWin).toBe(0);
    expect(result.bonusTriggered).toBe(false);
  });

  it('every win starts at [0, 0]', () => {
    for (const w of result.wins) expect(w.positions[0]).toEqual([0, 0]);
  });

  it('[1,2] has NO connections (no K to its left)', () => {
    const conns = getCellConnections(1, 2, result.wins, LINE_COLORS);
    expect(conns).toEqual([]);
  });

  it('[3,2] has no outgoing (no K to its right)', () => {
    const conns = getCellConnections(3, 2, result.wins, LINE_COLORS);
    expect(conns.length).toBe(1);
    expect(conns[0].incoming).toBe(0);
    expect(conns[0].outgoing).toBeNaN();
  });
});

describe('evaluate – wild grid', () => {
  const result = evaluate(WILD_GRID, 30, 1);

  const EXPECTED_WILD = [
    '┌──────────┬──────────┬──────────┬──────────┬──────────┐',
    '│          │          │          │          │          │',
    '│   GRN  ──│── WILD ──│── WILD ──│    A     │   WILD   │',
    '│          │ /        │ /      \\ │          │          │',
    '├──────────┼──────────┼──────────┼──────────┼──────────┤',
    '│        / │        / │          │ \\        │          │',
    '│    K     │   RED    │    10  ──│── WILD ──│── WILD   │',
    '│        \\ │ /        │ /        │        \\ │          │',
    '├──────────┼──────────┼──────────┼──────────┼──────────┤',
    '│        / │        / │          │          │ \\        │',
    '│   WILD ──│── WILD ──│──  J     │   PUR    │   WILD   │',
    '│          │          │          │          │          │',
    '└──────────┴──────────┴──────────┴──────────┴──────────┘',
  ].join('\n');

  it('visual output', () => {
    const actual = renderPlainGrid(WILD_GRID, result.wins);
    console.log('\n[WILD GRID]\n' + printComparison(actual, EXPECTED_WILD));
    expect(actual).toBe(EXPECTED_WILD);
  });

  it('finds 11 winning lines', () => {
    expect(result.wins.length).toBe(11);
  });

  it('correct winning line indices', () => {
    const indices = result.wins.map(w => w.lineIndex).sort((a, b) => a - b);
    expect(indices).toEqual([1, 2, 4, 6, 8, 18, 22, 23, 24, 26, 28]);
  });

  it('win symbols and counts', () => {
    const byIdx = (i: number) => result.wins.find(w => w.lineIndex === i)!;

    // 5-of-a-kind wins
    expect(byIdx(4).symbol).toBe(Sym.RedDragon);  expect(byIdx(4).count).toBe(5);
    expect(byIdx(18).symbol).toBe(Sym.Ten);        expect(byIdx(18).count).toBe(5);
    expect(byIdx(28).symbol).toBe(Sym.Ace);        expect(byIdx(28).count).toBe(5);

    // 3-of-a-kind wins
    expect(byIdx(1).symbol).toBe(Sym.GreenDragon); expect(byIdx(1).count).toBe(3);
    expect(byIdx(2).symbol).toBe(Sym.Jack);        expect(byIdx(2).count).toBe(3);
    expect(byIdx(6).symbol).toBe(Sym.Ten);         expect(byIdx(6).count).toBe(3);
    expect(byIdx(8).symbol).toBe(Sym.King);        expect(byIdx(8).count).toBe(3);
    expect(byIdx(22).symbol).toBe(Sym.RedDragon);  expect(byIdx(22).count).toBe(3);
    expect(byIdx(23).symbol).toBe(Sym.GreenDragon); expect(byIdx(23).count).toBe(3);
    expect(byIdx(24).symbol).toBe(Sym.Jack);       expect(byIdx(24).count).toBe(3);
    expect(byIdx(26).symbol).toBe(Sym.King);       expect(byIdx(26).count).toBe(3);
  });

  it('total win = 125', () => {
    expect(result.totalWin).toBe(125);
  });

  it('no scatter', () => {
    expect(result.scatterWin).toBe(0);
  });

  it('5x RedDragon (line 5) spans all reels via wilds', () => {
    const w = result.wins.find(w => w.lineIndex === 4)!;
    // payline [2,1,0,1,2] → Wild,Red,Wild,Wild,Wild
    expect(w.positions).toEqual([[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]]);
  });

  it('5x Ace (line 29) spans all reels via wilds', () => {
    const w = result.wins.find(w => w.lineIndex === 28)!;
    // payline [2,0,0,0,2] → Wild,Wild,Wild,Ace,Wild
    expect(w.positions).toEqual([[0, 2], [1, 0], [2, 0], [3, 0], [4, 2]]);
  });

  it('[3,0] Ace has NO connections (5x Ace outgoing jumps +2 to [4,2])', () => {
    // payline [2,0,0,0,2]: at [3,0] outgoing = row 2 - row 0 = +2 → filtered
    const conns = getCellConnections(3, 0, result.wins, LINE_COLORS);
    expect(conns.length).toBe(0);
  });
});

describe('evaluate – last_wild grid', () => {
  const result = evaluate(LAST_WILD_GRID, 30, 1);

  const EXPECTED_LAST_WILD = [
    '┌──────────┬──────────┬──────────┬──────────┬──────────┐',
    '│          │          │          │          │          │',
    '│   WILD ──│──  J   ──│── WILD ──│── WILD   │   GRN    │',
    '│        \\ │        \\ │ /      \\ │ /        │ /        │',
    '├──────────┼──────────┼──────────┼──────────┼──────────┤',
    '│          │ \\      / │ \\      / │ \\      / │          │',
    '│    A     │   GRN  ──│── WILD ──│── WILD   │    A     │',
    '│          │          │ /        │          │          │',
    '├──────────┼──────────┼──────────┼──────────┼──────────┤',
    '│          │          │          │          │          │',
    '│    K     │    10    │    A     │    A     │   WILD   │',
    '│          │          │          │          │          │',
    '└──────────┴──────────┴──────────┴──────────┴──────────┘',
  ].join('\n');

  it('visual output', () => {
    const actual = renderPlainGrid(LAST_WILD_GRID, result.wins);
    console.log('\n[LAST WILD GRID]\n' + printComparison(actual, EXPECTED_LAST_WILD));
    expect(actual).toBe(EXPECTED_LAST_WILD);
  });

  it('finds 7 winning lines', () => {
    expect(result.wins.length).toBe(7);
  });

  it('correct winning line indices', () => {
    const indices = result.wins.map(w => w.lineIndex).sort((a, b) => a - b);
    expect(indices).toEqual([1, 5, 9, 13, 17, 23, 29]);
  });

  it('win symbols and counts', () => {
    const byIdx = (i: number) => result.wins.find(w => w.lineIndex === i)!;

    // 5-of-a-kind GreenDragon
    expect(byIdx(9).symbol).toBe(Sym.GreenDragon);  expect(byIdx(9).count).toBe(5);
    expect(byIdx(13).symbol).toBe(Sym.GreenDragon); expect(byIdx(13).count).toBe(5);

    // 4-of-a-kind Jack
    expect(byIdx(1).symbol).toBe(Sym.Jack);  expect(byIdx(1).count).toBe(4);
    expect(byIdx(5).symbol).toBe(Sym.Jack);  expect(byIdx(5).count).toBe(4);
    expect(byIdx(17).symbol).toBe(Sym.Jack); expect(byIdx(17).count).toBe(4);

    // 3-of-a-kind Ten
    expect(byIdx(23).symbol).toBe(Sym.Ten);  expect(byIdx(23).count).toBe(3);
    expect(byIdx(29).symbol).toBe(Sym.Ten);  expect(byIdx(29).count).toBe(3);
  });

  it('total win = 134', () => {
    expect(result.totalWin).toBe(134);
  });

  it('no scatter', () => {
    expect(result.scatterWin).toBe(0);
  });

  it('5x GreenDragon (line 10) via Wild,GRN,Wild,Wild,GRN', () => {
    const w = result.wins.find(w => w.lineIndex === 9)!;
    // payline [0,1,1,1,0] → Wild,GRN,Wild,Wild,GRN
    expect(w.positions).toEqual([[0, 0], [1, 1], [2, 1], [3, 1], [4, 0]]);
  });

  it('3x Ten wins (lines 24, 30) have ±2 jumps → connections filtered', () => {
    const w24 = result.wins.find(w => w.lineIndex === 23)!;
    // payline [0,2,0,2,0] → positions jump row 0→2→0 (±2)
    expect(w24.positions).toEqual([[0, 0], [1, 2], [2, 0]]);
    // [1,2] should have no rendered connections due to ±2 filter
    const conns = getCellConnections(1, 2, result.wins, LINE_COLORS);
    expect(conns).toEqual([]);

    const w30 = result.wins.find(w => w.lineIndex === 29)!;
    // payline [0,2,1,2,0] → first jump row 0→2 is ±2
    expect(w30.positions).toEqual([[0, 0], [1, 2], [2, 1]]);
  });

  it('[4,0] GreenDragon has connections (end of 5x GRN lines)', () => {
    const conns = getCellConnections(4, 0, result.wins, LINE_COLORS);
    expect(conns.length).toBeGreaterThan(0);
  });
});

describe('evaluate – wild_red_emerald grid', () => {
  const result = evaluate(WILD_RED_EMERALD_GRID, 30, 1);

  const EXPECTED_WILD_RED_EMERALD = [
    '┌──────────┬──────────┬──────────┬──────────┬──────────┐',
    '│          │          │          │          │          │',
    '│   WILD ──│──  A   ──│── WILD   │   RED    │   WILD   │',
    '│          │        \\ │          │          │          │',
    '├──────────┼──────────┼──────────┼──────────┼──────────┤',
    '│          │          │ \\        │          │          │',
    '│   GRN    │   BNS    │   WILD   │    10    │    10    │',
    '│          │          │ /        │          │          │',
    '├──────────┼──────────┼──────────┼──────────┼──────────┤',
    '│          │        / │          │          │          │',
    '│   WILD ──│── RED    │    K     │    K     │    10    │',
    '│          │          │          │          │          │',
    '└──────────┴──────────┴──────────┴──────────┴──────────┘',
  ].join('\n');

  it('visual output', () => {
    const actual = renderPlainGrid(WILD_RED_EMERALD_GRID, result.wins);
    console.log('\n[WILD RED EMERALD GRID]\n' + printComparison(actual, EXPECTED_WILD_RED_EMERALD));
    expect(actual).toBe(EXPECTED_WILD_RED_EMERALD);
  });

  it('finds 8 winning lines', () => {
    expect(result.wins.length).toBe(8);
  });

  it('correct winning line indices', () => {
    const indices = result.wins.map(w => w.lineIndex).sort((a, b) => a - b);
    expect(indices).toEqual([1, 5, 6, 17, 18, 23, 28, 29]);
  });

  it('all wins are 3-of-a-kind', () => {
    for (const w of result.wins) expect(w.count).toBe(3);
  });

  it('4 Ace wins and 4 RedDragon wins', () => {
    const aceWins = result.wins.filter(w => w.symbol === Sym.Ace);
    const redWins = result.wins.filter(w => w.symbol === Sym.RedDragon);
    expect(aceWins.length).toBe(4);
    expect(redWins.length).toBe(4);
  });

  it('total win = 40', () => {
    // 4 × Ace(5) + 4 × RedDragon(5) = 40
    expect(result.totalWin).toBe(40);
  });

  it('no scatter (only 1 Bonus on reel 1)', () => {
    expect(result.scatterWin).toBe(0);
    expect(result.bonusTriggered).toBe(false);
  });

  it('Bonus at [1,1] breaks chain for any line passing through it', () => {
    // No winning line should include reel 1 row 1 in its positions
    for (const w of result.wins) {
      const hasReel1Row1 = w.positions.some(p => p[0] === 1 && p[1] === 1);
      expect(hasReel1Row1).toBe(false);
    }
  });

  it('lines with ±2 jumps are filtered from connections', () => {
    // Line 24 (idx 23): [0,2,0,2,0] → jumps +2,-2 → no connections at [1,2]
    const w = result.wins.find(w => w.lineIndex === 23)!;
    expect(w.positions).toEqual([[0, 0], [1, 2], [2, 0]]);

    const conns12 = getCellConnections(1, 2, result.wins, LINE_COLORS);
    // [1,2] has valid connections from lines 7 and 19 (incoming=0)
    // but should NOT have connections from line 24 (±2 jump) or line 30 (+2 jump)
    for (const c of conns12) {
      if (!isNaN(c.incoming)) {
        expect(Math.abs(c.incoming)).toBeLessThanOrEqual(1);
      }
      if (!isNaN(c.outgoing)) {
        expect(Math.abs(c.outgoing)).toBeLessThanOrEqual(1);
      }
    }
  });
});

/**
 * Screenshot: main game spin
 *
 *        Reel 0   Reel 1   Reel 2   Reel 3   Reel 4
 * row 0:  J        10       10       10       10
 * row 1:  10       RED      WLD      Q        10
 * row 2:  GRN      RED      WLD      Q        K
 *
 * BUG: Four consecutive 10s span row 0 reels 1-4, but no payline
 * routes a 10-win through [4,0]. The 3 winning lines (9, 12, 26)
 * all end at [4,1] instead. Payline [0,0,0,0,0] starts with J.
 * No payline pattern [1,0,0,0,0] exists in the 30-line set.
 */
const TENS_GRID: Grid = [
  [Sym.Jack, Sym.Ten, Sym.GreenDragon],
  [Sym.Ten, Sym.RedDragon, Sym.RedDragon],
  [Sym.Ten, Sym.Wild, Sym.Wild],
  [Sym.Ten, Sym.Queen, Sym.Queen],
  [Sym.Ten, Sym.Ten, Sym.King],
];

describe('evaluate – tens grid (top-right 10 unreachable)', () => {
  const result = evaluate(TENS_GRID, 30, 1);

  it('visual output', () => {
    const actual = renderPlainGrid(TENS_GRID, result.wins);
    console.log('\n[TENS GRID]\n' + printComparison(actual, actual));
  });

  it('finds exactly 3 winning lines, all 5x Ten', () => {
    expect(result.wins.length).toBe(3);
    for (const w of result.wins) {
      expect(w.symbol).toBe(Sym.Ten);
      expect(w.count).toBe(5);
      expect(w.payout).toBe(20);
    }
  });

  it('correct winning line indices: 9, 12, 26', () => {
    const indices = result.wins.map(w => w.lineIndex).sort((a, b) => a - b);
    expect(indices).toEqual([8, 11, 25]);
  });

  it('total win = 60', () => {
    expect(result.totalWin).toBe(60);
  });

  it('all 3 wins end at [4,1], not [4,0]', () => {
    // All winning paylines end at reel 4 row 1 — none reach [4,0]
    for (const w of result.wins) {
      const last = w.positions[w.positions.length - 1];
      expect(last).toEqual([4, 1]);
    }
  });

  it('[4,0] has NO connections despite having a 10', () => {
    // BUG: The 10 at [4,0] visually continues the row of 10s at row 0
    // (reels 1-3), but no payline routes a 10-win through it.
    // Payline [0,0,0,0,0] starts with J at [0,0] — not 10.
    // No payline pattern [1,0,0,0,0] exists in the 30-line definitions.
    const conns = getCellConnections(4, 0, result.wins, LINE_COLORS);
    expect(conns).toEqual([]);
  });

  it('no scatter', () => {
    expect(result.scatterWin).toBe(0);
  });
});
