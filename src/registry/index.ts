import { promises as fs } from 'fs';

import parseFrontMatter from 'gray-matter';

import {
  createHtmlParser,
  createHtmlPostProcessor,
  htmlParseAndProcess,
  htmlProcess,
  mdParseAndProcess,
} from './contentProcessors';
import Context from './context';
import { runMacros } from './macros-runner';
import extractDescription from './utils/extract-description';
import extractLiveSamples, {
  ExtractedSample,
} from './utils/extract-live-sample';
import findFragments from './utils/find-fragments';
import findHeadings from './utils/find-headings';
import findReferences from './utils/find-references';
import { getNewCommits } from './utils/git-commit-data';
import walk from './utils/walk';

/**
 * Transforms a list of paths to content files
 * into a Map of slugs to full paths
 *
 * @param {string[]} paths List of paths to content files
 * @param {string} locale Locale
 * @returns {Map<string, string>} Map of slugs to full paths
 */
const generateSlugToPathMap = (
  paths: string[],
  locale: string,
): Map<string, string> => {
  const map = new Map<string, string>();

  paths.forEach((path) => {
    const separator = `files/${locale.toLowerCase()}`;
    const localPath = path.substring(
      path.lastIndexOf(separator) + separator.length,
    );
    if (!localPath) {
      throw new Error(`Failed to get subpath for ${path}`);
    }

    map.set(localPath, path);
  });

  return map;
};

const normalizeReference = (ref = '', pagePath = '') => {
  if (ref.startsWith('#')) {
    // just anchor
    return `${pagePath}/${ref}`;
  } else if (!ref.includes('#') && !ref.endsWith('/')) {
    // add trailing slash to plain links
    return `${ref}/`;
  } else if (ref.includes('#') && !ref.includes('/#')) {
    // add slash before hash (just to simplify search for broken links)
    return ref.replace('#', '/#');
  }
  return ref;
};

const sharedHtmlParser = createHtmlParser();

export interface RegistryInitOptions {
  sourceLocale: string;
  pathToOriginalContent: string;
  targetLocale: string;
  pathToLocalizedContent: string;
}

class Registry {
  _options?: RegistryInitOptions;
  localizedContentMap?: Map<string, string>;
  contentPages = new Map();
  liveSamples?: Set<ExtractedSample> = new Set();
  existingInternalDestinations: Set<string> = new Set();
  unlocalizedInternalDests: Set<string> = new Set();
  translatedInternalDests: Set<string> = new Set();

  // counters for visual notifications
  expandedMacrosFor = 0;
  estimatedMacrosExpansionAmount = 0;
  pagePostProcessedAmount = 0;
  estimatedContentPagesAmount = 0;

  constructor(options: RegistryInitOptions) {
    this._options = options;
  }

  getPagesData() {
    return this.contentPages.values();
  }

  getPageBySlug(slug: string) {
    return this.contentPages.get(slug);
  }

  getLiveSamples() {
    return Array.from(this.liveSamples.values());
  }

