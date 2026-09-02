import { execSync, spawn } from 'child_process';
import http from 'http';

const PORT = 5173;

function checkServer() {
  return new Promise((resolve) => {
    http.get(`http://localhost:${PORT}`, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', () => resolve(null));
  });
}

async function main() {
  // Kill any existing process on port
  try {
    if (process.platform === 'win32') {
      execSync(`for /f "tokens=5" %a in ('netstat -aon ^| findstr :${PORT} ^| findstr LISTENING') do taskkill /F /PID %a 2>nul`, { stdio: 'ignore' });
    }
  } catch (e) {}

  console.log('Starting Vite dev server...');
  const vite = spawn('cmd', ['/c', 'cd /d "C:\\Users\\DELL\\OneDrive\\Documents\\Default Project\\resqmap\\frontend" && npx vite --port 5173 --host'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
  });

  let output = '';
  vite.stdout.on('data', (d) => {
    const s = d.toString();
    output += s;
    process.stdout.write(s);
  });
  vite.stderr.on('data', (d) => {
    const s = d.toString();
    output += s;
    process.stderr.write(s);
  });

  // Wait for the server to be ready
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const result = await checkServer();
    if (result) {
      console.log('\n\n=== Server is up ===');
      console.log('Status:', result.status);
      console.log('Body length:', result.body.length);
      console.log('Has root div:', result.body.includes('id="root"'));
      console.log('Has script tag:', result.body.includes('main.jsx'));
      console.log('\n=== Full HTML ===');
      console.log(result.body);

      // Now try to check if Vite serves the JS correctly
      http.get(`http://localhost:${PORT}/src/main.jsx`, (res2) => {
        let jsBody = '';
        res2.on('data', (chunk) => jsBody += chunk);
        res2.on('end', () => {
          console.log('\n=== main.jsx response ===');
          console.log('Status:', res2.statusCode);
          console.log('Content-Type:', res2.headers['content-type']);
          console.log('Length:', jsBody.length);
          console.log(jsBody.substring(0, 1000));
          
          // Also check for import errors by looking for the App.jsx
          http.get(`http://localhost:${PORT}/src/App.jsx`, (res3) => {
            let appBody = '';
            res3.on('data', (chunk) => appBody += chunk);
            res3.on('end', () => {
              console.log('\n=== App.jsx response ===');
              console.log('Status:', res3.statusCode);
              console.log('Length:', appBody.length);
              if (res3.statusCode !== 200) {
                console.log('BODY:', appBody.substring(0, 500));
              } else {
                console.log('First 200 chars:', appBody.substring(0, 200));
              }
              
              // Now try to load each module to check for errors
              const modules = [
                '/src/data/relocationData.js',
                '/src/pages/RelocationSites.jsx',
                '/src/pages/Overview.jsx',
                '/src/pages/FloodMap.jsx',
              ];
              let pending = modules.length;
              modules.forEach(mod => {
                http.get(`http://localhost:${PORT}${mod}`, (res4) => {
                  let modBody = '';
                  res4.on('data', (chunk) => modBody += chunk);
                  res4.on('end', () => {
                    console.log(`\n=== ${mod} ===`);
                    console.log(`Status: ${res4.statusCode}, Length: ${modBody.length}`);
                    if (res4.statusCode !== 200) {
                      console.log('ERROR:', modBody.substring(0, 500));
                    }
                    if (--pending === 0) {
                      console.log('\n\nDone. Cleaning up...');
                      vite.kill();
                      process.exit(0);
                    }
                  });
                }).on('error', (err) => {
                  console.log(`\n=== ${mod} ERROR: ${err.message} ===`);
                  if (--pending === 0) {
                    vite.kill();
                    process.exit(0);
                  }
                });
              });
            });
          });
        });
      });
      return;
    }
  }
  
  console.log('Server did not start in time');
  console.log('Output:', output);
  vite.kill();
  process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
