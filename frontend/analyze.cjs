const fs = require('fs');
const code = fs.readFileSync('dist/assets/index-C5WiNDmk.js', 'utf8');

// Check for potential issues
console.log('=== Bundle Analysis ===');
console.log('Size:', code.length);

// Check for the NavItem with relocation
const hasRelocationNav = code.includes('/relocation');
console.log('Has /relocation route:', hasRelocationNav);

// Check for potential null access patterns  
const hasUseMap = code.includes('useMap');
console.log('Has useMap:', hasUseMap);

// Check for MapContainer
const hasMapContainer = code.includes('MapContainer');
console.log('Has MapContainer:', hasMapContainer);

// Check for CircleMarker
const hasCircleMarker = code.includes('CircleMarker');
console.log('Has CircleMarker:', hasCircleMarker);

// Check for loadRelocationData
const hasLoadRelocation = code.includes('loadRelocationData') || code.includes('tne');
console.log('Has loadRelocationData:', hasLoadRelocation);

// Check the React StrictMode / createRoot pattern
const hasCreateRoot = code.includes('createRoot');
console.log('Has createRoot:', hasCreateRoot);

// Check for the HashRouter
const hasHashRouter = code.includes('HashRouter');
console.log('Has HashRouter:', hasHashRouter);

// Check for import errors or missing modules
const hasLeafletCSS = code.includes('leaflet');
console.log('Has leaflet reference:', hasLeafletCSS);

// Check for recharts
const hasRecharts = code.includes('recharts') || code.includes('PieChart') || code.includes('BarChart');
console.log('Has recharts:', hasRecharts);

// Look for the main entry point
const hasAppLayout = code.includes('AppLayout') || code.includes('dne');
console.log('Has AppLayout:', hasAppLayout);

// Check for potential issues with the relocation page being a top-level import
const hasLazyLoad = code.includes('lazy') || code.includes('Suspense');
console.log('Has lazy/Suspense:', hasLazyLoad);

// Check the package.json for react-router-dom version
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('\n=== Dependencies ===');
console.log('react:', pkg.dependencies?.react);
console.log('react-dom:', pkg.dependencies?.['react-dom']);
console.log('react-router-dom:', pkg.dependencies?.['react-router-dom']);
console.log('leaflet:', pkg.dependencies?.leaflet);
console.log('react-leaflet:', pkg.dependencies?.['react-leaflet']);
console.log('recharts:', pkg.dependencies?.recharts);
