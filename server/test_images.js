import axios from 'axios';
import * as cheerio from 'cheerio';

async function checkPage() {
    const url = 'https://www.skbatteryamerica.com/career/benefit.html';
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(res.data);
        const images = [];
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            if (src) images.push(new URL(src, url).href);
        });

        console.log(`Found ${images.length} images.`);
        for (const img of images) {
            try {
                // Use GET instead of HEAD because some servers block HEAD
                await axios.get(img, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                console.log(`[OK] ${img}`);
            } catch (err) {
                console.log(`[BROKEN] ${img} - ${err.message}`);
            }
        }
    } catch (err) {
        console.error(err.message);
    }
}

checkPage();
