import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  PlusCircle,
  Bell,
  Radio,
  Link,
  FileCode,
  CheckCircle,
  Image,
  Gauge,
  Camera,
  Rocket,
  MailOpen,
  Plus,
  Info,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Inbox,
  User,
  Trash2,
  ImageOff,
  Clock,
  RefreshCw,
  Pause,
  Play,
  Settings2,
  CalendarClock,
  BarChart3,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  Menu,
  X,
  Globe,
} from "lucide-react";
import { OmniSightLogo } from "./components/OmniSightLogo";
import { DailyLogSection } from "./components/DailyLogSection";
import { UserGuide } from "./components/UserGuide";

// 하늘색 팔레트
const C = {
  primary:   "#0284c7",   // 메인 하늘색 (sky-600)
  hover:     "#0369a1",   // 호버 (sky-700)
  lightBg:   "#f0f9ff",   // 연한 배경 (sky-50)
  lightBd:   "#bae6fd",   // 연한 테두리 (sky-200)
  shadow:    "rgba(2,132,199,0.20)",
  badge:     "#e0f2fe",   // 배지 배경 (sky-100)
};

type PageData = {
  path: string;
  status: number;
  brokenImg: boolean;
  loadTime: string;
};

type Target = {
  id: number;
  name: string;
  url: string;
  status: "active";
  data: PageData[];
  timestamp: string;
  previewUrl: string;
  history?: any[];
};

type AlertChannel = {
  email: string;
  targetIds: number[];
};

type MonitorSchedule = {
  interval: number;        // minutes
  activeHours: "all" | "business" | "custom";
  customStart: string;
  customEnd: string;
  globalPaused: boolean;
};

type TargetSchedule = {
  targetId: number;
  useGlobal: boolean;
  interval: number;
  activeHours: "all" | "business" | "custom";
  customStart: string;
  customEnd: string;
  paused: boolean;
};

type TabName = "guide" | "dashboard" | "add" | "schedule" | "alerts";

