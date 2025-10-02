const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    console.log(`CONSOLE [${msg.type()}]:`, msg.text());
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  // Visit the site
  console.log('Visiting https://cathcr.vercel.app...');
  await page.goto('https://cathcr.vercel.app', { waitUntil: 'networkidle' });

  // Wait a bit for React to render
  await page.waitForTimeout(3000);

  // Check what's in the body
  const bodyContent = await page.evaluate(() => {
    return {
      innerHTML: document.body.innerHTML.substring(0, 1000),
      rootDiv: document.getElementById('root')?.innerHTML?.substring(0, 500) || 'ROOT DIV IS EMPTY',
      backgroundColor: window.getComputedStyle(document.body).backgroundColor,
      hasScripts: document.querySelectorAll('script').length
    };
  });

  console.log('\n=== PAGE CONTENT ===');
  console.log('Body innerHTML:', bodyContent.innerHTML);
  console.log('Root div content:', bodyContent.rootDiv);
  console.log('Body background:', bodyContent.backgroundColor);
  console.log('Script tags:', bodyContent.hasScripts);

  // Take screenshot
  await page.screenshot({ path: 'deployment-screenshot.png', fullPage: true });
  console.log('\nScreenshot saved as deployment-screenshot.png');

  await browser.close();
})();
