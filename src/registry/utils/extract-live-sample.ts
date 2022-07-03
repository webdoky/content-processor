import { visit } from 'unist-util-visit';
import { HtmlNode } from './interfaces';
import { visitParents } from 'unist-util-visit-parents';

export interface ExtractedSample {
  src: string;
  id: string;
  content: {
    js?: string;
    css?: string;
    html?: string;
  };
}

const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

const sampleSpecificClassName = 'wd--live-sample';
const staticFrameIdPart = 'frame_';
const cssSampleClassName = 'language-css';
const htmlSampleClassName = 'language-html';
const jsSampleClassName = 'language-js';

const getTextContent = (node: HtmlNode) =>
  node.children
    ? node.children.reduce(
        (acc, childNode) => acc + getTextContent(childNode),
        '',
      )
    : node.value || '';

const extractSection = (siblings: HtmlNode[], currentNode: HtmlNode) => {
  const headingLevel = parseInt(currentNode.tagName.slice(1));
  if (isNaN(headingLevel)) {
    throw new Error('Incorrect starting node');
  }

  const startingIndex = siblings.indexOf(currentNode);
  if (startingIndex < 0) {
    throw new Error('Could not find starting node');
  }

  const children = [];

  for (let i = startingIndex + 1; i <= siblings.length; i++) {
    const processedNode = siblings[i];

    if (headingTags.includes(processedNode.tagName)) {
      const processedHeadingLevel = parseInt(processedNode.tagName.slice(1));

      if (processedHeadingLevel <= headingLevel) {
        break;
      }
    }

    children.push(processedNode);
  }

  return {
    type: 'element',
    tagName: 'section',
    children,
  };
};

const extractLiveSamples = (ast): { [key: string]: ExtractedSample } => {
  const collectedSamples: { [key: string]: ExtractedSample } = {};

  visit(
    ast,
    (node: HtmlNode) =>
      !!(
        node.tagName === 'iframe' &&
        node.properties?.className?.includes(sampleSpecificClassName)
      ),
    (node: HtmlNode) => {
      let id = node.properties?.id;
      const src = node.properties?.src;

      if (id && src) {
        if (id.startsWith(staticFrameIdPart)) {
          id = id.slice(staticFrameIdPart.length, id.length);
        }

        collectedSamples[id] = { id, src, content: {} };
      }
    },
  );

  if (Object.values(collectedSamples).length === 0) {
    // Don't continue if there are no samples included in the page
    return collectedSamples;
  }

  visitParents(
    ast,
    (node: HtmlNode) => !!collectedSamples[node.properties?.id],
    (node: HtmlNode, relatives: HtmlNode[]) => {
      const ancestor = relatives[relatives.length - 1];
      if (headingTags.includes(node.tagName)) {
        // Found a header. Our samples are in this section
        const { children } = ancestor;
        const section = extractSection(children, node);

        visit(
          section,
          ({ tagName, properties: { className = [] } = {} }: HtmlNode) =>
            tagName === 'pre' &&
            (className?.includes(cssSampleClassName) ||
              className?.includes(htmlSampleClassName) ||
              className?.includes(jsSampleClassName)),
          (sectionNode: HtmlNode) => {
            const {
              properties: { className },
            } = sectionNode;
            if (className.includes(cssSampleClassName)) {
              collectedSamples[node.properties.id].content.css =
                getTextContent(sectionNode);
            } else if (className.includes(htmlSampleClassName)) {
              collectedSamples[node.properties.id].content.html =
                getTextContent(sectionNode);
            } else if (className.includes(jsSampleClassName)) {
              collectedSamples[node.properties.id].content.js =
                getTextContent(sectionNode);
            }
          },
        );
      } else {
        const preElement = node.children.find(
          (node) =>
            node.tagName === 'pre' &&
            node.properties?.className.includes('html'),
        );

        if (preElement) {
          collectedSamples[node.properties.id].content.html =
            getTextContent(preElement);
        }

        // TODO: support other types of content, than just html?
      }
    },
  );

  return collectedSamples;
};

export default extractLiveSamples;
