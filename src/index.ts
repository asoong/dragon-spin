#!/usr/bin/env node

import { renderTitle } from './renderer';
import { menu, prompt } from './input';
import { saveExists, loadGame, createFreshState } from './save';
import { createRNG } from './rng';
import { gameLoop } from './game';
import { GameState } from './types';
import { writeln, Color, colorize, showCursor, write } from './terminal';

const QUICK_PRESETS = [
  { name: 'Casual    — 1,000 credits, 30 lines, 1/line  (30/spin)',  credits: 1000, lines: 30, bet: 1  },
  { name: 'Standard  — 2,500 credits, 30 lines, 5/line  (150/spin)', credits: 2500, lines: 30, bet: 5  },
  { name: 'High Roller — 10,000 credits, 30 lines, 25/line (750/spin)', credits: 10000, lines: 30, bet: 25 },
];

const CREDIT_OPTIONS = [100, 500, 1000, 2500, 5000, 10000];
const LINE_OPTIONS = [1, 5, 10, 15, 20, 25, 30];
const BET_OPTIONS = [1, 2, 5, 10, 25, 50, 100];

async function setupNewGame(): Promise<GameState> {
  const modeIdx = await menu('How would you like to start?', [
    ...QUICK_PRESETS.map(p => p.name),
    'Custom    — choose your own settings',
  ]);

  if (modeIdx < QUICK_PRESETS.length) {
    const preset = QUICK_PRESETS[modeIdx];
    writeln();
    writeln(colorize(`  ${preset.name.split('—')[0].trim()} mode selected!`, Color.brightGreen));
    writeln(colorize(`  ${preset.credits} credits, ${preset.lines} lines, ${preset.bet} per line`, Color.dim));
    writeln();
    return createFreshState(preset.credits, preset.lines, preset.bet);
  }

  // Custom setup
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
