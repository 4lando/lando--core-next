import Log from '../lib/logger.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import createDebug from './debug.js';

const debugShim = (log: Log, {namespace}: {namespace?: string} = {}) => {
  const fresh = new Log({...log.shim, extra: namespace});

  fresh.alsoSanitize(/_auth$/);
  fresh.alsoSanitize(/_authToken$/);
  fresh.alsoSanitize(/_password$/);
  fresh.alsoSanitize('forceAuth');

  const debug = Object.assign(
    (...args: unknown[]) => {
      let firstArg = args[0];
      if (typeof firstArg !== 'string') {
        args.unshift('%O');
        firstArg = '%O';
      }

      let index = 0;
      const formatted = String(firstArg).replace(/%([a-zA-Z%])/g, (match, format) => {
        if (match === '%%') return '%';
        index++;
        if (format === 'O' || format === 'o') {
          const val = args[index];
          args.splice(index, 1);
          index--;
          try {
            return JSON.stringify(val, null, 2);
          } catch {
            return String(val);
          }
        }
        if (format === 's') {
          const val = args[index];
          args.splice(index, 1);
          index--;
          return String(val);
        }
        if (format === 'd' || format === 'i') {
          const val = args[index];
          args.splice(index, 1);
          index--;
          return String(parseInt(String(val), 10));
        }
        return match;
      });

      args[0] = formatted;
      fresh.debug(args[0] as string, ...args.slice(1));
    },
    {
      enabled: true,
      namespace: namespace ?? 'lando',
      contract: function() {
 return debug;
},
      replace: function() {
 return debug;
},
      extend: (name: string) => debugShim(log, {namespace: name}),
    },
  );

  return debug;
};

export default debugShim;
