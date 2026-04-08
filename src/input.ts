import * as readline from 'node:readline';

/**
 * Wait for a single keypress in raw mode. Returns the key string.
 */
export function waitForKey(): Promise<string> {
  return new Promise((resolve, reject) => {
    const wasRaw = process.stdin.isRaw;
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const onData = (data: Buffer) => {
      teardown();
      resolve(data.toString());
    };
    const onError = (err: Error) => {
      teardown();
      reject(err);
    };
    const teardown = () => {
      process.stdin.removeListener('data', onData);
      process.stdin.removeListener('error', onError);
      process.stdin.setRawMode(wasRaw ?? false);
      process.stdin.pause();
    };

    process.stdin.once('data', onData);
    process.stdin.once('error', onError);
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
  let answered = false;
  return new Promise<string>((resolve, reject) => {
    rl.question(question, (answer) => {
      answered = true;
      rl.close();
      resolve(answer.trim());
    });
    rl.once('error', (err) => {
      rl.close();
      reject(err);
    });
    rl.once('close', () => {
      if (!answered) resolve('');
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
