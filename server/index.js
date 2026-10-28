import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crawlSite } from './crawler.js';
import os from 'os';
import nodemailer from 'nodemailer';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');
const ALERTS_FILE = path.join(__dirname, 'alerts.json');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 모든 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[ACCESS] ${req.method} ${req.url} (from ${req.ip || req.socket.remoteAddress})`);
  next();
});

let targets = [];
let schedulers = {};
let alertChannels = [];

// 알림 채널 데이터 저장 및 로드
function loadAlertChannels() {
  try {
    if (fs.existsSync(ALERTS_FILE)) {
      const data = fs.readFileSync(ALERTS_FILE, 'utf-8');
      alertChannels = JSON.parse(data);
      console.log(`[Load] Restored ${alertChannels.length} alert channels from alerts.json`);
    }
  } catch (err) {
    console.error('[Load Alerts Error]', err.message);
  }
}

function saveAlertChannels() {
  try {
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alertChannels, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Save Alerts Error]', err.message);
  }
}

// .env 파일 자동 로드
const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
  try {
    const envLines = fs.readFileSync(ENV_FILE, 'utf-8').split(/\r?\n/);
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
          process.env[key] = val;
        }
      }
    }
    console.log('[Env] Loaded environment variables from server/.env');
  } catch (err) {
    console.warn('[Env Load Warning]', err.message);
  }
}

// Nodemailer 트랜스포터 구성 (자동 Ethereal 테스트 메일 계정 및 실제 SMTP 지원)
let mailTransporter = null;
let currentSmtpConfig = {
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587'),
  user: process.env.SMTP_USER || '',
  pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '')
};

async function initMailTransporter() {
  try {
    if (currentSmtpConfig.user && currentSmtpConfig.pass) {
      mailTransporter = nodemailer.createTransport({
        host: currentSmtpConfig.host || 'smtp.gmail.com',
        port: currentSmtpConfig.port || 587,
        secure: currentSmtpConfig.port === 465,
        auth: {
          user: currentSmtpConfig.user,
          pass: currentSmtpConfig.pass
        }
      });
      console.log(`[Email Transporter] Configured custom SMTP user: ${currentSmtpConfig.user}`);
    } else {
      // 지정된 외부 계정이 없을 경우 Nodemailer Ethereal 테스트 계정 자동 할당
      const testAccount = await nodemailer.createTestAccount();
      mailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[Email Transporter] Initialized Ethereal test SMTP account: ${testAccount.user}`);
    }
  } catch (err) {
    console.warn('[Email Transporter Init Error]', err.message);
  }
}

initMailTransporter();

