import puppeteer from 'puppeteer';
import * as utils from './utils';
import { Navigator } from './navigator';
import yargs from 'yargs';
import fs from 'fs';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const url = 'https://www.unaj.edu.ar';
    await page.goto(url);

    const links = await page.$$eval('a', (as) =>
      as.map((a) => {
        if (a.hasAttribute('href')) {
          return a.getAttribute('href')!;
        } else {
          return '';
        }
      })
    );

    const filtered = links.filter((l) => l.includes(url));

    fs.writeFileSync('links', filtered.join('\n'));

    // const argv = yargs
    //   .usage('HTMLER \n\nUsage: $0 -u [url] [options]')
    //   .help('help')
    //   .alias('help', 'h')
    //   .version('version', '1.0.1')
    //   .alias('version', 'V')
    //   .options({
    //     url: {
    //       alias: 'u',
    //       description: '<url> Url to crawl',
    //       requiresArg: true,
    //       required: true,
    //     },
    //     output: {
    //       alias: 'o',
    //       description: '<path> path to output files',
    //       requiresArg: true,
    //       required: false,
    //       default: 'output',
    //     },
    //   }).argv;

    // const outDir = '/'.concat(argv.output);

    // if (typeof argv.url === 'string') {
    //   const parseUrl = argv.url.includes('http')
    //     ? argv.url
    //     : 'http://'.concat(argv.url);
    //   console.log(parseUrl);
    //   const navigator = new Navigator(page, outDir);
    //   await navigator.traverse(parseUrl);
    // }
    await browser.close();
  } catch (e) {
    console.error(e.message);
  }
})();
