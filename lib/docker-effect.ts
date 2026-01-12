/* eslint-disable require-jsdoc, valid-jsdoc */
// eslint-disable-next-line spaced-comment
/// <reference types="bun-types" />
/**
 * Docker client using the-moby-effect (Effect-ts based, ESM native)
 * Hybrid approach: Promise API for containers, Bun.$ CLI for networks
 *
 * @module docker-effect
 */

import type {ContainerInspectResponse, ContainerSummary} from 'the-moby-effect/MobySchemas';

// Types for our Promise-based API
export interface DockerConnectionOptions {
  socketPath?: string;
  host?: string;
  port?: number;
}

export interface ContainerListOptions {
  all?: boolean;
  limit?: number;
  size?: boolean;
  filters?: {
    label?: string[];
    name?: string[];
    status?: Array<'created' | 'restarting' | 'running' | 'removing' | 'paused' | 'exited' | 'dead'>;
    network?: string[];
  };
}

export interface NetworkInfo {
  Id: string;
  Name: string;
  Driver: string;
  Scope: string;
  IPAM?: {
    Driver?: string;
    Config?: Array<{
      Subnet?: string;
      Gateway?: string;
    }>;
  };
  Containers?: Record<string, {
    Name: string;
    EndpointID: string;
    MacAddress: string;
    IPv4Address: string;
    IPv6Address: string;
  }>;
  Labels?: Record<string, string>;
}

export interface NetworkCreateOptions {
  Name: string;
  Driver?: string;
  Internal?: boolean;
  Attachable?: boolean;
  Labels?: Record<string, string>;
}

/**
 * Docker client class providing Promise-based API
 * Uses Bun CLI for all Docker operations (avoids CJS bundling issues)
 */
export class DockerClient {
  private socketPath: string;
  private initialized: boolean = false;

  constructor(socketPath?: string) {
    this.socketPath = socketPath || process.env.DOCKER_HOST || '/var/run/docker.sock';
  }

  /**
   * Initialize the client (lazy - called on first use if needed)
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    // Verify Docker is accessible
    try {
      await Bun.$`docker info`.quiet();
      this.initialized = true;
    } catch (error) {
      throw new Error(`Cannot connect to Docker daemon: ${error}`);
    }
  }

  /**
   * Close the Docker client connection
   */
  async close(): Promise<void> {
    this.initialized = false;
  }

  // ============ Container Operations (via Bun CLI) ============

  /**
   * List containers
   * @param {ContainerListOptions} options - Container list options
   */
  async listContainers(options: ContainerListOptions = {}): Promise<ContainerSummary[]> {
    const args: string[] = ['docker', 'ps', '--format', '{{json .}}'];
    if (options.all) args.push('-a');
    if (options.limit) args.push('-n', String(options.limit));
    if (options.size) args.push('-s');
    if (options.filters) {
      for (const [key, values] of Object.entries(options.filters)) {
        for (const value of values as string[]) {
          args.push('--filter', `${key}=${value}`);
        }
      }
    }

    const result = await Bun.$`${args}`.text();
    const lines = result.trim().split('\n').filter(Boolean);
    return lines.map(line => JSON.parse(line)) as ContainerSummary[];
  }

  /**
   * Inspect a container
   * @param {string} id - Container ID
   */
  async inspectContainer(id: string): Promise<ContainerInspectResponse> {
    // Use CLI since the promise API doesn't have direct inspect
    const result = await Bun.$`docker inspect ${id} --format '{{json .}}'`.json();
    return result as ContainerInspectResponse;
  }

