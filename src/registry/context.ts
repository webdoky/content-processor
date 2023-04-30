import type Registry from '.';
import JsonService from './environment/json';

export interface Environment {
  browserCompat: unknown;
  specUrls?: string;
  path: string;
  slug: string;
  tags: string[];
  targetLocale: string;
  title: string;
}

export default class Context {
  env: Environment;
  json: JsonService;
  registry: Registry;

  constructor(env: Environment, registry: Registry) {
    this.env = env;
    this.registry = registry;
    this.json = new JsonService(this);
  }
}
