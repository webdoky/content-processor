// Note: this is in many ways a verbatim from https://github.com/mdn/yari
import { u } from 'unist-builder';

/**
 * Transform a Markdown code block into a <pre>.
 * Adding the highlight tags as classes
 */
export function code(h, node) {
  const value = node.value ? node.value + '\n' : '';
  const lang = node.lang?.replace(/-nolint$/, '');
  const meta = (node.meta || '').split(' ');
  const props: { className?: string | string[] } = {};

  if (lang) {
    props.className = [`language-${lang.toLowerCase()}`, ...meta];
  } else if (node.meta) {
    props.className = meta;
  }

  /*
   * Inject a <code> element so prism gets it correctly.
   */
  const code = h(node, 'code', props, [u('text', value)]);
  if (node.meta) {
    code.data = { meta: node.meta };
  }
  return h(node.position, 'pre', props, [code]);
}
