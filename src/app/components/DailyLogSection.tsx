import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import {
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ImageOff,
  Image,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  CalendarDays,
  CalendarRange,
} from "lucide-react";

const C = {
  primary: "#0284c7",
  hover:   "#0369a1",
  lightBg: "#f0f9ff",
  lightBd: "#bae6fd",
  shadow:  "rgba(2,132,199,0.20)",
  badge:   "#e0f2fe",
};

const KO_DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const KO_MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

type ViewMode = "daily" | "weekly" | "monthly" | "custom";

type DayRecord = {
  date: string;
  time: string;
  path: string;
  status: number;
  brokenImg: boolean;
  loadTime: string;
};

// 가짜 데이터 생성 로직 제거

// ── 날짜 유틸 ────────────────────────────────────────────────
function toLocalISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekStart(dateStr: string): Date {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function formatDateKo(dateStr: string, withDay = true) {
  const d = new Date(dateStr + "T00:00:00");
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const dayKo = KO_DAYS[d.getDay()];
  return withDay ? `${mm}월 ${dd}일(${dayKo})` : `${mm}월 ${dd}일`;
}

function computeDateRange(
  mode: ViewMode,
  selectedDate: string,
  year: number,
  month: number,
  customFrom: string,
  customTo: string,
  today: string
): string[] {
  if (mode === "daily") return [selectedDate];

  if (mode === "weekly") {
    const start = getWeekStart(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return toLocalISODate(d);
    }).filter((d) => d <= today);
  }

  if (mode === "monthly") {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month - 1, i + 1);
      return toLocalISODate(d);
    }).filter((d) => d <= today);
  }

  if (mode === "custom") {
    if (!customFrom || !customTo || customFrom > customTo) return [];
    const dates: string[] = [];
    const d = new Date(customFrom + "T00:00:00");
    const end = new Date(Math.min(new Date(customTo + "T00:00:00").getTime(), new Date(today + "T00:00:00").getTime()));
    while (d <= end) {
      dates.push(toLocalISODate(d));
      d.setDate(d.getDate() + 1);
      if (dates.length > 90) break; // 최대 90일
    }
    return dates;
  }

  return [];
}

function daySummary(records: DayRecord[]) {
  const total = records.length;
  const ok = records.filter((r) => r.status === 200).length;
  const err = total - ok;
  const broken = records.filter((r) => r.brokenImg).length;
  const avg = total > 0 ? (records.reduce((a, r) => a + parseFloat(r.loadTime), 0) / total).toFixed(2) + "s" : "-";
  const rate = total > 0 ? Math.round((ok / total) * 100) : 0;
  return { total, ok, err, broken, avg, rate };
}

// ── 컴포넌트 ─────────────────────────────────────────────────
interface Props {
  targetName: string;
  targetId: number;
  history: any[];
}

