import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'https://frontend-seven-bice-roz217pfff.vercel.app';
const OUT = 'C:\\Users\\DELL\\OneDrive\\Documents\\Default Project\\resqmap\\frontend\\audit_screenshots';

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const results = [];
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 300));
  });
  page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message.substring(0, 300)));

  console.log('=== PRODUCTION FRONTEND AUDIT ===\n');
  
  const routes = [
    { hash: '', name: 'Overview' },
    { hash: '#/map', name: 'Flood Map' },
    { hash: '#/priority', name: 'Priority Analysis' },
    { hash: '#/historical', name: 'Historical Analysis' },
    { hash: '#/explorer', name: 'Habitation Explorer' },
    { hash: '#/relocation', name: 'Relocation Sites' },
    { hash: '#/methodology', name: 'Methodology' },
  ];

  for (const route of routes) {
    consoleErrors.length = 0;
    const url = route.hash ? BASE + '/' + route.hash : BASE;
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const state = await page.evaluate(() => {
        const root = document.getElementById('root');
        const text = root ? root.innerText : '';
        const hasMap = !!document.querySelector('.leaflet-container');
        const hasCharts = text.includes('chart') || !!document.querySelector('.recharts-wrapper');
        const navLinks = document.querySelectorAll('nav a, aside a');
        const hasNav = navLinks.length > 0;
        const title = document.title;
        const bodyText = text.substring(0, 500);
        
        let hasErrorBoundary = false;
        try {
          hasErrorBoundary = text.includes('React Error Caught');
        } catch(e) {}
        
        return {
          childCount: root ? root.children.length : 0,
          htmlLength: root ? root.innerHTML.length : 0,
          hasMap,
          hasCharts,
          hasNav,
          navCount: navLinks.length,
          title,
          bodyText: bodyText.substring(0, 200),
          hasErrorBoundary,
        };
      });
      
      const ok = state.htmlLength > 1000 && !state.hasErrorBoundary;
      const entry = {
        route: route.name,
        status: ok ? 'PASS' : 'FAIL',
        htmlLength: state.htmlLength,
        hasMap: state.hasMap,
        hasNav: state.hasNav,
        hasErrorBoundary: state.hasErrorBoundary,
        consoleErrors: consoleErrors.length,
        firstError: consoleErrors[0] || null,
      };
      results.push(entry);
      
      console.log((ok ? 'PASS' : 'FAIL') + '  ' + route.name.padEnd(25) + 
        ' html=' + state.htmlLength + 
        ' map=' + state.hasMap + 
        ' nav=' + state.hasNav + 
        ' errors=' + consoleErrors.length);
      
      if (consoleErrors.length > 0) {
        console.log('     ERROR: ' + consoleErrors[0]);
      }
      
      await page.screenshot({ path: OUT + '\\prod_' + route.name.replace(/\s+/g, '_').toLowerCase() + '.png', fullPage: false });
      
    } catch (e) {
      results.push({ route: route.name, status: 'FAIL', error: e.message.substring(0, 200) });
      console.log('FAIL  ' + route.name.padEnd(25) + ' ERROR: ' + e.message.substring(0, 200));
    }
  }

  console.log('\n=== INTERACTION TESTS ===\n');
  
  // Test Flood Map interactions
  console.log('--- Flood Map ---');
  await page.goto(BASE + '/#/map', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const mapState = await page.evaluate(() => {
    const toggle = document.querySelector('button');
    const leafletMap = document.querySelector('.leaflet-container');
    const markers = leafletMap ? leafletMap.querySelectorAll('.leaflet-interactive') : [];
    return {
      hasToggle: !!toggle,
      mapRendered: !!leafletMap,
      mapWidth: leafletMap ? leafletMap.offsetWidth : 0,
      mapHeight: leafletMap ? leafletMap.offsetHeight : 0,
      interactiveElements: markers.length,
    };
  });
  console.log('  Map rendered: ' + mapState.mapRendered + ' (' + mapState.mapWidth + 'x' + mapState.mapHeight + ')');
  console.log('  Interactive elements: ' + mapState.interactiveElements);
  await page.screenshot({ path: OUT + '\\interaction_floodmap.png', fullPage: false });
  
  // Test Relocation Sites interactions
  console.log('\n--- Relocation Sites ---');
  await page.goto(BASE + '/#/relocation', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const relocationState = await page.evaluate(() => {
    const leafletMap = document.querySelector('.leaflet-container');
    const circleMarkers = leafletMap ? leafletMap.querySelectorAll('circle') : [];
    const tables = document.querySelectorAll('table');
    const tableRows = tables.length > 0 ? tables[0].querySelectorAll('tbody tr').length : 0;
    const filterInputs = document.querySelectorAll('input');
    const filterSelects = document.querySelectorAll('select');
    const buttons = document.querySelectorAll('button');
    return {
      mapRendered: !!leafletMap,
      circleMarkers: circleMarkers.length,
      tables: tables.length,
      tableRows,
      filterInputs: filterInputs.length,
      filterSelects: filterSelects.length,
      buttons: buttons.length,
    };
  });
  console.log('  Map rendered: ' + relocationState.mapRendered);
  console.log('  Circle markers: ' + relocationState.circleMarkers);
  console.log('  Tables: ' + relocationState.tables + ', Rows: ' + relocationState.tableRows);
  console.log('  Filter inputs: ' + relocationState.filterInputs);
  console.log('  Filter selects: ' + relocationState.filterSelects);
  console.log('  Buttons: ' + relocationState.buttons);
  await page.screenshot({ path: OUT + '\\interaction_relocation.png', fullPage: false });
  
  // Test Priority Analysis
  console.log('\n--- Priority Analysis ---');
  await page.goto(BASE + '/#/priority', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const priorityState = await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    const tableRows = tables.length > 0 ? tables[0].querySelectorAll('tbody tr').length : 0;
    const svgs = document.querySelectorAll('svg');
    const recharts = document.querySelectorAll('.recharts-wrapper');
    return {
      tables: tables.length,
      tableRows,
      svgs: svgs.length,
      charts: recharts.length,
    };
  });
  console.log('  Tables: ' + priorityState.tables + ', Rows: ' + priorityState.tableRows);
  console.log('  Charts: ' + priorityState.charts);
  await page.screenshot({ path: OUT + '\\interaction_priority.png', fullPage: false });

  // Test Habitation Explorer
  console.log('\n--- Habitation Explorer ---');
  await page.goto(BASE + '/#/explorer', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const explorerState = await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    const tableRows = tables.length > 0 ? tables[0].querySelectorAll('tbody tr').length : 0;
    const searchInput = document.querySelector('input[type="text"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    return {
      tables: tables.length,
      tableRows,
      hasSearch: !!searchInput,
    };
  });
  console.log('  Tables: ' + explorerState.tables + ', Rows: ' + explorerState.tableRows);
  console.log('  Has search: ' + explorerState.hasSearch);
  await page.screenshot({ path: OUT + '\\interaction_explorer.png', fullPage: false });

  console.log('\n=== SUMMARY ===\n');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log('Routes: ' + passed + ' PASS, ' + failed + ' FAIL, ' + results.length + ' total');
  
  writeFileSync(OUT + '\\audit_results.json', JSON.stringify(results, null, 2));
  console.log('Results saved to audit_results.json');
  
  await browser.close();
}

audit().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
