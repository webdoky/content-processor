import type Registry from '.';
import WebService from './environment/web';

export interface ContextOptions {
  browserCompat: unknown;
  path: string;
  registry: Registry;
  slug: string;
  targetLocale: string;
  title: string;
}

export default class Context implements ContextOptions {
  browserCompat: unknown;
  path: string;
  registry: Registry;
  slug: string;
  targetLocale: string;
  title: string;
  web = new WebService();

  constructor({
    path,
    slug,
    title,
    registry,
    targetLocale,
    browserCompat,
  }: ContextOptions) {
    this.browserCompat = browserCompat;
    this.path = path;
    this.registry = registry;
    this.slug = slug;
    this.targetLocale = targetLocale;
    this.title = title;
  }
}
