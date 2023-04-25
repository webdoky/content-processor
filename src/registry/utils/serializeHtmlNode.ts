const attributeNames = {
  className: 'class',
  title: 'title',
};

const serializeHtmlNode = (
  attributes: Partial<HTMLElement>,
  content: string,
): string => {
  const { tagName = 'div', ...otherAttributes } = attributes;

  const htmlAttributes = Object.entries(otherAttributes).map(([key, value]) => [
    attributeNames[key] || key,
    value,
  ]);

  return `<${tagName} ${htmlAttributes
    .map(([name, value]) => `${name}="${value}"`)
    .join(' ')}>${content}</${tagName}>`;
};

export default serializeHtmlNode;
