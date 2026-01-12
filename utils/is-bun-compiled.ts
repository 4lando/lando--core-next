/**
 * Detects if the current process is running as a compiled Bun binary.
 *
 * When Bun compiles a binary, import.meta.url returns paths like
 * 'file:///$bunfs/root/...' which points to Bun's internal virtual filesystem.
 * This virtual filesystem doesn't exist on the actual disk, so we need to
 * detect this case and handle it specially (e.g., for plugin loading).
 *
 * @returns {boolean} True if running as a compiled Bun binary
 */
export default function isBunCompiled(): boolean {
  // Check if process.argv[1] contains the Bun virtual filesystem marker
  // In compiled Bun binaries, this will be something like '/$bunfs/root/bin/lando.ts'
  try {
    return process.argv[1]?.includes('$bunfs') ?? false;
  } catch {
    return false;
  }
}
