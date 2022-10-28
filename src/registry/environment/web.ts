import { readFileSync } from 'fs';
import path from 'path';
import type Context from '../context';

import escapeHtml from '../utils/escape-html';
import convertSpacesToUnderscores from '../utils/spaces-to-underscores';

export default class WebService {
  context: Context;
  constructor(context: Context) {
    this.context = context;
  }
  /**
   * Return specific .json files from the content root
   */
  getJSONData(name: string): unknown {
    const filePath = path.join(
      this.context.registry._options.pathToOriginalContent,
      'jsondata',
      `${name}.json`,
    );
    try {
      return readJSONDataFile(filePath);
    } catch (error) {
      console.error(`Tried to read JSON from ${filePath}`, error);
      throw error;
    }
  }
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

const _readJSONDataCache = new Map<string, unknown>();
function readJSONDataFile(filePath: string): unknown {
  if (_readJSONDataCache.has(filePath)) {
    return _readJSONDataCache.get(filePath);
  }
  const payload = JSON.parse(readFileSync(filePath, 'utf-8'));
  if (process.env.NODE_ENV === 'production') {
    _readJSONDataCache.set(filePath, payload);
  }
  return payload;
}
