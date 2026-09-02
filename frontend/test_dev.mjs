import('http').then(({ default: http }) => {
  // Fetch the page
  http.get('http://localhost:5173/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Has root div:', data.includes('id="root"'));
      console.log('Has script tag:', data.includes('src="/src/main.jsx"'));
      console.log('HTML length:', data.length);
      
      // Now check the main.jsx module
      http.get('http://localhost:5173/src/main.jsx', (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          console.log('\nmain.jsx Status:', res2.statusCode);
          console.log('main.jsx length:', data2.length);
          console.log('Has createRoot:', data2.includes('createRoot'));
          
          // Check App.jsx module
          http.get('http://localhost:5173/src/App.jsx', (res3) => {
            let data3 = '';
            res3.on('data', chunk => data3 += chunk);
            res3.on('end', () => {
              console.log('\nApp.jsx Status:', res3.statusCode);
              console.log('App.jsx length:', data3.length);
              console.log('Has RelocationSites import:', data3.includes('RelocationSites'));
              console.log('Has /relocation route:', data3.includes('/relocation'));
              process.exit(0);
            });
          });
        });
      });
    });
  }).on('error', (e) => {
    console.error('Dev server not running:', e.message);
    process.exit(1);
  });
});
