import { GameState, SpinOutcome, Sym } from './types';
import { RNG } from './rng';
import { spin } from './reels';
import { evaluate } from './evaluator';
import { MAX_LINES } from './paylines';
import { saveGame } from './save';
import { sleep, animateReelSpin, animateWins, animateCredits, animatePearlToPot, animatePotExplode, animateMiniGameReel } from './animator';
import {
  renderReelGrid, renderHUD, renderWinDetails, renderControls,
  getGridHeight,
} from './renderer';
import { write, writeln, moveTo, clearScreen, clearLine, hideCursor, showCursor, Color, colorize } from './terminal';
import { waitForKey } from './input';
import { runBonus } from './bonus';
import { BonusMode } from './types';
import { checkPearlSpawn, checkPotExplode, runJackpotGame, renderPearlPot } from './jackpot';

const GRID_START_ROW = 3;
const GRID_START_COL = 3;
const BET_OPTIONS = [1, 2, 5, 10, 25, 50, 100];

export async function gameLoop(state: GameState, rng: RNG): Promise<void> {
  let lastWin = 0;
  let running = true;

  // Handle clean exit
  const cleanup = () => {
    write(showCursor());
    process.exit(0);
  };
  process.on('SIGINT', cleanup);

  write(hideCursor());

  while (running) {
    // Render full screen
    write(clearScreen());

    // Title bar
    write(moveTo(1, 1));
    write(colorize(' DRAGON SPIN', Color.brightRed, Color.bold));

    // Render idle grid (mystery symbols or last spin result)
    const lastSpin = state.history.length ? state.history[state.history.length - 1].grid : null;
    const idleGrid = lastSpin ?? Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => Sym.Mystery));
    renderReelGrid(idleGrid, GRID_START_ROW, GRID_START_COL);

    const hudRow = GRID_START_ROW + getGridHeight() + 1;
    renderHUD(state, lastWin, hudRow);
    renderPearlPot(state.pearlCount, hudRow + 2, 1);
    renderControls(hudRow + 10);

    // Wait for input
    const key = await waitForKey();
    const code = key.charCodeAt(0);

    // Ctrl+C
    if (code === 3) {
      running = false;
      break;
    }

    // Q to quit
    if (key === 'q' || key === 'Q') {
      running = false;
      break;
    }

    // Arrow keys come as escape sequences: \x1b[A, \x1b[B, \x1b[C, \x1b[D
    if (key === '\x1b[A') { // Up arrow — increase bet
      const idx = BET_OPTIONS.indexOf(state.betPerLine);
      if (idx < BET_OPTIONS.length - 1) {
        state.betPerLine = BET_OPTIONS[idx + 1];
      } else if (idx === -1) {
        state.betPerLine = BET_OPTIONS[0];
      }
      continue;
    }
    if (key === '\x1b[B') { // Down arrow — decrease bet
      const idx = BET_OPTIONS.indexOf(state.betPerLine);
      if (idx > 0) {
        state.betPerLine = BET_OPTIONS[idx - 1];
      } else if (idx === -1) {
        state.betPerLine = BET_OPTIONS[0];
      }
      continue;
    }
    if (key === '\x1b[C') { // Right arrow — increase lines
      if (state.lines < MAX_LINES) state.lines++;
      continue;
    }
    if (key === '\x1b[D') { // Left arrow — decrease lines
      if (state.lines > 1) state.lines--;
      continue;
    }

    // Space or Enter to spin
    if (key === ' ' || key === '\r' || key === '\n') {
      const totalBet = state.lines * state.betPerLine;

      if (state.credits < totalBet) {
        write(moveTo(hudRow + 3, 1));
        write(colorize(' Not enough credits!', Color.brightRed));
        await sleep(1000);
        continue;
      }

      // Deduct bet
      state.credits -= totalBet;
      lastWin = 0;
      renderHUD(state, 0, hudRow);

      // Spin
      const { grid, mysteryResolutions } = spin(rng);

      // Animate
      await animateReelSpin(grid, rng, GRID_START_ROW, GRID_START_COL);

      // Evaluate
      const result = evaluate(grid, state.lines, state.betPerLine);

      // Show wins
      renderWinDetails(result.wins, result.scatterWin, hudRow + 2);

      if (result.wins.length > 0) {
        const allPos = result.wins.flatMap(w => w.positions);
        await animateWins(grid, allPos, GRID_START_ROW, GRID_START_COL);
      }

      // Award winnings
      lastWin = result.totalWin;
      if (lastWin > 0) {
        const prevCredits = state.credits;
        state.credits += lastWin;
        await animateCredits(prevCredits, state.credits, hudRow, 1);
      }
      renderHUD(state, lastWin, hudRow);

      // Record spin
      state.stats.spins++;
      state.stats.wagered += totalBet;
      state.stats.won += lastWin;
      if (lastWin > state.stats.biggestWin) state.stats.biggestWin = lastWin;
      state.history.push({
        grid,
        bet: totalBet,
        win: lastWin,
        bonus: result.bonusTriggered,
        time: new Date().toISOString(),
      });

      // Cap history to last 500 spins to keep save file reasonable
      if (state.history.length > 500) {
        state.history = state.history.slice(-500);
      }

      // Auto-save
      saveGame(state);

      // Pearl mechanic — check for pearl spawn
      if (checkPearlSpawn(rng)) {
        const pearlReel = rng.int(0, 4);
        const pearlRow = rng.int(0, 2);
        const potRow = hudRow + 2;
        const potCol = 4;

        await animatePearlToPot(pearlReel, pearlRow, GRID_START_ROW, GRID_START_COL, potRow, potCol);

        state.pearlCount++;
        renderPearlPot(state.pearlCount, potRow, 1);

        // Check if pot explodes
        if (checkPotExplode(state.pearlCount, rng)) {
          await sleep(500);
          await animatePotExplode(potRow, potCol);

          state.pearlCount = 0;

          write(clearScreen());
          writeln();
          writeln(colorize('  🏺 THE POT HAS EXPLODED! 🏺', Color.brightYellow, Color.bold));
          writeln(colorize('  Jackpot Pick is starting...', Color.brightCyan));
          writeln(colorize('  Press any key to begin!', Color.dim));
          await waitForKey();

          const jackpotWin = await runJackpotGame(state, rng);
          state.credits += jackpotWin;
          state.stats.won += jackpotWin;
          state.stats.jackpotWins++;
          if (jackpotWin > state.stats.biggestWin) state.stats.biggestWin = jackpotWin;

          saveGame(state);
        }
      }

      // Bonus trigger
      if (result.bonusTriggered) {
        await sleep(500);
        write(clearScreen());

        writeln();
        writeln(colorize('  ★ ★ ★  DRAGON SPIN BONUS!  ★ ★ ★', Color.brightYellow, Color.bold));
        writeln();

        const dragonSpinModes = ['RAINING WILDS', 'PERSISTING WILDS', 'REEL BLAST'];
        const modeMap: BonusMode[] = ['raining-wilds', 'persisting-wilds', 'reel-blast'];
        const chosenIdx = rng.int(0, dragonSpinModes.length - 1);
        await animateMiniGameReel(dragonSpinModes, chosenIdx, 6);

        write(moveTo(14, 1));
        writeln(colorize('  Press any key to start...', Color.dim));
        await waitForKey();

        const mode = modeMap[chosenIdx];
        const bonusWin = await runBonus(mode, state, rng);
        state.credits += bonusWin;
        state.stats.won += bonusWin;
        if (bonusWin > state.stats.biggestWin) state.stats.biggestWin = bonusWin;

        write(clearScreen());
        writeln();
        writeln(colorize('  ★ BONUS COMPLETE ★', Color.brightYellow, Color.bold));
        writeln(colorize(`  Total bonus winnings: ${bonusWin}`, Color.brightCyan));
        writeln();
        writeln(colorize('  Press any key to continue...', Color.dim));
        await waitForKey();

        saveGame(state);
      }
    }
  }

  write(showCursor());
  write(clearScreen());
  writeln(colorize('\n  Thanks for playing Dragon Spin!\n', Color.brightRed, Color.bold));
  writeln(`  Final credits: ${state.credits}`);
  writeln(`  Total spins: ${state.stats.spins}`);
  writeln(`  Biggest win: ${state.stats.biggestWin}`);
  writeln();
  saveGame(state);
}
