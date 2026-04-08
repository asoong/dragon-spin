#!/usr/bin/env node

import { renderTitle } from './renderer';
import { menu, prompt } from './input';
import { saveExists, loadGame, createFreshState } from './save';
import { createRNG } from './rng';
import { gameLoop } from './game';
import { GameState } from './types';
import { writeln, Color, colorize, showCursor, write } from './terminal';

const CREDIT_OPTIONS = [100, 500, 1000, 5000];
const LINE_OPTIONS = [1, 5, 10, 15, 20, 25, 30];
const BET_OPTIONS = [1, 2, 5, 10, 25];

async function setupNewGame(): Promise<GameState> {
  const creditIdx = await menu('Choose starting credits:', CREDIT_OPTIONS.map(String));
  const credits = CREDIT_OPTIONS[creditIdx];

  const lineIdx = await menu('Choose number of paylines:', LINE_OPTIONS.map(String));
  const lines = LINE_OPTIONS[lineIdx];

  const betIdx = await menu('Choose bet per line:', BET_OPTIONS.map(String));
  const betPerLine = BET_OPTIONS[betIdx];

  writeln();
  writeln(colorize(`  Starting with ${credits} credits, ${lines} lines, ${betPerLine} per line`, Color.brightGreen));
  writeln(colorize(`  Total bet per spin: ${lines * betPerLine}`, Color.dim));
  writeln();

  return createFreshState(credits, lines, betPerLine);
}

async function main(): Promise<void> {
  const rng = createRNG();

  renderTitle();

  let state: GameState;
  const saved = loadGame();

  if (saved && saveExists()) {
    const lastDate = new Date(saved.lastPlayed).toLocaleDateString();
    const choice = await menu(
      `Save found — ${saved.credits} credits, ${saved.stats.spins} spins (last played: ${lastDate})`,
      ['Continue', 'New Game'],
    );

    if (choice === 0) {
      state = saved;
      writeln(colorize('\n  Resuming game...', Color.brightGreen));
    } else {
      state = await setupNewGame();
    }
  } else {
    state = await setupNewGame();
  }

  await gameLoop(state, rng);
}

main().catch((err) => {
  write(showCursor());
  console.error('Fatal error:', err);
  process.exit(1);
});
