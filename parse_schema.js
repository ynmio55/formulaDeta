const fs = require('fs');
const html = fs.readFileSync('docs.html', 'utf8');

// The HTML structure seems to have <h2 id="endpoint-name">Endpoint Name</h2>
// followed by some text, and then a <table> where the <thead> has "Attribute", "Type", "Description"
const endpoints = [];
const h2Regex = /<h2 id=['"]([^'"]+)['"]>([^<]+)<\/h2>/gi;
let h2Match;

while ((h2Match = h2Regex.exec(html)) !== null) {
  const id = h2Match[1];
  const name = h2Match[2];
  
  // Find the next table
  const tableStartIndex = html.indexOf('<table', h2Match.index);
  const nextH2Index = html.indexOf('<h2', h2Match.index + 1);
  
  // Only parse table if it's before the next H2
  if (tableStartIndex !== -1 && (nextH2Index === -1 || tableStartIndex < nextH2Index)) {
    const tableEndIndex = html.indexOf('</table>', tableStartIndex);
    if (tableEndIndex !== -1) {
      const tableHtml = html.substring(tableStartIndex, tableEndIndex + 8);
      
      const trRegex = /<tr>([\s\S]*?)<\/tr>/gi;
      let trMatch;
      const attributes = [];
      
      while ((trMatch = trRegex.exec(tableHtml)) !== null) {
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const tds = [];
        let tdMatch;
        while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
          // Remove all HTML tags and trim
          tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
        }
        
        if (tds.length >= 3 && tds[0] !== 'Attribute') {
          attributes.push({
            name: tds[0],
            type: tds[1],
            description: tds[2].replace(/\s+/g, ' ')
          });
        }
      }
      
      if (attributes.length > 0) {
        endpoints.push({ id, name, attributes });
      }
    }
  }
}

fs.writeFileSync('schema.json', JSON.stringify(endpoints, null, 2));
console.log('Saved ' + endpoints.length + ' endpoints to schema.json');
