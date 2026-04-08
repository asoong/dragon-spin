import * as readline from 'node:readline';

/**
 * Wait for a single keypress in raw mode. Returns the key string.
 */
export function waitForKey(): Promise<string> {
  return new Promise((resolve) => {
    const wasRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', (data) => {
      process.stdin.setRawMode(wasRaw ?? false);
      process.stdin.pause();
      resolve(data.toString());
    });
  });
}

/**
 * Prompt the user for text input using readline.
 */
export function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Present a numbered menu and return the chosen index (0-based).
 */
export async function menu(title: string, options: string[]): Promise<number> {
  console.log(`\n${title}`);
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));

  while (true) {
    const answer = await prompt('\nChoose: ');
    const num = parseInt(answer, 10);
    if (num >= 1 && num <= options.length) return num - 1;
    console.log(`Please enter a number between 1 and ${options.length}.`);
  }
}
