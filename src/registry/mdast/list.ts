import yariPorts from '@webdoky/yari-ports';
import { list as defaultListHandler } from 'mdast-util-to-hast/lib/handlers/list';

const { markdown: yariMarkdownUtils } = yariPorts;
// https://github.com/mdn/yari/blob/b0dbaed4bc4135b51217400f750179b4a3bebc28/markdown/m2h/handlers/dl.js
const { isDefinitionList, asDefinitionList } = yariMarkdownUtils;

export function list(h, node) {
  if (isDefinitionList(node)) {
    return asDefinitionList(h, node);
  }

  return defaultListHandler(h, node);
}
