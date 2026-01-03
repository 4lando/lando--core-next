import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';

type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';

interface LoggerOptions {
  logDir?: string;
  logLevelConsole?: LogLevel;
  logLevel?: LogLevel;
  logName?: string;
}

const LEVEL_VALUES: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  error: '\x1b[31m',
  warn: '\x1b[33m',
  info: '\x1b[32m',
  verbose: '\x1b[36m',
  debug: '\x1b[34m',
  silly: '\x1b[35m',
};

const RESET = '\x1b[0m';

export class Log {
  private logDir: string;
  private logLevelConsole: LogLevel;
  private logLevel: LogLevel;
  private logName: string;
  private sanitizedKeys: string[] = [];
  private errorStream: fs.WriteStream | null = null;
  private mainStream: fs.WriteStream | null = null;

  constructor(options: LoggerOptions = {}) {
    this.logDir = options.logDir || '';
    this.logLevelConsole = options.logLevelConsole || 'warn';
    this.logLevel = options.logLevel || 'debug';
    this.logName = options.logName || 'lando';

    if (this.logDir) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
        this.errorStream = fs.createWriteStream(path.join(this.logDir, 'error.log'), { flags: 'a' });
        this.mainStream = fs.createWriteStream(path.join(this.logDir, `${this.logName}.log`), { flags: 'a' });
      } catch {
        // Silently fail if we can't create log directory
      }
    }
  }

  alsoSanitize(key: string): void {
    if (!this.sanitizedKeys.includes(key)) {
      this.sanitizedKeys.push(key);
    }
  }

  private sanitize(obj: unknown): unknown {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (this.sanitizedKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private shouldLog(level: LogLevel, isConsole: boolean): boolean {
    const threshold = isConsole ? LEVEL_VALUES[this.logLevelConsole] : LEVEL_VALUES[this.logLevel];
    return LEVEL_VALUES[level] <= threshold;
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = meta ? this.sanitize(meta) : undefined;
    const metaStr = sanitizedMeta ? ` ${util.inspect(sanitizedMeta, { depth: 4, colors: false })}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  private formatConsole(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const color = LEVEL_COLORS[level];
    const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
    const sanitizedMeta = meta ? this.sanitize(meta) : undefined;
    const metaStr = sanitizedMeta ? ` ${util.inspect(sanitizedMeta, { depth: 4, colors: true })}` : '';
    return `${color}${timestamp} ${level.toUpperCase().padEnd(7)}${RESET} ${message}${metaStr}`;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog(level, true)) {
      console.error(this.formatConsole(level, message, meta));
    }

    if (this.shouldLog(level, false)) {
      const formatted = this.formatMessage(level, message, meta) + '\n';
      
      if (this.mainStream) {
        this.mainStream.write(formatted);
      }
      
      if (level === 'error' && this.errorStream) {
        this.errorStream.write(formatted);
      }
    }
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  verbose(message: string, meta?: Record<string, unknown>): void {
    this.log('verbose', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  silly(message: string, meta?: Record<string, unknown>): void {
    this.log('silly', message, meta);
  }
}

export default Log;
