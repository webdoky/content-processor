import type Registry from '.';
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
  registry: Registry;
  web: WebService;

  constructor(env: Environment, registry: Registry) {
    this.env = env;
    this.registry = registry;
    this.web = new WebService(this);
  }
}
