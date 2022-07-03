const getNodeContent = (node) => {
  let textContent = '';
  const children = node.children || [];

  for (let i = 0; i < children.length; i++) {
    const childNode = children[i];
    const { value, children: nodeChildren } = childNode;
    if (value) {
      textContent += value;
    } else if (nodeChildren) {
      textContent += getNodeContent(childNode);
    }
  }

  return textContent;
};

export default getNodeContent;