function generateMockData(): PageData[] {
  const paths = ["/", "/login", "/shop", "/api/v2", "/cart"];
  return paths.map((p) => ({
    path: p,
    status: Math.random() > 0.05 ? 200 : 404,
    brokenImg: Math.random() > 0.85,
    loadTime: (Math.random() * 1.5 + 0.2).toFixed(2) + "s",
  }));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>("guide");
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentTargetId, setCurrentTargetId] = useState<number | null>(null);
  const [alertChannels, setAlertChannels] = useState<AlertChannel[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [selectedTargetIds, setSelectedTargetIds] = useState<number[]>([]);
  const [imgError, setImgError] = useState(false);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collectState, setCollectState] = useState<"idle" | "loading" | "collected">("idle");
  const [collectedUrls, setCollectedUrls] = useState<string[]>([]);

  const [globalSchedule, setGlobalSchedule] = useState<MonitorSchedule>({
    interval: 30,
    activeHours: "all",
    customStart: "09:00",
    customEnd: "18:00",
    globalPaused: false,
  });
  const [targetSchedules, setTargetSchedules] = useState<TargetSchedule[]>([]);

  const currentTarget = targets.find((t) => t.id === currentTargetId) || null;

  // ── 0. 초기 데이터 로드 ──────────────────────────────────────
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/targets');
        const data = await res.json();
        setTargets(data);
        
        // 백엔드 데이터로 스케줄 상태 복구
        if (data.length > 0) {
          const restoredSchedules = data.map((t: any) => ({
            targetId: t.id,
            useGlobal: false,
            ...(t.schedule || { interval: t.interval || 30, activeHours: "all", customStart: "09:00", customEnd: "18:00", paused: false })
          }));
          setTargetSchedules(restoredSchedules);
          if (currentTargetId === null) {
            setCurrentTargetId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load initial targets:", err);
      }
    };
    fetchInitialData();
  }, []);

  // ── 1. 스케줄 동기화 (Auto-save) ──────────────────────────────
  useEffect(() => {
    if (targets.length === 0 || targetSchedules.length === 0) return;

    // 글로벌 설정이 체크된 타겟은 글로벌 값을 덮어씌움
    const schedulesToSync = targetSchedules.map(sched => {
      if (sched.useGlobal) {
        return {
          ...sched,
          interval: globalSchedule.interval,
          activeHours: globalSchedule.activeHours,
          customStart: globalSchedule.customStart,
          customEnd: globalSchedule.customEnd,
          paused: globalSchedule.globalPaused
        };
      }
      return sched;
    });

    fetch('/api/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedules: schedulesToSync })
    }).catch(err => console.error("Schedule sync error:", err));
  }, [globalSchedule, targetSchedules]);

  // ── 2. 대시보드 활성 시 주기적으로 데이터 업데이트 (Polling) ──
  useEffect(() => {
    let interval: any;
    if (activeTab === 'dashboard') {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/targets');
          const data = await res.json();
          setTargets(data);
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 5000); // 5초마다 최신 데이터 확인
    }
    return () => clearInterval(interval);
  }, [activeTab]);

  const switchTab = (tab: TabName) => {
    // 탭 재진입 시 각 페이지 초기화
    if (tab === "add") {
      setCollectState("idle");
      setCollectedUrls([]);
      setUrlInput("");
    }
    if (tab === "dashboard") {
      setTableExpanded(false);
    }
    if (tab === "alerts") {
      setSelectedTargetIds([]);
      setEmailInput("");
    }
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const collectTargetUrls = async () => {
    const url = urlInput.trim();
    if (!url) { alert("URL을 입력해 주세요."); return; }
    setCollectState("loading");
    
    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      
      if (data.success) {
        setCollectedUrls(data.results.map((r: any) => r.path));
        (window as any)._lastCollection = data;
        setCollectState("collected");
      } else {
        alert(data.error || "수집에 실패했습니다.");
        setCollectState("idle");
      }
    } catch (err) {
      alert("서버와 통신 중 오류가 발생했습니다.");
      setCollectState("idle");
    }
  };

  const startMonitoring = async () => {
    const url = urlInput.trim();
    if (!url || collectedUrls.length === 0) return;
    
    const lastData = (window as any)._lastCollection;
    const finalUrl = lastData?.url || (url.startsWith('http') ? url : 'https://' + url);

    // 백엔드에 실제 등록 요청 (수집된 데이터 전송)
    setCollectState("loading");
    try {
      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: finalUrl,
          name: finalUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0].toUpperCase(),
          data: lastData?.results || [],
          interval: globalSchedule.interval,
          schedule: { 
            interval: globalSchedule.interval, 
            activeHours: globalSchedule.activeHours, 
            customStart: globalSchedule.customStart, 
            customEnd: globalSchedule.customEnd, 
            paused: globalSchedule.globalPaused 
          }
        })
      });
      const data = await response.json();
      
      if (data.success) {
        const newTarget = data.target;
        setTargets((prev) => [...prev, newTarget]);
        setTargetSchedules((prev) => [
          ...prev,
          { targetId: newTarget.id, useGlobal: true, interval: globalSchedule.interval, activeHours: "all", customStart: "09:00", customEnd: "18:00", paused: false },
        ]);
        setUrlInput("");
        setCurrentTargetId(newTarget.id);
        setImgError(false);
        setCollectState("idle");
        setCollectedUrls([]);
        setActiveTab("dashboard");
      }
    } catch (err) {
      alert("모니터링 등록 중 오류가 발생했습니다.");
      setCollectState("idle");
    }
  };

  const resetCollection = () => {
    setCollectState("idle");
    setCollectedUrls([]);
  };

  const selectTarget = (id: number) => {
    setCurrentTargetId(id);
    setImgError(false);
    setActiveTab("dashboard");
    setSidebarOpen(false);
  };

  const toggleTargetSelect = (id: number) => {
    setSelectedTargetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAllCheckboxes = () => {
    if (selectedTargetIds.length === targets.length) {
      setSelectedTargetIds([]);
    } else {
      setSelectedTargetIds(targets.map((t) => t.id));
    }
  };

  const addEmailWithSelection = () => {
    const email = emailInput.trim();
    if (!email || !email.includes("@")) return;
    if (selectedTargetIds.length === 0) {
      alert("알림을 수신할 사이트를 하나 이상 선택해 주세요.");
      return;
    }
    if (alertChannels.some((c) => c.email === email)) {
      alert("이미 등록된 이메일 주소입니다.");
      return;
    }
    setAlertChannels((prev) => [...prev, { email, targetIds: selectedTargetIds }]);
    setEmailInput("");
    setSelectedTargetIds([]);
  };

  const removeChannel = (email: string) => {
    setAlertChannels((prev) => prev.filter((c) => c.email !== email));
  };

  const deleteTarget = async (id: number) => {
    if (window.confirm("해당 사이트를 목록에서 삭제하시겠습니까?")) {
      try {
        await fetch(`/api/targets/${id}`, { method: 'DELETE' });
        setTargets((prev) => prev.filter((t) => t.id !== id));
        if (currentTargetId === id) {
          setCurrentTargetId(null);
          setActiveTab("guide");
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const stats = currentTarget
    ? {
        total: currentTarget.data.length,
        success: currentTarget.data.filter((d) => d.status === 200).length,
        broken: currentTarget.data.filter((d) => d.brokenImg).length,
      }
    : { total: 0, success: 0, broken: 0 };

  /* ── 공통 버튼 스타일 헬퍼 ── */
  const primaryBtn: React.CSSProperties = {
    backgroundColor: C.primary,
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.15s",
    whiteSpace: "nowrap",
  };

  const getTargetSchedule = (id: number): TargetSchedule =>
    targetSchedules.find((s) => s.targetId === id) ??
    { targetId: id, useGlobal: true, interval: globalSchedule.interval, activeHours: "all", customStart: "09:00", customEnd: "18:00", paused: false };

  const updateTargetSchedule = (id: number, patch: Partial<TargetSchedule>) => {
    setTargetSchedules((prev) => {
      const exists = prev.find((s) => s.targetId === id);
      if (exists) return prev.map((s) => s.targetId === id ? { ...s, ...patch } : s);
      return [...prev, { targetId: id, useGlobal: true, interval: globalSchedule.interval, activeHours: "all", customStart: "09:00", customEnd: "18:00", paused: false, ...patch }];
    });
  };

  const intervalOptions = [
    { label: "5분",  value: 5 },
    { label: "15분", value: 15 },
    { label: "30분", value: 30 },
    { label: "1시간", value: 60 },
    { label: "3시간", value: 180 },
    { label: "6시간", value: 360 },
    { label: "12시간", value: 720 },
    { label: "24시간", value: 1440 },
  ];

  const timesPerDay = (interval: number) => Math.round(1440 / interval);

  const activeHoursMinutes = () => {
    if (globalSchedule.activeHours === "all") return 1440;
    if (globalSchedule.activeHours === "business") return 9 * 60; // 9h
    const [sh, sm] = globalSchedule.customStart.split(":").map(Number);
    const [eh, em] = globalSchedule.customEnd.split(":").map(Number);
    return Math.max(0, (eh * 60 + em) - (sh * 60 + sm));
  };

  const effectiveTimesPerDay = () => Math.max(1, Math.round(activeHoursMinutes() / globalSchedule.interval));

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ fontFamily: "'Pretendard', sans-serif", backgroundColor: "#f8fafc" }}
    >
      {/* ── 모바일 백드롭 ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.32)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── 사이드바 ── */}
      <aside
        className={[
          "bg-white border-r flex-shrink-0 flex flex-col",
          "fixed top-0 left-0 z-30 transition-all duration-300 overflow-hidden",
          "lg:static lg:z-auto lg:w-72",
          sidebarOpen ? "w-72 shadow-2xl lg:shadow-none" : "w-14",
        ].join(" ")}
        style={{ height: "100dvh" }}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-2 px-3 py-5 flex-shrink-0" style={{ minHeight: "4.5rem" }}>
          {/* 데스크탑: 로고 + 타이틀 */}
          <div className="hidden lg:flex items-center gap-2">
            <OmniSightLogo size={28} color={C.primary} />
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: C.primary }}>OmniSight</h1>
          </div>

          {/* 모바일: 토글 버튼 */}
          <button
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-colors"
            style={{ color: C.primary }}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="메뉴 열기/닫기"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* 모바일 펼쳐졌을 때: 로고 + 타이틀 */}
          {sidebarOpen && (
            <div className="lg:hidden flex items-center gap-2 overflow-hidden">
              <OmniSightLogo size={26} color={C.primary} />
              <h1 className="whitespace-nowrap" style={{ fontSize: "1.15rem", fontWeight: 700, color: C.primary }}>
                OmniSight
              </h1>
            </div>
          )}
        </div>

        <nav className="px-2 space-y-1">
          {(
            [
              { id: "guide",     icon: <BookOpen size={18} />,         label: "OmniSight 사용방법" },
              { id: "add",       icon: <PlusCircle size={18} />,       label: "신규 타겟 추가" },
              { id: "dashboard", icon: <LayoutDashboard size={18} />, label: "모니터링 대시보드" },
              { id: "schedule",  icon: <CalendarClock size={18} />,    label: "모니터링 주기 관리" },
              { id: "alerts",    icon: <Bell size={18} />,              label: "알림 설정" },
            ] as { id: TabName; icon: React.ReactNode; label: string }[]
          ).map((item) => (
            <div
              key={item.id}
              onClick={() => switchTab(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className="p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all"
              style={
                activeTab === item.id
                  ? { backgroundColor: C.lightBg, color: C.primary, borderRight: `4px solid ${C.primary}`, fontWeight: 600 }
                  : { color: "#4b5563" }
              }
              onMouseEnter={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9"; }}
              onMouseLeave={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={`whitespace-nowrap ${sidebarOpen ? "" : "hidden lg:inline"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </nav>

        <div className={`mt-8 flex-1 flex flex-col px-4 overflow-hidden ${sidebarOpen ? "" : "hidden lg:flex"}`}>
          <div className="flex justify-between items-center mb-4 px-2 text-gray-400">
            <h2 style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              등록된 사이트 목록
            </h2>
            <span style={{ fontSize: "0.625rem", backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>
              {targets.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pb-4" style={{ scrollbarWidth: "none" }}>
            {targets.length === 0 ? (
              <div className="p-4 border border-dashed rounded-xl text-center text-gray-400" style={{ fontSize: "0.6875rem" }}>
                사이트를 추가해 주세요
              </div>
            ) : (
              targets.map((t) => (
                <div
                  key={t.id}
                  className="relative group p-3 border rounded-xl bg-white cursor-pointer transition-all hover:shadow-md"
                  style={
                    currentTargetId === t.id
                      ? { borderColor: C.primary, backgroundColor: C.lightBg, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                      : { borderColor: "#f9fafb" }
                  }
                  onClick={() => selectTarget(t.id)}
                >
                  {/* 사이트 정보 */}
                  <div className="flex items-center gap-2 mb-1 pr-5">
                    <span
                      className="flex-shrink-0"
                      style={{ height: 7, width: 7, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }}
                    />
                    <span className="truncate" style={{ fontWeight: 700, fontSize: "0.75rem", letterSpacing: "-0.01em" }}>
                      {t.name}
                    </span>
                  </div>
                  <div className="truncate text-gray-400 pl-3.5" style={{ fontSize: "0.5625rem" }}>{t.url}</div>

                  {/* 삭제 버튼 — hover 시 표시 */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTarget(t.id); }}
                    title="삭제"
                    className="absolute top-2 right-2 flex items-center justify-center rounded-md transition-all"
                    style={{ width: 20, height: 20, backgroundColor: "transparent", color: "#9ca3af" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#fee2e2";
                      (e.currentTarget as HTMLElement).style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#9ca3af";
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`p-4 border-t text-gray-400 text-center ${sidebarOpen ? "" : "hidden lg:block"}`} style={{ fontSize: "0.625rem" }}>
          v1.4.0-SmartAlert
        </div>
      </aside>

      {/* 모바일: 아이콘 스트립 너비만큼 공간 확보 */}
      <div className="w-14 flex-shrink-0 lg:hidden" />

      {/* ── 메인 컨텐츠 ── */}
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f8fafc", scrollbarWidth: "none" }}>

        {/* [탭] 사용방법 가이드 */}
        {activeTab === "guide" && (
          <UserGuide onNavigate={(tab) => switchTab(tab as TabName)} />
        )}

        {/* [탭] 신규 타겟 추가 */}
        {activeTab === "add" && (
          <div className="p-8 md:p-12 max-w-4xl mx-auto">
            {/* 페이지 헤더 */}
            <div className="text-center mb-10">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ backgroundColor: C.lightBg, color: C.primary }}
              >
                <Plus size={28} />
              </div>
              <h2 className="text-gray-800 mb-2" style={{ fontSize: "1.875rem", fontWeight: 900 }}>
                새 모니터링 타겟 등록
              </h2>
              <p className="text-gray-500" style={{ fontSize: "0.9375rem" }}>
                감시할 사이트의 루트 URL을 입력하면 시스템이 자동으로 모든 하위 페이지를 수집합니다.
              </p>
            </div>

            {/* ── Phase 1: IDLE — URL 입력 폼 ── */}
            {collectState === "idle" && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
                <div>
                  <label className="block text-gray-700 mb-2" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                    웹사이트 URL
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400" style={{ fontWeight: 500 }}>
                      https://
                    </span>
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && collectTargetUrls()}
                      placeholder="example.com"
                      className="w-full bg-gray-50 border border-transparent rounded-2xl outline-none transition-all"
                      style={{ paddingLeft: "5rem", paddingRight: "1rem", paddingTop: "1rem", paddingBottom: "1rem", fontSize: "1.125rem" }}
                      onFocus={(e) => { e.currentTarget.style.backgroundColor = "#fff"; e.currentTarget.style.boxShadow = `0 0 0 2px ${C.primary}`; }}
                      onBlur={(e) => { e.currentTarget.style.backgroundColor = "#f9fafb"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: "시각적 비교", desc: "픽셀 단위로 UI 깨짐을 감지합니다." },
                    { title: "이미지 전수 조사", desc: "깨진 이미지 URL을 모두 찾아냅니다." },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="p-4 border rounded-2xl cursor-pointer transition-all"
                      style={{ borderColor: "#e5e7eb" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.lightBd)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb")}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded" style={{ accentColor: C.primary }} />
                        <span className="text-gray-700" style={{ fontWeight: 700, fontSize: "0.875rem" }}>{item.title}</span>
                      </div>
                      <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>{item.desc}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={collectTargetUrls}
                  className="w-full text-white rounded-2xl flex items-center justify-center gap-2 transition-all"
                  style={{ ...primaryBtn, padding: "1rem", fontSize: "1.125rem", boxShadow: `0 10px 25px ${C.shadow}` }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.hover)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.primary)}
                >
                  <Globe size={18} /> 모니터링 타겟 수집
                </button>
              </div>
            )}

            {/* ── Phase 2: LOADING — 수집 중 ── */}
            {collectState === "loading" && (
              <div
                className="bg-white rounded-3xl shadow-sm border flex flex-col items-center justify-center gap-6 py-16"
              >
                {/* 스피너 + 지구 아이콘 */}
                <div className="relative flex items-center justify-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: C.lightBg }}
                  >
                    <Globe size={32} style={{ color: C.primary }} />
                  </div>
                  <svg
                    className="absolute inset-0 animate-spin"
                    width="80" height="80" viewBox="0 0 80 80"
                    fill="none"
                  >
                    <circle cx="40" cy="40" r="37" stroke={C.lightBd} strokeWidth="3" />
                    <path
                      d="M40 3 A37 37 0 0 1 77 40"
                      stroke={C.primary} strokeWidth="3" strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="text-center">
                  <p style={{ fontWeight: 700, fontSize: "1.125rem", color: "#111827" }}>URL 수집 중...</p>
                  <p className="text-gray-400 mt-1.5" style={{ fontSize: "0.875rem" }}>
                    <span className="font-mono" style={{ color: C.primary }}>https://{urlInput.trim()}</span>
                    {" "}에서 경로를 탐색하고 있습니다
                  </p>
                </div>

                {/* 점 애니메이션 */}
                <div className="flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: C.primary, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Phase 3: COLLECTED — 결과 표시 ── */}
            {collectState === "collected" && (
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">

                {/* 수집 완료 헤더 */}
                <div className="px-8 py-6 border-b" style={{ backgroundColor: C.lightBg }}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#dcfce7" }}
                      >
                        <CheckCircle size={22} style={{ color: "#16a34a" }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>수집 완료</p>
                        <p className="font-mono mt-0.5" style={{ fontSize: "0.8125rem", color: C.primary }}>
                          https://{urlInput.trim()}
                        </p>
                      </div>
                    </div>
                    <span
                      className="px-4 py-1.5 rounded-xl flex items-center gap-1.5"
                      style={{ backgroundColor: C.badge, color: C.primary, fontWeight: 700, fontSize: "0.875rem" }}
                    >
                      총 <strong>{collectedUrls.length}</strong>개 경로 발견
                    </span>
                  </div>
                </div>

                {/* URL 목록 */}
                <div className="px-8 pt-6 pb-4">
                  <p className="text-gray-400 mb-4 uppercase" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.07em" }}>
                    수집된 URL 목록
                  </p>
                  <div
                    className="space-y-2 overflow-y-auto pr-1"
                    style={{ maxHeight: "300px", scrollbarWidth: "thin", scrollbarColor: `${C.lightBd} transparent` }}
                  >
                    {collectedUrls.map((path, idx) => (
                      <div
                        key={path}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                        style={{ backgroundColor: "#f9fafb" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.lightBg)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#f9fafb")}
                      >
                        <span
                          className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: C.badge, color: C.primary, fontSize: "0.5625rem", fontWeight: 900 }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 font-mono text-gray-600" style={{ fontSize: "0.8125rem" }}>
                          <span className="text-gray-400">https://{urlInput.trim()}</span>
                          <span style={{ fontWeight: 700, color: "#374151" }}>{path}</span>
                        </span>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="px-8 pb-8 pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={resetCollection}
                    className="flex-1 py-3.5 rounded-2xl border flex items-center justify-center gap-2 transition-all"
                    style={{ borderColor: C.lightBd, color: C.primary, fontWeight: 700, fontSize: "0.9375rem", backgroundColor: "#fff" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.lightBg)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#fff")}
                  >
                    <RefreshCw size={16} /> 다시 조회하기
                  </button>
                  <button
                    onClick={startMonitoring}
                    className="flex-1 py-3.5 rounded-2xl text-white flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: C.primary, fontWeight: 700, fontSize: "0.9375rem", boxShadow: `0 10px 25px ${C.shadow}` }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.hover)}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.primary)}
                  >
                    <Rocket size={16} /> 모니터링 시작
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* [탭] 모니터링 주기 관리 */}
        {activeTab === "schedule" && (
          <div className="p-10 max-w-5xl mx-auto">
            {/* 헤더 */}
            <div className="flex items-center gap-4 mb-10">
              <div
                className="w-12 h-12 text-white rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.primary, boxShadow: `0 10px 25px ${C.shadow}` }}
              >
                <CalendarClock size={22} />
              </div>
              <div>
                <h2 className="text-gray-800" style={{ fontSize: "1.5rem", fontWeight: 700 }}>모니터링 주기 관리</h2>
                <p className="text-gray-500" style={{ fontSize: "0.875rem" }}>
                  전체 기본값과 사이트별 개별 주기를 설정하세요.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* 왼쪽: 글로벌 설정 */}
              <div className="lg:col-span-2 space-y-6">

                {/* 글로벌 일시정지 배너 */}
                {globalSchedule.globalPaused && (
                  <div
                    className="flex items-center gap-3 p-4 rounded-2xl border"
                    style={{ backgroundColor: "#eff6ff", borderColor: "#93c5fd" }}
                  >
                    <Pause size={16} style={{ color: "#1d4ed8" }} />
                    <p style={{ fontSize: "0.8125rem", color: "#1e3a8a", fontWeight: 600 }}>
                      전체 모니터링이 일시 정지 중입니다. 재개하려면 아래 버튼을 누르세요.
                    </p>
                  </div>
                )}

                {/* 기본 모니터링 간격 */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="flex items-center gap-2 text-gray-800" style={{ fontWeight: 700 }}>
                      <Clock size={16} style={{ color: C.primary }} /> 기본 모니터링 간격
                    </h3>
                    <button
                      onClick={() => setGlobalSchedule((s) => ({ ...s, globalPaused: !s.globalPaused }))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                      style={{
                        fontSize: "0.75rem", fontWeight: 700,
                        backgroundColor: globalSchedule.globalPaused ? "#dcfce7" : "#fef2e6",
                        color: globalSchedule.globalPaused ? "#16a34a" : C.primary,
                        border: `1px solid ${globalSchedule.globalPaused ? "#bbf7d0" : C.lightBd}`,
                      }}
                    >
                      {globalSchedule.globalPaused
                        ? <><Play size={13} /> 전체 재개</>
                        : <><Pause size={13} /> 전체 일시정지</>}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {intervalOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setGlobalSchedule((s) => ({ ...s, interval: opt.value }))}
                        className="px-4 py-2 rounded-xl transition-all"
                        style={{
                          fontSize: "0.8125rem", fontWeight: 600,
                          backgroundColor: globalSchedule.interval === opt.value ? C.primary : "#f3f4f6",
                          color: globalSchedule.interval === opt.value ? "#fff" : "#374151",
                          boxShadow: globalSchedule.interval === opt.value ? `0 4px 12px ${C.shadow}` : "none",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-400 mt-3" style={{ fontSize: "0.75rem" }}>
                    현재 간격: <span style={{ color: C.primary, fontWeight: 700 }}>
                      {intervalOptions.find((o) => o.value === globalSchedule.interval)?.label}
                    </span>마다 1회 실행
                  </p>
                </div>

                {/* 활성 시간대 */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <h3 className="flex items-center gap-2 text-gray-800 mb-6" style={{ fontWeight: 700 }}>
                    <Settings2 size={16} style={{ color: C.primary }} /> 모니터링 활성 시간대
                  </h3>
                  <div className="space-y-3">
                    {([
                      { value: "all",      label: "24시간 상시", desc: "매일 24시간 중단 없이 모니터링" },
                      { value: "business", label: "업무 시간 (09:00 ~ 18:00)", desc: "평일 업무 시간대만 모니터링" },
                      { value: "custom",   label: "직접 지정", desc: "시작·종료 시각을 직접 설정" },
                    ] as { value: MonitorSchedule["activeHours"]; label: string; desc: string }[]).map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-all"
                        style={{
                          borderColor: globalSchedule.activeHours === opt.value ? C.primary : "#e5e7eb",
                          backgroundColor: globalSchedule.activeHours === opt.value ? C.lightBg : "#fff",
                        }}
                      >
                        <input
                          type="radio"
                          name="activeHours"
                          value={opt.value}
                          checked={globalSchedule.activeHours === opt.value}
                          onChange={() => setGlobalSchedule((s) => ({ ...s, activeHours: opt.value }))}
                          style={{ accentColor: C.primary, marginTop: 2 }}
                        />
                        <div>
                          <p className="text-gray-800" style={{ fontSize: "0.875rem", fontWeight: 600 }}>{opt.label}</p>
                          <p className="text-gray-400" style={{ fontSize: "0.75rem" }}>{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {globalSchedule.activeHours === "custom" && (
                    <div className="flex items-center gap-4 mt-5 p-4 bg-gray-50 rounded-2xl">
                      <div className="flex-1">
                        <label className="block text-gray-500 mb-1" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>시작</label>
                        <input
                          type="time"
                          value={globalSchedule.customStart}
                          onChange={(e) => setGlobalSchedule((s) => ({ ...s, customStart: e.target.value }))}
                          className="w-full bg-white border rounded-xl outline-none px-3 py-2"
                          style={{ fontSize: "0.875rem", borderColor: C.lightBd }}
                        />
                      </div>
                      <span className="text-gray-400 mt-5" style={{ fontSize: "1.25rem" }}>~</span>
                      <div className="flex-1">
                        <label className="block text-gray-500 mb-1" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>종료</label>
                        <input
                          type="time"
                          value={globalSchedule.customEnd}
                          onChange={(e) => setGlobalSchedule((s) => ({ ...s, customEnd: e.target.value }))}
                          className="w-full bg-white border rounded-xl outline-none px-3 py-2"
                          style={{ fontSize: "0.875rem", borderColor: C.lightBd }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 사이트별 개별 설정 */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <h3 className="flex items-center gap-2 text-gray-800 mb-2" style={{ fontWeight: 700 }}>
                    <RefreshCw size={16} style={{ color: C.primary }} /> 사이트별 개별 주기 설정
                  </h3>
                  <p className="text-gray-400 mb-6" style={{ fontSize: "0.75rem" }}>
                    개별 설정을 켜면 해당 사이트에 모니터링 간격과 활성 시간대를 따로 적용할 수 있습니다.
                  </p>

                  {targets.length === 0 ? (
                    <div className="py-10 text-center border border-dashed rounded-2xl text-gray-300" style={{ fontSize: "0.8125rem" }}>
                      등록된 타겟이 없습니다. 먼저 신규 타겟을 추가해 주세요.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {targets.map((t) => {
                        const ts = getTargetSchedule(t.id);
                        const effectiveInterval = ts.useGlobal ? globalSchedule.interval : ts.interval;
                        const effectiveHoursLabel = ts.useGlobal
                          ? (globalSchedule.activeHours === "all" ? "24시간 상시"
                            : globalSchedule.activeHours === "business" ? "업무 시간"
                            : `${globalSchedule.customStart}~${globalSchedule.customEnd}`)
                          : (ts.activeHours === "all" ? "24시간 상시"
                            : ts.activeHours === "business" ? "업무 시간"
                            : `${ts.customStart}~${ts.customEnd}`);
                        return (
                          <div
                            key={t.id}
                            className="border rounded-2xl overflow-hidden transition-all"
                            style={{ borderColor: !ts.useGlobal ? C.lightBd : "#e5e7eb" }}
                          >
                            {/* ── 카드 헤더 ── */}
                            <div
                              className="flex items-center gap-3 px-5 py-4"
                              style={{ backgroundColor: !ts.useGlobal ? C.lightBg : "#f9fafb" }}
                            >
                              {/* 사이트 정보 */}
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-800 truncate" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>{t.name}</p>
                                <p className="text-gray-400 truncate" style={{ fontSize: "0.625rem" }}>{t.url}</p>
                              </div>

                              {/* 현재 설정 요약 뱃지 */}
                              <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                                <span
                                  className="px-2 py-0.5 rounded-md"
                                  style={{ fontSize: "0.625rem", fontWeight: 700, backgroundColor: ts.useGlobal ? "#f3f4f6" : C.badge, color: ts.useGlobal ? "#9ca3af" : C.primary }}
                                >
                                  {intervalOptions.find((o) => o.value === effectiveInterval)?.label}
                                </span>
                                <span
                                  className="px-2 py-0.5 rounded-md"
                                  style={{ fontSize: "0.625rem", fontWeight: 700, backgroundColor: ts.useGlobal ? "#f3f4f6" : C.badge, color: ts.useGlobal ? "#9ca3af" : C.primary }}
                                >
                                  {effectiveHoursLabel}
                                </span>
                              </div>

                              {/* 개별 설정 토글 */}
                              <button
                                onClick={() => updateTargetSchedule(t.id, { useGlobal: !ts.useGlobal })}
                                className="flex items-center gap-1 flex-shrink-0"
                                style={{ fontSize: "0.6875rem", fontWeight: 700, color: ts.useGlobal ? "#9ca3af" : C.primary }}
                              >
                                {ts.useGlobal
                                  ? <ToggleLeft size={24} style={{ color: "#d1d5db" }} />
                                  : <ToggleRight size={24} style={{ color: C.primary }} />}
                                <span style={{ whiteSpace: "nowrap" }}>{ts.useGlobal ? "글로벌" : "개별"}</span>
                              </button>

                              {/* 일시정지 */}
                              <button
                                onClick={() => updateTargetSchedule(t.id, { paused: !ts.paused })}
                                className="flex-shrink-0 p-2 rounded-xl transition-all"
                                title={ts.paused ? "재개" : "일시정지"}
                                style={{
                                  backgroundColor: ts.paused ? "#eff6ff" : "#f3f4f6",
                                  color: ts.paused ? "#1d4ed8" : "#9ca3af",
                                }}
                              >
                                {ts.paused ? <Play size={14} /> : <Pause size={14} />}
                              </button>
                            </div>

                            {/* ── 개별 설정 확장 영역 ── */}
                            {!ts.useGlobal && (
                              <div className="px-5 py-5 border-t space-y-6" style={{ borderColor: C.lightBd, backgroundColor: "#fffdf9" }}>

                                {/* 모니터링 간격 */}
                                <div>
                                  <p className="flex items-center gap-1.5 mb-3 text-gray-600" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                                    <Clock size={13} style={{ color: C.primary }} /> 모니터링 간격
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {intervalOptions.map((opt) => (
                                      <button
                                        key={opt.value}
                                        onClick={() => updateTargetSchedule(t.id, { interval: opt.value })}
                                        className="px-3 py-1.5 rounded-xl transition-all"
                                        style={{
                                          fontSize: "0.75rem", fontWeight: 600,
                                          backgroundColor: ts.interval === opt.value ? C.primary : "#f3f4f6",
                                          color: ts.interval === opt.value ? "#fff" : "#374151",
                                          boxShadow: ts.interval === opt.value ? `0 3px 8px ${C.shadow}` : "none",
                                        }}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* 활성 시간대 */}
                                <div>
                                  <p className="flex items-center gap-1.5 mb-3 text-gray-600" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                                    <Settings2 size={13} style={{ color: C.primary }} /> 활성 시간대
                                  </p>
                                  <div className="grid grid-cols-3 gap-2">
                                    {([
                                      { value: "all",      label: "24시간", sub: "상시" },
                                      { value: "business", label: "업무 시간", sub: "09:00~18:00" },
                                      { value: "custom",   label: "직접 지정", sub: "시각 설정" },
                                    ] as { value: TargetSchedule["activeHours"]; label: string; sub: string }[]).map((opt) => (
                                      <button
                                        key={opt.value}
                                        onClick={() => updateTargetSchedule(t.id, { activeHours: opt.value })}
                                        className="flex flex-col items-center py-3 rounded-xl border transition-all"
                                        style={{
                                          borderColor: ts.activeHours === opt.value ? C.primary : "#e5e7eb",
                                          backgroundColor: ts.activeHours === opt.value ? C.lightBg : "#fff",
                                        }}
                                      >
                                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: ts.activeHours === opt.value ? C.primary : "#374151" }}>
                                          {opt.label}
                                        </span>
                                        <span style={{ fontSize: "0.6rem", color: ts.activeHours === opt.value ? C.primary : "#9ca3af", marginTop: 2 }}>
                                          {opt.sub}
                                        </span>
                                      </button>
                                    ))}
                                  </div>

                                  {/* 커스텀 시각 입력 */}
                                  {ts.activeHours === "custom" && (
                                    <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-xl">
                                      <div className="flex-1">
                                        <label className="block text-gray-400 mb-1" style={{ fontSize: "0.625rem", fontWeight: 700 }}>시작</label>
                                        <input
                                          type="time"
                                          value={ts.customStart}
                                          onChange={(e) => updateTargetSchedule(t.id, { customStart: e.target.value })}
                                          className="w-full bg-white border rounded-lg outline-none px-2 py-1.5"
                                          style={{ fontSize: "0.8125rem", borderColor: C.lightBd }}
                                        />
                                      </div>
                                      <span className="text-gray-300 mt-4">~</span>
                                      <div className="flex-1">
                                        <label className="block text-gray-400 mb-1" style={{ fontSize: "0.625rem", fontWeight: 700 }}>종료</label>
                                        <input
                                          type="time"
                                          value={ts.customEnd}
                                          onChange={(e) => updateTargetSchedule(t.id, { customEnd: e.target.value })}
                                          className="w-full bg-white border rounded-lg outline-none px-2 py-1.5"
                                          style={{ fontSize: "0.8125rem", borderColor: C.lightBd }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>

                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* 오른쪽: 요약 카드 */}
              <div className="space-y-5">
                {/* 일일 실행 요약 */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <h4 className="flex items-center gap-2 text-gray-800 mb-5" style={{ fontWeight: 700, fontSize: "0.875rem" }}>
                    <BarChart3 size={15} style={{ color: C.primary }} /> 일일 실행 요약
                  </h4>
                  <div className="space-y-4">
                    {[
                      {
                        label: "기본 간격",
                        value: intervalOptions.find((o) => o.value === globalSchedule.interval)?.label ?? "-",
                      },
                      {
                        label: "활성 시간대",
                        value: globalSchedule.activeHours === "all" ? "24시간"
                             : globalSchedule.activeHours === "business" ? "09:00~18:00"
                             : `${globalSchedule.customStart}~${globalSchedule.customEnd}`,
                      },
                      {
                        label: "하루 실행 횟수",
                        value: `약 ${effectiveTimesPerDay()}회`,
                      },
                      {
                        label: "등록 타겟",
                        value: `${targets.length}개 사이트`,
                      },
                      {
                        label: "총 일일 요청",
                        value: `약 ${effectiveTimesPerDay() * Math.max(targets.length, 1)}회`,
                      },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between items-center">
                        <span className="text-gray-400" style={{ fontSize: "0.75rem" }}>{row.label}</span>
                        <span className="text-gray-800" style={{ fontSize: "0.8125rem", fontWeight: 700 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 상태 카드 */}
                <div
                  className="rounded-3xl p-6"
                  style={{ backgroundColor: globalSchedule.globalPaused ? "#eff6ff" : C.lightBg, border: `1px solid ${globalSchedule.globalPaused ? "#93c5fd" : C.lightBd}` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: globalSchedule.globalPaused ? "#bfdbfe" : C.primary }}
                    >
                      {globalSchedule.globalPaused
                        ? <Pause size={16} style={{ color: "#1e3a8a" }} />
                        : <RefreshCw size={16} style={{ color: "#fff" }} />}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: globalSchedule.globalPaused ? "#1e3a8a" : C.primary }}>
                        {globalSchedule.globalPaused ? "전체 정지 중" : "정상 실행 중"}
                      </p>
                      <p style={{ fontSize: "0.6875rem", color: "#9ca3af" }}>
                        {globalSchedule.globalPaused ? "모든 스케줄 중단됨" : "스케줄 활성 상태"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 안내 */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <h4 className="flex items-center gap-2 text-gray-800 mb-3" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
                    <Info size={14} style={{ color: C.primary }} /> 설정 안내
                  </h4>
                  <ul className="text-gray-400 space-y-2" style={{ fontSize: "0.6875rem", lineHeight: 1.7 }}>
                    {[
                      "간격이 짧을수록 실시간 감지가 빠릅니다.",
                      "활성 시간대 외에는 수집을 건너뜁니다.",
                      "개별 설정된 사이트는 글로벌 변경에 영향받지 않습니다.",
                      "일시정지 중인 사이트는 알림도 발송되지 않습니다.",
                    ].map((t) => (
                      <li key={t} className="flex gap-2 items-start">
                        <ChevronRight size={11} style={{ color: C.primary, marginTop: 3, flexShrink: 0 }} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* [탭] 대시보드 */}
        {activeTab === "dashboard" && (
          <div className="p-8">
            {!currentTarget ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="mb-6 opacity-40">
                  <Radio size={96} className="text-gray-300" />
                </div>
                <h2 className="text-gray-800 mb-2" style={{ fontSize: "1.5rem", fontWeight: 700 }}>
                  선택된 타겟이 없습니다.
                </h2>
                <p className="text-gray-500 mb-6">왼쪽 목록에서 사이트를 선택하거나 새로운 사이트를 추가하세요.</p>
                <button
                  onClick={() => switchTab("add")}
                  className="px-6 py-3 text-white rounded-xl transition"
                  style={{ ...primaryBtn }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.hover)}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.primary)}
                >
                  신규 타겟 등록하기
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-gray-900" style={{ fontSize: "1.875rem", fontWeight: 900 }}>
                        {currentTarget.name}
                      </h2>
                      <span
                        className="px-3 py-1 rounded-full flex items-center gap-1.5"
                        style={{ backgroundColor: "#dcfce7", color: "#15803d", fontSize: "0.75rem", fontWeight: 700 }}
                      >
                        <span style={{ height: 8, width: 8, borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }} />{" "}
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-gray-500 flex items-center gap-2">
                      <Link size={12} />
                      <span>{currentTarget.url}</span>
                    </p>
                  </div>
                </div>

                {/* 통계 카드 4개 + Visual Health — 한 줄 */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  {[
                    { icon: <FileCode size={18} style={{ color: C.primary }} />, label: "Total Pages",  value: stats.total,   valueColor: "#1f2937" },
                    { icon: <CheckCircle size={18} style={{ color: "#22c55e" }} />, label: "Healthy",   value: stats.success, valueColor: "#16a34a" },
                    { icon: <Image size={18} style={{ color: "#ef4444" }} />,       label: "Broken Img",value: stats.broken,  valueColor: "#dc2626" },
                    { icon: <Gauge size={18} style={{ color: C.primary }} />,       label: "Avg Response", value: "0.8s",     valueColor: "#1f2937" },
                  ].map((card) => (
                    <div key={card.label} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <div className="mb-2">{card.icon}</div>
                      <p className="text-gray-400 uppercase" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.04em" }}>
                        {card.label}
                      </p>
                      <h3 style={{ fontSize: "1.375rem", fontWeight: 700, color: card.valueColor }}>{card.value}</h3>
                    </div>
                  ))}

                  {/* Visual Health — 컴���트 */}
                  <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ minHeight: 120 }}>
                    <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-shrink-0 border-b border-gray-100">
                      <Camera size={13} style={{ color: C.primary }} />
                      <h3 className="text-gray-800" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>Visual Health</h3>
                    </div>
                    <div className="flex-1 relative" style={{ backgroundColor: "#f9fafb", minHeight: 80 }}>
                      {imgError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                          <ImageOff size={22} className="mb-1" />
                          <p className="uppercase" style={{ fontSize: "0.5625rem", fontWeight: 700 }}>Unavailable</p>
                        </div>
                      ) : (
                        <img
                          src={currentTarget.previewUrl}
                          className="w-full h-full object-cover absolute inset-0"
                          onError={() => setImgError(true)}
                          alt="Visual preview"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 페이지 모니터링 테이블 — 전체 너비 + 아코디언 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                  <div className="p-5 border-b flex justify-between items-center">
                    <h3 className="text-gray-800" style={{ fontWeight: 700, fontSize: "0.875rem" }}>페이지 모니터링 상세</h3>
                    {currentTarget.data.length > 3 && (
                      <button
                        onClick={() => setTableExpanded((v) => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          fontSize: "0.6875rem", fontWeight: 700,
                          backgroundColor: tableExpanded ? C.badge : "#f3f4f6",
                          color: tableExpanded ? C.primary : "#6b7280",
                        }}
                      >
                        {tableExpanded
                          ? <><ChevronUp size={12} style={{ display: "inline", verticalAlign: "middle" }} /> 접기</>
                          : <><ChevronDown size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {currentTarget.data.length - 3}개 더 보기</>}
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left" style={{ fontSize: "0.75rem" }}>
                      <thead style={{ backgroundColor: "#f9fafb" }}>
                        <tr className="text-gray-400">
                          {["URL Path", "Status", "Resources", "Response"].map((h) => (
                            <th key={h} className="px-6 py-4 uppercase" style={{ fontWeight: 700, fontSize: "0.65rem" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y text-gray-600">
                        {(tableExpanded ? currentTarget.data : currentTarget.data.slice(0, 3)).map((d) => (
                          <tr
                            key={d.path}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#f9fafb")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                          >
                            <td className="px-6 py-4 text-gray-800" style={{ fontWeight: 700 }}>{d.path}</td>
                            <td className="px-6 py-4">
                              <span
                                className="px-2 py-0.5 rounded-full"
                                style={{
                                  fontSize: "0.5625rem", fontWeight: 900,
                                  backgroundColor: d.status === 200 ? "#dcfce7" : "#fee2e2",
                                  color: d.status === 200 ? "#15803d" : "#dc2626",
                                }}
                              >
                                {d.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {d.brokenImg
                                ? <span className="text-red-500" style={{ fontWeight: 700 }}>Broken</span>
                                : <span className="text-gray-300">OK</span>}
                            </td>
                            <td className="px-6 py-4 text-gray-400 font-mono" style={{ fontSize: "0.625rem" }}>{d.loadTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!tableExpanded && currentTarget.data.length > 3 && (
                    <button
                      className="w-full py-3 text-center border-t border-gray-100 hover:bg-gray-50 transition-colors"
                      style={{ fontSize: "0.75rem", fontWeight: 700, color: C.primary }}
                      onClick={() => setTableExpanded(true)}
                    >
                      + {currentTarget.data.length - 3}개 더 보기
                    </button>
                  )}
                </div>

                {/* 날짜별 모니터링 기록 */}
                <DailyLogSection targetName={currentTarget.name} targetId={currentTarget.id} history={currentTarget.history || []} />
              </div>
            )}
          </div>
        )}

        {/* [탭] 알림 설정 */}
        {activeTab === "alerts" && (
          <div className="p-12 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <div
                className="w-12 h-12 text-white rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.primary, boxShadow: `0 10px 25px ${C.shadow}` }}
              >
                <Bell size={22} />
              </div>
              <div>
                <h2 className="text-gray-800" style={{ fontSize: "1.5rem", fontWeight: 700 }}>알림 통합 설정</h2>
                <p className="text-gray-500" style={{ fontSize: "0.875rem" }}>
                  수신할 이메일 주소를 입력하고 알림을 받을 사이트들을 선택하세요.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* 이메일  사이트 매칭 섹션 */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                  <h3 className="text-gray-800 mb-6 flex items-center gap-2" style={{ fontWeight: 700 }}>
                    <MailOpen size={16} style={{ color: C.primary }} /> 이메일-사이트 매칭 등록
                  </h3>

                  {/* 이메일 입력 */}
                  <div className="space-y-4 mb-8">
                    <label className="block text-gray-400 uppercase" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                      1. 수신 이메일 주소
                    </label>
                    <div
                      className="flex items-center gap-2 p-1 bg-gray-50 border rounded-2xl transition-all"
                      style={{ borderColor: "#e5e7eb" }}
                      onFocusCapture={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 2px ${C.primary}`)}
                      onBlurCapture={(e)  => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
                    >
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addEmailWithSelection()}
                        placeholder="수신 이메일 주소 입력"
                        className="flex-1 min-w-0 bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 500 }}
                      />
                      <button
                        onClick={addEmailWithSelection}
                        className="rounded-xl transition-all flex-shrink-0"
                        style={{ ...primaryBtn, padding: "0.75rem 1.5rem", fontSize: "0.875rem" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.hover)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.primary)}
                      >
                        등록
                      </button>
                    </div>
                  </div>

                  {/* 사이트 다중 선택 */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-gray-400 uppercase" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                        2. 알림을 받을 사이트 선택
                      </label>
                      <button
                        onClick={toggleAllCheckboxes}
                        className="hover:underline"
                        style={{ fontSize: "0.625rem", color: C.primary, fontWeight: 700 }}
                      >
                        전체 선택/해제
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-2" style={{ maxHeight: "15rem", scrollbarWidth: "none" }}>
                      {targets.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-gray-400 italic" style={{ fontSize: "0.75rem" }}>
                          먼저 대시보드에서 사이트를 추가해 주세요.
                        </div>
                      ) : (
                        targets.map((t) => (
                          <label
                            key={t.id}
                            className="flex items-center gap-3 p-3 border rounded-xl bg-white cursor-pointer transition-all"
                            style={{ borderColor: "#e5e7eb" }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.lightBd)}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb")}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTargetIds.includes(t.id)}
                              onChange={() => toggleTargetSelect(t.id)}
                              className="w-4 h-4 rounded"
                              style={{ accentColor: C.primary }}
                            />
                            <div>
                              <p className="text-gray-800" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{t.name}</p>
                              <p className="text-gray-400 truncate" style={{ fontSize: "0.5625rem", maxWidth: "8rem" }}>{t.url}</p>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 등록된 알림 목록 */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col" style={{ minHeight: "400px" }}>
                  <h3 className="text-gray-800 mb-6 flex items-center justify-between" style={{ fontWeight: 700 }}>
                    등록된 알림 채널
                    <span style={{ fontSize: "0.625rem", backgroundColor: C.badge, color: C.primary, padding: "2px 8px", borderRadius: "9999px", fontWeight: 700 }}>
                      {alertChannels.length}
                    </span>
                  </h3>

                  <div className="space-y-3 flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    {alertChannels.length === 0 ? (
                      <div className="flex flex-col items-center justify-center border border-dashed rounded-3xl text-gray-400" style={{ height: "10rem" }}>
                        <Inbox size={28} className="mb-2" />
                        <p style={{ fontSize: "0.75rem" }}>등록된 알림 채널이 없습니다.</p>
                      </div>
                    ) : (
                      alertChannels.map((channel) => {
                        const matchedTargets = targets.filter((t) => channel.targetIds.includes(t.id));
                        return (
                          <div
                            key={channel.email}
                            className="p-4 bg-gray-50 border border-gray-100 rounded-2xl relative overflow-hidden transition-all"
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = C.lightBd)}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#f3f4f6")}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: C.lightBg, color: C.primary, fontSize: "0.75rem" }}>
                                  <User size={14} />
                                </div>
                                <div>
                                  <p className="text-gray-800" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{channel.email}</p>
                                  <p className="text-gray-400" style={{ fontSize: "0.625rem" }}>활성 상태</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeChannel(channel.email)}
                                className="text-gray-300 transition-colors"
                                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#ef4444")}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#d1d5db")}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {matchedTargets.map((t) => (
                                <span
                                  key={t.id}
                                  style={{
                                    fontSize: "0.625rem", padding: "2px 6px", borderRadius: "4px",
                                    backgroundColor: C.badge, color: C.primary, border: `1px solid ${C.lightBd}`,
                                  }}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <h4 className="text-gray-800 uppercase mb-3 flex items-center gap-2" style={{ fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                      <Info size={14} style={{ color: C.primary }} /> 현재 적용된 알림 정책
                    </h4>
                    <ul className="text-gray-500 space-y-2" style={{ fontSize: "0.6875rem", lineHeight: "1.6" }}>
                      {[
                        "HTTP 4xx/5xx 장애 감지 시 즉시 발송",
                        "시각적 UI 변화 5% 이상 발생 시 발송",
                        "미수집된 이미지 자원 발생 시 발송",
                      ].map((item) => (
                        <li key={item} className="flex gap-2 items-start">
                          <ChevronRight size={12} style={{ color: C.primary, marginTop: 2 }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}