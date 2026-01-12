
import path from 'path';
import debugShim from '../utils/debug-shim.js';
import getFingerprint from '../utils/get-fingerprint.js';
import getSystemCas from '../utils/get-system-cas.js';
import runPowershellScript from '../utils/run-powershell-script.js';

/**
 * Installs the Lando Development Certificate Authority (CA) on Windows systems.
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
        const winfps = await getSystemCas();

        return winfps.includes(fingerprint);
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
      const script = path.join(lando.config.userConfRoot, 'scripts', 'install-system-ca-win32.ps1');
      const args = ['-CA', caCert];

      // Add optional arguments
      if (options.debug || options.verbose > 0 || lando.debuggy) args.push('-Debug');
      if (!lando.config.isInteractive) args.push('-NonInteractive');

      // Run the installation command
      const result = await runPowershellScript(script, args, {debug});

      // Update task title on successful installation
      task.title = 'Installed Lando Development Certificate Authority (CA)';

      return result;
    },
  });
};
