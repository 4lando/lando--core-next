// eslint-disable-next-line spaced-comment
/// <reference types="bun-types" />
import _ from 'lodash';
import fs from 'fs';
import Promise from './promise.js';
import toLandoContainer from '../utils/to-lando-container.js';
import dockerComposify from '../utils/docker-composify.js';
import {DockerClient, getDockerClient} from './docker-effect.js';
import type {ContainerListOptions, NetworkCreateOptions, NetworkInfo} from './docker-effect.js';

interface ContainerData {
  Id: string;
  Labels: Record<string, string>;
  Status: string;
}

interface LandoContainer {
  id: string;
  service: string;
  name: string;
  app: string;
  kind: string;
  lando: boolean;
  instance: string;
  status: string;
  src: string[];
  running?: boolean;
}

const srcExists = (files: string[] = []) => _.reduce(files, (exists, file) => fs.existsSync(file) || exists, false);

export default class Landerode {
  id: string;
  private client: DockerClient | null = null;
  private opts: Record<string, unknown>;

  constructor(opts: Record<string, unknown> = {}, id = 'lando') {
    this.opts = opts;
    this.id = id;
  }

  private async getClient(): Promise<DockerClient> {
    if (!this.client) {
      const socketPath = (this.opts.socketPath as string) || process.env.DOCKER_HOST || '/var/run/docker.sock';
      this.client = getDockerClient(socketPath);
    }
    return this.client;
  }

  async createNet(name: string, opts: Partial<NetworkCreateOptions> = {}): Promise<{ Id: string }> {
    const client = await this.getClient();
    try {
      return await client.createNetwork({
        Name: name,
        Attachable: true,
        Internal: true,
        ...opts,
      });
    } catch (err) {
      throw new Error(`Error creating network: ${err}`);
    }
  }

  async scan(cid: string): Promise<unknown> {
    const client = await this.getClient();
    const result = await client.inspectContainer(cid);
    if (!result) {
      throw new Error(`Error inspecting container: ${cid}`);
    }
    return result;
  }

  async isRunning(cid: string): Promise<boolean> {
    try {
      const data = await this.scan(cid);
      return _.get(data, 'State.Running', false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes(`No such container: ${cid}`)) return false;
      if (message.includes('no such container')) return false;
      throw err;
    }
  }

  async list(options: Record<string, unknown> = {}, separator = '_'): Promise<LandoContainer[]> {
    const client = await this.getClient();

    const listOpts: ContainerListOptions = {
      all: options.all as boolean | undefined,
    };

    const containers = await client.listContainers(listOpts);

    let result: LandoContainer[] = ([...containers] as unknown as ContainerData[])
      .filter(Boolean)
      .filter(data => data.Status !== 'Removal In Progress')
      .map(container => toLandoContainer(container, separator) as LandoContainer)
      .filter(data => data.lando === true)
      .filter(data => data.instance === this.id);

    const keepPromises = result.map(async container => {
      if (!srcExists(container.src) && container.kind === 'app') {
        await this.remove(container.id, {force: true});
        return false;
      }
      return true;
    });

    const keeps = await Promise.all(keepPromises);
    result = result.filter((unused, i) => keeps[i]);

    if (options.project) {
      result = result.filter(c => c.app === options.project);
    }
    if (options.app) {
      result = result.filter(c => c.app === dockerComposify(options.app as string));
    }

    if (!_.isEmpty(options.filter)) {
      const filterPairs = _.fromPairs(
        _.map(options.filter as string[], (filter: string) => filter.split('=')),
      );
      result = _.filter(result, filterPairs) as LandoContainer[];
    }

    if (result.find(container => container.status === 'Up Less than a second')) {
      return this.list(options, separator);
    }

    return result.map(container => {
      container.running = container && typeof container.status === 'string' && !container.status.includes('Exited');
      return container;
    });
  }

  async remove(cid: string, opts: {v?: boolean; force?: boolean} = {v: true, force: false}): Promise<void> {
    const client = await this.getClient();
    await client.removeContainer(cid, {force: opts.force, volumes: opts.v});
  }

  async stop(cid: string, opts: {t?: number} = {}): Promise<void> {
    const client = await this.getClient();
    await client.stopContainer(cid, opts.t);
  }

  async getContainer(cid: string): Promise<unknown> {
    const client = await this.getClient();
    return client.getContainer(cid);
  }

  async getNetwork(name: string): Promise<NetworkInfo | null> {
    const client = await this.getClient();
    return client.getNetwork(name);
  }

  async listNetworks(filters?: Record<string, string[]>): Promise<NetworkInfo[]> {
    const client = await this.getClient();
    return client.listNetworks(filters);
  }

  async listContainers(options: ContainerListOptions = {}): Promise<readonly unknown[]> {
    const client = await this.getClient();
    return client.listContainers(options);
  }

  async ping(): Promise<string> {
    const client = await this.getClient();
    return client.ping();
  }
}
