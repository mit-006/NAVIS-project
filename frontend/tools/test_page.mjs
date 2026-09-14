import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    const content = await page.content();
    const hasRoot = content.includes('ResQMap');
    const bodyText = await page.textContent('body');
    console.log('Page loaded:', hasRoot);
    console.log('Body text (first 500):', bodyText?.substring(0, 500));
    console.log('Errors found:', errors.length);
    errors.forEach((e, i) => console.log(`Error ${i+1}:`, e));
  } catch (e) {
    console.error('Navigation error:', e.message);
    console.log('Collected errors:', errors);
    errors.forEach((e, i) => console.log(`Error ${i+1}:`, e));
  }
  
  await browser.close();
})();
