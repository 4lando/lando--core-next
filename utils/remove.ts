
import fs from 'fs';

// standardize remove func
export default path => fs.rmSync(path, {force: true, retryDelay: 201, maxRetries: 16, recursive: true});
