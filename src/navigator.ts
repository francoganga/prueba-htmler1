import { Page } from 'puppeteer';
import { Stack } from 'typescript-collections';
import {
  filterBy,
  slugify,
  extractSlug,
  extractSection,
  createDirectoryIfNotExists,
} from './utils';
import fs from 'fs';
import path from 'path';

interface Hash {
  [index: string]: boolean;
}

export class Navigator {
  private filter: Hash;
  private toVisit;
  private linkFetcher;
  private baseUrl;
  private count = 0;
  private page;

  constructor(
    baseUrl: string,
    linkFetcher: (url: string) => Promise<string[]>,
    page: Page
  ) {
    this.linkFetcher = linkFetcher;
    this.toVisit = new Stack<string>();
    this.filter = {};
    this.baseUrl = baseUrl;
    this.page = page;
  }

  async traverse(url?: string) {
    let newLinks: string[];

    // Puede haber problemas aca mas adelante
    if (url) {
      const root = await this.linkFetcher(url);

      // Add inital links to filter and stack
      root.map((l) => {
        this.filter[l] ||= true;
        this.toVisit.add(l);
      });
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
        newLinks.map((l) => {
          this.filter[l] ||= true;
          this.toVisit.add(l);
        });

        console.log(`stack size is ${this.toVisit.size()}`);
        console.log(`filter size is ${Object.keys(this.filter).length}`);

        // Create folder & replace href in generated html and save the file.
        //

        const slug = extractSlug(toVisit);

        const section = extractSection(toVisit);

        createDirectoryIfNotExists(section);

        const html = await this.page.content();

        const filename = path.resolve(__dirname + section + slug + '.html');

        fs.writeFileSync(filename, html, { encoding: 'utf8' });

        console.log(`section: ${section}\n`);
        console.log(`slug: ${slug}\n\n`);

        //createDirectoryIfNotExists(section);
      } catch (e) {
        console.error(e.message);
        //this.traverse();
      }
    }
    this.count += 1;
    await this.traverse();
  }
}
