export interface HeadingItem {
  depth: number;
  valueL: string;
  anchor: string;
}

export interface MacroData {
  macro: string;
  result: string;
}

export interface ContentItem {
  id: string; // TODO???
  title: string;
  path: string;
  slug: string;
  tags: string; // TODO:??
  description: string;
  content: string;
  hasContent: boolean;
  originalPath: string;
  headings: HeadingItem[];
  macros: MacroData[];
  // TODO: type this
  // ...data,
  updatesInOriginalRepo: string;
  section: string;
  sourceLastUpdatetAt: number;
  translationLastUpdatedAt: number;
  browser_compat: unknown; // TODO::
}
