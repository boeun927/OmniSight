import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

async function crawlSite(rootUrl, maxPages = 100) {
  const domain = new URL(rootUrl).hostname;
  const visited = new Set();
  const queue = [rootUrl];
  const results = [];

  while (queue.length > 0 && visited.size < maxPages) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      console.log(`Crawling: ${currentUrl}`);
      const startTime = Date.now();
      const response = await axios.get(currentUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const $ = cheerio.load(response.data);
      
      const pageInfo = {
        path: new URL(currentUrl).pathname,
        status: response.status,
        loadTime: loadTime + 's',
        brokenImg: false
      };

      // Check for broken images
      const images = [];
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
          try {
            images.push(new URL(src, currentUrl).href);
          } catch (e) {}
        }
      });

      for (const imgSrc of images.slice(0, 5)) {
        try {
          await axios.head(imgSrc, { timeout: 3000 });
        } catch (err) {
          pageInfo.brokenImg = true;
          break;
        }
      }

      results.push(pageInfo);

      // Find sub-links
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, currentUrl).href;
            const hrefUrl = new URL(absoluteUrl);
            if (hrefUrl.hostname === domain && !visited.has(absoluteUrl) && !queue.includes(absoluteUrl)) {
              queue.push(absoluteUrl);
            }
          } catch (e) {}
        }
      });
    } catch (error) {
      results.push({
        path: new URL(currentUrl).pathname,
        status: error.response ? error.response.status : 500,
        loadTime: '0.00s',
        brokenImg: false
      });
    }
  }

  return results;
}

export { crawlSite };
