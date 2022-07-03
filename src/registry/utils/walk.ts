import { promises as fs } from 'fs';
import path from 'path';

const walk = async (dirname, deep = true) => {
  const list = await fs.readdir(dirname);
  let files = [];

  const operations = list.map(async (fileName) => {
    const resolvedFile = path.resolve(dirname, fileName);
    const fileStat = await fs.stat(resolvedFile);

    if (fileStat && fileStat.isDirectory()) {
      if (deep) {
        const innerList = await walk(resolvedFile);
        files = files.concat(innerList);
      }
    } else {
      files.push(resolvedFile);
    }
  });

  await Promise.all(operations);

  return files;
};

export default walk;
