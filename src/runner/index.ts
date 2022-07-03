import Registry, { RegistryInitOptions } from '../registry/index';
import rimraf from 'rimraf';
import { promises as fs } from 'fs';
import path from 'path';
import { MainIndexData, PageData } from './interfaces';

const mainIndexFile = 'mainIndex.json';
const articlesDir = 'files/';

const isExternalLink = (ref) =>
  ref.startsWith('http://') || ref.startsWith('https://');

interface LocalRunnerOptions {
  pathToCache: string;
}

export type RunnerOptions = RegistryInitOptions & LocalRunnerOptions;

export default class Runner {
  sourceRegistry?: Registry;
  indexData: MainIndexData[];
  pagesData: PageData[];
  pathToCache: string;

  constructor(options: RunnerOptions) {
    const { pathToCache, ...registryOptions } = options;

    this.pathToCache = pathToCache;
    this.sourceRegistry = new Registry(registryOptions);
    this.indexData = [];
    this.pagesData = [];
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
        updatesInOriginalRepo,
        originalPath,
        translationLastUpdatedAt,
      } = page;

      this.indexData.push({
        slug: data.slug || '',
        title: data.title || '',
        path,
        hasContent: !!content,
      });

      this.pagesData.push({
        content,
        description,
        hasContent: !!content,
        headings,
        ...data,
        path,
        originalPath,
        updatesInOriginalRepo,
        section,
        sourceLastUpdatetAt: 0,
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
    } = this;
    let orphanedLinksCount = 0;

    for (const page of sourceRegistry.getPagesData()) {
      const { path, references } = page;

      // Check if links in the content lead to sensible destinations
      references.forEach((refItem) => {
        if (
          !isExternalLink(refItem) &&
          !translatedInternalDests.has(refItem) &&
          !unlocalizedInternalDests.has(refItem) // Don't count those not translated yet
        ) {
          orphanedLinksCount++;
          console.warn(
            '\x1b[33mwarn\x1b[0m',
            `- found orphaned reference: ${refItem} on page ${path}`,
          );
        }
      });
    }

    if (orphanedLinksCount > 0) {
      console.warn(
        `\x1b[33mfound ${orphanedLinksCount} orphaned reference${
          orphanedLinksCount > 1 ? 's' : ''
        }\x1b[0m`,
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
