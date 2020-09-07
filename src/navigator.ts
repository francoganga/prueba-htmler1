import { Page } from 'puppeteer';
import { Stack } from 'typescript-collections';
import {
  filterBy,
  extractSlug,
  extractSection,
  createDirectoryIfNotExists,
  linksToRelative,
  removeDuplicated,
} from './utils';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

interface Hash {
  [index: string]: boolean;
}

export class Navigator {
  private filter: Hash;
  private toVisit;
  private baseUrl: string;
  private count = 0;
  private page;
  private outDir: string;

  constructor(page: Page, outDir: string, url: string) {
    this.toVisit = new Stack<URL>();
    this.filter = {};
    this.page = page;
    this.outDir = outDir;
    this.baseUrl = url;
  }

  async traverse(first?: boolean) {
    let newLinks: string[];

    if (first) {
      let root: string[];
      try {
        await this.downloadAssets();

        root = await this.getLinks(this.baseUrl, true);

        console.log(`testing with baseurl: [${this.baseUrl}]`);

        console.log(`Found ${root.length} initial links\n`);
        root.map((l) => {
          this.filter[l] ||= true;
          this.toVisit.add(new URL(l));
        });

        //Asdasasd

        fs.mkdirSync(path.resolve(process.cwd().concat(this.outDir)), {
          recursive: true,
        });

        const html = linksToRelative(await this.page.content());

        const filename = path.resolve(
          process.cwd().concat(this.outDir),
          'index.html'
        );

        fs.writeFileSync(filename, html, { encoding: 'utf8' });
      } catch (e) {
        if (e.code !== 'EEXIST') {
          console.error(e.message);
        }
      }

      // Add inital links to filter and stack
    } else {
      const toVisit = this.toVisit.pop()!;

      console.log(`On link: ${toVisit}`);
      //const full = this.baseUrl + toVisit;

      try {
        if (Object.keys(this.filter).length !== 0) {
          newLinks = filterBy(await this.getLinks(toVisit.href), this.filter);
        } else {
          newLinks = await this.getLinks(toVisit.href);
        }
        console.log(`Iteration number: ${this.count}`);
        console.log(`Found ${newLinks.length} links`);

        // Agrego nuevos links despues de sacar el "padre"
        if (newLinks.length > 0) {
          newLinks.map((l) => {
            this.filter[l] ||= true;
            this.toVisit.add(new URL(l));
          });
        }

        // Create folder & replace href in generated html and save the file.
        // TODO: relative links in generated html
        //
        let slug = extractSlug(toVisit.href);

        if (slug === '') {
          slug = 'index';
        }
        const section = extractSection(toVisit.href);
        createDirectoryIfNotExists(section, this.outDir);

        // Si es un link a una imagen descargar con fetch.
        const isImg = toVisit.href.match(/.*(\.(png|jpg|jpeg))$/);
        if (isImg) {
          console.log('is image');
          const imgResponse = await fetch(toVisit);
          const filename = slug.replace(/%20/gi, '-');
          const filePath = process
            .cwd()
            .concat('/', this.outDir, section, filename);
          console.log(`filePath  ${filePath}\n\n`);
          if (imgResponse) {
            const file = fs.createWriteStream(filePath);
            imgResponse.body.pipe(file);
            file.on('finish', () => {
              file.close();
            });
          }
        } else {
          console.log(`stack size is ${this.toVisit.size()}`);
          console.log(`filter size is ${Object.keys(this.filter).length}`);

          const outDir = process.cwd().concat(this.outDir);

          const html = await this.page.content();

          const filename = path.resolve(outDir + section + slug + '.html');

          fs.writeFileSync(filename, html, { encoding: 'utf8' });

          console.log(`section: ${section}\n`);
          console.log(`slug: ${slug}\n\n`);
        }
        //createDirectoryIfNotExists(section);
      } catch (e) {
        console.error(e.message);
        //this.traverse();
      }
    }
    this.count += 1;
    if (this.toVisit.size() > 0) {
      await this.traverse();
    }
  }

  async getLinks(url: string, first?: boolean) {
    if (!first) {
      await this.page.goto(url);
    }

    const [perf] = JSON.parse(
      await this.page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation');
        return JSON.stringify(perf);
      })
    );

    console.log(`time was: ${perf.responseEnd - perf.fetchStart}`);

    await this.page.setViewport({ width: 1920, height: 1080 });
    const links = await this.page.$$eval('a', (as) =>
      as.map((a) => {
        if (a.hasAttribute('href')) {
          return a.getAttribute('href')!;
        } else {
          return '';
        }
      })
    );

    const uniq = removeDuplicated(links);

    // filtrar hrefs inusables
    // TODO: Mejorar este filtrado
    const hrefs = uniq
      .filter(
        (l) =>
          l.match(/^((https?:\/\/[a-z0-9.-]*)|\/[a-z0-9.]*)(\/.*)/) !== null
      )
      .filter((l) => l !== '')
      .filter((l) => !l.includes('#'))
      .filter((l) => l.match(/javascript.*/) == null)
      .filter((l) => l.match(/.*pdf$/) == null)
      .filter((l) => l.match(/.*xls$/) == null)
      .filter((l) => l.match(/.*xlsx$/) == null)
      .filter((l) => l.match(/.*doc$/) == null)
      .filter((l) => l.match(/.*ppt$/) == null)
      .filter((l) => l.match(/index.php$/) == null)
      .filter((l) => l.match(/\?/) == null)
      .filter((l) => l.match(/mailto/) == null)
      .filter((l) => l.match(/.*docx$/) == null);

    return hrefs
      .map((l) => {
        if (l.startsWith('/')) {
          return this.baseUrl.concat(l.replace(/\/index.php/gi, ''));
        } else {
          return l;
        }
      })
      .filter((l) => l !== undefined)
      .filter((l) => l.includes(this.baseUrl));
  }

  async downloadAssets() {
    const assetsDir = path.join(process.cwd(), this.outDir, 'assets');

    fs.mkdirSync(assetsDir, { recursive: true });

    this.page.setRequestInterception(true);

    const handleRequest = async (request: any) => {
      try {
        const url = new URL(request.url());
        const resType = request.resourceType();
        if (resType === 'script' || resType === 'image') {
          const asset = await fetch(url);
          console.log(url.href);

          const dirpath = path.join(
            process.cwd(),
            this.outDir,
            'assets',
            url.pathname.replace(/(\/(?:[a-zA-Z0-9\._-]*\/)*).*/, (_, a) => a)
          );

          console.log(`dirpath: [${dirpath}]`);

          fs.mkdirSync(dirpath, { recursive: true });

          if (asset) {
            console.log('hay asset');
            // const filePath = __dirname.concat('/assets', url.pathname);
            const filePath = path.join(assetsDir, url.pathname);
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
    };

    this.page.on('request', handleRequest);

    const response = await this.page.goto(this.baseUrl, {
      waitUntil: 'networkidle0',
      timeout: 14_000,
    });

    // This should execute only one time
    this.page.removeListener('request', handleRequest);
    this.page.setRequestInterception(false);
    console.log('removed event listener and stoped request interception');

    // check for url redirect
    if (response) {
      let redirectUrl: string | undefined;
      const chain = response.request().redirectChain();
      console.log(chain.length);
      if (chain.length > 0) {
        redirectUrl = chain[0].frame()?.url();
      }
      if (redirectUrl) {
        console.log('used redirectUrl');
        this.baseUrl = redirectUrl;
        console.log(`baseurl: ${this.baseUrl}`);
      }
    }
  }
}
