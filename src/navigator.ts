import { Page } from 'puppeteer';
import { Stack } from 'typescript-collections';
import {
  filterBy,
  extractSlug,
  extractSection,
  createDirectoryIfNotExists,
  linksToRelative,
  removeDuplicated
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
  private baseUrl: string | undefined;
  private count = 0;
  private page;
  private outDir: string;

  constructor(
    page: Page,
    outDir: string
  ) {
    this.toVisit = new Stack<string>();
    this.filter = {};
    this.page = page;
    this.outDir = outDir;
  }

  async traverse(url?: string) {
    let newLinks: string[];

    // Puede haber problemas aca mas adelante
    if (url) {
      let root: string[];
      try {
        root = await this.getLinks(url);

        console.log(`testing with baseurl: [${this.baseUrl!}]`)

        console.log(`Found ${root.length} initial links\n`);
        root.map((l) => {
          this.filter[l] ||= true;
          this.toVisit.add(l);
        });
      } catch (e) {
        console.error(e);
      }

      // Add inital links to filter and stack
    } else {
      const toVisit = this.toVisit.pop()!;

      //const full = this.baseUrl + toVisit;

      try {
        if (Object.keys(this.filter).length !== 0) {
          newLinks = filterBy(await this.getLinks(toVisit), this.filter);
        } else {
          newLinks = await this.getLinks(toVisit);
        }
        console.log(`Iteration number: ${this.count}`);

        console.log(`On link: ${toVisit}\nFound ${newLinks.length} links `);

        // Agrego nuevos links despues de sacar el "padre"
        if (newLinks.length > 0) {
          newLinks.map((l) => {
            this.filter[l] ||= true;
            this.toVisit.add(l);
          });
        }

        // Create folder & replace href in generated html and save the file.
        // TODO: relative links in generated html
        //
        let slug = extractSlug(toVisit);

        if (slug === '') {
          slug = 'index.html';
        }
        const section = extractSection(toVisit);
        createDirectoryIfNotExists(section, this.outDir);

        // Si es un link a una imagen descargar con fetch.
        const isImg = toVisit.match(/.*(\.(png|jpg|jpeg))$/);
        if (isImg) {
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

          const html = linksToRelative(await this.page.content());

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


  async getLinks(url: string) {

    if (this.baseUrl === undefined) {
        const response = await this.page.goto(url);

        if (response) {
          const chain = response.request().redirectChain();
          console.log(chain.length);
          const redirectUrl = chain[0].frame()?.url();
          if (redirectUrl) {
            console.log('used redirectUrl')
            this.baseUrl = redirectUrl;
            console.log(`baseurl: ${this.baseUrl}`)
          } else {
            console.log('not redirecturl')
            this.baseUrl = url;
          }
          console.log(chain[0].frame()?.url());
        }
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
        .filter((l) => l !== '')
        .filter((l) => l !== '#')
        .filter((l) => l.match(/javascript.*/) == null)
        .filter((l) => l.match(/.*pdf$/) == null)
        .filter((l) => l.match(/.*xls$/) == null)
        .filter((l) => l.match(/.*xlsx$/) == null)
        .filter((l) => l.match(/.*doc$/) == null)
        .filter((l) => l.match(/.*ppt$/) == null)
        .filter((l) => l.match(/index.php$/) == null)
        .filter((l) => l.match(/\?/) == null)
        .filter((l) => l.match(/mailto/) == null)
        .filter((l) => l.match(/.*docx$/) == null)
        .filter(l => {
          if (l.includes(this.baseUrl!)) {
            return true;
          }
        });
        return hrefs;
  }
}
