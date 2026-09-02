const fs = require('fs');
const code = fs.readFileSync('dist/assets/index-C5WiNDmk.js', 'utf8');
console.log('Bundle size:', code.length, 'chars');
console.log('Contains RelocationSites:', code.includes('RelocationSites'));
console.log('Contains loadRelocationData:', code.includes('loadRelocationData'));
console.log('Contains useMap:', code.includes('useMap'));
console.log('Contains MapContainer:', code.includes('MapContainer'));
console.log('Contains createRoot:', code.includes('createRoot'));
