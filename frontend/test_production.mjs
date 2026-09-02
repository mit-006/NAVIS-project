import { chromium } from 'playwright';

const BASE = 'https://frontend-seven-bice-roz217pfff.vercel.app';

async function testProduction() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const allErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      allErrors.push(`CONSOLE ERROR: ${msg.text().substring(0, 300)}`);
    }
  });
  
  page.on('pageerror', error => {
    allErrors.push(`PAGE ERROR: ${error.message.substring(0, 300)}\nStack: ${(error.stack || '').substring(0, 300)}`);
  });

  const routes = [
    { hash: '', name: 'Overview (#/)' },
    { hash: '#/map', name: 'Flood Map (#/map)' },
    { hash: '#/priority', name: 'Priority Analysis (#/priority)' },
    { hash: '#/historical', name: 'Historical Analysis (#/historical)' },
    { hash: '#/explorer', name: 'Habitation Explorer (#/explorer)' },
    { hash: '#/relocation', name: 'Relocation Sites (#/relocation)' },
    { hash: '#/methodology', name: 'Methodology (#/methodology)' },
  ];
  
  for (const route of routes) {
    allErrors.length = 0;
    const url = route.hash ? `${BASE}/${route.hash}` : `${BASE}/`;
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const state = await page.evaluate(() => {
        const root = document.getElementById('root');
        const text = root?.innerText || '';
        return {
          childCount: root?.children?.length || 0,
          innerHTMLLength: root?.innerHTML?.length || 0,
          hasErrorBoundary: text.includes('React Error Caught'),
          firstLineOfContent: text.split('\n').find(l => l.trim().length > 0) || '',
          title: document.title,
        };
      });
      
      const hasContent = state.innerHTMLLength > 1000 && !state.hasErrorBoundary;
      const status = hasContent ? 'PASS' : 'FAIL';
      
      console.log(`${status}  ${route.name.padEnd(40)} children=${state.childCount}  html=${state.innerHTMLLength}  ${state.hasErrorBoundary ? 'ERROR BOUNDARY' : 'OK'}`);
      
      if (state.hasErrorBoundary) {
        console.log(`       ERROR BOUNDARY TEXT: ${state.firstLineOfContent.substring(0, 200)}`);
      }
      
      if (allErrors.length > 0) {
        console.log(`       CONSOLE ERRORS (${allErrors.length}):`);
        allErrors.forEach(e => console.log(`         ${e.substring(0, 200)}`));
      }
      
      await page.screenshot({ path: `C:\\Users\\DELL\\OneDrive\\Documents\\Default Project\\resqmap\\frontend\\prod_${route.name.replace(/[^a-z]/gi, '_').toLowerCase()}.png`, fullPage: false });
      
    } catch (e) {
      console.log(`FAIL  ${route.name.padEnd(40)} NAVIGATION ERROR: ${e.message.substring(0, 200)}`);
    }
  }
  
  await browser.close();
}

testProduction().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
