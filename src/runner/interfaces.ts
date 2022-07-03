import { Heading } from '../registry/utils/find-headings';
import { ExtractedSample } from '../registry/utils/extract-live-sample';

export interface IndexFileObject {
  index: MainIndexData;
  liveSamples: ExtractedSample[];
  internalDestinations: string[];
}

export interface MainIndexData {
  slug: string;
  title: string;
  path: string;
  hasContent: boolean;
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
  sourceLastUpdatetAt?: number;
  translationLastUpdatedAt?: string;

  // data fields
  title: string;
  slug: string;
  tags: string[];
  browserCompat: string;
}