export function DailyLogSection({ targetName, targetId, history }: Props) {
  const today = toLocalISODate(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  // 날짜 상태
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6); return toLocalISODate(d);
  });
  const [customTo, setCustomTo] = useState(today);

  // 펼침 상태
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null); // "HH:MM" (daily) or "DATE::HH:MM" (multi-day)

  // 필터
  const [filterPath, setFilterPath] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "ok" | "err">("all");

  // 페이지 (daily=시간슬롯 페이지, multi=날짜 페이지)
  const [page, setPage] = useState(1);
  const PAGE_SIZE = viewMode === "daily" ? 8 : 10;

  const resetPage = () => { setPage(1); setExpandedDate(null); setExpandedSlot(null); };

  // ── 날짜 범위 ──────────────────────────────────────────────
  const dateRange = useMemo(
    () => computeDateRange(viewMode, selectedDate, selectedYear, selectedMonth, customFrom, customTo, today),
    [viewMode, selectedDate, selectedYear, selectedMonth, customFrom, customTo, today]
  );

  // ── 전체 레코드 ────────────────────────────────────────────
  const allRecords = useMemo(() => {
    const todayStr = toLocalISODate(new Date());
    return history.flatMap((h) => {
      // 백엔드 timestamp는 "HH:MM:SS" 형식임
      const [time] = h.timestamp.split(' ');
      return h.results.map((r: any) => ({
        date: todayStr, // 현재는 당일 데이터 위주이므로 오늘 날짜로 매칭
        time: time,
        path: r.path,
        status: r.status,
        brokenImg: r.brokenImg,
        loadTime: r.loadTime
      }));
    });
  }, [history]);

  // ── 필터 적용 ────────────────────────��─────────────────────
  const filtered = useMemo(() =>
    allRecords.filter((r) => {
      const pOk = filterPath === "all" || r.path === filterPath;
      const sOk = filterStatus === "all" || (filterStatus === "ok" ? r.status === 200 : r.status !== 200);
      return pOk && sOk;
    }),
    [allRecords, filterPath, filterStatus]
  );

  const paths = useMemo(() => ["all", ...Array.from(new Set(allRecords.map((r) => r.path)))], [allRecords]);

  // ── 전체 통계 ──────────────────────────────────────────────
  const stats = useMemo(() => daySummary(allRecords), [allRecords]);

  // ── 네비게이션 레이블 ──────────────────────────────────────
  const navLabel = useMemo(() => {
    if (viewMode === "daily") return null;
    if (viewMode === "weekly") {
      const ws = getWeekStart(selectedDate);
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      return `${formatDateKo(toLocalISODate(ws))} ~ ${formatDateKo(toLocalISODate(we))}`;
    }
    if (viewMode === "monthly") return `${selectedYear}년 ${KO_MONTHS[selectedMonth - 1]}`;
    return null;
  }, [viewMode, selectedDate, selectedYear, selectedMonth]);

  // ── 네비��이션 핸들러 ──────────────────────────────────────
  const navPrev = () => {
    if (viewMode === "daily") {
      const d = new Date(selectedDate + "T00:00:00"); d.setDate(d.getDate() - 1); setSelectedDate(toLocalISODate(d));
    } else if (viewMode === "weekly") {
      const ws = getWeekStart(selectedDate); ws.setDate(ws.getDate() - 7); setSelectedDate(toLocalISODate(ws));
    } else if (viewMode === "monthly") {
      if (selectedMonth === 1) { setSelectedYear((y) => y - 1); setSelectedMonth(12); }
      else setSelectedMonth((m) => m - 1);
    }
    resetPage();
  };

  const navNext = () => {
    if (viewMode === "daily") {
      if (selectedDate >= today) return;
      const d = new Date(selectedDate + "T00:00:00"); d.setDate(d.getDate() + 1); setSelectedDate(toLocalISODate(d));
    } else if (viewMode === "weekly") {
      const ws = getWeekStart(selectedDate); ws.setDate(ws.getDate() + 7);
      if (toLocalISODate(ws) > today) return;
      setSelectedDate(toLocalISODate(ws));
    } else if (viewMode === "monthly") {
      const curYear = new Date().getFullYear();
      const curMonth = new Date().getMonth() + 1;
      if (selectedYear > curYear || (selectedYear === curYear && selectedMonth >= curMonth)) return;
      if (selectedMonth === 12) { setSelectedYear((y) => y + 1); setSelectedMonth(1); }
      else setSelectedMonth((m) => m + 1);
    }
    resetPage();
  };

  const navNextDisabled = useMemo(() => {
    if (viewMode === "daily") return selectedDate >= today;
    if (viewMode === "weekly") { const ws = getWeekStart(selectedDate); const next = new Date(ws); next.setDate(next.getDate() + 7); return toLocalISODate(next) > today; }
    if (viewMode === "monthly") { const cy = new Date().getFullYear(); const cm = new Date().getMonth() + 1; return selectedYear > cy || (selectedYear === cy && selectedMonth >= cm); }
    return true;
  }, [viewMode, selectedDate, selectedYear, selectedMonth, today]);

  // ── CSV 다운로드 ───────────────────────────────────────────
  const downloadCSV = () => {
    const isMulti = viewMode !== "daily";
    const header = isMulti
      ? ["날짜", "시간", "경로", "상태코드", "이미지상태", "응답시간"]
      : ["시간", "경로", "상태코드", "이미지상태", "응답시간"];
    const rows = allRecords.map((r) =>
      isMulti
        ? [r.date, r.time, r.path, String(r.status), r.brokenImg ? "이상" : "정상", r.loadTime]
        : [r.time, r.path, String(r.status), r.brokenImg ? "이상" : "정상", r.loadTime]
    );
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const suffix =
      viewMode === "daily" ? selectedDate
      : viewMode === "weekly" ? `week_${toLocalISODate(getWeekStart(selectedDate))}`
      : viewMode === "monthly" ? `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`
      : `${customFrom}_${customTo}`;
    a.download = `omnisight_${targetName}_${suffix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── 일일 모드: 시간 슬롯 그룹 ──────────────────────────────
  const timeGroups = useMemo(() => {
    if (viewMode !== "daily") return [];
    const map: Record<string, DayRecord[]> = {};
    filtered.forEach((r) => { if (!map[r.time]) map[r.time] = []; map[r.time].push(r); });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [viewMode, filtered]);

  // ── 멀티 모드: 날짜 그룹 ───────────────────────────────────
  const dateGroups = useMemo(() => {
    if (viewMode === "daily") return [];
    return dateRange.map((dateStr) => {
      const dayAll = allRecords.filter((r) => r.date === dateStr);
      const dayFiltered = filtered.filter((r) => r.date === dateStr);
      return { dateStr, dayAll, dayFiltered };
    });
  }, [viewMode, dateRange, allRecords, filtered]);

  // 페이지네이션
  const items = viewMode === "daily" ? timeGroups : dateGroups;
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const pagedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const MODE_TABS: { id: ViewMode; label: string; icon: ReactNode }[] = [
    { id: "daily",   label: "일일",      icon: <Clock size={13} /> },
    { id: "weekly",  label: "주간",      icon: <CalendarDays size={13} /> },
    { id: "monthly", label: "월간",      icon: <Calendar size={13} /> },
    { id: "custom",  label: "직접 지정", icon: <CalendarRange size={13} /> },
  ];

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {/* ── 헤더 (한 줄) ─────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2">

          {/* 제목 */}
          <div className="flex items-center gap-1.5 flex-shrink-0 mr-1">
            <Calendar size={15} style={{ color: C.primary }} />
            <h3 className="text-gray-800 whitespace-nowrap" style={{ fontWeight: 700, fontSize: "0.875rem" }}>
              모니터링 기록 조회
            </h3>
          </div>

          {/* 모드 탭 */}
          <div className="flex items-center gap-0.5 p-1 rounded-xl bg-gray-100 flex-shrink-0">
            {MODE_TABS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => { setViewMode(id); resetPage(); setFilterPath("all"); setFilterStatus("all"); }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap"
                style={{
                  fontSize: "0.6875rem", fontWeight: 700,
                  backgroundColor: viewMode === id ? C.primary : "transparent",
                  color: viewMode === id ? "#fff" : "#6b7280",
                  boxShadow: viewMode === id ? `0 2px 8px ${C.shadow}` : "none",
                }}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* 날짜 선택 — 인라인 */}
          {viewMode === "daily" && (
            <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
              <button onClick={navPrev} className="p-1.5 hover:bg-gray-100 transition-colors">
                <ChevronLeft size={14} className="text-gray-500" />
              </button>
              <input
                type="date" value={selectedDate} max={today}
                onChange={(e) => { setSelectedDate(e.target.value); resetPage(); }}
                className="outline-none bg-transparent px-1 py-1.5 text-gray-700 cursor-pointer"
                style={{ fontSize: "0.8125rem", fontWeight: 600 }}
              />
              <button onClick={navNext} disabled={navNextDisabled} className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-30">
                <ChevronRight size={14} className="text-gray-500" />
              </button>
            </div>
          )}

          {(viewMode === "weekly" || viewMode === "monthly") && (
            <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
              <button onClick={navPrev} className="p-1.5 hover:bg-gray-100 transition-colors">
                <ChevronLeft size={14} className="text-gray-500" />
              </button>
              <span className="px-3 py-1.5 text-gray-700 whitespace-nowrap" style={{ fontSize: "0.8125rem", fontWeight: 700, minWidth: 180, textAlign: "center" }}>
                {navLabel}
              </span>
              <button onClick={navNext} disabled={navNextDisabled} className="p-1.5 hover:bg-gray-100 transition-colors disabled:opacity-30">
                <ChevronRight size={14} className="text-gray-500" />
              </button>
            </div>
          )}

          {viewMode === "custom" && (
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <span className="text-gray-400 whitespace-nowrap" style={{ fontSize: "0.625rem", fontWeight: 700 }}>시작</span>
                <input
                  type="date" value={customFrom} max={customTo || today}
                  onChange={(e) => { setCustomFrom(e.target.value); resetPage(); }}
                  className="outline-none bg-transparent text-gray-700 cursor-pointer"
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                />
              </div>
              <span className="text-gray-400" style={{ fontSize: "0.75rem" }}>~</span>
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                <span className="text-gray-400 whitespace-nowrap" style={{ fontSize: "0.625rem", fontWeight: 700 }}>종료</span>
                <input
                  type="date" value={customTo} min={customFrom} max={today}
                  onChange={(e) => { setCustomTo(e.target.value); resetPage(); }}
                  className="outline-none bg-transparent text-gray-700 cursor-pointer"
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                />
              </div>
              {dateRange.length > 0 && (
                <span className="px-2 py-1 rounded-lg whitespace-nowrap" style={{ fontSize: "0.6875rem", fontWeight: 700, backgroundColor: C.badge, color: C.primary }}>
                  {dateRange.length}일간
                </span>
              )}
            </div>
          )}

          {/* 다운로드 — 오른쪽 끝 */}
          {dateRange.length > 0 && (
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white transition-all flex-shrink-0 ml-auto"
              style={{ backgroundColor: C.primary, fontSize: "0.6875rem", fontWeight: 700, boxShadow: `0 3px 10px ${C.shadow}` }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.hover)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.primary)}
            >
              <Download size={12} />
              CSV 다운로드
            </button>
          )}
        </div>
      </div>

      {/* ── 요약 통계 ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
        {[
          { label: "전체 점검", value: stats.total.toLocaleString(), color: "#1f2937", bg: "white" },
          { label: "정상",       value: stats.ok.toLocaleString(),    color: "#16a34a", bg: "#f0fdf4" },
          { label: "오류",       value: stats.err.toLocaleString(),   color: "#dc2626", bg: "#fff5f5" },
          { label: "평균 응답",  value: stats.avgLoad,                color: C.primary, bg: C.lightBg },
        ].map((s) => (
          <div key={s.label} className="px-5 py-4" style={{ backgroundColor: s.bg }}>
            <p className="text-gray-400 mb-0.5 uppercase" style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── 필터 바 ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50">
        <Filter size={13} className="text-gray-400 flex-shrink-0" />
        <div className="flex flex-wrap gap-1.5">
          {paths.map((p) => (
            <button
              key={p}
              onClick={() => { setFilterPath(p); setPage(1); }}
              className="px-2.5 py-1 rounded-lg transition-all"
              style={{
                fontSize: "0.6875rem", fontWeight: 700,
                backgroundColor: filterPath === p ? C.primary : "#f3f4f6",
                color: filterPath === p ? "#fff" : "#6b7280",
              }}
            >
              {p === "all" ? "전체 경로" : p}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
        {(["all", "ok", "err"] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(1); }}
            className="px-2.5 py-1 rounded-lg transition-all"
            style={{
              fontSize: "0.6875rem", fontWeight: 700,
              backgroundColor: filterStatus === s ? (s === "ok" ? "#16a34a" : s === "err" ? "#dc2626" : C.primary) : "#f3f4f6",
              color: filterStatus === s ? "#fff" : "#6b7280",
            }}
          >
            {s === "all" ? "전체 상태" : s === "ok" ? "정상만" : "오류만"}
          </button>
        ))}
        <span className="ml-auto text-gray-400" style={{ fontSize: "0.6875rem" }}>
          {filtered.length.toLocaleString()}건 조회됨
        </span>
      </div>

      {/* ── 테이블 영역 ───────────────────────────────────────── */}
      {dateRange.length === 0 ? (
        <div className="py-14 text-center text-gray-300" style={{ fontSize: "0.8125rem" }}>
          조회 기간을 설정해 주세요.
        </div>
      ) : (
        <>
          {/* ── 일일 모드: 시간 슬롯 아코디언 ─────────────────── */}
          {viewMode === "daily" && (
            <div className="divide-y divide-gray-100">
              {(pagedItems as typeof timeGroups).length === 0 ? (
                <div className="py-12 text-center text-gray-300" style={{ fontSize: "0.8125rem" }}>
                  해당 조건의 기록이 없습니다.
                </div>
              ) : (
                (pagedItems as typeof timeGroups).map(([time, records]) => {
                  const open = expandedSlot === time;
                  const s = daySummary(records);
                  return (
                    <div key={time}>
                      <button
                        className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors text-left"
                        onClick={() => setExpandedSlot(open ? null : time)}
                      >
                        <div className="flex items-center gap-2 w-16 flex-shrink-0">
                          <Clock size={12} style={{ color: C.primary }} />
                          <span style={{ fontSize: "0.8125rem", fontWeight: 800, color: C.primary }}>{time}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "0.625rem", fontWeight: 700, backgroundColor: C.badge, color: C.primary }}>
                          {records.length}개 경로
                        </span>
                        {s.err > 0 && (
                          <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "0.625rem", fontWeight: 700, backgroundColor: "#fee2e2", color: "#dc2626" }}>
                            오류 {s.err}
                          </span>
                        )}
                        {s.broken > 0 && (
                          <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "0.625rem", fontWeight: 700, backgroundColor: "#fef9c3", color: "#92400e" }}>
                            이미지 {s.broken}
                          </span>
                        )}
                        <span className="text-gray-400 ml-auto mr-2" style={{ fontSize: "0.6875rem" }}>평균 {s.avg}</span>
                        {open ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
                      </button>
                      {open && <TimeDetailTable records={records} />}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── 주간/월간/직접 지정 모드: ��짜 아코디언 ──────── */}
          {viewMode !== "daily" && (
            <div className="divide-y divide-gray-100">
              {(pagedItems as typeof dateGroups).length === 0 ? (
                <div className="py-12 text-center text-gray-300" style={{ fontSize: "0.8125rem" }}>
                  해당 조건의 기록이 없습니다.
                </div>
              ) : (
                (pagedItems as typeof dateGroups).map(({ dateStr, dayAll, dayFiltered }) => {
                  const open = expandedDate === dateStr;
                  const s = daySummary(dayAll);
                  const showSlotKey = (slot: string) => `${dateStr}::${slot}`;

                  // 이 날짜의 시간 슬롯 그룹
                  const slotMap: Record<string, DayRecord[]> = {};
                  dayFiltered.forEach((r) => { if (!slotMap[r.time]) slotMap[r.time] = []; slotMap[r.time].push(r); });
                  const slots = Object.entries(slotMap).sort(([a], [b]) => a.localeCompare(b));

                  return (
                    <div key={dateStr}>
                      {/* 날짜 요약 행 */}
                      <button
                        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                        onClick={() => {
                          setExpandedDate(open ? null : dateStr);
                          setExpandedSlot(null);
                        }}
                      >
                        {/* 날짜 레이블 */}
                        <div className="flex-shrink-0 w-40">
                          <p style={{ fontSize: "0.8125rem", fontWeight: 800, color: "#1f2937" }}>
                            {formatDateKo(dateStr)}
                          </p>
                          <p style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>{dateStr}</p>
                        </div>

                        {/* 성공률 바 */}
                        <div className="flex-1 max-w-32 hidden sm:block">
                          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${s.rate}%`,
                                backgroundColor: s.rate >= 95 ? "#22c55e" : s.rate >= 80 ? "#f59e0b" : "#ef4444",
                              }}
                            />
                          </div>
                          <p style={{ fontSize: "0.5625rem", color: "#9ca3af", marginTop: 2 }}>{s.rate}% 정상</p>
                        </div>

                        {/* 통계 뱃지 */}
                        <div className="flex flex-wrap gap-1.5 ml-2">
                          <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "0.625rem", fontWeight: 700, backgroundColor: C.badge, color: C.primary }}>
                            {s.total}건
                          </span>
                          <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "0.625rem", fontWeight: 700, backgroundColor: "#dcfce7", color: "#15803d" }}>
                            ✓ {s.ok}
                          </span>
                          {s.err > 0 && (
                            <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "0.625rem", fontWeight: 700, backgroundColor: "#fee2e2", color: "#dc2626" }}>
                              ✕ {s.err}
                            </span>
                          )}
                          {s.broken > 0 && (
                            <span className="px-2 py-0.5 rounded-md" style={{ fontSize: "0.625rem", fontWeight: 700, backgroundColor: "#fef9c3", color: "#92400e" }}>
                              Img {s.broken}
                            </span>
                          )}
                        </div>

                        <span className="text-gray-400 ml-auto mr-2 hidden md:block" style={{ fontSize: "0.6875rem" }}>
                          평균 {s.avg}
                        </span>
                        {open ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
                      </button>

                      {/* 확장: 시간대별 아코디언 */}
                      {open && (
                        <div
                          className="border-t"
                          style={{ borderColor: C.lightBd, backgroundColor: C.lightBg }}
                        >
                          {slots.length === 0 ? (
                            <p className="px-8 py-6 text-gray-400" style={{ fontSize: "0.8125rem" }}>
                              해당 조건의 기록이 없습니다.
                            </p>
                          ) : (
                            <div className="divide-y" style={{ borderColor: C.lightBd + "60" }}>
                              {slots.map(([slot, slotRecords]) => {
                                const slotOpen = expandedSlot === showSlotKey(slot);
                                const ss = daySummary(slotRecords);
                                return (
                                  <div key={slot}>
                                    <button
                                      className="w-full flex items-center gap-4 pl-12 pr-6 py-3 hover:bg-sky-100/40 transition-colors text-left"
                                      onClick={() => setExpandedSlot(slotOpen ? null : showSlotKey(slot))}
                                    >
                                      <div className="flex items-center gap-2 w-14 flex-shrink-0">
                                        <Clock size={11} style={{ color: C.primary, opacity: 0.7 }} />
                                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.hover }}>{slot}</span>
                                      </div>
                                      <span className="px-2 py-0.5 rounded" style={{ fontSize: "0.5625rem", fontWeight: 700, backgroundColor: C.badge, color: C.primary }}>
                                        {slotRecords.length}개
                                      </span>
                                      {ss.err > 0 && (
                                        <span className="px-2 py-0.5 rounded" style={{ fontSize: "0.5625rem", fontWeight: 700, backgroundColor: "#fee2e2", color: "#dc2626" }}>
                                          오류 {ss.err}
                                        </span>
                                      )}
                                      <span className="text-gray-400 ml-auto mr-1" style={{ fontSize: "0.625rem" }}>{ss.avg}</span>
                                      {slotOpen ? <ChevronUp size={12} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={12} className="text-gray-400 flex-shrink-0" />}
                                    </button>
                                    {slotOpen && <TimeDetailTable records={slotRecords} indent />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ── 페이지네이션 ──────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <span className="text-gray-400" style={{ fontSize: "0.75rem" }}>
            {page} / {totalPages} 페이지 · {items.length}개 {viewMode === "daily" ? "시간대" : "날짜"}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-white transition-colors disabled:opacity-30"
            >
              <ChevronLeft size={13} className="text-gray-500" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-center transition-all"
                  style={{
                    fontSize: "0.75rem", fontWeight: 700,
                    backgroundColor: page === p ? C.primary : "transparent",
                    color: page === p ? "#fff" : "#6b7280",
                    border: page === p ? "none" : "1px solid #e5e7eb",
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-white transition-colors disabled:opacity-30"
            >
              <ChevronRight size={13} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 상세 레코드 테이블 (공용) ─────────────────────────────────
function TimeDetailTable({ records, indent = false }: { records: DayRecord[]; indent?: boolean }) {
  return (
    <div
      className="overflow-x-auto border-t"
      style={{ borderColor: C.lightBd, backgroundColor: indent ? "#e0f2fe22" : C.lightBg }}
    >
      <table className="w-full text-left" style={{ fontSize: "0.75rem" }}>
        <thead>
          <tr className="text-gray-400 border-b" style={{ borderColor: C.lightBd }}>
            {["URL Path", "Status", "이미지", "응답시간"].map((h) => (
              <th
                key={h}
                className="py-3 uppercase"
                style={{
                  paddingLeft: indent ? "3.5rem" : "1.5rem",
                  paddingRight: "1.5rem",
                  fontWeight: 700, fontSize: "0.625rem", letterSpacing: "0.04em",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: C.lightBd + "80" }}>
          {records.map((r, i) => (
            <tr
              key={i}
              className="transition-colors"
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#e0f2fe40")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
            >
              <td
                className="py-3 text-gray-800 font-mono"
                style={{ paddingLeft: indent ? "3.5rem" : "1.5rem", paddingRight: "1.5rem", fontWeight: 700 }}
              >
                {r.path}
              </td>
              <td className="px-6 py-3">
                <span className="flex items-center gap-1.5">
                  {r.status === 200
                    ? <CheckCircle2 size={13} style={{ color: "#16a34a" }} />
                    : <XCircle size={13} style={{ color: "#dc2626" }} />}
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      fontSize: "0.5625rem", fontWeight: 900,
                      backgroundColor: r.status === 200 ? "#dcfce7" : "#fee2e2",
                      color: r.status === 200 ? "#15803d" : "#dc2626",
                    }}
                  >
                    {r.status}
                  </span>
                </span>
              </td>
              <td className="px-6 py-3">
                {r.brokenImg
                  ? <span className="flex items-center gap-1 text-yellow-600" style={{ fontWeight: 700, fontSize: "0.6875rem" }}><ImageOff size={12} /> 이상</span>
                  : <span className="flex items-center gap-1 text-gray-400" style={{ fontSize: "0.6875rem" }}><Image size={12} /> 정상</span>}
              </td>
              <td className="px-6 py-3 text-gray-500 font-mono" style={{ fontSize: "0.6875rem" }}>{r.loadTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}