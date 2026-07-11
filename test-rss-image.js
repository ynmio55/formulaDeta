const Parser = require('rss-parser');
const parser = new Parser();

async function run() {
  const feed = await parser.parseURL('https://www.motorsport.com/rss/f1/news/');
  console.log(JSON.stringify(feed.items[0], null, 2));
}

run();