  async init() {
    const {
      sourceLocale,
      pathToOriginalContent,
      targetLocale,
      pathToLocalizedContent,
    } = this._options;

    const glossarySourcePages = await walk(
      `${pathToOriginalContent}/${sourceLocale.toLowerCase()}/glossary`,
    );

    const cssSourcePages = await walk(
      `${pathToOriginalContent}/${sourceLocale.toLowerCase()}/web/css`,
    );

    const htmlSourcePages = await walk(
      `${pathToOriginalContent}/${sourceLocale.toLowerCase()}/web/html`,
    );

    const javaScriptSourcePages = await walk(
      `${pathToOriginalContent}/${sourceLocale.toLowerCase()}/web/javascript`,
    );

    const svgSourcePages = await walk(
      `${pathToOriginalContent}/${sourceLocale.toLowerCase()}/web/svg`,
    );

    const guideSourcePages = await walk(
      `${pathToOriginalContent}/${sourceLocale.toLowerCase()}/web/guide`,
    );

    const otherSourcePages = await walk(
      `${pathToOriginalContent}/${sourceLocale.toLowerCase()}/web/`,
      false,
    );

    const localizedContentPages = await walk(
      `${pathToLocalizedContent}/${targetLocale.toLowerCase()}`,
    );

    this.localizedContentMap = generateSlugToPathMap(
      localizedContentPages,
      targetLocale,
    );

    console.log('rendering pages...');
    const glossaryProcessingTasks = await this.processSection(
      glossarySourcePages,
      'glossary',
    );
    const cssProcessingTasks = await this.processSection(cssSourcePages, 'css');
    const htmlProcessingTasks = await this.processSection(
      htmlSourcePages,
      'html',
    );
    const javascriptProcessingTasks = await this.processSection(
      javaScriptSourcePages,
      'javascript',
    );
    const svgProcessingTasks = await this.processSection(svgSourcePages, 'svg');
    const guideProcessingTasks = await this.processSection(
      guideSourcePages,
      'guide',
    );
    const otherPagesProcessingTasks = await this.processSection(
      otherSourcePages,
      '',
    );
    console.table({
      'CSS Pages': cssProcessingTasks.length,
      'HTML Pages': htmlProcessingTasks.length,
      'JavaScript Pages': javascriptProcessingTasks.length,
      'SVG Pages': svgProcessingTasks.length,
      Guides: guideProcessingTasks.length,
      Glossary: glossaryProcessingTasks.length,
      'Other Pages': otherPagesProcessingTasks.length,
    });
    const aggregatedTasks = [
      ...cssProcessingTasks,
      ...htmlProcessingTasks,
      ...javascriptProcessingTasks,
      ...svgProcessingTasks,
      ...guideProcessingTasks,
      ...glossaryProcessingTasks,
      ...otherPagesProcessingTasks,
    ];
    this.estimatedContentPagesAmount = aggregatedTasks.length;
    this.estimatedMacrosExpansionAmount = aggregatedTasks.length;
    await Promise.all(aggregatedTasks);

    //
    console.log('Initial registry is ready, expanding macros:');

    for (const [slug, pageData] of this.contentPages) {
      const {
        content: rawContent,
        data,
        data: { 'browser-compat': browserCompat, title },
        path,
        hasLocalizedContent,
        ...otherPageData
      } = pageData;

      const { content, data: processedData } = runMacros(
        rawContent,
        new Context(
          {
            browserCompat,
            path,
            slug,
            targetLocale,
            title,
          },
          this,
        ),
        !hasLocalizedContent, // Don't run macros for non-localized pages
      );

      this.contentPages.set(data.slug, {
        content,
        data: {
          ...data,
          ...processedData,
        },
        path,
        hasLocalizedContent,
        ...otherPageData,
      });

      if (hasLocalizedContent) {
        this.existingInternalDestinations.add(path);
      }

      process.stdout.write(
        `${++this.expandedMacrosFor} of ${
          this.estimatedMacrosExpansionAmount
        } pages\r`,
      );
    }
    console.log(
      `Done with macros, ${this.expandedMacrosFor} processed.\nRendering pages:`,
    );

    for (const [slug, pageData] of this.contentPages) {
      const {
        hasLocalizedContent,
        content: rawContent,
        sourceType,
        ...otherPageData
      } = pageData;
      const {
        path,
        data: { 'browser-compat': browserCompat, title },
      } = pageData;

      const sourceProcessor =
        sourceType === 'html' ? this.processHtmlPage : this.processMdPage;
      const content = await sourceProcessor(rawContent);

      const {
        headings,
        fragments = new Set(),
        references = [],
        description: rawDescription,
      } = this.extractParts(content);

      const { content: processedDescription } = runMacros(
        rawDescription,
        new Context(
          {
            browserCompat,
            path,
            slug,
            targetLocale,
            title,
          },
          this,
        ),
        !hasLocalizedContent, // Don't run macros for non-localized pages
      );

      this.rememberLinkDestinations(path, fragments, hasLocalizedContent);

      // live samples
      let extractedLiveSamples = {};

      if (hasLocalizedContent) {
        const htmlAst = htmlParseAndProcess.parse(content);

        try {
          extractedLiveSamples = extractLiveSamples(htmlAst);
        } catch (error) {
          console.log('Got problem while extracting live samples for:', slug);
          throw error;
        }

        Object.values(extractedLiveSamples).forEach(
          (sample: ExtractedSample) => {
            if (!Object.values(sample.content).length) {
              console.warn(
                `\x1b[33mMissing live sample content for ${sample.id}, on ${slug} page\x1b[0m`,
              );
            }
            this.liveSamples.add(sample);
          },
        );
      }

      const normalizedReferences = hasLocalizedContent
        ? references
            .filter((item) => item !== '#on-github') // this is an external widget, unavailable in content
            .map((item: string) => normalizeReference(item, path))
        : [];

      this.contentPages.set(slug, {
        content: hasLocalizedContent ? content : '',
        hasLocalizedContent,
        headings,
        referencesAll: normalizedReferences,
        referencesFixable: normalizedReferences.filter((ref) => {
          if (ref.startsWith('http://') || ref.startsWith('http://')) {
            return true;
          }

          let [path] = ref.split('#');
          if (path.endsWith('/')) {
            path = path.slice(0, path.length - 1);
          }
          return this.existingInternalDestinations.has(path);
        }),
        description: processedDescription,
        ...otherPageData,
      });

      process.stdout.write(
        `${++this.pagePostProcessedAmount} of ${
          this.estimatedContentPagesAmount
        } pages\r`,
      );
    }

    console.log(
      `Initial registry is ready, ${this.pagePostProcessedAmount} pages processed`,
    );

    const contentfulPagesSlugs = Array.from(this.contentPages.values())
      .filter((page) => page.hasLocalizedContent)
      .map((page) => page.data.slug);

    const htmlPostProcessor = createHtmlPostProcessor({
      existingLinks: Array.from(this.existingInternalDestinations),
    });

    for (const slug of contentfulPagesSlugs) {
      const page = this.contentPages.get(slug);

      const postProcessedContent = htmlPostProcessor.processSync(page.content);

      this.contentPages.set(slug, {
        ...page,
        content: postProcessedContent.toString(),
      });
    }

    console.log(
      `Content has been rendered, ${contentfulPagesSlugs.length} pages with content processed`,
    );
  }

