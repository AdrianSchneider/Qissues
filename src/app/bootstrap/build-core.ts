import * as fs                 from 'fs';
import Config                  from '../services/config';
import Cache                   from '../services/cache';
import Storage                 from '../services/storage/disk';
import Logger                  from '../services/logger';
import { getLogger }           from '../services/logger';
import Container               from '../services/container';

interface Options {
  configFile: string,
  logLevel: number,
  cacheFile: string,
  clearCache: boolean,
  cachePrefix: string
}

export default function buildCore(container: Container, options: Options) {
  container.registerService(
    'logger',
    () => getLogger(options.logLevel)
  );

  container.registerService(
    'config',
    () => {
      const conf = new Config(options.configFile, fs);
      return conf.initialize();
    }
  );

  container.registerService(
    'storage',
    () => new Storage(options.cacheFile)
  );

  container.registerService(
    'cache',
    (storage: Storage) => {
      const cache = new Cache(storage, options.cachePrefix);
      if (options.clearCache) cache.invalidateAll();
      return cache;
    },
    ['storage']
  );

  return container;
};