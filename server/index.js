import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crawlSite } from './crawler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let targets = [];
let schedulers = {};

// 데이터 저장 함수
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(targets, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Save Error]', error.message);
  }
}

// 초기 데이터 로드 및 타이머 재설정 함수
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      targets = JSON.parse(data);
      console.log(`[Load] Restored ${targets.length} targets from data.json`);
      
      // 타이머 재가동
      targets.forEach(t => {
        if (!t.schedule) {
          t.schedule = { interval: t.interval || 30, paused: false, activeHours: 'all' };
        }
        setupTimer(t.id);
      });
    }
  } catch (error) {
    console.error('[Load Error]', error.message);
  }
}

// 24시간 형식으로 현재 시간을 반환하는 헬퍼 함수
function getCurrentTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

// 타이머 등록 헬퍼 함수
function setupTimer(targetId) {
  if (schedulers[targetId]) {
    clearInterval(schedulers[targetId]);
    delete schedulers[targetId];
  }
  const target = targets.find(t => t.id === targetId);
  if (!target || !target.schedule || target.schedule.paused) return;

  const intervalMs = target.schedule.interval * 60 * 1000;
  schedulers[targetId] = setInterval(() => performCheck(targetId), intervalMs);
}

// 스케줄 실행 체크 (활성 시간대)
function isWithinActiveHours(schedule) {
  if (!schedule || schedule.paused) return false;
  if (schedule.activeHours === "all") return true;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [startH, startM] = (schedule.customStart || "09:00").split(":").map(Number);
  const [endH, endM] = (schedule.customEnd || "18:00").split(":").map(Number);
  
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

async function performCheck(targetId) {
  const targetIndex = targets.findIndex(t => t.id === targetId);
  if (targetIndex === -1) return;

  const target = targets[targetIndex];
  
  // 스케줄 조건 확인 (활성 시간대)
  if (!isWithinActiveHours(target.schedule)) {
    return;
  }
  try {
    const results = await crawlSite(target.url, 100);
    targets[targetIndex] = {
      ...target,
      status: 'active',
      data: results,
      timestamp: getCurrentTime(),
      history: [
        ...(target.history || []),
        { timestamp: getCurrentTime(), results }
      ].slice(-100) // 기록 최대 100개 유지
    };
    saveData(); // 데이터 영구 저장
  } catch (error) {
    console.error(`[Schedule Error] ${target.url}:`, error.message);
  }
}

// 1. URL 수집 전용 (빠른 탐색)
app.post('/api/discover', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
    
    console.log(`[Discover] Crawling: ${targetUrl}`);
    const results = await crawlSite(targetUrl, 100);
    res.json({ success: true, url: targetUrl, results });
  } catch (error) {
    console.error('[Discover Error]', error.message);
    res.status(500).json({ error: '사이트 정보를 가져오지 못했습니다.' });
  }
});

// 2. 타겟 최종 등록 (수집된 데이터를 바로 사용)
app.post('/api/targets', (req, res) => {
  const { url, name, data, interval = 30, schedule } = req.body;
  
  const newTarget = {
    id: Date.now(),
    name: name || url.replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0].toUpperCase(),
    url: url,
    status: 'active',
    data: data,
    interval: interval,
    schedule: schedule || { interval, paused: false, activeHours: 'all' },
    timestamp: getCurrentTime(),
    history: [{ timestamp: getCurrentTime(), results: data }],
    previewUrl: `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1024`
  };

  targets.push(newTarget);
  saveData();

  setupTimer(newTarget.id);

  console.log(`[Register] Target added: ${url}`);
  res.json({ success: true, target: newTarget });
});

// 3. 스케줄 동기화 (Auto-save)
app.put('/api/schedule', (req, res) => {
  const { schedules } = req.body;
  if (!schedules || !Array.isArray(schedules)) return res.status(400).json({ error: 'Invalid schedules' });

  let updatedCount = 0;
  schedules.forEach(sched => {
    const targetIndex = targets.findIndex(t => t.id === sched.targetId);
    if (targetIndex !== -1) {
      // 스케줄 업데이트
      targets[targetIndex].schedule = sched;
      // 타이머 재설정
      setupTimer(sched.targetId);
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    saveData();
    console.log(`[Schedule] Updated ${updatedCount} targets`);
  }

  res.json({ success: true, updated: updatedCount });
});

app.get('/api/targets', (req, res) => res.json(targets));

app.delete('/api/targets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (schedulers[id]) {
    clearInterval(schedulers[id]);
    delete schedulers[id];
  }
  targets = targets.filter(t => t.id !== id);
  saveData();
  res.json({ success: true });
});

// 4. 특정 타겟 내의 특정 경로 데이터 삭제
app.delete('/api/targets/:id/path', (req, res) => {
  const id = parseInt(req.params.id);
  const { path: pathToDelete } = req.body;

  const targetIndex = targets.findIndex(t => t.id === id);
  if (targetIndex !== -1) {
    // 1. 현재 데이터(data)에서 삭제
    targets[targetIndex].data = targets[targetIndex].data.filter(d => d.path !== pathToDelete);
    
    // 2. 히스토리(history) 내의 모든 결과에서도 해당 경로 삭제 (통계 일관성 유지)
    if (targets[targetIndex].history) {
      targets[targetIndex].history = targets[targetIndex].history.map(h => ({
        ...h,
        results: h.results.filter(r => r.path !== pathToDelete)
      }));
    }

    saveData();
    res.json({ success: true, updatedTarget: targets[targetIndex] });
  } else {
    res.status(404).json({ error: 'Target not found' });
  }
});
// 프론트엔드 정적 파일 서빙 (배포용)
const clientDistPath = path.join(__dirname, '../dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  loadData(); // 시작 시 데이터 복구
  console.log(`Monitoring server running on http://localhost:${PORT}`);
});
