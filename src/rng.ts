import { randomInt } from 'node:crypto';

export interface RNG {
  /** Returns random integer in [min, max] inclusive */
  int(min: number, max: number): number;
  /** Pick a random element from an array */
  pick<T>(arr: readonly T[]): T;
  /** Return a shuffled copy of the array */
  shuffle<T>(arr: readonly T[]): T[];
  /** Return true with the given probability (0-1) */
  chance(probability: number): boolean;
}

export function createRNG(): RNG {
  return {
    int(min: number, max: number): number {
      return randomInt(min, max + 1);
    },

    pick<T>(arr: readonly T[]): T {
      return arr[randomInt(0, arr.length)];
    },

    shuffle<T>(arr: readonly T[]): T[] {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = randomInt(0, i + 1);
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    },

    chance(probability: number): boolean {
      return Math.random() < probability;
    },
  };
}
