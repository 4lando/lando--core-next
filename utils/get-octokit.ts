
import {Octokit} from '@octokit/rest';

import {HttpsAgent} from '@npmcli/agent';

const defaults = {
  userAgent: 'Lando/unknown',
  request: {
    agent: new HttpsAgent({family: 4}),
  },
};

export default (options = {}) => new Octokit({...defaults, ...options});
