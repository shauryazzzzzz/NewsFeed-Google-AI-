import Parser from 'rss-parser';
const parser = new Parser();
try {
  const feed = await parser.parseURL('https://feeds.bbci.co.uk/news/world/rss.xml');
  console.log(feed.title);
  console.log(feed.items[0].title);
} catch(e) { console.error(e.message); }
