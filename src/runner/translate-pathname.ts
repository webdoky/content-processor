function translatePathname(
  pathname: string,
  {
    sourceLocale,
    targetLocale,
  }: { sourceLocale: string; targetLocale: string },
): string {
  return pathname
    .replace(`/${sourceLocale}/`, `/${targetLocale}/`)
    .split('#')
    .map((item, index) => (index === 0 ? `${item}/` : item))
    .join('#');
}

export default translatePathname;
