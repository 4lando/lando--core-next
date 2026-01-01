
import path from 'path';
import debugShim from '../utils/debug-shim.js';
import getFingerprint from '../utils/get-fingerprint.js';
import getSystemCas from '../utils/get-system-cas.js';
import runCommand from '../utils/run-command.js';

/**
 * Installs the Lando Development Certificate Authority (CA) on macOS systems.
 * This module is called by `lando setup` to ensure the Lando CA is trusted by the system.
 *
 * @param {Object} lando - The Lando config object
 * @param {Object} options - Options passed to the setup command
 * @return {Promise<void>}
 */
export default async (lando, options) => {
  const debug = debugShim(lando.log);

  const {caCert} = lando.config;

  // Skip the installation of the CA if set in options
  if (options.skipInstallCa) return;

  // Add CA installation task
  options.tasks.push({
    title: `Installing Lando Development CA`,
    id: 'install-ca',
    dependsOn: ['create-ca'],
    description: '@lando/install-ca',
    comments: {
      'NOT INSTALLED': 'Will install Lando Development Certificate Authority (CA) to system store',
    },
    hasRun: async () => {
      try {
        const fingerprint = getFingerprint(caCert);
        debug('computed sha1 fingerprint %o for ca %o', fingerprint, caCert);

        // get fingerprints
        const darwinfps = await getSystemCas();

        return darwinfps.includes(fingerprint);
      } catch (error) {
        debug('error determining fingerprint of %o: %o %o', caCert, error.message, error.stack);
        return false;
      }
    },
    canRun: async () => {
      return true;
    },
    task: async (ctx, task) => {
      task.title = 'Installing Lando Development Certificate Authority (CA)';

      // Assemble the installation command
      const fingerprint = getFingerprint(caCert);
      const script = path.join(lando.config.userConfRoot, 'scripts', 'install-system-ca-macos.sh');
      const args = ['--ca', caCert, '--fingerprint', fingerprint];

      // Add optional arguments
      if (options.debug || options.verbose > 0 || lando.debuggy) args.push('--debug');
      if (!lando.config.isInteractive) args.push('--non-interactive');

      // Run the installation command
      const result = await runCommand(script, args, {debug});

      // Update task title on successful installation
      task.title = 'Installed Lando Development Certificate Authority (CA)';
      return result;
    },
  });
};
