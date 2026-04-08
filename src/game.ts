import { GameState, SpinOutcome, Sym, Grid, WinLine } from './types';
import { RNG } from './rng';
import { spin } from './reels';
import { evaluate } from './evaluator';
import { MAX_LINES } from './paylines';
import { saveGame } from './save';
import { sleep, animateReelSpin, animateWins, animateCredits, animatePearlToPot, animatePotExplode, animateMiniGameReel, animateBonusFlash } from './animator';
import {
  renderReelGrid, renderHUD, renderWinDetails, renderControls,
  getGridHeight, getCenteredCol,
} from './renderer';
import { write, writeln, moveTo, clearScreen, clearLine, hideCursor, showCursor, Color, colorize } from './terminal';
import { waitForKey } from './input';
import { runBonus } from './bonus';
import { BonusMode } from './types';
import { checkPearlSpawn, checkPotExplode, runJackpotGame, renderPearlPot } from './jackpot';
import { demoMode, demoWaitForKey, cleanupPidFile } from './demo';

const GRID_START_ROW = 3;
const BET_OPTIONS = [1, 2, 5, 10, 25, 50, 100];

export async function gameLoop(state: GameState, rng: RNG): Promise<void> {
  let lastWin = 0;
  let lastWinLines: WinLine[] = [];
  let lastScatterWin = 0;
  let lastGrid: Grid | null = null;
  let running = true;

  // Handle clean exit
  const cleanup = () => {
    if (demoMode) cleanupPidFile();
    write(showCursor());
    process.exit(0);
  };
  process.once('SIGINT', cleanup);
  process.once('SIGTERM', cleanup);
  process.once('SIGHUP', cleanup);

  write(hideCursor());

  while (running) {
    const gridCol = getCenteredCol();

    // Render full screen
    write(clearScreen());

    // Title bar — centered
    write(moveTo(1, gridCol));
    write(colorize('DRAGON SPIN', Color.brightRed, Color.bold));

    // Render idle grid (mystery symbols or last spin result with win lines)
    const idleGrid = lastGrid
      ?? (state.history.length ? state.history[state.history.length - 1].grid : null)
      ?? Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => Sym.Mystery));
    renderReelGrid(idleGrid, GRID_START_ROW, gridCol, lastWinLines.length > 0 ? lastWinLines : undefined);

    const hudRow = GRID_START_ROW + getGridHeight() + 1;
    renderHUD(state, lastWin, hudRow, gridCol);
    renderPearlPot(state.pearlCount, hudRow + 3, gridCol);
    renderWinDetails(lastWinLines, lastScatterWin, hudRow + 5, gridCol);
    const controlsRow = (process.stdout.rows || 24) - 1;
    renderControls(controlsRow, gridCol);

    // Wait for input (demo mode auto-spins after a delay)
    let key: string;
    if (demoMode) {
      await sleep(2500);
      key = ' ';
    } else {
      key = await waitForKey();
    }
    const code = key.charCodeAt(0);

    // Ctrl+C
    if (code === 3) {
      running = false;
      break;
    }

    // Q to quit (disabled in demo mode — exit via SIGTERM only)
    if ((key === 'q' || key === 'Q') && !demoMode) {
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

      // Demo: auto-refill credits when running low
      if (demoMode && state.credits < totalBet) {
        state.credits = 1000;
      }

      if (state.credits < totalBet) {
        continue;
      }

      // Deduct bet
      state.credits -= totalBet;
      lastWin = 0;
      lastWinLines = [];
      lastScatterWin = 0;
      lastGrid = null;
      renderHUD(state, 0, hudRow, gridCol);

      // Spin and check for pearl
      const { grid, mysteryResolutions } = spin(rng);
      const hasPearl = checkPearlSpawn(rng);
      let pearlReel = -1;
      let pearlRow = -1;

      if (hasPearl) {
        pearlReel = rng.int(0, 4);
        pearlRow = rng.int(0, 2);
        grid[pearlReel][pearlRow] = Sym.Pearl;
      }

      // Animate
      await animateReelSpin(grid, rng, GRID_START_ROW, gridCol);

      // Evaluate (Pearl breaks lines just like Bonus)
      const result = evaluate(grid, state.lines, state.betPerLine);

      // Show wins
      renderWinDetails(result.wins, result.scatterWin, hudRow + 5, gridCol);

      if (result.wins.length > 0) {
        await animateWins(grid, result.wins, GRID_START_ROW, gridCol);
      }

      // Store grid and win lines so they persist on screen
      lastGrid = grid;
      lastWinLines = result.wins;
      lastScatterWin = result.scatterWin;

      // Award winnings
      lastWin = result.totalWin;
      if (lastWin > 0) {
        const prevCredits = state.credits;
        state.credits += lastWin;
        await animateCredits(prevCredits, state.credits, hudRow, gridCol);
      }
      renderHUD(state, lastWin, hudRow, gridCol);

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
        state.history.splice(0, state.history.length - 500);
      }

      // Auto-save (suppressed in demo mode)
      if (!demoMode) saveGame(state);

      // Pearl mechanic — animate pearl to pot if one spawned
      if (hasPearl) {
        const potRow = hudRow + 3;
        const potCol = gridCol;

        await animatePearlToPot(pearlReel, pearlRow, GRID_START_ROW, gridCol, potRow, potCol);

        // Replace pearl with empty slot and re-render
        grid[pearlReel][pearlRow] = Sym.Empty;
        renderReelGrid(grid, GRID_START_ROW, gridCol, lastWinLines.length > 0 ? lastWinLines : undefined);

        state.pearlCount++;
        renderPearlPot(state.pearlCount, potRow, gridCol);

        // Check if pot explodes
        if (checkPotExplode(state.pearlCount, rng)) {
          await sleep(500);
          await animatePotExplode(potRow, potCol);

          state.pearlCount = 0;

          write(clearScreen());
          writeln();
          writeln(colorize('  🎰 THE POT HAS EXPLODED! 🎰', Color.brightYellow, Color.bold));
          writeln(colorize('  Jackpot Pick is starting...', Color.brightCyan));
          writeln(colorize('  Press any key to begin!', Color.dim));
          await demoWaitForKey(waitForKey, 1500);

          const jackpotWin = await runJackpotGame(state, rng);
          state.credits += jackpotWin;
          state.stats.won += jackpotWin;
          state.stats.jackpotWins++;
          if (jackpotWin > state.stats.biggestWin) state.stats.biggestWin = jackpotWin;

          if (!demoMode) saveGame(state);
        }
      }

      // Bonus trigger
      if (result.bonusTriggered) {
        await animateBonusFlash(grid, GRID_START_ROW, gridCol);
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
        await demoWaitForKey(waitForKey, 1500);

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
        await demoWaitForKey(waitForKey, 1500);

        if (!demoMode) saveGame(state);
      }
    }
  }

  process.removeListener('SIGINT', cleanup);
  process.removeListener('SIGTERM', cleanup);
  process.removeListener('SIGHUP', cleanup);
  write(showCursor());
  write(clearScreen());
  writeln(colorize('\n  Thanks for playing Dragon Spin!\n', Color.brightRed, Color.bold));
  writeln(`  Final credits: ${state.credits}`);
  writeln(`  Total spins: ${state.stats.spins}`);
  writeln(`  Biggest win: ${state.stats.biggestWin}`);
  writeln();
  if (!demoMode) saveGame(state);
}
