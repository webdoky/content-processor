import { Node } from 'unist';

export type HtmlNode = Node & {
  type: string;
  tagName?: string;
  properties?: {
    id?: string;
    className?: string[];
    src?: string;
    href?: string;
    title?: string;
  };
  value?: string;
  children?: HtmlNode[];
};
