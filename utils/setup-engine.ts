import Landerode from '../lib/docker.js';
import LandoDaemon from '../lib/daemon.js';
import Engine from '../lib/engine.js';
import dockerCompose from '../lib/compose.js';

const dc = (shell, bin, cmd, {compose, project, opts = {}}) => {
  const run = dockerCompose[cmd](compose, project, opts);
  return shell.sh([bin].concat(run.cmd), run.opts);
};

export default (config, cache, events, log, shell, id) => {
  // get enginey stuff
  const {orchestratorBin, orchestratorVersion, dockerBin, engineConfig} = config;
  const docker = new Landerode(engineConfig, id);
  const daemon = new LandoDaemon(
    cache,
    events,
    dockerBin,
    log,
    config.process,
    orchestratorBin,
    orchestratorVersion,
    config.userConfRoot,
  );
  const compose = (cmd, datum) => dc(shell, orchestratorBin, cmd, datum);
  return new Engine(daemon, docker, compose, config);
};
