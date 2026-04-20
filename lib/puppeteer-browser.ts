/**
 * Singleton Puppeteer browser — reused across PDF requests in the same
 * server process to avoid the ~2–3s cold-start cost on every print call.
 */

let browserInstance: any = null;

export async function getBrowser() {
  // Return existing browser if still connected
  if (browserInstance) {
    try {
      // Quick health check — throws if browser has crashed/closed
      await browserInstance.version();
      return browserInstance;
    } catch {
      browserInstance = null;
    }
  }

  let chromium: any;
  let puppeteer: any;

  if (process.env.NODE_ENV === 'production') {
    chromium = (await import('@sparticuz/chromium-min')).default;
    puppeteer = (await import('puppeteer-core')).default;
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    browserInstance = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(
        `https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar`
      ),
      headless: chromium.headless,
    });
  } else {
    puppeteer = (await import('puppeteer-core')).default;
    browserInstance = await puppeteer.launch({
      channel: 'chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  // Clean up reference if browser exits unexpectedly
  browserInstance.on('disconnected', () => { browserInstance = null; });

  return browserInstance;
}
