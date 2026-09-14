import { chromium } from 'playwright';

const BASE = 'https://frontend-seven-bice-roz217pfff.vercel.app';
const VIEWPORTS = [
  { name: '360px', width: 360, height: 800 },
  { name: '390px', width: 390, height: 844 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1440px', width: 1440, height: 900 },
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
          return { htmlLen, hasErrorBoundary, overflow, scrollW, innerW };
        });
        
        const ok = state.htmlLen > 1000 && !state.hasErrorBoundary && !state.overflow;
        results.push({ viewport: vp.name, route: route.name, status: ok ? 'PASS' : 'FAIL', overflow: state.overflow, errs: errors.length });
        if (!ok) issues.push(`${vp.name}/${route.name}: overflow=${state.overflow} errBoundary=${state.hasErrorBoundary} errs=${errors.length}`);
        if (errors.length > 0) issues.push(`  console: ${errors[0]}`);
        console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${route.name.padEnd(22)} overflow=${state.overflow} errs=${errors.length}`);
      } catch (e) {
        results.push({ viewport: vp.name, route: route.name, status: 'FAIL', error: e.message.substring(0, 100) });
        issues.push(`${vp.name}/${route.name}: EXCEPTION ${e.message.substring(0, 80)}`);
        console.log(`  FAIL  ${route.name.padEnd(22)} EXCEPTION`);
      }
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
    }
    await page.close();
  }

  // Test sidebar behavior on mobile
  console.log('\n=== SIDEBAR TEST (390px) ===');
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  // Open sidebar
  const hamburger = await page.$('button[aria-label="Toggle navigation"]');
  if (hamburger) {
    await hamburger.click();
    await page.waitForTimeout(500);
    const sidebarWidth = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return aside ? aside.getBoundingClientRect().width : 0;
    });
    const viewportWidth = 390;
    const pct = ((sidebarWidth / viewportWidth) * 100).toFixed(1);
    console.log(`  Sidebar width: ${sidebarWidth}px (${pct}% of ${viewportWidth}px viewport)`);
    if (sidebarWidth > 300) issues.push(`Sidebar too wide: ${sidebarWidth}px > 300px max`);
    if (sidebarWidth / viewportWidth > 0.82) issues.push(`Sidebar takes >80% of viewport: ${pct}%`);
    
    // Check overlay exists
    const hasOverlay = await page.evaluate(() => !!document.querySelector('.fixed.inset-0.bg-black\\/30, [class*="bg-black"][class*="fixed"]'));
    console.log(`  Overlay present: ${hasOverlay}`);
    
    // Click overlay to close
    const overlay = await page.$('.fixed.inset-0');
    if (overlay) {
      await overlay.click({ position: { x: 350, y: 400 } });
      await page.waitForTimeout(300);
      const sidebarHidden = await page.evaluate(() => {
        const aside = document.querySelector('aside');
        return aside ? aside.classList.contains('-translate-x-full') : true;
      });
      console.log(`  Sidebar closed after overlay click: ${sidebarHidden}`);
    }
  }
  await page.close();

  // Test FloodMap detail panel on mobile
  console.log('\n=== FLOODMAP DETAIL PANEL TEST (390px) ===');
  const mapPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mapPage.goto(`${BASE}/#/map`, { waitUntil: 'networkidle', timeout: 30000 });
  await mapPage.waitForTimeout(3000);
  
  // Click on a polygon
  const clicked = await mapPage.evaluate(() => {
    const paths = document.querySelectorAll('.leaflet-interactive');
    if (paths.length > 0) {
      paths[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;
    }
    return false;
  });
  console.log(`  Clicked polygon: ${clicked}`);
  await mapPage.waitForTimeout(1000);
  
  // Check for bottom-sheet on mobile
  const panelInfo = await mapPage.evaluate(() => {
    const fixedEls = document.querySelectorAll('.fixed');
    let bottomSheet = null;
    fixedEls.forEach(el => {
      if (el.style && el.style.maxHeight === '60vh') bottomSheet = el;
    });
    if (bottomSheet) {
      const rect = bottomSheet.getBoundingClientRect();
      return { found: true, width: rect.width, height: rect.height, bottom: rect.bottom, viewportH: window.innerHeight };
    }
    // Check for any visible detail panel
    const panels = document.querySelectorAll('[class*="shadow-2xl"]');
    let panelRect = null;
    panels.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 100 && r.height > 100) panelRect = { width: r.width, height: r.height, top: r.top, bottom: r.bottom };
    });
    return { found: false, panel: panelRect };
  });
  console.log(`  Bottom-sheet: ${JSON.stringify(panelInfo)}`);
  if (panelInfo.found) {
    if (panelInfo.width > 390) issues.push(`Detail panel wider than viewport: ${panelInfo.width}px > 390px`);
    if (panelInfo.height > 844 * 0.65) issues.push(`Detail panel too tall: ${panelInfo.height}px > ${(844*0.65).toFixed(0)}px`);
  }
  await mapPage.close();

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
