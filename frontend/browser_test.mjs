import { chromium } from 'playwright';

const BASE = 'http://localhost:4173';

async function testApp() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const errors = [];
  const consoleMessages = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });
  
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
  });
  
  page.on('crash', () => {
    errors.push('PAGE CRASHED');
  });
  
  console.log('Navigating to ' + BASE + ' ...');
  
  try {
    const response = await page.goto(BASE, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Response status:', response?.status());
    
    // Wait a bit for React to mount
    await page.waitForTimeout(3000);
    
    // Check if #root has content
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        innerHTML: root?.innerHTML?.substring(0, 500) || 'EMPTY',
        childCount: root?.children?.length || 0,
        title: document.title,
      };
    });
    
    console.log('\n=== PAGE STATE ===');
    console.log('Title:', rootContent.title);
    console.log('#root children:', rootContent.childCount);
    console.log('#root innerHTML (first 500):', rootContent.innerHTML);
    
    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(m => console.log(m));
    
    console.log('\n=== ERRORS ===');
    if (errors.length === 0) {
      console.log('NO ERRORS DETECTED');
    } else {
      errors.forEach(e => console.log(e));
    }
    
    // Try navigating to each page
    const routes = ['#/', '#/map', '#/priority', '#/historical', '#/explorer', '#/relocation', '#/methodology'];
    for (const route of routes) {
      console.log(`\n--- Navigating to ${route} ---`);
      const navErrors = [];
      
      page.on('pageerror', err => navErrors.push(err.message));
      
      try {
        await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        
        const state = await page.evaluate(() => {
          const root = document.getElementById('root');
          return {
            childCount: root?.children?.length || 0,
            hasContent: (root?.innerHTML?.length || 0) > 50,
            innerHTMLLength: root?.innerHTML?.length || 0,
          };
        });
        
        console.log(`  Children: ${state.childCount}, HasContent: ${state.hasContent}, innerHTML length: ${state.innerHTMLLength}`);
        
        if (navErrors.length > 0) {
          console.log(`  ERRORS:`, navErrors);
        }
      } catch (e) {
        console.log(`  NAVIGATION ERROR: ${e.message}`);
      }
    }
    
  } catch (e) {
    console.log('Navigation failed:', e.message);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'C:\\Users\\DELL\\OneDrive\\Documents\\Default Project\\resqmap\\frontend\\debug_screenshot.png', fullPage: true });
  console.log('\nScreenshot saved to debug_screenshot.png');
  
  await browser.close();
}

testApp().catch(e => { console.error('Fatal:', e); process.exit(1); });
