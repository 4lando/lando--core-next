
import os from 'os';
import path from 'path';

import debugShim from '../utils/debug-shim.js';
import getFingerprint from '../utils/get-fingerprint.js';
import getSystemCas from '../utils/get-system-cas.js';
import isAdminUser from '../utils/is-admin-user.js';
import runElevated from '../utils/run-elevated.js';
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

  // Add linux CA installation task
  options.tasks.push({
    title: `Installing Lando Development CA on Linux`,
    id: 'install-ca-linux',
    dependsOn: ['create-ca'],
    description: '@lando/install-ca-linux',
    comments: {
      'NOT INSTALLED': 'Will install Lando Development Certificate Authority (CA) to Linux store',
    },
    hasRun: async () => {
      try {
        const fingerprint = getFingerprint(caCert);
        debug('computed sha1 fingerprint %o for ca %o', fingerprint, caCert);

        // get fingerprints
        const linuxfps = await getSystemCas({platform: 'linux'});

        // check if we have it in both
        return linuxfps.includes(fingerprint);
      } catch (error) {
        debug('error determining fingerprint of %o: %o %o', caCert, error.message, error.stack);
        return false;
      }
    },
    canRun: async () => {
      // Check for admin privileges
      if (!await isAdminUser()) {
        throw new Error([
          `User "${lando.config.username}" does not have permission to trust the CA!`,
          'Contact your system admin for permission and then rerun setup.',
        ].join(os.EOL));
      }

      return true;
    },
    task: async (ctx, task) => {
      task.title = 'Installing Lando Development Certificate Authority (CA) to Linux store';

      // Prompt for password if in interactive mode and password not provided
      if (ctx.password === undefined && lando.config.isInteractive) {
        ctx.password = await task.prompt({
          type: 'password',
          name: 'password',
          message: `Enter computer password for ${lando.config.username} to install the CA`,
          validate: async input => {
            const options = {debug, ignoreReturnCode: true, password: input};
            const response = await runElevated(['echo', 'Validating elevated access'], options);
            if (response.code !== 0) return response.stderr;
            return true;
          },
        });
      }

      // Prepare the installation command
      const script = path.join(lando.config.userConfRoot, 'scripts', 'install-system-ca-linux.sh');
      const command = [script, '--ca', caCert];

      // Add debug flag if necessary
      if (options.debug || options.verbose > 0 || lando.debuggy) command.push('--debug');

      // Execute the installation command with elevated privileges
      const result = await runElevated(command, {debug, password: ctx.password});

      // Update task title on successful installation
      task.title = 'Installed Lando Development Certificate Authority (CA) to Linux store';
      return result;
    },
  });

  // Add windows CA installation task
  options.tasks.push({
    title: `Installing Lando Development CA on Windows`,
    id: 'install-ca-win32',
    dependsOn: ['copy-ca'],
    description: '@lando/install-ca-win32',
    comments: {
      'NOT INSTALLED': 'Will install Lando Development Certificate Authority (CA) to Windows store',
    },
    hasRun: async () => {
      try {
        const fingerprint = getFingerprint(caCert);
        debug('computed sha1 fingerprint %o for ca %o', fingerprint, caCert);

        // get fingerprints
        const winfps = await getSystemCas();

        // check if we have it in both
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
      task.title = 'Installing Lando Development Certificate Authority (CA) to Windows store';

      // Assemble the installation command
      const script = path.join(lando.config.userConfRoot, 'scripts', 'install-system-ca-win32.ps1');
      const args = ['-CA', caCert];

      // Add optional arguments
      if (options.debug || options.verbose > 0 || lando.debuggy) args.push('-Debug');
      if (!lando.config.isInteractive) args.push('-NonInteractive');

      // Run the installation command
      const result = await runPowershellScript(script, args, {debug});

      // Update task title on successful installation
      task.title = 'Installed Lando Development Certificate Authority (CA) to Windows store';
      return result;
    },
  });
};
