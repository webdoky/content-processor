import type Registry from '.';
import PageService from './environment/page';
import WebService from './environment/web';

export interface Environment {
  browserCompat: unknown;
  path: string;
  slug: string;
  targetLocale: string;
  title: string;
}

export default class Context {
  env: Environment;
  page: PageService;
  registry: Registry;
  web: WebService;

  constructor(env: Environment, registry: Registry) {
    this.env = env;
    this.page = new PageService(this);
    this.registry = registry;
    this.web = new WebService();
  }
}
