/* eslint-disable require-jsdoc */
/**
 * Dockerfile generator - inlined to avoid Bun bundling issues with dockerfile-generator package
 * Original: dockerfile-generator/lib/dockerGenerator.js + dockerProcessor.js
 */

function processString(cmdName: string, param: string): string {
  return `${cmdName} ${param}`;
}

function processCmdAndRunAndEntryPointAndShell(cmdName: string, params: string | string[]): string | null {
  if (typeof params === 'string') {
    return `${cmdName} [ "${params}" ]`;
  }
  if (Array.isArray(params)) {
    const paramsList = params.map(p => `"${p}"`).join(', ');
    return `${cmdName} [ ${paramsList} ]`;
  }
  return null;
}

function processLabelAndEnv(cmdName: string, params: Record<string, string> | string[]): string {
  let lines = '';
  if (typeof params === 'object') {
    Object.keys(params).forEach(key => {
      lines += `${cmdName} ${key}=${(params as Record<string, string>)[key]}\n`;
    });
  }
  return lines.substring(0, lines.length - 1);
}

function processSimpleArrays(cmdName: string, params: string[]): string {
  return params.map(param => `${cmdName} ${param}`).join('\n');
}

function processSingleCmd(params: string | string[]): string | null {
  return processCmdAndRunAndEntryPointAndShell('CMD', params);
}

function processSingleRun(params: string | string[]): string | null {
  return processCmdAndRunAndEntryPointAndShell('RUN', params);
}

function processLabels(params: Record<string, string>): string {
  return processLabelAndEnv('LABEL', params);
}

function processEnvs(params: Record<string, string>): string {
  return processLabelAndEnv('ENV', params);
}

function processAdd(params: Record<string, string>): string {
  return Object.keys(params).map(key => `ADD ${key} ${params[key]}`).join('\n');
}

function processCopy(params: Record<string, string> & { from?: string }): string {
  return Object.keys(params)
    .filter(key => key !== 'from')
    .map(key => {
      const command = params.from ? `COPY --from=${params.from}` : 'COPY';
      return `${command} ${key} ${params[key]}`;
    })
    .join('\n');
}

function processEntryPoint(params: string | string[]): string | null {
  return processCmdAndRunAndEntryPointAndShell('ENTRYPOINT', params);
}

function processFrom(params: { baseImage: string; alias?: string }): string {
  let response = processString('FROM', params.baseImage);
  if (params.alias) {
    response = `${response} AS ${params.alias}`;
  }
  return response;
}

function processUser(params: string): string {
  return processString('USER', params);
}

function processWorkDir(params: string): string {
  return processString('WORKDIR', params);
}

function processStopSignal(params: string): string {
  return processString('STOPSIGNAL', params);
}

function processExposes(params: string[]): string {
  return processSimpleArrays('EXPOSE', params);
}

function processArgs(params: string[]): string {
  return processSimpleArrays('ARG', params);
}

function processVolumes(params: string[]): string {
  return processSimpleArrays('VOLUME', params);
}

function processShell(params: string | string[]): string | null {
  return processCmdAndRunAndEntryPointAndShell('SHELL', params);
}

function processComment(params: string): string {
  return `# ${params}`;
}

type ProcessorFunction = (params: any) => string | null;

function determineFunction(functionName: string): ProcessorFunction {
  let fName = functionName.toLowerCase();

  if (functionName.indexOf('-') !== -1) {
    fName = functionName.substring(0, functionName.indexOf('-'));
  }

  const functions: Record<string, ProcessorFunction> = {
    from: processFrom,
    run: processSingleRun,
    cmd: processSingleCmd,
    labels: processLabels,
    expose: processExposes,
    env: processEnvs,
    add: processAdd,
    copy: processCopy,
    entrypoint: processEntryPoint,
    volumes: processVolumes,
    user: processUser,
    working_dir: processWorkDir,
    args: processArgs,
    stopsignal: processStopSignal,
    shell: processShell,
    comment: processComment,
  };

  return functions[fName] || functions.comment;
}

/**
 * Generate Dockerfile from an Array.
 * @param {Array} inputArray - Array of Dockerfile instructions
 * @return {string} Generated Dockerfile content
 */
export function generateDockerFileFromArray(inputArray: Record<string, any>[]): string {
  let resp = '';
  inputArray.forEach(item => {
    Object.keys(item).forEach(key => {
      const callableFunction = determineFunction(key);
      resp += callableFunction(item[key]);
      resp += '\n';
    });
  });
  return resp;
}

export default generateDockerFileFromArray;
