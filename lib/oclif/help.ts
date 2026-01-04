import {Help} from '@oclif/core';

export default class LandoHelp extends Help {
  protected formatRoot(): string {
    const lines: string[] = [];

    lines.push('The libraries that power all of Lando.');
    lines.push('');
    lines.push('Usage: lando <command> [args] [options]');
    lines.push('');

    const commands = this.sortedCommands.filter(c => !c.hidden);
    if (commands.length > 0) {
      lines.push('Commands:');
      const maxLen = Math.max(...commands.map(c => c.id.length));
      for (const cmd of commands) {
        const padding = ' '.repeat(maxLen - cmd.id.length + 2);
        lines.push(`  ${cmd.id}${padding}${cmd.summary || ''}`);
      }
      lines.push('');
    }

    lines.push('Options:');
    lines.push('  --channel      Sets the update channel');
    lines.push('  --clear        Clears the lando tasks cache');
    lines.push('  --debug, -d    Shows debug output');
    lines.push('  --help         Shows help');
    lines.push('  --verbose, -v  Sets verbosity level');
    lines.push('');

    lines.push('Examples:');
    lines.push('  lando start          Starts up an app');
    lines.push('  lando rebuild        Rebuilds an app');
    lines.push('  lando destroy -y     Destroys an app without prompt');
    lines.push('  lando --help         Shows help');
    lines.push('');

    return lines.join('\n');
  }

  async showRootHelp(): Promise<void> {
    const output = await this.formatRoot();
    this.log(output);
  }
}
