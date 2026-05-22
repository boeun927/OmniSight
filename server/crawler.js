import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

function resolveJavascriptLink(href) {
  // 1. link(idx, num)
  let m = href.match(/link\((\d+)\s*,\s*(\d+)\)/);
  if (m) {
    const idx = parseInt(m[1]);
    const num = parseInt(m[2]);
    const linkArray = [
      ["/"],
      ["ceo" , "history" , "vision" , "ci" , "map"],
      ["business_intro" , "business_biz" ,"business_om" ,"", "02_01_0031","02_02_0011","02_02_0011", "02_02_0021", "02_02_0031"],
      ["ethical_management" , "safety_health", "", "esg_data"],
      ["invest_news", "statement_financial_position" , "" ],
      ["invest_news", "", "marketing_materials"],
      ["personnel_system", ""],
    ];
    if (linkArray[idx] && linkArray[idx][num]) {
      const chk = linkArray[idx][num];
      return idx === 0 ? chk : `/sub.do?MENUID=${chk}&MENUNO=${idx}`;
    }
  }

  // 2. linkBBS(idx, num, 'bbsNo')
  m = href.match(/linkBBS\((\d+)\s*,\s*(\d+)\s*,\s*['"]([^'"]+)['"]\)/);
  if (m) {
    const idx = parseInt(m[1]);
    const num = parseInt(m[2]);
    const bbsNo = m[3];
    const linkArray = [
      ["/"],
      ["ceo" , "history" , "vision" , "ci" , "map"],
      ["business_intro" , "business_biz" ,"business_om" ,"", "02_01_0031","02_02_0011","02_02_0011", "02_02_0021", "02_02_0031"],
      ["ethical_management" , "safety_health", "", "esg_data"],
      ["invest_news", "statement_financial_position" , "" ],
      ["invest_news", "", "marketing_materials"],
      ["personnel_system", ""],
    ];
    if (linkArray[idx] && linkArray[idx][num]) {
      const chk = linkArray[idx][num];
      return idx === 0 ? chk : `/bbs/data/bbsDataList.do?MENUID=${chk}&MENUNO=${idx}&bbsNo=${bbsNo}`;
    }
  }

  // 3. linkBusiness(idx, num)
  m = href.match(/linkBusiness\((\d+)\s*,\s*(\d+)\)/);
  if (m) {
    const idx = parseInt(m[1]);
    const num = parseInt(m[2]);
    if (idx === 2) {
      if (num === 1) {
        return `/env/bsnsintrcn/bsnsintrcnList.do?MENUNO=2&SUB_MENUNO=2&searchBsnsintrcnCode=A012001&searchClCode=A012003&ctgryNo=1`;
      }
      if (num === 2) {
        return `/env/bsnsintrcn/bsnsintrcnList.do?MENUNO=2&SUB_MENUNO=2&searchBsnsintrcnCode=A012001&searchClCode=A012003&ctgryNo=`;
      }
      if (num === 3) {
        return `/env/bsnsintrcn/bsnsintrcnList.do?MENUNO=2&SUB_MENUNO=3&searchBsnsintrcnCode=A012002&searchClCode=A012009&ctgryNo=`;
      }
    }
  }

  // 4. linkCarbon(idx, num)
  m = href.match(/linkCarbon\((\d+)\s*,\s*(\d+)\)/);
  if (m) {
    const idx = parseInt(m[1]);
    const num = parseInt(m[2]);
    if (idx === 3 && num === 3) {
      return `/env/carbonReduc/carbonReducDtl.do?MENUID=3&SUB_MENUNO=3`;
    }
  }

  return null;
}

