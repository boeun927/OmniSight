import express from 'express';
import cors from 'cors';
import { crawlSite } from './crawler.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/collect', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

    console.log(`Starting collection for: ${targetUrl}`);
    const results = await crawlSite(targetUrl);
    
    res.json({
      success: true,
      url: targetUrl,
      results: results
    });
  } catch (error) {
    console.error('Collection failed:', error);
    res.status(500).json({ error: 'Failed to collect site data' });
  }
});

app.listen(PORT, () => {
  console.log(`Monitoring server running on http://localhost:${PORT}`);
});
