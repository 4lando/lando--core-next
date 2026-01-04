import type { Command } from '@oclif/core';

export const COMMANDS: Record<string, typeof Command> = {};

export function registerCommand(id: string, cmd: typeof Command): void {
  COMMANDS[id] = cmd;
}

export function unregisterCommand(id: string): void {
  delete COMMANDS[id];
}

export function getCommand(id: string): typeof Command | undefined {
  return COMMANDS[id];
}

export function listCommands(): string[] {
  return Object.keys(COMMANDS);
}
