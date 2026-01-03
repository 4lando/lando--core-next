/// <reference types="bun-types" />

type DebugFunction = (...args: unknown[]) => void;

interface Debug extends DebugFunction {
  enabled: boolean;
  namespace: string;
  extend: (suffix: string) => Debug;
}

const DEBUG = process.env.DEBUG || '';
const debugPatterns = DEBUG.split(',').map(p => p.trim()).filter(Boolean);

function matchesPattern(namespace: string): boolean {
  if (debugPatterns.length === 0) return false;
  
  for (const pattern of debugPatterns) {
    if (pattern === '*') return true;
    if (pattern === namespace) return true;
    
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (namespace.startsWith(prefix)) return true;
    }
    
    if (pattern.startsWith('-')) {
      const excluded = pattern.slice(1);
      if (excluded.endsWith('*')) {
        const prefix = excluded.slice(0, -1);
        if (namespace.startsWith(prefix)) return false;
      } else if (namespace === excluded) {
        return false;
      }
    }
  }
  
  return false;
}

const colors = [
  '\x1b[36m', '\x1b[33m', '\x1b[32m', '\x1b[35m', '\x1b[34m', '\x1b[31m',
];
const reset = '\x1b[0m';
let colorIndex = 0;

function getColor(): string {
  const color = colors[colorIndex % colors.length];
  colorIndex++;
  return color;
}

function formatArgs(args: unknown[]): string[] {
  return args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.stack || arg.message;
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  });
}

function createDebug(namespace: string): Debug {
  const enabled = matchesPattern(namespace);
  const color = getColor();
  let lastTime = Date.now();

  const debug: Debug = function(...args: unknown[]) {
    if (!debug.enabled) return;
    
    const now = Date.now();
    const diff = now - lastTime;
    lastTime = now;
    
    const prefix = `${color}${namespace}${reset}`;
    const suffix = `${color}+${diff}ms${reset}`;
    const formatted = formatArgs(args);
    
    console.error(prefix, ...formatted, suffix);
  } as Debug;

  debug.enabled = enabled;
  debug.namespace = namespace;
  debug.extend = (suffix: string) => createDebug(`${namespace}:${suffix}`);

  return debug;
}

export default createDebug;
