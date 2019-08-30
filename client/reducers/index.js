import { combineReducers } from 'redux';

import { auth } from './auth';
import { config } from './config';
import { deployments } from './deployments';
import { excludes } from './excludes';
import { mappings } from './mappings';

export default combineReducers({
  auth,
  config,
  deployments,
  excludes,
  mappings
});
