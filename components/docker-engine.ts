import fs, {copySync} from '../utils/fs.js';
import os from 'os';
import path from 'path';
import merge from 'lodash/merge';
import slugify from '../utils/slugify.js';
import debug from '../utils/debug.js';
import {sync as globSync} from '../utils/glob.js';
import stringArgv from 'string-argv';

import {DockerClient} from '../lib/docker-effect.js';
import {EventEmitter} from 'events';
import {nanoid} from 'nanoid';
import {PassThrough} from 'stream';

import makeError from '../utils/make-error.js';
import makeSuccess from '../utils/make-success.js';
import mergePromise from '../utils/merge-promise.js';

import read from '../utils/read-file.js';
import remove from '../utils/remove.js';
import write from '../utils/write-file.js';
import getDockerX from '../utils/get-docker-x.js';
import getComposeX from '../utils/get-compose-x.js';
import getPassphraselessKeys from '../utils/get-passphraseless-keys.js';
import runCommand from '../utils/run-command.js';
import getBuildxError from '../utils/get-buildx-error.js';

interface DockerEngineConfig {
  socketPath?: string;
  host?: string;
  port?: number;
}

class DockerEngine {
  static name = 'docker-engine';
  static cspace = 'docker-engine';
  static config = {};
  static debug = debug('docker-engine');
  static builder = getDockerX();
  static orchestrator = getComposeX();

  builder: string;
  debug: ReturnType<typeof debug>;
  orchestrator: string;
  docker: DockerClient;

  constructor(config: DockerEngineConfig = {}, {
    builder = DockerEngine.builder,
    debug = DockerEngine.debug,
    orchestrator = DockerEngine.orchestrator,
  } = {}) {
    this.builder = builder;
    this.debug = debug;
    this.orchestrator = orchestrator;
    this.docker = new DockerClient(config.socketPath);
  }

  build(dockerfile: string,
    {
      tag,
      buildArgs = {},
      attach = false,
      context = path.join(os.tmpdir(), nanoid()),
      id = tag,
      sources = [],
    }: {
      tag?: string;
      buildArgs?: Record<string, string>;
      attach?: boolean;
      context?: string;
      id?: string;
      sources?: Array<{source: string; target: string}>;
    } = {}) {
    const awaitHandler = async () => {
      return new Promise((resolve, reject) => {
        if (!attach) {
          builder.on('progress', (data: {id?: string; status?: string; progress?: string; stream?: string}) => {
            if (data.id && data.status) {
              if (data.progress) debugFn('%s %o', data.status, data.progress);
              else debugFn('%s', data.status);
            }
            if (data.stream) debugFn('%s', data.stream);
          });
        }

        builder.on('done', (output: Array<{status: string}>) => {
          resolve(makeSuccess(merge({}, args, {stdout: output[output.length - 1]?.status || '', all: '', stderr: ''})));
        });
        builder.on('error', (error: Error) => {
          reject(makeError(merge({}, args, {error, all: '', code: 1, context: '', errorCode: '', short: '', statusCode: 1, stdout: '', stderr: error.message})));
        });
      });
    };

    if (!dockerfile) throw new Error('you must pass a dockerfile into engine.build');
    if (!fs.existsSync(dockerfile)) throw new Error(`${dockerfile} does not exist`);

    const debugFn = id ? this.debug.extend(id) : this.debug.extend('docker-engine:build');

    remove(context);
    fs.mkdirSync(context, {recursive: true});

    for (const source of sources) {
      try {
        copySync(source.source, path.join(context, source.target), {dereference: true});
      } catch (error: unknown) {
        const err = error as Error;
        err.message = `Failed to copy ${source.source} into build context at ${source.target}!: ${err.message}`;
        throw err;
      }
    }

    copySync(dockerfile, path.join(context, 'Dockerfile'));

    if (process.platform === 'win32') {
      for (const file of globSync(path.join(context, '**/*'), {nodir: true})) {
        write(file, read(file), {forcePosixLineEndings: true});
      }
    }

    const args = {command: 'docker build', args: {dockerfile, tag, sources}, all: '', stdout: '', stderr: ''};
    const builder = new EventEmitter();

    debugFn('building image %o from %o with build-args %o', tag, context, buildArgs);

    const buildArgFlags = Object.entries(buildArgs).map(([k, v]) => `--build-arg=${k}=${v}`).join(' ');
    const cmd = runCommand(this.builder, ['build', '-t', tag || '', buildArgFlags, context].filter(Boolean), {debug: debugFn});

    let stdout = '';
    let stderr = '';
    cmd.stdout?.on('data', (data: Buffer) => {
      const line = data.toString();
      stdout += line;
      builder.emit('progress', {stream: line});
    });
    cmd.stderr?.on('data', (data: Buffer) => {
      const line = data.toString();
      stderr += line;
      builder.emit('progress', {stream: line});
    });
    cmd.on('close', (code: number) => {
      if (code !== 0) {
        builder.emit('error', new Error(`Build failed with code ${code}: ${stderr}`));
      } else {
        builder.emit('done', [{status: stdout}]);
      }
    });

    return mergePromise(builder, awaitHandler);
  }

