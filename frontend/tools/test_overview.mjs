import { chromium } from 'playwright';

const BASE = 'https://frontend-seven-bice-roz217pfff.vercel.app';
const VIEWPORTS = [
  { name: '360px', width: 360, height: 800 },
  { name: '390px', width: 390, height: 844 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1440px', width: 1440, height: 900 },
];
const ALL_ROUTES = [
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

  // Test all routes at all viewports
  for (const vp of VIEWPORTS) {
    console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) ===`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    
    for (const route of ALL_ROUTES) {
      const errors = [];
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text().substring(0, 200)); });
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
          return { htmlLen, hasErrorBoundary, overflow, scrollW, innerW, hasMap, hasCharts };
        });
        
        const ok = state.htmlLen > 1000 && !state.hasErrorBoundary && !state.overflow;
        results.push({ viewport: vp.name, route: route.name, status: ok ? 'PASS' : 'FAIL' });
        if (!ok) issues.push(`${vp.name}/${route.name}: overflow=${state.overflow} errBoundary=${state.hasErrorBoundary} errs=${errors.length}`);
        if (errors.length > 0) issues.push(`  console: ${errors[0]}`);
        console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${route.name.padEnd(22)} overflow=${state.overflow} map=${state.hasMap} charts=${state.hasCharts} errs=${errors.length}`);
      } catch (e) {
        results.push({ viewport: vp.name, route: route.name, status: 'FAIL' });
        issues.push(`${vp.name}/${route.name}: EXCEPTION`);
        console.log(`  FAIL  ${route.name.padEnd(22)} EXCEPTION`);
      }
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
    }
    await page.close();
  }

  // Overview-specific checks
  console.log('\n=== OVERVIEW SPECIFIC CHECKS ===');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const overviewChecks = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasHero: text.includes('Spatial Risk Overview'),
      hasStudyArea: text.includes('Kamrup Metropolitan'),
      hasFlood: text.includes('Flood'),
      has228: text.includes('228'),
      has76: text.includes('76'),
      hasMap: !!document.querySelector('.leaflet-container'),
      hasCharts: !!document.querySelector('.recharts-wrapper'),
      hasHazardIntel: text.includes('Hazard Intelligence'),
      hasDecisionIntel: text.includes('Decision Intelligence'),
      hasExploreActions: text.includes('Explore ResQMap'),
      hasDataSources: text.includes('Data Sources'),
      hasMethodology: text.includes('Methodology'),
    };
  });
  console.log('  Hero section:', overviewChecks.hasHero ? 'PASS' : 'FAIL');
  console.log('  Study area:', overviewChecks.hasStudyArea ? 'PASS' : 'FAIL');
  console.log('  Flood hazard:', overviewChecks.hasFlood ? 'PASS' : 'FAIL');
  console.log('  228 value:', overviewChecks.has228 ? 'PASS' : 'FAIL');
  console.log('  76 value:', overviewChecks.has76 ? 'PASS' : 'FAIL');
  console.log('  Map rendered:', overviewChecks.hasMap ? 'PASS' : 'FAIL');
  console.log('  Charts rendered:', overviewChecks.hasCharts ? 'PASS' : 'FAIL');
  console.log('  Hazard Intel:', overviewChecks.hasHazardIntel ? 'PASS' : 'FAIL');
  console.log('  Decision Intel:', overviewChecks.hasDecisionIntel ? 'PASS' : 'FAIL');
  console.log('  Quick Actions:', overviewChecks.hasExploreActions ? 'PASS' : 'FAIL');
  console.log('  Data Sources:', overviewChecks.hasDataSources ? 'PASS' : 'FAIL');
  
  // Check nav links
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href*="#/"]'));
    return anchors.map(a => a.getAttribute('href'));
  });
  console.log('  Nav links found:', links.length);
  
  await page.close();

  // Check non-Overview pages are unchanged
  console.log('\n=== NON-OVERVIEW PAGE CHECKS ===');
  const checkPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const route of ALL_ROUTES.filter(r => r.name !== 'Overview')) {
    const url = `${BASE}/${route.hash}`;
    await checkPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await checkPage.waitForTimeout(1500);
    const hasContent = await checkPage.evaluate(() => document.getElementById('root').innerHTML.length > 1000);
    console.log(`  ${route.name}: ${hasContent ? 'PASS (unchanged)' : 'FAIL'}`);
    if (!hasContent) issues.push(`${route.name} page appears broken`);
  }
  await checkPage.close();

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Routes: ${results.length} | PASS: ${passed} | FAIL: ${failed}`);
  if (issues.length > 0) {
    console.log('\nIssues:');
    issues.forEach(i => console.log(`  ${i}`));
  } else {
    console.log('No issues found!');
  }

  await browser.close();
}

test().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
