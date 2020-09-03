import puppeteer from 'puppeteer';
import * as utils from './utils';
import fs from 'fs';
import Treemodel, { Node } from 'tree-model';
import { createStringLiteral } from 'typescript';
import { LinkModel } from './utils';
import { Stack } from 'typescript-collections';
import { Navigator } from './navigator';

interface HashMap {
  [index: string]: boolean;
}

export const tree = new Treemodel();

(async () => {
  console.log(`asd`);

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const BASE_URL = 'http://wwwviejo.unaj.edu.ar';

    const getLinks = utils.prepareLinkFetcher(page);

    const navigator = new Navigator(BASE_URL, getLinks);

    const firstLinks = utils.removeDuplicated(await getLinks(BASE_URL));

    await navigator.traverse(firstLinks);

    //const links = utils.removeDuplicated(await getLinks(BASE_URL));

    //const hashmap: HashMap = {};

    ////filtrar links repetidos
    //links.map((l) => {
    //  hashmap[l] ||= true;
    //});

    // const child_url = BASE_URL + links[0];
    // const childLinks = utils.filterBy(await getLinks(child_url), hashmap);

    // // console.log(childLinks);

    // const child_url2 = BASE_URL + childLinks[0];
    // const childLinks2 = utils.filterBy(await getLinks(child_url2), hashmap);

    // console.log(childLinks2);

    //const loop = async () => {
    //  let siblingsFilter: HashMap = {};

    //  for (let child of links) {
    //    const url = BASE_URL + child;
    //    // await page.goto(BASE_URL + child.model.url);
    //    const childLinks = utils.filterBy(await getLinks(url), hashmap);

    //    const html = await page.content();

    //    const filename = utils.slugify(url).concat('.html');

    //    fs.writeFileSync(filename, html, { encoding: 'utf8' });

    //    const filtered = utils.filterBy(childLinks, siblingsFilter);

    //    console.log(`unfiltered length is ${childLinks.length}`);
    //    console.log(`filtered length is ${filtered.length}`);

    //    //filter by parent links duplicated
    //    childLinks.map((l) => {
    //      siblingsFilter[l] ||= true;
    //    });
    //  }
    //};

    // await loop();

    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
