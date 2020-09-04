import { Page } from 'puppeteer';
import { Stack } from 'typescript-collections';
import {
  filterBy,
  extractSlug,
  extractSection,
  createDirectoryIfNotExists,
  linksToRelative,
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
  private linkFetcher;
  private baseUrl: string | undefined;
  private count = 0;
  private page;
  private outDir: string;

  constructor(
    linkFetcher: (url: string) => Promise<string[]>,
    page: Page,
    outDir: string
  ) {
    this.linkFetcher = linkFetcher;
    this.toVisit = new Stack<string>();
    this.filter = {};
    this.page = page;
    this.outDir = outDir;
  }

  async traverse(url?: string) {
    let newLinks: string[];

    // Puede haber problemas aca mas adelante
    if (url) {
      this.baseUrl = url;
      let root: string[];
      try {
        root = await this.linkFetcher(url);
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

      const full = this.baseUrl + toVisit;

      try {
        if (Object.keys(this.filter).length !== 0) {
          newLinks = filterBy(await this.linkFetcher(full), this.filter);
        } else {
          newLinks = await this.linkFetcher(full);
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
        const slug = extractSlug(toVisit);
        const section = extractSection(toVisit);
        createDirectoryIfNotExists(section, this.outDir);

        // Si es un link a una imagen descargar con fetch.
        const isImg = toVisit.match(/.*(\.(png|jpg|jpeg))$/);
        if (isImg) {
          const imgResponse = await fetch(full);
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
}
