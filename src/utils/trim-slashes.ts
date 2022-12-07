/**
 * Trims slashes from both ends of a string
 *
 * @param {string} s Input text, e.g. /Web/HTML/Element/
 * @returns {string} Text without slashes on ends, e.g. Web/HTML/Element
 */
export default function trimSlashes(s: string): string {
  if (!s) {
    return '';
  }
  return s.replace(/^\//, '').replace('//$/', '');
}
