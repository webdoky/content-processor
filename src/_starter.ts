import { cwd } from 'process';
import runServer from './server';

const baseDir = cwd();

runServer({
  pathToLocalizedContent: `${baseDir}/external/translated-content/files`,
  pathToOriginalContent: `${baseDir}/external/original-content/files`,
  sourceLocale: 'en-US',
  targetLocale: 'uk',
});
