import { promises as fs } from 'fs';
import path from 'path';

export default async function walk(
  dirname: string,
  deep = true,
): Promise<string[]> {
  const list = await fs.readdir(dirname);
  let files = [];

  const operations = list.map(async (fileName) => {
    const resolvedFile = path.resolve(dirname, fileName);
    const fileStat = await fs.stat(resolvedFile);

    if (fileStat && fileStat.isDirectory()) {
      if (deep) {
        const innerList = await walk(resolvedFile, deep);
        files = files.concat(innerList);
      }
    } else {
      if (fileName !== 'index.md') {
        return;
      }
      files.push(resolvedFile);
    }
  });

  await Promise.all(operations);

  return files;
}