  async processSection(originalPaths, sectionName) {
    const { sourceLocale } = this._options;

    const mapOfOriginalContent = generateSlugToPathMap(
      originalPaths,
      sourceLocale,
    );
    const tasks = [];
    const mapEntries = Array.from(mapOfOriginalContent.entries());

    for (const [slug, path] of mapEntries) {
      if (path.slice(-2) === 'md' || path.slice(-4) === 'html') {
        // TODO: we'll need images here
        tasks.push(this.processPage(slug, mapOfOriginalContent, sectionName));
      }
    }

    return tasks;
  }

  rememberLinkDestinations(
    path: string,
    fragments: Set<string>,
    isLocalized: boolean,
  ) {
    const { translatedInternalDests, unlocalizedInternalDests } = this;

    const destinationSet = isLocalized
      ? translatedInternalDests
      : unlocalizedInternalDests;

    destinationSet.add(`${path}/`);

    fragments.forEach((id) => {
      destinationSet.add(`${path}/#${id}`);
    });
  }

  async processPage(key, mapOfOriginalContent, sectionName) {
    const { sourceLocale, targetLocale } = this._options;
    const mapOfLocalizedContent = this.localizedContentMap;
    let mdKey;
    let htmlKey;

    if (key.slice(-3) === '.md') {
      mdKey = key;
      htmlKey = `${key.slice(0, -3)}.html`;
    } else if (key.slice(-5) === '.html') {
      mdKey = `${key.slice(0, -5)}.md`;
      htmlKey = key;
    }

    // default to localized content path
    const originalFullPath =
      mapOfOriginalContent.get(htmlKey) || mapOfOriginalContent.get(mdKey);
    let path =
      mapOfLocalizedContent.get(htmlKey) || mapOfLocalizedContent.get(mdKey);
    const hasLocalizedContent = !!path || false;

    if (!path) {
      // make sure there is at least original content path, if localized one is missing
      path = originalFullPath;
    }

    const {
      content,
      data,
      sourceType,
      data: { tags = [] },
    } = await this.readContentPage(path);

    const gitUpdatesInformation = hasLocalizedContent
      ? await getNewCommits(path, this._options)
      : {};

    const { newCommits = [], lastUpdatedAt = undefined } =
      gitUpdatesInformation;

    this.contentPages.set(data.slug, {
      content,
      hasLocalizedContent,
      data,
      tags,
      path: `/${targetLocale}/docs/${data.slug}`,
      updatesInOriginalRepo: newCommits,
      section: sectionName,
      originalPath: originalFullPath.split(sourceLocale.toLowerCase())[1],
      translationLastUpdatedAt: lastUpdatedAt,
      sourceType,
    });
    process.stdout.write(
      `Processed ${this.contentPages.size} of ${this.estimatedContentPagesAmount} pages\r`,
    );
  }

  async readContentPage(path) {
    const input = await fs.readFile(path);

    const { data, content } = parseFrontMatter(input);

    return {
      content,
      data,
      sourceType: path.slice(-3) === '.md' ? 'md' : 'html',
    };
  }

  extractParts = (htmlContent: string) => {
    const htmlAst = sharedHtmlParser.parse(htmlContent);

    const headings = findHeadings(htmlAst);
    const fragments = findFragments(htmlAst);
    const references = findReferences(htmlAst);
    const description = extractDescription(htmlAst);

    return {
      headings,
      fragments,
      references,
      description,
    };
  };

  processMdPage = async (mdContent: string) => {
    const parsedInput = mdParseAndProcess.parse(mdContent);

    const linkedContentAst = await mdParseAndProcess.run(parsedInput);
    const processedRehypeAst = await htmlProcess.run(linkedContentAst as any); // TODO: type AST transformations

    return htmlProcess.stringify(processedRehypeAst as any);
  };

  // TODO: seems unused now
  async processHtmlPage(htmlContent: string) {
    const parsedInputAst = htmlParseAndProcess.parse(htmlContent);

    const linkedContentAst = await htmlParseAndProcess.run(parsedInputAst);
    const processedHtmlAst = await htmlProcess.run(linkedContentAst);

    return htmlProcess.stringify(processedHtmlAst);
  }
}

export default Registry;