// ── 모니터링 이메일 알림 전송 헬퍼 함수 ──
async function sendEmailAlert({ target, type = 'OPEN', message = '', incidentNo = '' }) {
  if (!target || !target.id) return { success: false };

  const matchedChannels = alertChannels.filter(c => Array.isArray(c.targetIds) && c.targetIds.includes(target.id));
  if (matchedChannels.length === 0) {
    console.log(`[Email Alert] Target '${target.name}' (ID: ${target.id}) has no matched email recipients.`);
    return { success: false, reason: 'no_recipients' };
  }

  const recipients = [...new Set(matchedChannels.map(c => c.email))];
  const isError = type === 'OPEN' || type === 'ERROR';
  const nowStr = getCurrentTime();

  console.log(`[Email Alert Dispatch] Target: '${target.name}', Type: ${type}, Recipients: [${recipients.join(', ')}]`);

  const subject = isError
    ? `🚨 [OmniSight 장애 경보] ${target.name} 사이트 장애가 감지되었습니다.`
    : `✅ [OmniSight 복구 완료] ${target.name} 사이트가 정상 복구되었습니다.`;

  const htmlContent = `
    <div style="font-family: 'Pretendard', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background-color: ${isError ? '#dc2626' : '#0284c7'}; padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; tracking-tight: -0.02em;">
          ${isError ? '🚨 모니터링 장애 경보 발생' : '✅ 모니터링 복구 완료 안내'}
        </h1>
        <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">
          OmniSight Automated Web Monitoring & Alert Engine
        </p>
      </div>
      <div style="padding: 28px 24px; color: #334155;">
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;">대상 사이트: ${target.name}</h2>
          <p style="margin: 0; font-size: 13px; color: #64748b;">수신 메일: <strong style="color: #0284c7;">${recipients.join(', ')}</strong></p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
          <tr>
            <td style="padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; width: 120px; color: #475569;">대상 URL</td>
            <td style="padding: 10px 14px; border: 1px solid #e2e8f0;"><a href="${target.url}" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 600;">${target.url}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #475569;">모니터링 상태</td>
            <td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: ${isError ? '#dc2626' : '#16a34a'}; font-weight: 800;">
              ${isError ? '장애 발생 (OPEN)' : '조치/복구 완료 (RESOLVED)'}
            </td>
          </tr>
          ${incidentNo ? `
          <tr>
            <td style="padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #475569;">장애 번호</td>
            <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700;">${incidentNo}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #475569;">감지 일시</td>
            <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 600;">${nowStr}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; font-weight: 700; color: #475569;">상세 내용</td>
            <td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: #334155; line-height: 1.5;">${message || '모니터링 점검 중 상태 변화가 감지되었습니다.'}</td>
          </tr>
        </table>

        <div style="margin-top: 24px; padding: 16px; background-color: #f1f5f9; border-radius: 12px; font-size: 12px; color: #64748b; line-height: 1.6;">
          💡 본 메일은 OmniSight 모니터링 결과 알림설정에서 등록하신 이메일 매칭 규칙에 따라 자동 발송되었습니다.
        </div>
      </div>
    </div>
  `;

  let lastPreviewUrl = null;
  for (const email of recipients) {
    try {
      if (mailTransporter) {
        const info = await mailTransporter.sendMail({
          from: `"OmniSight Monitor" <${currentSmtpConfig.user || 'noreply@omnisight.co.kr'}>`,
          to: email,
          subject: subject,
          html: htmlContent
        });
        const preview = nodemailer.getTestMessageUrl(info);
        if (preview) lastPreviewUrl = preview;
        console.log(`[Email Sent] Successfully sent alert to ${email} (Preview URL: ${preview || 'N/A'})`);
      }
    } catch (err) {
      console.warn(`[Email Send Error for ${email}]`, err.message);
    }
  }

  return { success: true, previewUrl: lastPreviewUrl };
}

// 데이터 저장 함수
function saveData() {
  try {
    const cleanTargets = targets.filter(t => t !== null && typeof t === 'object');
    fs.writeFileSync(DATA_FILE, JSON.stringify(cleanTargets, null, 2), 'utf-8');
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
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
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
    if (!target) return;
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

const INCIDENTS_FILE = path.join(__dirname, 'incidents.json');
let incidents = [];

function saveIncidents() {
  try {
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(incidents, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Incidents Save Error]', error.message);
  }
}

function generateIncidentNo(dateStr) {
  const todayStr = dateStr || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sameDayList = incidents.filter(i => i && i.incidentNo && i.incidentNo.startsWith(todayStr));
  const seq = sameDayList.length + 1;
  return `${todayStr}_${String(seq).padStart(2, '0')}`;
}

function loadIncidents() {
  try {
    if (fs.existsSync(INCIDENTS_FILE)) {
      const data = fs.readFileSync(INCIDENTS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      incidents = (Array.isArray(parsed) ? parsed : []).filter(i => i && !['INC-20260805-001', 'INC-20260804-002'].includes(i.id));
    } else {
      incidents = [];
    }

    // 더미 장애데이터가 없을 경우 예시 장애보고서용 데이터 1건 생성
    if (incidents.length === 0) {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const todayFormatted = new Date().toISOString().slice(0, 10);
      incidents = [
        {
          id: `INC-DUMMY-01`,
          incidentNo: `${todayStr}_01`,
          targetId: 999,
          targetName: '행복ICT 웹사이트',
          targetUrl: 'https://www.happyict.co.kr',
          status: 'RESOLVED',
          severity: 'Major',
          errorType: 'HTTP 500 응답 장애',
          errorSummary: '메인 웹 서버 응답 지연 및 DB 커넥션 타임아웃',
          startedAt: `${todayFormatted} 09:15:20`,
          startedAtMs: Date.now() - 3600000,
          resolvedAt: `${todayFormatted} 09:35:45`,
          duration: '20분 25초',
          durationSec: 1225,
          failedPagesCount: 2,
          brokenImgCount: 0,
          createdDate: todayFormatted,
          dept: 'IT운영팀',
          manager: '김보은',
          customer: '행복ICT',
          title: '행복ICT 웹사이트 메인 DB 접속 지연으로 인한 500 에러 발생',
          symptom: '웹사이트 메인 페이지 접속 시 HTTP 500 에러 출력 및 서비스 이용 불가',
          rootCause: '새벽 데이터 수집 배치 실행 중 DB 커넥션 미반환으로 인한 커넥션 풀 고갈',
          impactRange: '행복ICT 웹사이트 메인 및 주요 서브페이지 (영향 사용자 약 150명)',
          actionSummary: 'DB 커넥션 풀 초기화 및 WAS 프로세스 재기동 조치 완료',
          actionLogs: [
            { time: '09:15:20', content: 'OmniSight 장애 감지 시스템 자동 알림 발송', person: '시스템' },
            { time: '09:18:00', content: '장애 상황 확인 및 WAS/DB 로그 긴급 점검 시작', person: '김보은' },
            { time: '09:25:00', content: 'DB 커넥션 풀 고갈 원인 파악 및 튜닝 작업 수행', person: '이시스템' },
            { time: '09:32:00', content: 'WAS 서버 재기동 및 커넥션 풀 가용 상태 확인', person: '이시스템' },
            { time: '09:35:45', content: '서비스 정상 복구 확인 및 최종 헬스체크 완료', person: '김보은' }
          ],
          preventiveAction: 'DB 커넥션 타임아웃 설정 강화 및 미반환 커넥션 자동 회수 세이프가드 모듈 적용',
          dueDate: '2026-08-25',
          preventiveManager: '김보은'
        }
      ];
      saveIncidents();
    } else {
      // 기존 장애 데이터에 incidentNo 부여
      let updated = false;
      incidents.forEach((inc, idx) => {
        if (!inc.incidentNo) {
          const dateStr = inc.startedAt ? inc.startedAt.slice(0, 10).replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const seqStr = String(idx + 1).padStart(2, '0');
          inc.incidentNo = `${dateStr}_${seqStr}`;
          updated = true;
        }
      });
      if (updated) saveIncidents();
    }
  } catch (error) {
    console.error('[Incidents Load Error]', error.message);
    incidents = [];
  }
}

// 타겟 점검 결과에 따른 장애 자동 로깅 처리
function processTargetIncident(target, results) {
  // 모니터링이 중단(일시정지)된 타겟은 장애 로깅 및 알림 생성을 하지 않음
  if (target && target.schedule && target.schedule.paused) {
    console.log(`[ProcessIncident] Target '${target.name}' is paused. Skipping incident creation.`);
    return;
  }

  const openIndex = incidents.findIndex(i => i.targetId === target.id && i.status === 'OPEN');
  const failedPages = results ? results.filter(r => r.status !== 200) : [];
  const brokenImgPages = results ? results.filter(r => r.brokenImg) : [];
  const hasFailure = failedPages.length > 0 || brokenImgPages.length > 0;

  if (hasFailure) {
    const errorDetails = [];
    if (failedPages.length > 0) {
      errorDetails.push(`HTTP 오류 페이지 ${failedPages.length}건 (응답코드: ${Array.from(new Set(failedPages.map(p => p.status))).join(', ')})`);
    }
    if (brokenImgPages.length > 0) {
      errorDetails.push(`깨진 이미지 ${brokenImgPages.length}건 감지`);
    }
    const errorSummary = errorDetails.join(' / ');

    if (openIndex !== -1) {
      incidents[openIndex].errorSummary = errorSummary;
      incidents[openIndex].lastCheckedAt = getCurrentTime();
    } else {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const newInc = {
        id: `INC-${Date.now()}`,
        incidentNo: generateIncidentNo(todayStr),
        targetId: target.id,
        targetName: target.name,
        targetUrl: target.url,
        status: 'OPEN',
        severity: 'Major',
        errorType: failedPages.length > 0 ? `HTTP ${failedPages[0].status} 응답 장애` : '이미지 렌더링 오류',
        errorSummary: errorSummary,
        startedAt: getCurrentTime(),
        startedAtMs: Date.now(),
        resolvedAt: null,
        duration: '진행 중 (미복구)',
        failedPagesCount: failedPages.length,
        brokenImgCount: brokenImgPages.length,
        createdDate: new Date().toISOString().slice(0, 10),
        dept: 'IT운영팀',
        manager: '김보은',
        customer: target.name || '고객사',
        title: `${target.name} 서비스 접속 불량 장애`,
        symptom: errorSummary,
        rootCause: '네트워크 연결 지연 또는 대상 서버 응답 실패',
        impactRange: `${target.name} 주요 웹 서비스`,
        actionSummary: '장애원인 파악 및 복구 조치 진행 중',
        actionLogs: [
          { time: getCurrentTime().slice(11), content: '장애 감지 및 알림 발송', person: '시스템' }
        ],
        preventiveAction: '상세 원인 분석 후 재발 방지 대책 수립 예정',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
        preventiveManager: '김보은'
      };
      incidents.unshift(newInc);
      
      // 이메일 알림 즉시 발송
      sendEmailAlert({
        target,
        type: 'OPEN',
        message: newInc.errorSummary,
        incidentNo: newInc.incidentNo
      });
    }
    saveIncidents();
  } else {
    // 정상인 경우 오픈된 장애 자동 복구
    if (openIndex !== -1) {
      const inc = incidents[openIndex];
      const nowMs = Date.now();
      const diffSec = Math.max(1, Math.round((nowMs - inc.startedAtMs) / 1000));
      let durationStr = `${diffSec}초`;
      if (diffSec >= 60) {
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        durationStr = `${mins}분 ${secs}초`;
      }
      if (diffSec >= 3600) {
        const hrs = Math.floor(diffSec / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        durationStr = `${hrs}시간 ${mins}분`;
      }

      incidents[openIndex] = {
        ...inc,
        status: 'RESOLVED',
        resolvedAt: getCurrentTime(),
        duration: durationStr
      };
      saveIncidents();

      // 복구 알림 이메일 발송
      sendEmailAlert({
        target,
        type: 'RESOLVED',
        message: `모니터링 점검 결과 사이트가 정상 복구되었습니다. (복구 소요 시간: ${durationStr})`,
        incidentNo: inc.incidentNo
      });
    }
  }
}

// 단일 타겟 모니터링 실행
async function performCheck(targetId, isManual = false) {
  if (checkingTargets[targetId]) {
    console.log(`[PerformCheck] Already crawling for target ${targetId}, skipping duplicate`);
    return { success: false, message: '이미 점검 진행 중입니다.' };
  }
  
  const targetIndex = targets.findIndex(t => t && t.id === targetId);
  if (targetIndex === -1) return { success: false, message: '타겟을 찾을 수 없습니다.' };

  const target = targets[targetIndex];
  if (!target) return { success: false, message: '타겟이 존재하지 않습니다.' };
  
  // 수동 실행이 아닌 경우 일시정지(paused) 및 시간대 제한 적용
  if (!isManual) {
    if (target.schedule && target.schedule.paused) {
      console.log(`[PerformCheck] Target '${target.name}' is paused. Skipping check.`);
      return { success: false, message: '모니터링이 일시정지된 대상입니다.' };
    }
    if (!isWithinActiveHours(target.schedule)) {
      return { success: false, message: '활성 시간대가 아닙니다.' };
    }
  }

  checkingTargets[targetId] = true;
  try {
    console.log(`[PerformCheck] Starting crawl: ${target.name} (${target.url}) (Manual: ${isManual})`);
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

    // 장애 로깅 자동 감지 처리
    processTargetIncident(targets[targetIndex], results);

    console.log(`[PerformCheck] Crawl success: ${target.name} (${target.url})`);
    return { success: true, target: targets[targetIndex] };
  } catch (error) {
    console.error(`[Schedule Error] ${target.url}:`, error.message);
    // 예외 발생 시 서버 연결 실패 장애 로깅
    processTargetIncident(target, [{ path: '/', status: 500, brokenImg: false }]);
    return { success: false, error: error.message };
  } finally {
    delete checkingTargets[targetId];
  }
}

// 5. 수동 즉시 점검 실행 API
app.post('/api/targets/:id/check', async (req, res) => {
  const id = parseInt(req.params.id);
  console.log(`[Manual Check API] Target ID: ${id}`);
  const result = await performCheck(id, true);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// 6. 장애현황 관리 API 목록
app.get('/api/incidents', (req, res) => {
  res.json(incidents);
});

// 수동 복구 처리 API
app.post('/api/incidents/:id/resolve', (req, res) => {
  const id = req.params.id;
  const idx = incidents.findIndex(i => i.id === id);
  if (idx !== -1) {
    const inc = incidents[idx];
    const nowMs = Date.now();
    const diffSec = inc.startedAtMs ? Math.max(1, Math.round((nowMs - inc.startedAtMs) / 1000)) : 60;
    let durationStr = `${diffSec}초`;
    if (diffSec >= 60) {
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      durationStr = `${mins}분 ${secs}초`;
    }
    if (diffSec >= 3600) {
      const hrs = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      durationStr = `${hrs}시간 ${mins}분`;
    }

    incidents[idx] = {
      ...inc,
      status: 'RESOLVED',
      resolvedAt: getCurrentTime(),
      resolvedAtMs: nowMs,
      durationSec: diffSec,
      duration: durationStr
    };
    saveIncidents();

    // 수동 복구 알림 메일 발송
    const targetObj = targets.find(t => t.id === inc.targetId) || { id: inc.targetId, name: inc.targetName, url: inc.targetUrl };
    sendEmailAlert({
      target: targetObj,
      type: 'RESOLVED',
      message: `관리자에 의해 수동으로 장애 복구 조치 완료 처리되었습니다.`,
      incidentNo: inc.incidentNo
    });

    res.json({ success: true, incident: incidents[idx] });
  } else {
    res.status(404).json({ error: 'Incident not found' });
  }
});

// 장애 이력 삭제 API
app.delete('/api/incidents/:id', (req, res) => {
  const id = req.params.id;
  incidents = incidents.filter(i => i.id !== id);
  saveIncidents();
  res.json({ success: true });
});

// ── 이메일 알림 채널 API ──
app.get('/api/alerts', (req, res) => {
  res.json(alertChannels);
});

app.post('/api/alerts', (req, res) => {
  const { email, targetIds } = req.body;
  if (!email || !Array.isArray(targetIds)) {
    return res.status(400).json({ error: '이메일 주소와 선택한 사이트 목록이 필요합니다.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existingIdx = alertChannels.findIndex(c => c.email.toLowerCase() === cleanEmail);

  if (existingIdx !== -1) {
    alertChannels[existingIdx].targetIds = targetIds;
  } else {
    alertChannels.push({ email: cleanEmail, targetIds });
  }

  saveAlertChannels();
  console.log(`[Alert Channel Saved] Email: ${cleanEmail}, Matched Targets: [${targetIds.join(', ')}]`);
  res.json({ success: true, alertChannels });
});

app.delete('/api/alerts/:email', (req, res) => {
  const emailToDelete = req.params.email.trim().toLowerCase();
  alertChannels = alertChannels.filter(c => c.email.toLowerCase() !== emailToDelete);
  saveAlertChannels();
  console.log(`[Alert Channel Deleted] Email: ${emailToDelete}`);
  res.json({ success: true, alertChannels });
});

// 이메일 전송 테스트 API (버튼 클릭 시 매칭 메일로 즉시 테스트 발송)
app.post('/api/alerts/test', async (req, res) => {
  const { email, targetId } = req.body;
  if (!email) return res.status(400).json({ error: '수신할 이메일 주소를 입력해 주세요.' });

  let target = targets.find(t => t.id === targetId) || targets[0] || { id: 999, name: 'OmniSight 샘플 사이트', url: 'https://example.com' };

  try {
    const sendResult = await sendEmailAlert({
      target,
      type: 'OPEN',
      message: `[OmniSight 테스트 메시지] '${email}' 수신 이메일로 연동된 모니터링 알림 테스트 메일입니다. 장애 발생 시 이 주소로 장애 경보 메일이 발송됩니다.`,
      incidentNo: 'INC-TEST-001'
    });

    res.json({
      success: true,
      message: `'${email}' 수신 주소로 알림 메일 발송 처리가 완료되었습니다.`,
      previewUrl: sendResult?.previewUrl || null
    });
  } catch (err) {
    console.error('[Alert Test Error]', err);
    res.status(500).json({ error: '테스트 메일 전송 중 오류가 발생했습니다.' });
  }
});

// 기존 setupTimer 호환성 래퍼 (중앙 틱 감지 유도)
function setupTimer(targetId) {
  checkAllTargetsSchedule();
}

// 초기 데이터 로드 및 중앙 스케줄러 시작
function loadData() {
  try {
    loadIncidents();
    loadAlertChannels();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      targets = (Array.isArray(parsed) ? parsed : []).filter(t => t !== null && typeof t === 'object');
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

const USER_PROFILE_FILE = path.join(__dirname, 'user_profile.json');
let userProfile = {
  username: 'admin@happyict.co.kr',
  password: '0000',
  nickname: '최고관리자',
  level: 'admin',
  lastLoginAt: ''
};

function loadUserProfile() {
  try {
    if (fs.existsSync(USER_PROFILE_FILE)) {
      const data = fs.readFileSync(USER_PROFILE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      userProfile = { ...userProfile, ...parsed };
      if (!userProfile.nickname || userProfile.nickname === '관리자') {
        userProfile.nickname = '최고관리자';
        saveUserProfile();
      }
    } else {
      saveUserProfile();
    }
  } catch (err) {
    console.error('[User Profile Load Error]', err.message);
  }
}

function saveUserProfile() {
  try {
    fs.writeFileSync(USER_PROFILE_FILE, JSON.stringify(userProfile, null, 2), 'utf-8');
  } catch (err) {
    console.error('[User Profile Save Error]', err.message);
  }
}

loadUserProfile();

// ── 계정 관리 (Users) 시스템 ──
const USERS_FILE = path.join(__dirname, 'users.json');
let usersList = [];

function saveUsersList() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Users Save Error]', err.message);
  }
}

function loadUsersList() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf-8');
      usersList = JSON.parse(data);
    } else {
      usersList = [];
    }

    if (!Array.isArray(usersList) || usersList.length === 0) {
      usersList = [
        {
          id: 1,
          username: "admin@happyict.co.kr",
          nickname: "최고관리자",
          password: "happy2690",
          level: "admin",
          lastLoginAt: getCurrentTime(),
          createdAt: "2026-08-01 09:00:00"
        },
        {
          id: 2,
          username: "kambe@happyict.co.kr",
          nickname: "김보은",
          password: "happy2690",
          level: "admin",
          lastLoginAt: "2026-08-20 13:45:10",
          createdAt: "2026-08-10 10:30:00"
        },
        {
          id: 3,
          username: "user01@happyict.co.kr",
          nickname: "홍길동",
          password: "happy2690",
          level: "user",
          lastLoginAt: "2026-08-19 18:20:00",
          createdAt: "2026-08-15 14:00:00"
        }
      ];
      saveUsersList();
    }
  } catch (err) {
    console.error('[Users Load Error]', err.message);
    usersList = [];
  }
}

loadUsersList();

// 0. 로그인 API
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: '아이디와 비밀번호를 모두 입력해 주세요.' });
  }

  const cleanUser = username.trim().toLowerCase();
  
  // 1. usersList 목록에서 계정 매칭 (username 이메일 또는 'admin' 숏컷)
  let matchedUser = usersList.find(u => 
    (u.username.toLowerCase() === cleanUser || (cleanUser === 'admin' && u.id === 1)) &&
    u.password === password
  );

  // 2. 기본 admin 프로필 매칭
  const isProfileMatch = !matchedUser && (cleanUser === userProfile.username.toLowerCase() || cleanUser === 'admin') && password === userProfile.password;

  if (matchedUser || isProfileMatch) {
    const nowTime = getCurrentTime();

    if (matchedUser) {
      matchedUser.lastLoginAt = nowTime;
      saveUsersList();
    } else {
      userProfile.lastLoginAt = nowTime;
      saveUserProfile();
    }

    const currentUsername = matchedUser ? matchedUser.username : userProfile.username;
    const currentNickname = matchedUser ? matchedUser.nickname : userProfile.nickname;
    const currentLevel = matchedUser ? matchedUser.level : (userProfile.level || 'admin');
    const isFirstLogin = matchedUser ? (matchedUser.isFirstLogin === true) : false;

    console.log(`[Auth] Account '${currentUsername}' (${currentNickname}) logged in as level [${currentLevel}] (isFirstLogin: ${isFirstLogin})`);
    return res.json({
      success: true,
      user: {
        username: currentUsername,
        nickname: currentNickname,
        level: currentLevel,
        lastLoginAt: nowTime,
        isFirstLogin: isFirstLogin
      },
      token: 'omnisight_session_token_2026'
    });
  }

  console.warn(`[Auth Failed] Invalid login attempt for user '${username}'`);
  return res.status(401).json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
});

// ── 최초 로그인 비밀번호 변경 전용 API ──
app.post('/api/user/first-password-change', (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword || !newPassword.trim()) {
    return res.status(400).json({ error: '유효한 아이디와 새 비밀번호를 입력해 주세요.' });
  }

  const cleanUser = username.trim().toLowerCase();
  const matchedIndex = usersList.findIndex(u => u.username.toLowerCase() === cleanUser || (cleanUser === 'admin' && u.id === 1));

  if (matchedIndex !== -1) {
    usersList[matchedIndex].password = newPassword.trim();
    usersList[matchedIndex].isFirstLogin = false; // 최초 로그인 비밀번호 변경 완료 처리
    saveUsersList();

    if (matchedIndex === 0) {
      userProfile.password = newPassword.trim();
      saveUserProfile();
    }

    console.log(`[First Password Changed] Account '${cleanUser}' set new password.`);
    return res.json({ success: true, message: '비밀번호 변경이 성공적으로 완료되었습니다.' });
  }

  res.status(404).json({ error: '해당 사용자를 찾을 수 없습니다.' });
});

// 사용자 프로필 조회 API
app.get('/api/user/profile', (req, res) => {
  const reqUsername = (req.query.username || '').toString().trim().toLowerCase();
  if (!reqUsername) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  const matched = usersList.find(u => u.username.toLowerCase() === reqUsername || (reqUsername === 'admin' && u.id === 1));
  if (matched) {
    return res.json({
      username: matched.username,
      nickname: matched.nickname,
      level: matched.level,
      lastLoginAt: matched.lastLoginAt,
      isFirstLogin: matched.isFirstLogin === true
    });
  }

  res.status(404).json({ error: 'User not found' });
});

// 사용자 프로필 및 레벨 수정 API
app.put('/api/user/profile', (req, res) => {
  const { username, nickname, newPassword, level } = req.body;
  const targetEmail = (username || '').toString().trim().toLowerCase();
  
  const matchedIndex = usersList.findIndex(u => u.username.toLowerCase() === targetEmail || (targetEmail === 'admin' && u.id === 1));
  if (matchedIndex !== -1) {
    if (nickname && nickname.trim()) usersList[matchedIndex].nickname = nickname.trim();
    if (newPassword && newPassword.trim()) usersList[matchedIndex].password = newPassword.trim();
    if (level) usersList[matchedIndex].level = level;
    saveUsersList();

    if (matchedIndex === 0) {
      userProfile.nickname = usersList[0].nickname;
      userProfile.password = usersList[0].password;
      userProfile.level = usersList[0].level;
      saveUserProfile();
    }

    return res.json({
      success: true,
      user: {
        username: usersList[matchedIndex].username,
        nickname: usersList[matchedIndex].nickname,
        level: usersList[matchedIndex].level,
        lastLoginAt: usersList[matchedIndex].lastLoginAt
      }
    });
  }

  if (nickname && nickname.trim()) userProfile.nickname = nickname.trim();
  if (newPassword && newPassword.trim()) userProfile.password = newPassword.trim();
  if (level) userProfile.level = level;
  saveUserProfile();

  res.json({
    success: true,
    user: {
      username: userProfile.username,
      nickname: userProfile.nickname,
      level: userProfile.level || 'admin',
      lastLoginAt: userProfile.lastLoginAt
    }
  });
});

// ── 계정 관리 API ──
// 계정 전체 목록 조회
app.get('/api/users', (req, res) => {
  res.json(usersList.map(u => ({
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    level: u.level,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt
  })));
});

// 신규 계정 생성
app.post('/api/users', (req, res) => {
  const { username, nickname, password, level } = req.body;
  if (!username || !nickname || !password) {
    return res.status(400).json({ error: '아이디(이메일), 닉네임, 비밀번호를 모두 입력해주세요.' });
  }

  const cleanEmail = username.trim().toLowerCase();
  const exists = usersList.some(u => u.username.toLowerCase() === cleanEmail);
  if (exists) {
    return res.status(400).json({ error: '이미 존재하거나 사용 중인 아이디(이메일)입니다.' });
  }

  const newUser = {
    id: Date.now(),
    username: cleanEmail,
    nickname: nickname.trim(),
    password: password.trim(),
    level: level === 'admin' ? 'admin' : 'user',
    isFirstLogin: true, // 최초 로그인 시 비밀번호 변경 유도
    lastLoginAt: '기록 없음 (미접속)',
    createdAt: getCurrentTime()
  };

  usersList.push(newUser);
  saveUsersList();
  console.log(`[User Created] Email: ${cleanEmail}, Level: ${newUser.level}`);
  res.json({ success: true, user: newUser });
});

// 비밀번호 무조건 'happy2690'으로 초기화
app.post('/api/users/:id/reset-password', (req, res) => {
  const id = parseInt(req.params.id);
  const targetUser = usersList.find(u => u.id === id);
  if (!targetUser) {
    return res.status(404).json({ error: '해당 계정을 찾을 수 없습니다.' });
  }

  targetUser.password = 'happy2690';
  targetUser.isFirstLogin = true; // 비밀번호 초기화 후 첫 로그인 시 변경 유도
  saveUsersList();

  if (id === 1 || targetUser.username.toLowerCase() === userProfile.username.toLowerCase()) {
    userProfile.password = 'happy2690';
    saveUserProfile();
  }

  console.log(`[Password Reset] User ID ${id} (${targetUser.username}) reset to 'happy2690'`);
  res.json({ success: true, message: `비밀번호가 'happy2690'으로 초기화되었습니다.` });
});

// 계정 정보/권한레벨 수정
app.put('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { nickname, level } = req.body;
  const targetIndex = usersList.findIndex(u => u.id === id);
  if (targetIndex === -1) {
    return res.status(404).json({ error: '해당 계정을 찾을 수 없습니다.' });
  }

  if (nickname) usersList[targetIndex].nickname = nickname.trim();
  if (level) usersList[targetIndex].level = level;

  saveUsersList();
  res.json({ success: true, user: usersList[targetIndex] });
});

// 계정 삭제
app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (id === 1) {
    return res.status(400).json({ error: '최고 관리자 계정은 삭제할 수 없습니다.' });
  }
  usersList = usersList.filter(u => u.id !== id);
  saveUsersList();
  res.json({ success: true });
});

// 1. URL 수집 전용 (빠른 탐색)
app.post('/api/discover', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) targetUrl = 'http://' + targetUrl;
    
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
  const { url, name, data, interval = 30, schedule, createdBy } = req.body;
  
  const newTarget = {
    id: Date.now(),
    name: name || url.replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0].toUpperCase(),
    url: url,
    status: 'active',
    data: data,
    interval: interval,
    schedule: schedule || { interval, paused: false, activeHours: 'all' },
    createdBy: (createdBy || 'admin@happyict.co.kr').trim().toLowerCase(),
    timestamp: getCurrentTime(),
    history: [{ timestamp: getCurrentTime(), results: data }],
    previewUrl: `https://image.thum.io/get/delay/5/width/1024/crop/800/${url.startsWith('http') ? url : 'http://' + url}`
  };

  targets.push(newTarget);
  saveData();

  setupTimer(newTarget.id);

  console.log(`[Register] Target added: ${url} by [${newTarget.createdBy}]`);
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

