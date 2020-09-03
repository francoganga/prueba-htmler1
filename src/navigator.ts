import { Stack } from 'typescript-collections';
import { filterBy } from './utils';

interface Hash {
  [index: string]: boolean;
}

export class Navigator {
  private filter: Hash;
  private toVisit;
  private linkFetcher;
  private baseUrl;
  private count = 0;

  constructor(
    baseUrl: string,
    linkFetcher: (url: string) => Promise<string[]>
  ) {
    this.linkFetcher = linkFetcher;
    this.toVisit = new Stack<string>();
    this.filter = {};
    this.baseUrl = baseUrl;
  }

  async traverse(links?: string[]) {
    this.count += 1;
    console.log(`iteracion numbero: ${this.count}`);
    let newLinks: string[];

    // Puede haber problemas aca mas adelante
    if (!this.toVisit.peek && links && links.length > 0) {
      // Add visited links to filter
      links.map((l) => {
        this.filter[l] ||= true;
        this.toVisit.add(l);
      });
    }

    const toVisit = this.toVisit.pop()!;

    const url = toVisit ? this.baseUrl + toVisit : this.baseUrl;

    if (Object.keys(this.filter).length !== 0) {
      newLinks = filterBy(await this.linkFetcher(url), this.filter);
    } else {
      newLinks = await this.linkFetcher(url);
    }
    console.log(`On link: ${toVisit}\nlinks ${newLinks.length}`);

    // Agrego nuevos links despues de sacar el "padre"
    newLinks.map((l) => {
      this.filter[l] ||= true;
      this.toVisit.add(l);
    });

    console.log(`stack size is ${this.toVisit.size()}`);
    console.log(`filter size is ${Object.keys(this.filter).length}\n\n`);

    await this.traverse();
  }
}
