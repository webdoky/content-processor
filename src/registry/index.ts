import { promises as fs } from 'fs';

import parseFrontMatter from 'gray-matter';

import trimSlashes from '../utils/trim-slashes';

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
import { SerializedMetaMacro } from '../runner/interfaces';
import { Heading } from './utils/find-headings';
import { pick } from 'lodash-es';
import trimHash from '../utils/trim-hash';

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

const parsePageMatter = (
  input: string | Buffer,
): { content: string; data: PageFrontMatter } => {
  const { data, content } = parseFrontMatter(input);

  return {
    data: pick(data, [
      'browser-compat',
      'spec-urls',
      'title',
      'tags',
      'slug',
      'page-type',
    ]),
    content,
  };
};

const removeTrailingSlash = (url: string) =>
  url.endsWith('/') ? url.slice(0, url.length - 1) : url;

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
  redirectMap?: Record<string, string>;
}

type SourceType = 'md' | 'html';

interface PageFrontMatter {
  'browser-compat': string;
  'spec-urls': string;
  'page-type': string;
  title: string;
  tags: string[];
  slug: string;
}

// TODO: this interface definitely needs cleanup
interface InternalPageData {
  content: string;
  description: string;
  hasContent: boolean;
  headings: Heading[];
  path: string;
  originalPath: string;
  updatesInOriginalRepo: string[];
  section: string;
  sourceLastUpdatedAt?: number;
  translationLastUpdatedAt?: string;
  macros?: SerializedMetaMacro[];

  data: PageFrontMatter & {
    macros?: SerializedMetaMacro[];
  };

  // data fields
  title: string;
  slug: string;
  tags: string[];
  browserCompat: string;
  pageType: string;

  // internal fields
  hasLocalizedContent: boolean;
  referencesAll: string[];
  referencesFixable: string[];
  sourceType?: SourceType;
}

enum MetaMacros {
  cssref = 'cssref',
  jsref = 'jsref',
  jssidebar = 'jssidebar',
}

interface SidebarNavLink {
  hasLocalizedContent?: boolean;
  path: string;
  title: string;
}

interface SidebarSection {
  title: string;
  expanded: boolean;
  items?: SidebarNavLink[];
  links?: SidebarNavLink[];
  sections?: SidebarSection[];
}

type NavigationMacroData = SidebarSection[];

class Registry {
  _options?: RegistryInitOptions;
  localizedContentMap?: Map<string, string>;
  contentPages: Map<string, Partial<InternalPageData>> = new Map();
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

