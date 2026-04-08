/**
 * 30 payline definitions.
 * Each payline is an array of 5 row indices (0=top, 1=middle, 2=bottom),
 * one per reel (left to right).
 */
export const PAYLINES: readonly number[][] = [
  [1, 1, 1, 1, 1],  //  1: middle straight
  [0, 0, 0, 0, 0],  //  2: top straight
  [2, 2, 2, 2, 2],  //  3: bottom straight
  [0, 1, 2, 1, 0],  //  4: V shape
  [2, 1, 0, 1, 2],  //  5: inverted V
  [0, 0, 1, 0, 0],  //  6: top slight dip
  [2, 2, 1, 2, 2],  //  7: bottom slight bump
  [1, 2, 2, 2, 1],  //  8: U shape
  [1, 0, 0, 0, 1],  //  9: inverted U
  [0, 1, 1, 1, 0],  // 10: shallow V
  [2, 1, 1, 1, 2],  // 11: shallow inverted V
  [1, 0, 1, 0, 1],  // 12: zigzag up
  [1, 2, 1, 2, 1],  // 13: zigzag down
  [0, 1, 0, 1, 0],  // 14: top zigzag
  [2, 1, 2, 1, 2],  // 15: bottom zigzag
  [1, 1, 0, 1, 1],  // 16: top bump center
  [1, 1, 2, 1, 1],  // 17: bottom bump center
  [0, 0, 1, 1, 1],  // 18: top to middle
  [2, 2, 1, 1, 1],  // 19: bottom to middle
  [1, 1, 1, 0, 0],  // 20: middle to top
  [1, 1, 1, 2, 2],  // 21: middle to bottom
  [0, 1, 2, 2, 2],  // 22: top diagonal to bottom
  [2, 1, 0, 0, 0],  // 23: bottom diagonal to top
  [0, 2, 0, 2, 0],  // 24: top-bottom alternating
  [2, 0, 2, 0, 2],  // 25: bottom-top alternating
  [1, 0, 2, 0, 1],  // 26: complex zigzag 1
  [1, 2, 0, 2, 1],  // 27: complex zigzag 2
  [0, 2, 2, 2, 0],  // 28: top edges, bottom middle
  [2, 0, 0, 0, 2],  // 29: bottom edges, top middle
  [0, 2, 1, 2, 0],  // 30: diamond
];

export const NUM_REELS = 5;
export const NUM_ROWS = 3;
export const MAX_LINES = PAYLINES.length;
