import { visit } from 'unist-util-visit';

const DISABLE_NEXT_LINE = '<!-- markdownlint-disable-next-line -->';

/**
 * Plugin to automatically add `target` and `rel` attributes to external links.
 *
 */
const cleanupCodeSamples = () => {
  return (tree) => {
    visit(
      tree,
      (node) => node.type === 'code',
      (node) => {
        if (node.value.includes('markdownlint')) {
          node.value = node.value.replace(`${DISABLE_NEXT_LINE}\n`, '');
          node.value = node.value.replace(DISABLE_NEXT_LINE, '');
        }
      },
    );
  };
};

export default cleanupCodeSamples;
