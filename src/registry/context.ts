import type Registry from '.';
import JsonService from './environment/json';

export interface Environment {
  browserCompat: unknown;
  path: string;
  slug: string;
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

  // eslint-disable-next-line @typescript-eslint/ban-types
  callMacro(fn: Function, ...args: unknown[]): string {
    return fn.call(this, ...args);
  }
}
