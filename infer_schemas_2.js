const endpoints = [
  '/v1/car_data',
  '/v1/location',
  '/v1/sessions',
  '/v1/session_result',
  '/v1/starting_grid',
  '/v1/weather'
];

async function generateSchema() {
  const schemas = {};
  for (const ep of endpoints) {
    try {
      let url = `https://api.openf1.org${ep}?session_key=9159`;
      if (ep === '/v1/sessions') url = `https://api.openf1.org${ep}?meeting_key=1219`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const item = data[0];
        const types = {};
        for (const [key, value] of Object.entries(item)) {
          types[key] = typeof value;
        }
        schemas[ep] = types;
      } else {
        schemas[ep] = "Still no data";
      }
    } catch (e) {
      schemas[ep] = "Error: " + e.message;
    }
  }
  require('fs').writeFileSync('api_schemas_2.json', JSON.stringify(schemas, null, 2));
  console.log('Schemas written to api_schemas_2.json');
}

generateSchema();