  buildx(dockerfile: string,
    {
      tag,
      buildArgs = {},
      context = path.join(os.tmpdir(), nanoid()),
      id = tag,
      ignoreReturnCode = false,
      sshKeys = [],
      sshSocket = false,
      sources = [],
      stderr = '',
      stdout = '',
    }: {
      tag?: string;
      buildArgs?: Record<string, string>;
      context?: string;
      id?: string;
      ignoreReturnCode?: boolean;
      sshKeys?: string[];
      sshSocket?: string | false;
      sources?: Array<{source: string; target: string}>;
      stderr?: string;
      stdout?: string;
    } = {}) {
    const awaitHandler = async () => {
      return new Promise((resolve, reject) => {
        buildxer.on('done', ({code, stdout, stderr}: {code: number; stdout: string; stderr: string}) => {
          debugFn('command %o done with code %o', args, code);
          resolve(makeSuccess(merge({}, args, {code, stdout, stderr, all: stdout + stderr})));
        });
        buildxer.on('error', (error: Error) => {
          debugFn('command %o error %o', args, error?.message);
          reject(error);
        });
      });
    };

    if (!dockerfile) throw new Error('you must pass a dockerfile into buildx');
    if (!fs.existsSync(dockerfile)) throw new Error(`${dockerfile} does not exist`);

    const debugFn = id ? this.debug.extend(id) : this.debug.extend('docker-engine:buildx');

    remove(context);
    fs.mkdirSync(context, {recursive: true});

    for (const source of sources) {
      try {
        copySync(source.source, path.join(context, source.target), {dereference: true});
      } catch (error: unknown) {
        const err = error as Error;
        err.message = `Failed to copy ${source.source} into build context at ${source.target}!: ${err.message}`;
        throw err;
      }
    }

    if (process.platform === 'win32') {
      for (const file of globSync(path.join(context, '**/*'), {nodir: true})) {
        write(file, read(file), {forcePosixLineEndings: true});
      }
    }

    copySync(dockerfile, path.join(context, 'Dockerfile'));
    dockerfile = path.join(context, 'Dockerfile');

    const args = {
      command: this.builder,
      args: [
        'buildx',
        'build',
        `--file=${dockerfile}`,
        '--progress=plain',
        `--tag=${tag}`,
        context,
      ],
    };

    for (const [key, value] of Object.entries(buildArgs)) args.args.push(`--build-arg=${key}=${value}`);

    let processedSshKeys = sshKeys;
    if (processedSshKeys.length > 0) {
      processedSshKeys = getPassphraselessKeys(processedSshKeys);
      args.args.push(`--ssh=keys=${processedSshKeys.join(',')}`);
      for (const key of processedSshKeys) args.args.push(`--ssh=${path.basename(key)}=${key}`);
      debugFn('passing in ssh keys %o', processedSshKeys);
    }

    if (sshSocket && fs.existsSync(sshSocket)) {
      args.args.push(`--ssh=agent=${sshSocket}`);
      debugFn('passing in ssh agent socket %o', sshSocket);
    }

    const buildxer = runCommand(args.command, args.args, {debug: debugFn});

    buildxer.stdout?.on('data', (data: Buffer) => {
      buildxer.emit('data', data);
      buildxer.emit('progress', data);
      for (const line of data.toString().trim().split('\n')) debugFn(line);
      stdout += data;
    });
    buildxer.stderr?.on('data', (data: Buffer) => {
      buildxer.emit('data', data);
      buildxer.emit('progress', data);
      for (const line of data.toString().trim().split('\n')) debugFn(line);
      stderr += data;
    });
    buildxer.on('close', (code: number) => {
      if (code !== 0 && !ignoreReturnCode) {
        buildxer.emit('error', getBuildxError({code, stdout, stderr}));
      } else {
        buildxer.emit('done', {code, stdout, stderr});
        buildxer.emit('finished', {code, stdout, stderr});
        buildxer.emit('success', {code, stdout, stderr});
      }
    });

    debugFn('buildxing image %o from %o with build-args', tag, context, buildArgs);

    return mergePromise(buildxer, awaitHandler);
  }