  /**
   * Check if a container is running
   * @param {string} id - Container ID
   */
  async isContainerRunning(id: string): Promise<boolean> {
    try {
      const result = await Bun.$`docker inspect ${id} --format '{{.State.Running}}'`.text();
      return result.trim() === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Stop a container
   * @param {string} id - Container ID
   * @param {number} timeout - Optional timeout in seconds
   */
  async stopContainer(id: string, timeout?: number): Promise<void> {
    if (timeout) {
      await Bun.$`docker stop -t ${timeout} ${id}`.quiet();
    } else {
      await Bun.$`docker stop ${id}`.quiet();
    }
  }

  /**
   * Start a container
   * @param {string} id - Container ID
   */
  async startContainer(id: string): Promise<void> {
    await Bun.$`docker start ${id}`.quiet();
  }

  /**
   * Remove a container
   * @param {string} id - Container ID
   * @param {object} options - Remove options
   */
  async removeContainer(id: string, options: { force?: boolean; volumes?: boolean } = {}): Promise<void> {
    const args: string[] = ['docker', 'rm'];
    if (options.force) args.push('-f');
    if (options.volumes) args.push('-v');
    args.push(id);
    await Bun.$`${args}`.quiet();
  }

  /**
   * Get container by ID (returns inspection data)
   * @param {string} id - Container ID
   */
  async getContainer(id: string): Promise<ContainerInspectResponse | null> {
    try {
      return await this.inspectContainer(id);
    } catch {
      return null;
    }
  }

  // ============ Network Operations (via Bun CLI) ============

  /**
   * List networks
   * @param {Record<string, string[]>} filters - Optional filters
   */
  async listNetworks(filters?: Record<string, string[]>): Promise<NetworkInfo[]> {
    let cmd = 'docker network ls --format \'{{json .}}\'';
    if (filters) {
      for (const [key, values] of Object.entries(filters)) {
        for (const value of values) {
          cmd += ` --filter ${key}=${value}`;
        }
      }
    }
    const result = await Bun.$`sh -c ${cmd}`.text();
    const lines = result.trim().split('\n').filter(Boolean);

    // Get full details for each network
    const networks: NetworkInfo[] = [];
    for (const line of lines) {
      try {
        const basic = JSON.parse(line);
        const details = await this.inspectNetwork(basic.ID || basic.Name);
        if (details) networks.push(details);
      } catch {
        // Skip malformed entries
      }
    }
    return networks;
  }

  /**
   * Create a network
   * @param {NetworkCreateOptions} options - Network creation options
   */
  async createNetwork(options: NetworkCreateOptions): Promise<{ Id: string }> {
    const args: string[] = ['docker', 'network', 'create'];

    if (options.Driver) {
      args.push('--driver', options.Driver);
    }
    if (options.Internal) {
      args.push('--internal');
    }
    if (options.Attachable) {
      args.push('--attachable');
    }
    if (options.Labels) {
      for (const [key, value] of Object.entries(options.Labels)) {
        args.push('--label', `${key}=${value}`);
      }
    }
    args.push(options.Name);

    const result = await Bun.$`${args}`.text();
    return {Id: result.trim()};
  }

  /**
   * Inspect a network
   * @param {string} id - Network ID
   */
  async inspectNetwork(id: string): Promise<NetworkInfo | null> {
    try {
      const result = await Bun.$`docker network inspect ${id} --format '{{json .}}'`.text();
      return JSON.parse(result.trim()) as NetworkInfo;
    } catch {
      return null;
    }
  }

  /**
   * Get network by name or ID
   */
  async getNetwork(nameOrId: string): Promise<NetworkInfo | null> {
    return this.inspectNetwork(nameOrId);
  }

  /**
   * Remove a network
   */
  async removeNetwork(id: string): Promise<void> {
    await Bun.$`docker network rm ${id}`.quiet();
  }

  /**
   * Connect a container to a network
   */
  async connectToNetwork(networkId: string, containerId: string): Promise<void> {
    await Bun.$`docker network connect ${networkId} ${containerId}`.quiet();
  }

  /**
   * Disconnect a container from a network
   */
  async disconnectFromNetwork(networkId: string, containerId: string, force = false): Promise<void> {
    if (force) {
      await Bun.$`docker network disconnect -f ${networkId} ${containerId}`.quiet();
    } else {
      await Bun.$`docker network disconnect ${networkId} ${containerId}`.quiet();
    }
  }

  // ============ System Operations ============

  async ping(): Promise<string> {
    await Bun.$`docker info`.quiet();
    return 'OK';
  }

  async version(): Promise<unknown> {
    const result = await Bun.$`docker version --format '{{json .}}'`.text();
    return JSON.parse(result.trim());
  }

  async info(): Promise<unknown> {
    const result = await Bun.$`docker info --format '{{json .}}'`.text();
    return JSON.parse(result.trim());
  }
}

let clientInstance: DockerClient | null = null;

export function getDockerClient(socketPath?: string): DockerClient {
  if (!clientInstance) {
    clientInstance = new DockerClient(socketPath);
  }
  return clientInstance;
}

export function closeDockerClient(): void {
  clientInstance = null;
}

// Re-export types
export type {ContainerInspectResponse, ContainerSummary};
