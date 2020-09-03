import { Page } from 'puppeteer';
import Treemodel, { Node } from 'tree-model';
import { tree } from './index';
import { Stack } from 'typescript-collections';

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

export function prepareLinkFetcher(
  page: Page
): (url: string) => Promise<string[]> {
  return async (url: string) => {
    await page.goto(url);
    await page.setViewport({ width: 1920, height: 1080 });
    const links = await page.$$eval('a', (as) =>
      as.map((a) => {
        if (a.hasAttribute('href')) {
          return a.getAttribute('href')!;
        } else {
          return '';
        }
      })
    );

    // ignorar links externos

    const uniq = removeDuplicated(links);

    // filtrar hrefs inusables
    // TODO: Mejorar este filtrado
    const hrefs = uniq
      .filter((l) => l !== '')
      .filter((l) => l !== '#')
      .filter((l) => l.match(/javascript.*/) == null)
      .filter((l) => l.match(/.*pdf$/) == null)
      .filter((l) => l.match(/.*xls$/) == null)
      .filter((l) => l.match(/.*xlsx$/) == null)
      .filter((l) => l.match(/.*doc$/) == null)
      .filter((l) => l.match(/.*ppt$/) == null)
      .filter((l) => l.match(/mailto/) == null)
      .filter((l) => l.match(/.*docx$/) == null);

    return hrefs.filter((href) => href.match(/^\/.*/) !== null);
  };
}

export function createNode(node: LinkModel): Node<LinkModel> {
  return tree.parse(node);
}

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
