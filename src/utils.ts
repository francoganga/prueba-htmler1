import fs from 'fs';
import path from 'path';
import cheerio from 'cheerio';

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
  const resolved = path.resolve(process.cwd() + '/' + outDir + '/' + dirpath);
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
  return html.replace(
    /href=("|')((?:https?:\/\/[a-z0-9.-]*)|\/[a-z0-9.]*)(\/.*)\1/gi,
    (_, coma, _g2, g3) => 'href='.concat(coma, '.', g3, coma)
  );
}

export function toFilename(url: string) {
  return url.replace(/\//gi, '_');
}

export function getDirpath(url: string) {
  return url
    .replace(/^((https?:\/\/)|\/)[a-z0-9.]*\//, '')
    .replace(/(\/.*\/).*/, (_a, b) => b);
}

export function fixLinks(html: string, base: string, section?: string) {
  const $ = cheerio.load(html);

  $('a').each(function (this: Cheerio) {
    const href = $(this).attr('href');
    if (href && href.startsWith('/index.php')) {
      $(this).attr('href', href.replace(/\/index.php\//gi, '').concat('.html'));
    }
  });

  if (typeof section !== 'undefined') {
    $('base').attr('href', path.join(base, section));
  } else {
    $('base').attr('href', base);
  }

  return $.html();
}

export function generateBase(url: URL): string {
  return url.pathname.replace(/(\/(?:[a-zA-Z0-9\._-]*\/)*).*/, (_, m1) => m1);
}
