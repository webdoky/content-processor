import Registry, { RegistryInitOptions } from '../registry/index';
import rimraf from 'rimraf';
import { promises as fs } from 'fs';
import path from 'path';
import { MainIndexData, PageData } from './interfaces';
import trimHash from '../utils/trim-hash';
import translatePathname from './translate-pathname';

const mainIndexFile = 'mainIndex.json';
const articlesDir = 'files/';

const isExternalLink = (ref) =>
  ref.startsWith('http://') || ref.startsWith('https://');

interface LocalRunnerOptions {
  pathToCache: string;
}

const existingSectionsUrls = [
  '/uk/docs/web/javascript/',
  '/uk/docs/web/html/',
  '/uk/docs/web/css/',
  '/uk/docs/web/svg/',
  '/uk/docs/web/guide/',
  '/uk/docs/glossary/',
];

export type RunnerOptions = RegistryInitOptions & LocalRunnerOptions;

export default class Runner {
  sourceRegistry?: Registry;
  indexData: MainIndexData[];
  pagesData: PageData[];
  pathToCache: string;
  registryOptions: RegistryInitOptions;

  constructor(options: RunnerOptions) {
    const { pathToCache, ...registryOptions } = options;

    this.pathToCache = pathToCache;
    this.sourceRegistry = new Registry(registryOptions);
    this.indexData = [];
    this.pagesData = [];
    this.registryOptions = registryOptions;
  }

  async init() {
    const { sourceRegistry } = this;

    // Loading registry with content pages
    await sourceRegistry.init();

    await this.refreshCacheDir();

    for (const page of sourceRegistry.getPagesData()) {
      const {
        content,
        description,
        headings,
        data,
        path,
        section,
        pageType,
        updatesInOriginalRepo,
        originalPath,
        translationLastUpdatedAt,
      } = page;

      if (!headings) {
        throw new Error(`No headings for ${data.slug}`);
      }

      this.indexData.push({
        slug: data.slug || '',
        title: data.title || '',
        pageType,
        path,
        hasContent: !!content,
      });

      this.pagesData.push({
        content,
        description,
        hasContent: !!content,
        headings,
        pageType,
        ...data,
        path,
        originalPath,
        updatesInOriginalRepo,
        section,
        sourceLastUpdatedAt: 0,
        translationLastUpdatedAt,
      });
    }

    this.checkLinks();

    await this.writeMainIndex();

    await this.writeContentPages();
  }

  checkLinks(): void {
    const {
      sourceRegistry: { translatedInternalDests, unlocalizedInternalDests },
      sourceRegistry,
      registryOptions: { redirectMap = {}, sourceLocale, targetLocale },
    } = this;
    let orphanedLinksCount = 0;
    const countsByPage: { [key: string]: number } = {};
    const localeTranslationOptions = { sourceLocale, targetLocale };

    const redirects: [string, string][] = Object.entries(redirectMap)
      .filter(([from, to]) => from && to)
      .map(([from, to]) => [
        translatePathname(from, localeTranslationOptions),
        translatePathname(to, localeTranslationOptions),
      ]);

    for (const page of sourceRegistry.getPagesData()) {
      const { path, referencesAll, referencesFixable } = page;

      // Check if links in the content lead to sensible destinations
      referencesFixable?.forEach?.((refItem: string) => {
        if (
          !isExternalLink(refItem) &&
          !translatedInternalDests.has(refItem) &&
          !unlocalizedInternalDests.has(refItem) // Don't count those not translated yet
        ) {
          orphanedLinksCount++;
          console.warn(
            '\x1b[33mwarn\x1b[0m',
            `- found fixable reference: ${refItem} on page ${path}`,
          );
        }
      });

      referencesAll.forEach((refItem: string) => {
        const normalizedReference = trimHash(refItem);
        if (
          !isExternalLink(refItem) &&
          !translatedInternalDests.has(normalizedReference) &&
          !redirects.some(
            ([from, to]) =>
              from === normalizedReference && translatedInternalDests.has(to),
          )
        ) {
          const currentRefCount = countsByPage[normalizedReference] || 0;
          countsByPage[normalizedReference] = currentRefCount + 1;
        }
      });
    }

    if (orphanedLinksCount > 0) {
      console.warn(
        `\x1b[33mfound ${orphanedLinksCount} fixable orphaned reference${
          orphanedLinksCount > 1 ? 's' : ''
        } \x1b[0m`,
      );
    }

    const urlsInScope: Array<[string, number]> = Object.entries(
      countsByPage,
    ).filter(([url]) => {
      const normalizedUrl = url.toLowerCase();
      return existingSectionsUrls.some((urlPrefix) =>
        normalizedUrl.includes(urlPrefix),
      );
    });

    if (urlsInScope.length) {
      urlsInScope.sort(([_a, countA], [_b, countB]) => countB - countA);

      console.log(
        `Summary: ${urlsInScope.length} orphaned URLs found${
          urlsInScope.length > 100 ? ', showing top 100 of them' : ''
        }\n`,
        ...urlsInScope
          .slice(0, 100)
          .map(([url, count], index) => `№${index + 1}. ${url} – ${count}\n`),
      );
    }
  }

  async refreshCacheDir(): Promise<void> {
    const { pathToCache } = this;

    await new Promise((resolve) => {
      console.log('removing cache');
      rimraf(pathToCache, (anything) => resolve(anything));
    });

    try {
      await fs.access(pathToCache);
    } catch (error) {
      await fs.mkdir(pathToCache);
      console.log('cache directory created');
    }
  }

  async writeMainIndex(): Promise<void> {
    const { indexData, pathToCache, sourceRegistry } = this;
    const mainIndexFilePath = path.resolve(pathToCache, mainIndexFile);

    console.log(mainIndexFilePath, 'writing to file');
    if (indexData.length === 0) {
      throw new Error('Index is empty');
    }
    if (!indexData.some(({ hasContent }) => hasContent)) {
      throw new Error("Index doesn't have pages with content");
    }

    await fs.writeFile(
      mainIndexFilePath,
      JSON.stringify({
        index: indexData,
        liveSamples: sourceRegistry.getLiveSamples(),
        internalDestinations: Array.from(
          sourceRegistry.translatedInternalDests,
        ),
      }),
      { flag: 'w' },
    );

    console.log('wrote main index');
  }

  async writeContentPages(): Promise<void> {
    const { pagesData, pathToCache } = this;

    const slugs = pagesData.map(({ slug }) => slug);

    await Promise.all(
      slugs.map(async (slug) => {
        const directory = path.resolve(pathToCache, articlesDir, slug);
        try {
          await fs.access(directory);
        } catch (error) {
          await fs.mkdir(directory, { recursive: true });
        }
      }),
    );

    await Promise.all(
      pagesData.map(async (page) => {
        const filePath = path.resolve(
          pathToCache,
          articlesDir,
          page.slug,
          'index.json',
        );
        await fs.writeFile(filePath, JSON.stringify(page), { flag: 'w' });
      }),
    );
  }
}
