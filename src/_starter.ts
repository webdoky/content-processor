import { cwd } from 'process';
import Runner from './runner';

const baseDir = cwd();

const start = async () => {
  const runner = new Runner({
    pathToLocalizedContent: `${baseDir}/external/translated-content/files`,
    pathToOriginalContent: `${baseDir}/external/original-content/files`,
    pathToCache: `${baseDir}/cache/`,
    sourceLocale: 'en-US',
    targetLocale: 'uk',
    redirectMap: {},
  });

  await runner.init();

  console.log('done processing files');
};

start();
