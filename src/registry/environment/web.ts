import escapeHtml from '../utils/escape-html';
import convertSpacesToUnderscores from '../utils/spaces-to-underscores';

export default class WebService {
  /**
   * Creates a link HTML
   */
  link(uri: string, text: string, title: string, target: string): string {
    const out = [`<a href="${convertSpacesToUnderscores(escapeHtml(uri))}"`];
    if (title) {
      out.push(` title="${escapeHtml(title)}"`);
    }
    if (target) {
      out.push(` target="${escapeHtml(target)}"`);
    }
    out.push('>', escapeHtml(text || uri), '</a>');
    return out.join('');
  }
}
