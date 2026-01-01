
import remove from '../utils/remove.js';

export default async app => {
  // remove app compose directory and other things
  try {
    remove(app._dir);
  } catch {}
};
