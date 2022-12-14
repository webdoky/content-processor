import { readFileSync } from 'fs';

const redirectsData = readFileSync(
  'external/original-content/files/en-us/_redirects.txt',
).toString();

function translatePathname(pathname: string): string {
  return pathname
    .replace('/en-US/', '/uk/')
    .split('#')
    .map((item, index) => (index === 0 ? `${item}/` : item))
    .join('#');
}

const redirects: [string, string][] = redirectsData
  .split('\n')
  .map((line) => line.trim())
  .map((line) => line.split('\t'))
  .filter(([from, to]) => from && to)
  .map(([from, to]) => [translatePathname(from), translatePathname(to)]);

export default redirects;
