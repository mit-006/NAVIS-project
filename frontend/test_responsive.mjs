import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'https://frontend-seven-bice-roz217pfff.vercel.app';
const VIEWPORTS = [
  { name: '320px', width: 320, height: 568 },
  { name: '375px', width: 375, height: 667 },
  { name: '390px', width: 390, height: 844 },
  { name: '430px', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];
const ROUTES = [
  { hash: '', name: 'Overview' },
  { hash: '#/map', name: 'FloodMap' },
  { hash: '#/priority', name: 'PriorityAnalysis' },
  { hash: '#/historical', name: 'HistoricalAnalysis' },
  { hash: '#/explorer', name: 'HabitationExplorer' },
  { hash: '#/relocation', name: 'RelocationSites' },
  { hash: '#/methodology', name: 'Methodology' },
];

async function test() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const issues = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    
    for (const route of ROUTES) {
      const errors = [];
      const warns = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text().substring(0, 200));
        if (msg.type() === 'warning') warns.push(msg.text().substring(0, 200));
      });
      page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.substring(0, 200)));
      
      const url = route.hash ? `${BASE}/${route.hash}` : BASE;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        const state = await page.evaluate(() => {
          const root = document.getElementById('root');
          const htmlLen = root ? root.innerHTML.length : 0;
          const hasErrorBoundary = root ? root.innerText.includes('React Error Caught') : false;
          const scrollW = document.documentElement.scrollWidth;
          const innerW = window.innerWidth;
          const overflow = scrollW > innerW + 2;
          const hasMap = !!document.querySelector('.leaflet-container');
          const hasCharts = !!document.querySelector('.recharts-wrapper');
          const hasTable = !!document.querySelector('table');
          const hasSidebar = !!document.querySelector('aside');
          const focusableEls = document.querySelectorAll('button, a, input, select');
          const tooSmallEls = [];
          focusableEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0 && (rect.width < 28 || rect.height < 28)) {
              tooSmallEls.push({ tag: el.tagName, w: Math.round(rect.width), h: Math.round(rect.height) });
            }
          });
          return { htmlLen, hasErrorBoundary, overflow, scrollW, innerW, hasMap, hasCharts, hasTable, hasSidebar, tooSmallEls: tooSmallEls.slice(0, 5) };
        });
        
        const entry = {
          viewport: vp.name,
          route: route.name,
          status: (state.htmlLen > 1000 && !state.hasErrorBoundary && !state.overflow) ? 'PASS' : 'FAIL',
          htmlLen: state.htmlLen,
          overflow: state.overflow,
          scrollW: state.scrollW,
          innerW: state.innerW,
          hasMap: state.hasMap,
          hasCharts: state.hasCharts,
          hasTable: state.hasTable,
          consoleErrors: errors.length,
          tooSmall: state.tooSmallEls.length,
        };
        results.push(entry);
        
        if (state.overflow) issues.push(`${vp.name}/${route.name}: HORIZONTAL OVERFLOW (${state.scrollW} > ${state.innerW})`);
        if (state.hasErrorBoundary) issues.push(`${vp.name}/${route.name}: ERROR BOUNDARY TRIGGERED`);
        if (errors.length > 0) issues.push(`${vp.name}/${route.name}: ${errors.length} console errors`);
        if (state.tooSmallEls.length > 0) issues.push(`${vp.name}/${route.name}: ${state.tooSmallEls.length} elements below 28px touch target`);
        
        const icon = entry.status === 'PASS' ? 'PASS' : 'FAIL';
        console.log(`  ${icon}  ${route.name.padEnd(22)} overflow=${state.overflow} map=${state.hasMap} charts=${state.hasCharts} errs=${errors.length} small=${state.tooSmallEls.length}`);
        
      } catch (e) {
        results.push({ viewport: vp.name, route: route.name, status: 'FAIL', error: e.message.substring(0, 150) });
        issues.push(`${vp.name}/${route.name}: EXCEPTION - ${e.message.substring(0, 100)}`);
        console.log(`  FAIL  ${route.name.padEnd(22)} EXCEPTION: ${e.message.substring(0, 100)}`);
      }
      
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
    }
    await page.close();
  }

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${results.length} | PASS: ${passed} | FAIL: ${failed}`);
  
  if (issues.length > 0) {
    console.log('\nIssues:');
    issues.forEach(i => console.log(`  ${i}`));
  } else {
    console.log('\nNo issues found!');
  }

  writeFileSync('C:\\Users\\DELL\\OneDrive\\Documents\\Default Project\\resqmap\\frontend\\test_results.json', JSON.stringify({ results, issues }, null, 2));
  await browser.close();
}

test().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
