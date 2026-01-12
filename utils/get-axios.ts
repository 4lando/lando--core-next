
import axios from 'axios';

import {HttpAgent, HttpsAgent} from '@npmcli/agent';

export default (opts = {}, httpOpts = {}, httpsOpts = {}) => axios.create({
  httpAgent: new HttpAgent({family: 4, ...httpOpts}),
  httpsAgent: new HttpsAgent({family: 4, ...httpsOpts}),
  ...opts,
});
