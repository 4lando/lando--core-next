import {Help} from '@oclif/core';

export default class LandoHelp extends Help {
  protected formatRoot(): string {
    const lines: string[] = [];
    const version = this.config.version || 'unknown';

    lines.push('Usage:');
    lines.push('  lando <command> [args] [options]');
    lines.push('');

    const commands = this.sortedCommands.filter(c => !c.hidden);
    if (commands.length > 0) {
      lines.push('Commands:');
      const maxLen = Math.max(...commands.map(c => `lando ${c.id}`.length));
      for (const cmd of commands) {
        const cmdName = `lando ${cmd.id}`;
        const padding = ' '.repeat(maxLen - cmdName.length + 2);
        const desc = cmd.summary || cmd.description || '';
        lines.push(`  ${cmdName}${padding}${desc}`);
      }
      lines.push('');
    }

    lines.push('Options:');
    lines.push('  --channel      Sets the update channel  [array] [choices: "edge", "none", "stable"]');
    lines.push('  --clear        Clears the lando tasks cache  [boolean]');
    lines.push('  --debug        Shows debug output  [boolean]');
    lines.push('  --help         Shows lando or delegated command help if applicable  [boolean]');
    lines.push('  --verbose, -v  Runs with extra verbosity  [count]');
    lines.push('');

    lines.push('Examples:');
    lines.push('  lando start               Runs lando start');
    lines.push('  lando rebuild --help      Gets help about using the lando rebuild command');
    lines.push('  lando destroy -y --debug  Runs lando destroy non-interactively and with maximum verbosity');
    lines.push('  lando --clear             Clears the lando tasks cache');
    lines.push('');

    lines.push('You need at least one command before moving on');
    lines.push('');
    lines.push(`v${version}`);

    return lines.join('\n');
  }

  async showRootHelp(): Promise<void> {
    const output = this.formatRoot();
    this.log(output);
  }
}
