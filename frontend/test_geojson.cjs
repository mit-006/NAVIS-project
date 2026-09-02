const fs = require('fs');
const path = require('path');
try {
  const filePath = path.join(__dirname, 'public', 'data', 'preliminary_relocation_candidates.geojson');
  console.log('Looking for:', filePath);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log('GeoJSON type:', data.type);
  console.log('Feature count:', data.features.length);
  console.log('GeoJSON valid: YES');
} catch(e) {
  console.error('GeoJSON ERROR:', e.message);
}
