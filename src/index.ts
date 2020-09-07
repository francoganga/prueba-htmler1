import puppeteer from 'puppeteer';
import * as utils from './utils';
import { Navigator } from './navigator';
import yargs from 'yargs';
import fs from 'fs';
import fetch from 'node-fetch';
import { slugify, extractSlug } from './utils';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    const url = 'http://campus.unaj.edu.ar';

    fs.mkdirSync(__dirname + '/assets', { recursive: true });

    console.log('inicio');
    page.on('request', async (request) => {
      try {
        const url = new URL(request.url());
        const resType = request.resourceType();
        if (resType === 'script' || resType === 'image') {
          const asset = await fetch(url);
          console.log(url.href);

          const dirpath = __dirname.concat(
            '/assets',
            url.pathname.replace(/(\/(?:[a-zA-Z0-9\._-]*\/)*).*/, (_, a) => a)
          );
          console.log(`dirpath: [${dirpath}]`);

          fs.mkdirSync(dirpath, { recursive: true });

          if (asset) {
            console.log('hay asset');
            const filePath = __dirname.concat('/assets', url.pathname);
            console.log(`filePath [${filePath}]`);

            const buffer = await asset.buffer();
            console.log(`created buffer`);

            fs.writeFileSync(filePath, buffer);
            console.log(`wrote file`);
          }
        }
        request.continue();
      } catch (e) {
        console.error(e.message);
        request.continue();
      }
    });

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 14_000 });
    console.log('cargo?');

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
    // console.log('finished');
    await browser.close();
  } catch (e) {
    console.error(e.message);
  }
})();