  #getAllSlugs() {
    return Array.from(this.contentPages.keys());
  }

  #getPagesEntries() {
    return Array.from(this.contentPages.entries());
  }

  getChildren(slug: string, includeNested = true) {
    let childrenSlugs = this.#getAllSlugs().filter(
      (slugKey) => slugKey.startsWith(slug) && slugKey !== slug,
    );
    if (!includeNested) {
      childrenSlugs = childrenSlugs.filter(
        (childSlug) => !trimSlashes(childSlug.split(slug).at(-1)).includes('/'),
      );
    }
    return childrenSlugs.map((slugKey) => this.getPageBySlug(slugKey));
  }

  getPagesData() {
    return Array.from(this.contentPages.values());
  }

  getPageBySlug(slug: string) {
    return this.contentPages.get(slug);
  }

  getLiveSamples() {
    return Array.from(this.liveSamples.values());
  }

  hasPage(slug: string, localizedOnly = false): boolean {
    if (localizedOnly) {
      const page = this.getPageBySlug(slug);
      return !!page?.hasLocalizedContent;
    }
    return this.contentPages.has(slug);
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

    const otherSourcePages = await walk(
      `${pathToOriginalContent}/${sourceLocale.toLowerCase()}/web/`,
      false,
    );

    const localizedContentPages = await walk(
      `${pathToLocalizedContent}/${targetLocale.toLowerCase()}`,
    );

    if (localizedContentPages.length === 0) {
      throw new Error('localized content not found');
    }

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
    const otherPagesProcessingTasks = await this.processSection(
      otherSourcePages,
      '',
    );
    console.table({
      'CSS Pages': cssProcessingTasks.length,
      'HTML Pages': htmlProcessingTasks.length,
      'JavaScript Pages': javascriptProcessingTasks.length,
      'SVG Pages': svgProcessingTasks.length,
      Glossary: glossaryProcessingTasks.length,
      'Other Pages': otherPagesProcessingTasks.length,
    });
    const aggregatedTasks = [
      ...cssProcessingTasks,
      ...htmlProcessingTasks,
      ...javascriptProcessingTasks,
      ...svgProcessingTasks,
      ...glossaryProcessingTasks,
      ...otherPagesProcessingTasks,
    ];
    this.estimatedContentPagesAmount = aggregatedTasks.length;
    this.estimatedMacrosExpansionAmount = aggregatedTasks.length;
    await Promise.all(aggregatedTasks);

    //
    console.log('Initial registry is ready, expanding macros:');

    for (const [slug, pageData] of this.#getPagesEntries()) {
      const {
        content: rawContent,
        data,
        data: {
          'browser-compat': browserCompat,
          tags,
          title,
          'page-type': pageType,
          'spec-urls': specUrls,
        },
        path,
        hasLocalizedContent,
        ...otherPageData
      } = pageData;

      const { content, data: processedData } = runMacros(
        rawContent,
        new Context(
          {
            browserCompat,
            specUrls,
            path,
            slug,
            tags,
            pageType,
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

    for (const [slug, pageData] of this.#getPagesEntries()) {
      const {
        hasLocalizedContent,
        content: rawContent,
        sourceType,
        ...otherPageData
      } = pageData;
      const {
        path,
        data: {
          'browser-compat': browserCompat,
          tags,
          title,
          'page-type': pageType,
        },
      } = pageData;
      const sourceProcessor =
        sourceType === 'html' ? this.processHtmlPage : this.processMdPage;
      const content = await sourceProcessor(rawContent);
      const {
        headings = [],
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
            tags,
            targetLocale,
            title,
            pageType,
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

    const contentfulPagesSlugs = this.getPagesData()
      .filter((page) => page.hasLocalizedContent)
      .map((page) => page.data.slug);

    const htmlPostProcessor = createHtmlPostProcessor({
      existingLinks: Array.from(this.existingInternalDestinations),
      redirectMap: this._options.redirectMap || {},
    });

    // post process pages' content
    for (const slug of contentfulPagesSlugs) {
      const page = this.contentPages.get(slug);

      const postProcessedContent = htmlPostProcessor.processSync(page.content);

      this.contentPages.set(slug, {
        ...page,
        content: postProcessedContent.toString(),
      });
    }

    // post process pages metadata

    const translatedPagesUrls = new Set(
      Array.from(this.translatedInternalDests.values())
        .map(trimHash)
        .map(removeTrailingSlash),
    );

    const checkNavSectionLinks = (section: SidebarSection) => {
      if (section.items) {
        section.items.forEach((navLink) => {
          const { path } = navLink;
          navLink.hasLocalizedContent = translatedPagesUrls.has(path);
        });
      }
      if (section.links) {
        section.links.forEach((navLink) => {
          const { path } = navLink;
          navLink.hasLocalizedContent = translatedPagesUrls.has(path);
        });
      }
      if (section.sections) {
        section.sections.forEach(checkNavSectionLinks);
      }
    };

    for (const page of this.getPagesData()) {
      (page.data.macros || []).forEach((metaMacroData) => {
        const { macro, result } = metaMacroData;
        if (Object.values(MetaMacros).includes(macro as MetaMacros)) {
          const structure = JSON.parse(result) as NavigationMacroData;

          structure.forEach(checkNavSectionLinks);

          metaMacroData.result = JSON.stringify(structure);
        }
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
      data: { tags = [], 'page-type': pageType, title, slug },
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
      title,
      slug,
      pageType,
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

  async readContentPage(path): Promise<{
    content: string;
    data: PageFrontMatter;
    sourceType: SourceType;
  }> {
    const input = await fs.readFile(path);

    const { data, content } = parsePageMatter(input);

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

    return htmlProcess.stringify(processedRehypeAst);
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
