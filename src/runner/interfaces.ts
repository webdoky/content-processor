import { Heading } from '../registry/utils/find-headings';
import { ExtractedSample } from '../registry/utils/extract-live-sample';
import type { BaselineItem } from '../components/baseline/getWebFeatureStatus';

export interface IndexFileObject {
  index: MainIndexData;
  liveSamples: ExtractedSample[];
  internalDestinations: string[];
}

export interface MainIndexData {
  slug: string;
  title: string;
  pageType: string;
  path: string;
  hasContent: boolean;
}

export interface SerializedMetaMacro {
  macro: string;
  result: string;
}

export interface PageData {
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

  // data fields
  title: string;
  slug: string;
  tags: string[];
  pageType: string;
  baseline?: BaselineItem;
}
