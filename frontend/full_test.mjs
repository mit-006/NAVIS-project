import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  
  let fp = join(DIST, url);
  if (!existsSync(fp) || statSync(fp).isDirectory()) {
    fp = join(DIST, 'index.html');
  }
  
  const ext = extname(fp);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  try {
    res.end(readFileSync(fp));
  } catch (e) {
    res.statusCode = 500;
    res.end('Not found');
  }
});

server.listen(0, async () => {
  const port = server.address().port;
  const BASE = `http://localhost:${port}`;
  console.log(`Server running on ${BASE}`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const allErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      allErrors.push(`CONSOLE ERROR: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    allErrors.push(`PAGE ERROR: ${error.message}\nStack: ${error.stack}`);
  });
  
  page.on('crash', () => {
    allErrors.push('PAGE CRASHED');
  });
  
  try {
    console.log('\n=== LOADING OVERVIEW (#/) ===');
    const response = await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Status:', response?.status());
    await page.waitForTimeout(3000);
    
    const state = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        childCount: root?.children?.length || 0,
        innerHTMLLength: root?.innerHTML?.length || 0,
        firstChildTag: root?.firstElementChild?.tagName || 'none',
        firstChildClasses: root?.firstElementChild?.className || '',
        title: document.title,
      };
    });
    
    console.log('Title:', state.title);
    console.log('#root children:', state.childCount);
    console.log('#root innerHTML length:', state.innerHTMLLength);
    console.log('First child tag:', state.firstChildTag);
    console.log('First child classes:', state.firstChildClasses);
    
    if (allErrors.length > 0) {
      console.log('\n=== ERRORS ON OVERVIEW ===');
      allErrors.forEach(e => console.log(e));
    }
    
    // Take screenshot
    await page.screenshot({ path: join(__dirname, 'debug_overview.png'), fullPage: true });
    
    // Now navigate to each page
    const routes = [
      { hash: '#/map', name: 'Flood Map' },
      { hash: '#/priority', name: 'Priority Analysis' },
      { hash: '#/historical', name: 'Historical Analysis' },
      { hash: '#/explorer', name: 'Habitation Explorer' },
      { hash: '#/relocation', name: 'Relocation Sites' },
      { hash: '#/methodology', name: 'Methodology' },
    ];
    
    for (const route of routes) {
      allErrors.length = 0;
      console.log(`\n=== NAVIGATING TO ${route.name} (${route.hash}) ===`);
      
      try {
        await page.goto(`${BASE}/${route.hash}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        
        const state = await page.evaluate(() => {
          const root = document.getElementById('root');
          return {
            childCount: root?.children?.length || 0,
            innerHTMLLength: root?.innerHTML?.length || 0,
            text: root?.innerText?.substring(0, 200) || '',
          };
        });
        
        console.log(`  Children: ${state.childCount}, HTML length: ${state.innerHTMLLength}`);
        console.log(`  Text preview: "${state.text.substring(0, 150)}"`);
        
        await page.screenshot({ path: join(__dirname, `debug_${route.name.replace(/\s+/g, '_').toLowerCase()}.png`), fullPage: true });
        
        if (allErrors.length > 0) {
          console.log(`  ERRORS:`);
          allErrors.forEach(e => console.log(`    ${e.substring(0, 500)}`));
        } else {
          console.log('  No errors');
        }
      } catch (e) {
        console.log(`  NAVIGATION FAILED: ${e.message.substring(0, 200)}`);
      }
    }
    
  } catch (e) {
    console.log('Test failed:', e.message);
  }
  
  await browser.close();
  server.close();
  console.log('\n=== DONE ===');
});
