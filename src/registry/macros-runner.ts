import { kuma } from '@webdoky/yari-ports';
import Context from './context';
import serializeHtmlNode from './utils/serializeHtmlNode';
import { ExpungedMacroInsert } from '../components';

const { macros: Macros, parseMacroArgs, extractMacros } = kuma;

// List of macros that should be processed anyway, i.e for rendering navigation
const navigationalMacros = [
  'cssref',
  'jssidebar',
  'jsref',
  'glossarysidebar',
  'htmlsidebar',
  'svgref',
  'listsubpagesforsidebar',
];

const UNESCAPED_BACKTICK_MATCH = /([^\\])`/g;
const UNESCAPED_SINGLE_QUOTE_MATCH = /([^\\])'/g;

/**
 * Some macros, or their output may contain symbols, which may be considered
 * part of markdown syntax, so we have to additionally escape them.
 *
 * @param content string
 * @returns string
 */
const escapeMarkdownCharacters = (content: string) => {
  return content
    .replaceAll(UNESCAPED_BACKTICK_MATCH, '$1\\`')
    .replaceAll(UNESCAPED_SINGLE_QUOTE_MATCH, "$1\\'");
};

export const runMacros = (
  content: string,
  context: Context,
  navigationOnly = false,
) => {
  // const { path } = context;
  let resultContent = content;
  const recognizedMacros = extractMacros(content);
  const data = {
    macros: [],
  };
  const failedMacros = {};

  const macrosRegistry = new Macros(context);

  recognizedMacros.map((expression) => {
    const { match, functionName, args } = expression;

    if (
      !navigationOnly ||
      navigationalMacros.includes(functionName.toLowerCase())
    ) {
      let result = match; // uninterpolated macros will be visible by default
      const macroFunction = macrosRegistry.lookup(functionName);
      if (macroFunction) {
        try {
          if (args) {
            result = macroFunction(...parseMacroArgs(args));
          } else {
            result = macroFunction();
          }
        } catch (e) {
          result = match; // Do nothing
          if (failedMacros[functionName]) {
            failedMacros[functionName].count += 1;
            failedMacros[functionName].lastMessage = e?.message;
            failedMacros[functionName].lastUsedExpression = match;
          } else {
            failedMacros[functionName] = {
              count: 1,
              lastMessage: e?.message,
              lastUsedExpression: match,
            };
          }
          // throw new Error(
          //   `Error while processing page ${path} with macro {{${functionName}${
          //     args ? `(${args})` : ''
          //   }}}. Original error: ${e.message}`
          // );
        }
      } else {
        if (failedMacros[functionName]) {
          failedMacros[functionName].count += 1;
          failedMacros[functionName].lastUsedExpression = match;
        } else {
          failedMacros[functionName] = {
            count: 1,
            lastMessage: 'Macro missing',
            lastUsedExpression: match,
          };
        }
      }
      if (typeof result !== 'string') {
        // if the output is not a string, then we have to additionaly process it in the app
        // so put it into data layer instead
        data.macros.push({
          macro: functionName.toLowerCase(),
          result: JSON.stringify(result),
        });

        result = '';
      }
      resultContent = resultContent.replace(
        match,
        result !== match
          ? escapeMarkdownCharacters(result)
          : serializeHtmlNode(
              ExpungedMacroInsert,
              escapeMarkdownCharacters(result),
            ),
      );
    }
  });

  const numberOfFailedMacros = Object.keys(failedMacros).length;
  if (numberOfFailedMacros) {
    console.warn(
      `${context.env.path}: got ${numberOfFailedMacros} failed macros`,
    );
    Object.entries(failedMacros).forEach(([functionName, entry]: any) => {
      console.warn(
        `\x1b[33m${entry.count} failed ${functionName} macros, the last expression was: ${entry.lastUsedExpression}, message: ${entry.lastMessage}\x1b[0m`,
      );
    });
  }
  return {
    content: resultContent,
    data,
  };
};