app.get('/api/targets', (req, res) => {
  const cleanTargets = targets.map(t => ({
    ...t,
    createdBy: (t.createdBy || 'admin@happyict.co.kr').toLowerCase()
  }));
  res.json(cleanTargets);
});

app.delete('/api/targets/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (schedulers[id]) {
    clearInterval(schedulers[id]);
    delete schedulers[id];
  }
  targets = targets.filter(t => t && t.id !== id);
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
app.post('/api/ai-analyze', async (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: '분석할 URL을 입력해 주세요.' });

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let html = '';
    let isHttps = url.startsWith('https://');

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OmniSight-AI-Crawler/1.0' }
      });
      html = await response.text();
    } catch (err) {
      console.warn(`[AI Analyze] Fetch warning for ${url}:`, err.message);
    } finally {
      clearTimeout(timeoutId);
    }

    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    const langText = langMatch ? langMatch[1] : '';

    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["']/i);

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const titleText = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    const descriptionText = descMatch ? descMatch[1].trim() : '';

    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
    const schemaMatch = html.match(/application\/ld\+json/i);
    const faqMatch = html.match(/(faq|frequently asked questions|Q&A|질문|답변|Q\.|A\.)/i);
    const numericMatch = html.match(/(\d+[\.\,\%원달러명개건회초분시간점배]|https?:\/\/|\d{4}-\d{2}-\d{2})/g) || [];

    const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    const imgAltMatches = html.match(/<img[^>]*alt=["']([^"']+)["'][^>]*>/gi) || [];

    // ── 1. 글로벌 SEO 가중치 세분화 (Google Lighthouse 표준) ──
    let titleScore = titleText.length >= 10 && titleText.length <= 60 ? 20 : titleText.length > 0 ? 10 : 0;
    let descScore = descriptionText.length >= 40 && descriptionText.length <= 160 ? 20 : descriptionText.length > 0 ? 10 : 0;
    let h1Score = h1Matches.length === 1 ? 15 : h1Matches.length > 1 ? 8 : 0;
    let sslScore = isHttps ? 15 : 0;
    let ogScore = (ogTitleMatch && ogImageMatch) ? 15 : ogTitleMatch ? 8 : 0;
    let altScore = imgMatches.length === 0 ? 15 : (imgAltMatches.length / imgMatches.length >= 0.7) ? 15 : imgAltMatches.length > 0 ? 8 : 0;

    const seoScore = Math.min(100, titleScore + descScore + h1Score + sslScore + ogScore + altScore);

    const seoChecks = [
      {
        id: 'title',
        title: 'Title 태그 최적화 (20%)',
        status: titleScore === 20 ? 'passed' : titleScore === 10 ? 'warning' : 'failed',
        value: titleText ? `'${titleText}' (${titleText.length}자)` : 'Title 태그 누락됨',
        desc: '검색 엔진 결과(SERP)의 대표 제목입니다. (글로벌 표준 권장: 10자 ~ 60자)'
      },
      {
        id: 'description',
        title: 'Meta Description 요약 (20%)',
        status: descScore === 20 ? 'passed' : descScore === 10 ? 'warning' : 'failed',
        value: descriptionText ? `'${descriptionText.slice(0, 45)}...' (${descriptionText.length}자)` : 'Description 누락됨',
        desc: '검색 클릭률(CTR)에 결정적인 영향을 미치는 요약 설명문입니다. (권장: 40자 ~ 160자)'
      },
      {
        id: 'h1',
        title: 'H1 헤딩 구조 단일성 (15%)',
        status: h1Score === 15 ? 'passed' : h1Score === 8 ? 'warning' : 'failed',
        value: `H1 태그 ${h1Matches.length}개 / H2 태그 ${h2Matches.length}개`,
        desc: '페이지의 핵심 주제를 나타내는 H1 태그는 문맥 혼선을 방지하기 위해 오직 1개여야 합니다.'
      },
      {
        id: 'ssl',
        title: 'SSL (HTTPS) 보안 프로토콜 (15%)',
        status: sslScore === 15 ? 'passed' : 'failed',
        value: isHttps ? 'HTTPS 보안 연결 적용됨' : 'HTTP 보안 미적용 (경고 대상)',
        desc: 'Google 검색 인덱싱 알고리즘의 필수 패널티/가산점 보안 표준입니다.'
      },
      {
        id: 'og_tags',
        title: 'Open Graph 소셜 메타 태그 (15%)',
        status: ogScore === 15 ? 'passed' : ogScore === 8 ? 'warning' : 'failed',
        value: (ogTitleMatch && ogImageMatch) ? 'og:title & og:image 완비' : ogTitleMatch ? 'og:image 누락' : 'OG 태그 전무',
        desc: '카카오톡, 메신저, SNS 공유 시 대표 썸네일과 제목 데이터를 표출합니다.'
      },
      {
        id: 'images_alt',
        title: '이미지 Alt 대체 텍스트 비율 (15%)',
        status: altScore === 15 ? 'passed' : altScore === 8 ? 'warning' : 'failed',
        value: `전체 ${imgMatches.length}개 중 ${imgAltMatches.length}개 작성 (작성률 ${imgMatches.length > 0 ? Math.round((imgAltMatches.length / imgMatches.length) * 100) : 100}%)`,
        desc: '시각 장애인 접근성(W3C WCAG) 및 검색 로봇 이미지 검색 노출 기준입니다.'
      }
    ];

    // ── 2. 글로벌 GEO 가중치 세분화 (Princeton GEO Paper 표준) ──
    let schemaScore = schemaMatch ? 30 : 0;
    let faqScore = faqMatch ? 25 : 0;
    let numericScore = numericMatch.length >= 10 ? 25 : numericMatch.length >= 3 ? 15 : 5;
    let depthScore = html.length >= 3000 ? 20 : html.length >= 1000 ? 12 : 5;

    const geoScore = Math.min(100, schemaScore + faqScore + numericScore + depthScore);

    const geoChecks = [
      {
        id: 'schema_org',
        title: 'Schema.org JSON-LD 구조화 데이터 (30%)',
        status: schemaScore === 30 ? 'passed' : 'failed',
        value: schemaMatch ? 'JSON-LD 구조화 태그 감지됨' : 'JSON-LD 미구현 (AI 인덱싱 감점)',
        desc: 'ChatGPT Search / Perplexity AI 로봇이 사이트 엔티티 및 지식 그래프로 직접 추출하는 1순위 데이터 표준입니다.'
      },
      {
        id: 'faq_block',
        title: 'FAQ / Q&A 대화형 프롬프트 구조 (25%)',
        status: faqScore === 25 ? 'passed' : 'warning',
        value: faqMatch ? '문답형(Q&A) 대화 구조 감지됨' : '대화형 문답 패턴 부족',
        desc: '프롬프트 대답 조립 시 AI 검색 엔진이 직접 인용문(Citations)으로 발췌하기 가장 쉬운 구조입니다.'
      },
      {
        id: 'numeric_density',
        title: '수치 통계 & 근거 데이터 밀도 (25%)',
        status: numericScore === 25 ? 'passed' : numericScore === 15 ? 'warning' : 'failed',
        value: `숫자/통계/단위 데이터 ${numericMatch.length}개 발견`,
        desc: 'Princeton 연구 결과, 명확한 숫자와 통계 수치가 기재된 콘텐츠가 생성형 AI 답변 인용 확률 40% 이상 높습니다.'
      },
      {
        id: 'content_depth',
        title: '세만틱 텍스트 깊이 & 정보용량 (20%)',
        status: depthScore === 20 ? 'passed' : 'warning',
        value: `HTML 텍스트 세만틱 용량 약 ${(html.length / 1024).toFixed(1)} KB`,
        desc: 'RAG (Retrieval-Augmented Generation) AI 지식베이스 검색에 활용될 텍스트 정보의 깊이입니다.'
      }
    ];

    // 생성형 AI 모델별 가중치 적용 인용 확률 계산
    const chatgptProb = Math.min(99, Math.round(schemaScore * 1.1 + faqScore * 1.0 + (seoScore * 0.4)));
    const perplexityProb = Math.min(99, Math.round(numericScore * 1.4 + faqScore * 1.2 + schemaScore * 0.9));
    const geminiProb = Math.min(99, Math.round(sslScore * 1.2 + schemaScore * 1.1 + (seoScore * 0.5)));
    const claudeProb = Math.min(99, Math.round(depthScore * 1.5 + faqScore * 1.2 + numericScore * 1.0));

    const seoRecommendations = [
      titleScore < 20 ? `[Title 태그] 현재 '${titleText || '미작성'}' 글자수를 10자~60자 사이로 조정하고 브랜드 및 서비스 키워드를 명시하세요.` : 'Title 태그가 글로벌 최적 가이드라인을 충족합니다.',
      descScore < 20 ? `[Meta Description] 메타 설명을 40자~160자 사이로 작성하여 검색 클릭률(CTR)을 향상시키세요.` : 'Meta Description 태그가 올바르게 설정되어 있습니다.',
      h1Score < 15 ? `[H1 태그] 페이지 내 H1 태그를 정확히 1개로 단일화하여 문서 구조의 주도성을 높이세요.` : 'H1 및 H2 문서 구조가 적절합니다.',
      altScore < 15 ? `[Alt 대체 텍스트] 이미지 ${imgMatches.length - imgAltMatches.length}개에 alt="..." 대체 텍스트를 부여해 이미지 검색 지수를 높이세요.` : '모든 이미지에 Alt 태그가 잘 부여되어 있습니다.'
    ];

    const geoRecommendations = [
      schemaScore === 0 ? '[Schema.org 최적화] <script type="application/ld+json"> 구조화 데이터를 추가하면 ChatGPT Search와 Perplexity에서 인용률이 최대 50% 향상됩니다.' : 'Schema.org JSON-LD 구조화 태그가 우수하게 구현되어 있습니다.',
      faqScore === 0 ? '[Q&A 콘텐츠 구조] 자주 묻는 질문(FAQ)이나 "Q. ~란?" 문답형 단락을 추가하여 AI 답변 인용 가능성을 높이세요.' : '대화형 Q&A 문맥 구조가 생성형 AI 답변 구성에 친화적입니다.',
      numericScore < 25 ? '[E-E-A-T 통계 수치] 텍스트 내 구체적인 통계 수치(%, 수량, 수치 데이터)를 추가하여 AI 엔진의 신뢰도 지수를 끌어올리세요.' : '수치 통계 및 객관적 데이터 지표가 풍부하게 포함되어 있습니다.'
    ];

    res.json({
      success: true,
      url: url,
      analyzedAt: getCurrentTime(),
      seo: {
        score: seoScore,
        statusLabel: seoScore >= 80 ? '우수' : seoScore >= 60 ? '보통' : '개선 필요',
        checks: seoChecks,
        recommendations: seoRecommendations,
        suggestedCode: `<title>${titleText || '웹사이트 대표 제목'}</title>\n<meta name="description" content="${descriptionText || '웹사이트에 대한 설명글을 입력해 주세요.'}">\n<meta property="og:title" content="${titleText || '웹사이트 대표 제목'}">\n<meta property="og:description" content="${descriptionText || '웹사이트 설명문'}">`
      },
      geo: {
        score: geoScore,
        statusLabel: geoScore >= 80 ? '최적화됨' : geoScore >= 60 ? '양호' : 'AI 인덱싱 보강 필요',
        checks: geoChecks,
        aiCitationScores: {
          chatgpt: chatgptProb,
          perplexity: perplexityProb,
          gemini: geminiProb,
          claude: claudeProb
        },
        recommendations: geoRecommendations,
        suggestedCode: `<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "WebSite",\n  "name": "${titleText || '웹사이트명'}",\n  "url": "${url}",\n  "description": "${descriptionText || '웹사이트 설명'}"\n}\n</script>`
      }
    });
  } catch (err) {
    console.error('[AI Analyze Error]', err);
    res.status(500).json({ error: 'AI 분석 처리 중 오류가 발생했습니다.' });
  }
});

