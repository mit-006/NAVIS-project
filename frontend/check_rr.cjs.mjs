import('react-router-dom').then(m => {
  console.log('react-router-dom exports:', Object.keys(m).sort().join(', '));
}).catch(e => console.error(e.message));
