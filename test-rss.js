
const rssFeeds = {
  "feeds": [
    {
      "name": "Essential Information Group (EIG)",
      "url": "https://www.eigpropertyauctions.co.uk/news/rss"
    },
    {
      "name": "BBC News (Business/UK)",
      "url": "http://feeds.bbci.co.uk/news/business/rss.xml"
    }
  ]
};

async function testRss() {
  console.log("Starting RSS Forensic Test...");
  for (const feed of rssFeeds.feeds) {
    try {
      console.log(`Fetching ${feed.name}...`);
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) {
        console.error(`FAILED: ${feed.url} returned ${response.status}`);
        continue;
      }
      const text = await response.text();
      // Using the NEW regex from the repair
      const items = text.split(/<(?:[a-z0-9]+:)?(?:item|entry)/i).slice(1, 4);
      console.log(`Found ${items.length} items.`);
      for (const item of items) {
        const titleMatch = item.match(/<(?:[a-z0-9]+:)?title[^>]*>(.*?)<\/(?:[a-z0-9]+:)?title>/i);
        if (titleMatch && titleMatch[1]) {
           const title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>?/gm, '').trim();
           console.log(`  - Title: ${title}`);
        }
      }
    } catch (e) {
      console.error(`ERROR fetching ${feed.name}:`, e.message);
    }
  }
}

testRss();
