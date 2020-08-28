import puppeteer, { Browser, LaunchOptions, Page } from 'puppeteer';
import { Either, left, right } from 'fp-ts/lib/Either';

type Puppeteer = { browser: Browser; page: Page };

export async function initialize(): Promise<Either<Error, Puppeteer>> {
  let browser: Browser;
  let page: Page;

  try {
    let launchOpts: LaunchOptions = {
      headless: false,
    };

    if (process.env.FIREFOX === 'true') {
      launchOpts.product = 'firefox';
    }

    if (process.env.DOCKER === 'true') {
      launchOpts.args = [
        // Required for Docker version of Puppeteer */
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // This will write shared memory files into /tmp instead of /dev/shm, */
        // because Docker’s default for /dev/shm is 64MB */
        '--disable-dev-shm-usage',
      ];
    }

    browser = await puppeteer.launch(launchOpts);
    const browserVersion = await browser.version();
    console.log(`Started ${browserVersion}`);

    page = await browser.newPage();

    const initResponse: Puppeteer = {
      browser,
      page,
    };

    return right(initResponse);
  } catch (error) {
    return left(error);
  }
}
