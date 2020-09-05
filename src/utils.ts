import { Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

interface Hash {
  [index: string]: boolean;
}

export interface LinkModel {
  url: string;
  links: string[];
  filter: {
    [index: string]: true;
  };
  visited: boolean;
}

export function removeDuplicated(lines: string[]) {
  let hash: Hash = {};

  return lines.filter((l) => {
    if (!hash.hasOwnProperty(l)) {
      hash[l] = true;
      return l;
    }
  });
}

export async function getRedirectUrl(url: string) {}

export function filterBy(source: string[], hash: Hash) {
  return source.filter((l) => !hash.hasOwnProperty(l));
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function extractSection(url: string): string {
  const filter = url
    .split('/')
    .filter((i) => !i.includes('php'))
    .join('/');

  const section = filter.replace(/(\/.*\/).*/, (_, match) => {
    return match;
  });
  return section;
}

export function extractSlug(url: string): string {
  const filter = url
    .split('/')
    .filter((i) => !i.includes('php'))
    .join('/');

  const slug = filter.replace(/\/.*\/(.*)/, (_, match) => {
    return match;
  });
  return slug;
}

export function createDirectoryIfNotExists(dirpath: string, outDir: string) {
  const resolved = path.resolve(process.cwd() + '/' + outDir + dirpath);
  console.log(`trying to create dir ${resolved}`);
  try {
    fs.mkdirSync(resolved, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
}

export function linksToRelative(html: string) {
  return html.replace(/href=("|')\/index.php(.*)\1/gi, (_, _2, match) =>
    'href='.concat('.', match)
  );
}
