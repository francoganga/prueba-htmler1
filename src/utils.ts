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
    .replace(/\//gi, '-')
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function extractSection(url: string): string {
  const filterDomain = url.replace(
    /^((https?:\/\/[a-z0-9.-]*)|\/[a-z0-9.]*)(\/.*)/,
    (_full, _, _2, last) => {
      return last;
    }
  );

  return filterDomain.replace(
    /(^\/[a-z0-9-.]*\/(?:[a-z0-9-.]*\/)*)(.*)/,
    (_full, first) => {
      return first;
    }
  );
}

export function extractSlug(url: string): string {
  const filterDomain = url.replace(
    /^((https?:\/\/[a-z0-9.-]*)|\/[a-z0-9.]*)(\/.*)/,
    (_full, _, _2, last) => {
      return last;
    }
  );

  return filterDomain.replace(
    /(^\/[a-z0-9-.]*\/(?:[a-z0-9-.]*\/)*)(.*)/,
    (_full, _, last) => {
      return last;
    }
  );
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
  const hrefs = html.replace(
    /href=("|')((?:https?:\/\/[a-z0-9.-]*)|\/[a-z0-9.]*)(\/.*)\1/gi,
    (_, coma, _g2, g3) => 'href='.concat(coma, '.', g3, coma)
  );

  const scripts = hrefs.replace(
    /(<script(?:\stype="text\/javascript")?\ssrc=")((?:https?:\/\/[a-z0-9.-]*)|\/[a-z0-9.]*)(\/.*)("><\/script>)/gi,
    (_, g1, _g2, g3, g4) => {
      return g1.concat('./', 'assets', g3, g4);
    }
  );

  return scripts;
}
