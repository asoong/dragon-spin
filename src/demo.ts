import * as fs from 'node:fs';

const PID_FILE = '/tmp/dragon-spin-demo.pid';

export let demoMode = false;

export function enableDemoMode(): void {
  demoMode = true;
}

export function writePidFile(): void {
  fs.writeFileSync(PID_FILE, String(process.pid), { encoding: 'utf-8' });
}

export function cleanupPidFile(): void {
  try {
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
  } catch {
    // Ignore cleanup errors during exit
  }
}

/**
 * In demo mode, returns ' ' (space) after a short sleep instead of blocking on input.
 * In normal mode, delegates to the real waitForKey.
 */
export async function demoWaitForKey(
  realWaitForKey: () => Promise<string>,
  delayMs = 1500,
): Promise<string> {
  if (!demoMode) {
    return realWaitForKey();
  }
  await new Promise(resolve => setTimeout(resolve, delayMs));
  return ' ';
}
