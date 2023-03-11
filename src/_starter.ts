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
    redirectMap: {
      // some test redirects
      '/uk/docs/Web/JavaScript/Reference/Operators/Pipeline_operator':
        '/uk/docs/Web/JavaScript/Reference/Operators/',
      '/uk/docs/Web/JavaScript/Reference/Operators/Spread_operator':
        '/uk/docs/Web/JavaScript/Reference/Operators/Spread_syntax',
      '/uk/docs/Web/JavaScript/Reference/Operators/constructor':
        '/uk/docs/Web/JavaScript/Reference/Classes/constructor',
      '/uk/docs/Web/JavaScript/Reference/Operators/extends':
        '/uk/docs/Web/JavaScript/Reference/Classes/extends',
      '/uk/docs/Web/JavaScript/Reference/Operators/get':
        '/uk/docs/Web/JavaScript/Reference/Functions/get',
      '/uk/docs/Web/JavaScript/Reference/Operators/set':
        '/uk/docs/Web/JavaScript/Reference/Functions/set',
      '/uk/docs/Web/JavaScript/Reference/PaymentValidationErrors':
        '/uk/docs/Web/API/PaymentResponse/retry',
      '/uk/docs/Web/JavaScript/Reference/Properties_Index':
        '/uk/docs/Web/JavaScript/Reference',
      '/uk/docs/Web/JavaScript/Reference/Reserved_Words':
        '/uk/docs/Web/JavaScript/Reference/Lexical_grammar#Keywords',
      '/uk/docs/Web/JavaScript/Reference/Spread_operator':
        '/uk/docs/Web/JavaScript/Reference/Operators/Spread_syntax',
      '/uk/docs/Web/JavaScript/Reference/Statements/Legacy_generator_function':
        '/uk/docs/Web/JavaScript/Reference/Deprecated_and_obsolete_features',
    },
  });

  await runner.init();

  console.log('done processing files');
};

start();
