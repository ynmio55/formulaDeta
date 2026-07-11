const endpoints = [
  '/v1/car_data',
  '/v1/championship_drivers',
  '/v1/championship_teams',
  '/v1/drivers',
  '/v1/intervals',
  '/v1/laps',
  '/v1/location',
  '/v1/meetings',
  '/v1/overtakes',
  '/v1/pit',
  '/v1/position',
  '/v1/race_control',
  '/v1/sessions',
  '/v1/session_result',
  '/v1/starting_grid',
  '/v1/stints',
  '/v1/team_radio',
  '/v1/weather'
];

async function generateSchema() {
  const schemas = {};
  for (const ep of endpoints) {
    try {
      // fetch 1 record from 2024 or latest to infer schema
      let url = `https://api.openf1.org${ep}?session_key=latest`;
      if (ep.startsWith('/v1/championship')) url = `https://api.openf1.org${ep}?meeting_key=latest`;
      if (ep === '/v1/meetings') url = `https://api.openf1.org${ep}?year=2024`;
      
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
        schemas[ep] = "No data returned for inference";
      }
    } catch (e) {
      schemas[ep] = "Error: " + e.message;
    }
  }
  require('fs').writeFileSync('api_schemas.json', JSON.stringify(schemas, null, 2));
  console.log('Schemas written to api_schemas.json');
}

generateSchema();