async function crawlSite(rootUrl, maxPages = 300) {
  let normalizedRoot = rootUrl.replace(/;jsessionid=[^?#]+/i, '');
  if (!normalizedRoot.endsWith('/') && !normalizedRoot.split('/').pop().includes('.')) {
    normalizedRoot += '/';
  }

  const domain = new URL(normalizedRoot).hostname;
  const visited = new Set();
  const queue = [normalizedRoot];
  const results = [];

  // 제외할 확장자 목록
  const IGNORED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.zip', '.tar', '.gz'];

  // 3. 만약 renewus.co.kr 이라면, menu.json을 백엔드에서 미리 당겨와서 자바스크립트 수집 큐를 미리 충전해 줍니다.
  if (domain.includes('renewus.co.kr')) {
    try {
      console.log('[Crawler] Special preload for Renewus menu.json...');
      const menuRes = await axios.get('https://www.renewus.co.kr/resources/service/env/json/menu.json', { 
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (menuRes.data && menuRes.data.category) {
        const resolveAndQueue = (urlStr) => {
          if (urlStr) {
            if (urlStr.startsWith('javascript:')) {
              const resolved = resolveJavascriptLink(urlStr);
              if (resolved) {
                const fullUrl = new URL(resolved, 'https://www.renewus.co.kr').href;
                if (!visited.has(fullUrl) && !queue.includes(fullUrl)) {
                  queue.push(fullUrl);
                }
              }
            } else if (urlStr.startsWith('http') && urlStr.includes(domain)) {
              if (!visited.has(urlStr) && !queue.includes(urlStr)) {
                queue.push(urlStr);
              }
            } else if (urlStr.startsWith('/') && !urlStr.startsWith('//')) {
              const fullUrl = new URL(urlStr, 'https://www.renewus.co.kr').href;
              if (!visited.has(fullUrl) && !queue.includes(fullUrl)) {
                queue.push(fullUrl);
              }
            }
          }
        };

        menuRes.data.category.forEach(cat => {
          resolveAndQueue(cat.url);
          if (cat.twoDepth) {
            cat.twoDepth.forEach(sub => {
              resolveAndQueue(sub.url);
            });
          }
        });
      }
    } catch (e) {
      console.error('[Crawler] Failed to preload Renewus menu.json:', e.message);
    }
  }

  while (queue.length > 0 && visited.size < maxPages) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      console.log(`[Crawler] Crawling: ${currentUrl}`);
      const startTime = Date.now();
      const response = await axios.get(currentUrl, { 
        timeout: 10000, 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        } 
      });
      const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
      const $ = cheerio.load(response.data);
      
      const pageInfo = {
        path: new URL(currentUrl).pathname.replace(/;jsessionid=[^?#]+/i, ''),
        status: response.status,
        loadTime: loadTime + 's',
        brokenImg: false,
        brokenImages: [] // 깨진 이미지 URL 목록 추가
      };

      // Check for broken images (limited to first 10 for performance)
      const images = [];
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
          try {
            images.push(new URL(src, currentUrl).href);
          } catch (e) {}
        }
      });

      for (const imgSrc of images.slice(0, 10)) {
        try {
          // Use GET with a small timeout and high-level headers to avoid being blocked
          await axios.get(imgSrc, { 
            timeout: 5000, 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            responseType: 'stream' // Don't download the whole image
          });
        } catch (err) {
          pageInfo.brokenImg = true;
          pageInfo.brokenImages.push(imgSrc);
        }
      }

      results.push(pageInfo);

      // Find sub-links
      $('a').each((i, el) => {
        let href = $(el).attr('href');
        if (!href) return;

        // Skip non-page links (but resolve customized javascript navigation for eGovFrame)
        if (href.startsWith('javascript:')) {
          const resolved = resolveJavascriptLink(href);
          if (resolved) {
            href = resolved;
          } else {
            return;
          }
        } else if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
          return;
        }

        try {
          const cleanedHref = href.replace(/;jsessionid=[^?#]+/i, '');
          const absoluteUrl = new URL(cleanedHref, currentUrl).href.split('#')[0]; // Remove hash
          const hrefUrl = new URL(absoluteUrl);
          const pathname = hrefUrl.pathname.toLowerCase();

          // Check extensions
          if (IGNORED_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
            return;
          }

          // Only same domain and not visited/queued
          if (hrefUrl.hostname === domain && !visited.has(absoluteUrl) && !queue.includes(absoluteUrl)) {
            // Prioritize links in menu containers
            const isMenu = $(el).closest('nav, header, [class*="menu"], [id*="menu"], [class*="nav"], [id*="nav"], [class*="gnb"], [id*="gnb"]').length > 0;
            if (isMenu) {
              queue.unshift(absoluteUrl); // Put at front
            } else {
              queue.push(absoluteUrl); // Put at back
            }
          }
        } catch (e) {}
      });
    } catch (error) {
      console.error(`[Crawler Error] ${currentUrl}:`, error.message);
      results.push({
        path: new URL(currentUrl).pathname.replace(/;jsessionid=[^?#]+/i, ''),
        status: error.response ? error.response.status : (error.code === 'ECONNABORTED' ? 408 : 500),
        loadTime: '0.00s',
        brokenImg: false
      });
    }
  }

  // 중복 경로(path) 정규화 및 고유값 필터링 (동일 페이지 다중 수집 방지)
  const uniqueResults = [];
  const seenPaths = new Set();
  for (const item of results) {
    if (item && item.path) {
      if (!seenPaths.has(item.path)) {
        seenPaths.add(item.path);
        uniqueResults.push(item);
      }
    }
  }

  return uniqueResults;
}

export { crawlSite };
