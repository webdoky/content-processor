import { ContentItem } from './interfaces';
import Registry, { RegistryInitOptions } from '../registry/index';
import { ExtractedSample } from '../registry/utils/extract-live-sample';

const isExternalLink = (ref) =>
  ref.startsWith('http://') || ref.startsWith('https://');

export default class ContentRegistry {
  registry = new Map<string, ContentItem>();
  sourceRegistry?: Registry;

  async init(options: RegistryInitOptions) {
    let orphanedLinksCount = 0;

    // Loading registry with content pages
    this.sourceRegistry = new Registry();
    await this.sourceRegistry.init(options);

    for (const page of this.sourceRegistry.getPagesData()) {
      const {
        content,
        description,
        headings,
        data,
        path,
        section,
        references,
        updatesInOriginalRepo,
        originalPath,
        translationLastUpdatedAt,
      } = page;

      // Check if links in the content lead to sensible destinations
      const { translatedInternalDests, unlocalizedInternalDests } =
        this.sourceRegistry;
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

      this.registry.set(data.slug, {
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

    if (orphanedLinksCount > 0) {
      console.warn(
        `\x1b[33mfound ${orphanedLinksCount} orphaned reference${
          orphanedLinksCount > 1 ? 's' : ''
        }\x1b[0m`,
      );
    }
  }

  getAll(): ContentItem[] {
    return Array.from(this.registry.values());
  }

  getBySlug(id): ContentItem {
    return this.registry.get(id);
  }

  getLiveSamples(): ExtractedSample[] {
    return Array.from(this.sourceRegistry.getLiveSamples());
  }

  getInternalDestinations(): string[] {
    return Array.from(this.sourceRegistry.translatedInternalDests);
  }
}
