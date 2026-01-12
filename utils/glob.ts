/* eslint-disable require-jsdoc */
// / <reference types="bun-types" />

type GlobCallback = (err: Error | null, matches: string[]) => void;

export function sync(pattern: string, options: { cwd?: string; nodir?: boolean } = {}): string[] {
  const cwd = options.cwd || process.cwd();
  const onlyFiles = options.nodir !== false;
  const glob = new Bun.Glob(pattern);
  return [...glob.scanSync({cwd, onlyFiles})];
}

export async function async(pattern: string, options: { cwd?: string } = {}): Promise<string[]> {
  const cwd = options.cwd || process.cwd();
  const glob = new Bun.Glob(pattern);
  const results: string[] = [];
  for await (const path of glob.scan({cwd, onlyFiles: true})) {
    results.push(path);
  }
  return results;
}

function glob(
  pattern: string,
  options: { cwd?: string } | GlobCallback,
  callback?: GlobCallback,
): void {
  let opts: { cwd?: string } = {};
  let cb: GlobCallback;

  if (typeof options === 'function') {
    cb = options;
  } else {
    opts = options || {};
    cb = callback!;
  }

  try {
    const matches = sync(pattern, opts);
    cb(null, matches);
  } catch (err) {
    cb(err as Error, []);
  }
}

glob.sync = sync;

export default glob;
