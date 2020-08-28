import puppeteer, { Browser, Page } from 'puppeteer';
import * as utils from './utils';
import fs from 'fs';

interface Hash {
  [index: string]: boolean;
}

(async () => {
  console.log(`asd`);

  try {
    const browser = await puppeteer.launch();
    console.log(`did init`);
    const page = await browser.newPage();
    console.log(`navia`);

    const BASE_URL = 'http://wwwviejo.unaj.edu.ar';

    await page.goto(BASE_URL);
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

    //diferenciar entre relativos y externos

    const uniq = utils.removeDuplicated(links);
    console.log(uniq.length);

    // filtrar hrefs inusables
    const hrefs = uniq
      .filter((l) => l !== '')
      .filter((l) => l !== '#')
      .filter((l) => l.match(/javascript.*/) == null);

    const relativos = hrefs.filter((href) => href.match(/^\/.*/) !== null);

    //TODO: filtrar links no relativos hacia la misma pagina
    // ej: 'http://wwwviejo.unaj.edu.ar'
    const externos = hrefs.filter((href) => href.match(/^\/.*/) == null);
    console.log(`relativos: ${relativos.length}`);
    console.log(`externos: ${externos.length}`);
    console.log(externos);
    fs.writeFileSync('relativos', relativos.join('\n'), { encoding: 'utf8' });

    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
