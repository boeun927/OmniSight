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

// 중앙 스케줄러 타이머 및 실행 락(Lock)
let centralTimer = null;
let checkingTargets = {};

// 24시간 형식으로 현재 시간을 반환하는 헬퍼 함수
function getCurrentTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
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

// 중앙 스케줄러 기동 함수
function startCentralScheduler() {
  if (centralTimer) {
    clearInterval(centralTimer);
  }
  // 1분(60초)마다 주기적으로 모든 타겟의 스케줄 확인 및 점검 수행
  centralTimer = setInterval(checkAllTargetsSchedule, 60 * 1000);
  console.log('[Scheduler] Central scheduler started (1-minute tick)');
  
  // 시작 시 즉시 누락되거나 주기 도달한 타겟 점검 가동
  checkAllTargetsSchedule();
}

// 모든 타겟 스케줄 검증 및 실행 (1분마다 호출됨)
function checkAllTargetsSchedule() {
  console.log(`[Scheduler Tick] Checking schedules at ${getCurrentTime()}`);
  targets.forEach((target) => {
    const ts = target.schedule || { interval: target.interval || 30, paused: false, activeHours: 'all' };
    
    // 1. 활성화 상태 및 일시정지 여부
    if (ts.paused) return;
    
    // 2. 활성 시간대 조건 확인
    if (!isWithinActiveHours(ts)) {
      return;
    }
    
    // 3. 간격(분) 확인 (마지막 실행 시간으로부터 경과된 시간 계산)
    const intervalMinutes = Number(ts.interval || target.interval || 30);
    const lastChecked = target.lastCheckedAt || 0;
    const elapsedMinutes = (Date.now() - lastChecked) / (60 * 1000);
    
    if (elapsedMinutes >= intervalMinutes) {
      console.log(`[Scheduler] Triggering performCheck for ${target.name} - Elapsed: ${Math.round(elapsedMinutes)}m, Interval: ${intervalMinutes}m`);
      performCheck(target.id); // 백그라운드에서 병렬 비동기 기동
    }
  });
}

// 단일 타겟 모니터링 실행
async function performCheck(targetId) {
  if (checkingTargets[targetId]) {
    console.log(`[PerformCheck] Already crawling for target ${targetId}, skipping duplicate`);
    return;
  }
  
  const targetIndex = targets.findIndex(t => t.id === targetId);
  if (targetIndex === -1) return;

  const target = targets[targetIndex];
  
  // 안전장치: 다시 한 번 스케줄 및 활성 상태 점검
  if (!isWithinActiveHours(target.schedule)) {
    return;
  }

  checkingTargets[targetId] = true;
  try {
    console.log(`[PerformCheck] Starting crawl: ${target.name} (${target.url})`);
    const results = await crawlSite(target.url, 300); // 수집 제한 300개 상향 반영
    
    targets[targetIndex] = {
      ...target,
      status: 'active',
      data: results,
      lastCheckedAt: Date.now(), // 성공 시 밀리초 타임스탬프 영구 기록
      timestamp: getCurrentTime(),
      history: [
        ...(target.history || []),
        { timestamp: getCurrentTime(), results }
      ].slice(-100) // 최대 100개 유지
    };
    saveData(); // 데이터 영구 저장
    console.log(`[PerformCheck] Crawl success: ${target.name} (${target.url})`);
  } catch (error) {
    console.error(`[Schedule Error] ${target.url}:`, error.message);
  } finally {
    delete checkingTargets[targetId];
  }
}

// 기존 setupTimer 호환성 래퍼 (중앙 틱 감지 유도)
function setupTimer(targetId) {
  checkAllTargetsSchedule();
}

// 초기 데이터 로드 및 중앙 스케줄러 시작
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      targets = JSON.parse(data);
      console.log(`[Load] Restored ${targets.length} targets from data.json`);
      
      // 스케줄 정보 보정
      targets.forEach(t => {
        if (!t.schedule) {
          t.schedule = { interval: t.interval || 30, paused: false, activeHours: 'all' };
        }
      });

      // 중앙 스케줄러 시작
      startCentralScheduler();
    }
  } catch (error) {
    console.error('[Load Error]', error.message);
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
    const results = await crawlSite(targetUrl, 300);
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
    previewUrl: `https://image.thum.io/get/width/1024/crop/800/${url.startsWith('http') ? url : 'https://' + url}`
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
