export default function convertSpacesToUnderscores(input: string) {
  return input.split(' ').join('_');
}
