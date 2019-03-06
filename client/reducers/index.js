import { combineReducers } from 'redux';

import { auth } from './auth';
import { config } from './config';
import { deployments } from './deployments';
import { rules } from './rules';
import { resourceServers } from './resourceServers';
import { cipher } from './cipher';

export default combineReducers({
  auth,
  config,
  deployments,
  rules,
  resourceServers,
  cipher
});
