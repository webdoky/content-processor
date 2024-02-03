const UKRAINIAN_URL_REGEXPS = [
  /^https?:\/\/uk\.javascript\.info/,
  /^https?:\/\/uk\.wikipedia\.org/,
  /^https?:\/\/\w+\.google\.com\/.+\?hl=uk/,
];

export default function isUrlUkrainian(url: string): boolean {
  return UKRAINIAN_URL_REGEXPS.some((regexp) => regexp.test(url));
}