// 프론트엔드 정적 파일 서빙 (배포용)
const clientDistPath = path.resolve(__dirname, '../dist');

// 정적 자산 서빙 (JS)
app.get(['/assets/*.js', '*.js'], (req, res) => {
  try {
    const assetsDir = path.join(clientDistPath, 'assets');
    const files = fs.readdirSync(assetsDir);
    const jsFile = files.find(f => f.endsWith('.js'));
    if (jsFile) {
      const content = fs.readFileSync(path.join(assetsDir, jsFile));
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(content);
    }
  } catch (e) {
    console.error('[Asset Error]', e);
  }
  res.status(404).send('JS not found');
});

// 정적 자산 서빙 (CSS)
app.get(['/assets/*.css', '*.css'], (req, res) => {
  try {
    const assetsDir = path.join(clientDistPath, 'assets');
    const files = fs.readdirSync(assetsDir);
    const cssFile = files.find(f => f.endsWith('.css'));
    if (cssFile) {
      const content = fs.readFileSync(path.join(assetsDir, cssFile));
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(content);
    }
  } catch (e) {
    console.error('[Asset Error]', e);
  }
  res.status(404).send('CSS not found');
});

// 기타 정적 파일 (favicon 등)
app.use(express.static(clientDistPath));

// SPA 메인 페이지 서빙 (fs.readFileSync로 Windows 경로 인코딩 문제 원천 해결)
app.get('*', (req, res) => {
  try {
    const indexPath = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.send(html);
    }
  } catch (err) {
    console.error('[index.html Error]', err);
  }
  res.status(500).send('OmniSight index.html not found');
});

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIp();
loadData(); // 시작 시 데이터 복구

// 지원 포트 전체 동시 바인딩 (3002 기본, 3003, 3000, 8080)
const BIND_PORTS = [3002, 3003, 3000, 8080];
for (const p of BIND_PORTS) {
  try {
    const s = app.listen(p, '0.0.0.0', () => {
      console.log(`[OmniSight Server] Listening on port ${p} -> http://localhost:${p} / http://${localIp}:${p}`);
    });
    s.keepAliveTimeout = 2000;
    s.headersTimeout = 3000;
  } catch (err) {
    console.warn(`[Port ${p}] Failed to bind:`, err.message);
  }
}

// 브라우저 자동 실행 트리거 (Chrome에서 자동으로 새 탭 열기)
setTimeout(() => {
  try {
    exec('start http://localhost:3002');
    console.log('[Browser] Auto-launched http://localhost:3002 in default browser');
  } catch (e) {
    console.warn('[Browser Auto-launch Error]', e.message);
  }
}, 1000);
