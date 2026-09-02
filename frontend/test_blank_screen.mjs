import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Serve the built dist directory on port 3333
const server = createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  
  let fp = join(DIST, url);
  if (!existsSync(fp) || statSync(fp).isDirectory()) {
    fp = join(DIST, 'index.html');
  }
  
  const ext = extname(fp);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    res.end(readFileSync(fp));
  } catch (e) {
    res.statusCode = 500;
    res.end('File not found: ' + fp);
  }
});

server.listen(3333, () => {
  console.log('Server running on http://localhost:3333');
  console.log('Fetching page...');
  
  // Fetch the page and look for JS errors
  import('http').then(({ get }) => {
    get('http://localhost:3333', (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Body length:', body.length);
        console.log('---');
        
        // Check for script tags
        const scriptMatches = body.match(/<script[^>]*src="([^"]*)"[^>]*>/g);
        console.log('Script tags found:', scriptMatches?.length || 0);
        if (scriptMatches) {
          scriptMatches.forEach(s => console.log(' ', s));
        }
        
        // Check for CSS link tags
        const cssMatches = body.match(/<link[^>]*href="([^"]*)"[^>]*>/g);
        console.log('CSS/Link tags found:', cssMatches?.length || 0);
        if (cssMatches) {
          cssMatches.forEach(s => console.log(' ', s));
        }
        
        // Check for root div
        console.log('Has #root div:', body.includes('id="root"'));
        
        // Check for crossorigin attribute
        console.log('Has crossorigin attr:', body.includes('crossorigin'));
        
        // Print first 2000 chars of HTML
        console.log('\n--- HTML (first 2000 chars) ---');
        console.log(body.substring(0, 2000));
        
        // Try fetching each JS file
        const jsFiles = body.match(/src="(\/[^"]*\.js)"/g);
        if (jsFiles) {
          console.log('\n--- Checking JS files ---');
          jsFiles.forEach(match => {
            const jsUrl = match.match(/src="([^"]*)"/)[1];
            get('http://localhost:3333' + jsUrl, (jsRes) => {
              let jsBody = '';
              jsRes.on('data', (chunk) => jsBody += chunk);
              jsRes.on('end', () => {
                console.log(`${jsUrl}: status=${jsRes.statusCode}, length=${jsBody.length}`);
                
                // Check if the JS is valid
                if (jsBody.includes('createElement') || jsBody.includes('React')) {
                  console.log(`  Contains React/createElement: YES`);
                }
                if (jsBody.includes('createRoot')) {
                  console.log(`  Contains createRoot: YES`);
                }
                if (jsBody.includes('ReactDOM')) {
                  console.log(`  Contains ReactDOM: YES`);
                }
                
                // Check for potential errors in the JS
                const errorPatterns = [
                  'Cannot find module',
                  'is not a function',
                  'is not defined',
                  'Unexpected token',
                  'import.meta',
                ];
                errorPatterns.forEach(p => {
                  if (jsBody.includes(p)) {
                    console.log(`  WARNING: Contains "${p}"`);
                  }
                });
              });
            });
          });
        }
        
        // Wait a bit then close
        setTimeout(() => {
          console.log('\nDone. Closing server.');
          server.close();
          process.exit(0);
        }, 5000);
      });
    });
  });
});
