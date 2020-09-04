import puppeteer from 'puppeteer';
import * as utils from './utils';
import { Navigator } from './navigator';
import yargs from 'yargs';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const getLinks = utils.prepareLinkFetcher(page);

    const argv = yargs
      .usage('HTMLER \n\nUsage: $0 -u [url] [options]')
      .help('help')
      .alias('help', 'h')
      .version('version', '1.0.1')
      .alias('version', 'V')
      .options({
        url: {
          alias: 'u',
          description: '<url> Url to crawl',
          requiresArg: true,
          required: true,
        },
        output: {
          alias: 'o',
          description: '<path> path to output files',
          requiresArg: true,
          required: false,
          default: 'output',
        },
      }).argv;

    const outDir = '/'.concat(argv.output);

    if (typeof argv.url === 'string') {
      const parseUrl = argv.url.includes('http')
        ? argv.url
        : 'http://'.concat(argv.url);
      console.log(parseUrl);
      const navigator = new Navigator(getLinks, page, outDir);
      await navigator.traverse(parseUrl);
    }
    await browser.close();
  } catch (e) {
    console.error(e.message);
  }
})();