  async buildNRun(dockerfile: string, command: string | string[], {sources, tag, context, createOptions = {}, attach = false}: {
    sources?: Array<{source: string; target: string}>;
    tag?: string;
    context?: string;
    createOptions?: Record<string, unknown>;
    attach?: boolean;
  } = {}) {
    if (!tag) tag = slugify(nanoid()).toLowerCase();
    await this.build(dockerfile, {attach, context, sources, tag});
    await this.run(command, {attach, createOptions, tag});
  }

  async init() {
    // placeholder for async initialization
  }

  pull(image: string,
    {
      auth,
      attach = false,
    }: {
      auth?: {username: string; password: string; serveraddress?: string};
      attach?: boolean;
    } = {}) {
    const awaitHandler = async () => {
      return new Promise((resolve, reject) => {
        if (!attach) {
          puller.on('progress', (progress: {id?: string; status?: string; progress?: string}) => {
            const debugPull = progress.id ? this.debug.extend(`pull:${image}:${progress.id}`) : this.debug.extend(`pull:${image}`);
            if (progress.progress) debugPull('%s %o', progress.status, progress.progress);
            else debugPull('%s', progress.status);
          });
        }

        puller.on('done', (output: Array<{status: string}>) => {
          resolve(makeSuccess(merge({}, args, {stdout: output[output.length - 1]?.status || '', all: '', stderr: ''})));
        });
        puller.on('error', (error: Error) => {
          reject(makeError(merge({}, args, {error, all: '', code: 1, context: '', errorCode: '', short: '', statusCode: 1, stdout: '', stderr: error.message})));
        });
      });
    };

    if (!image) throw new Error('you must pass an image (repo/image:tag) into engine.pull');

    const args = {command: 'docker pull', args: {image, auth, attach}, all: '', stdout: '', stderr: ''};
    const puller = new EventEmitter();

    this.debug('pulling image %o', image);

    const pullArgs = ['pull', image];
    const cmd = runCommand(this.builder, pullArgs, {debug: this.debug});

    let stdout = '';
    let stderr = '';
    cmd.stdout?.on('data', (data: Buffer) => {
      const line = data.toString();
      stdout += line;
      const lines = line.split('\n').filter(Boolean);
      for (const l of lines) {
        puller.emit('progress', {status: l});
      }
    });
    cmd.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });
    cmd.on('close', (code: number) => {
      if (code !== 0) {
        puller.emit('error', new Error(`Pull failed: ${stderr}`));
      } else {
        puller.emit('done', [{status: stdout}]);
      }
    });

    return mergePromise(puller, awaitHandler);
  }

  async pullNRun(image: string, command: string | string[], {auth, attach = false, createOptions = {}}: {
    auth?: {username: string; password: string; serveraddress?: string};
    attach?: boolean;
    createOptions?: Record<string, unknown>;
  } = {}) {
    await this.pull(image, {attach, auth});
    await this.run(command, {attach, createOptions, image});
  }

  run(command: string | string[],
    {
      image = 'node:18-alpine',
      tag,
      createOptions = {},
      attach = false,
      interactive = false,
    }: {
      image?: string;
      tag?: string;
      createOptions?: Record<string, unknown>;
      attach?: boolean;
      interactive?: boolean;
    } = {}) {
    const awaitHandler = async () => {
      return new Promise((resolve, reject) => {
        runner.on('done', (data: {code: number; stdout: string; stderr: string}) => {
          resolve(makeSuccess(merge({}, {command: cmdArray, args: cmdArray}, data, {all: data.stdout + data.stderr})));
        });
        runner.on('error', (error: Error) => {
          reject(makeError(merge({}, {command: cmdArray, args: cmdArray, error, all: '', code: 1, context: '', errorCode: '', short: '', statusCode: 1, stdout: '', stderr: error.message})));
        });
      });
    };

    if (!command) throw new Error('you must pass a command into engine.run');
    const cmdArray = typeof command === 'string' ? stringArgv(command) : command;

    const useImage = tag || image;
    const args = ['run', '--rm'];
    
    if (interactive) {
      args.push('-it');
    }
    
    if (createOptions.HostConfig && (createOptions.HostConfig as Record<string, unknown>).Binds) {
      const binds = (createOptions.HostConfig as Record<string, unknown>).Binds as string[];
      for (const bind of binds) {
        args.push('-v', bind);
      }
    }
    
    if (createOptions.Env) {
      const envVars = createOptions.Env as string[];
      for (const env of envVars) {
        args.push('-e', env);
      }
    }
    
    if (createOptions.WorkingDir) {
      args.push('-w', createOptions.WorkingDir as string);
    }
    
    if (createOptions.User) {
      args.push('-u', createOptions.User as string);
    }

    args.push(useImage, ...cmdArray);

    const runner = new EventEmitter();
    this.debug('running command %o on image %o', cmdArray, useImage);

    const cmd = runCommand(this.builder, args, {debug: this.debug});

    let stdout = '';
    let stderr = '';
    
    cmd.stdout?.on('data', (data: Buffer) => {
      const str = data.toString();
      stdout += str;
      runner.emit('stdout', data);
      if (attach) process.stdout.write(data);
    });
    cmd.stderr?.on('data', (data: Buffer) => {
      const str = data.toString();
      stderr += str;
      runner.emit('stderr', data);
      if (attach) process.stderr.write(data);
    });
    cmd.on('close', (code: number) => {
      if (code !== 0) {
        runner.emit('error', new Error(`Run failed with code ${code}: ${stderr}`));
      } else {
        runner.emit('done', {code, stdout, stderr});
        runner.emit('finished', {code, stdout, stderr});
        runner.emit('success', {code, stdout, stderr});
      }
    });

    return mergePromise(runner, awaitHandler);
  }

  async listContainers(options?: {all?: boolean; filters?: Record<string, string[]>}) {
    return this.docker.listContainers(options);
  }

  async inspectContainer(id: string) {
    return this.docker.inspectContainer(id);
  }

  async stopContainer(id: string, options?: {t?: number}) {
    return this.docker.stopContainer(id, options);
  }

  async removeContainer(id: string, options?: {force?: boolean; v?: boolean}) {
    return this.docker.removeContainer(id, options);
  }

  async createNetwork(name: string, options?: {Driver?: string; Labels?: Record<string, string>}) {
    return this.docker.createNetwork(name, options);
  }

  async listNetworks(filters?: Record<string, string[]>) {
    return this.docker.listNetworks(filters);
  }

  async inspectNetwork(id: string) {
    return this.docker.inspectNetwork(id);
  }

  async removeNetwork(id: string) {
    return this.docker.removeNetwork(id);
  }

  async ping() {
    return this.docker.ping();
  }

  async version() {
    return this.docker.version();
  }

  async info() {
    return this.docker.info();
  }
}

export default DockerEngine;
