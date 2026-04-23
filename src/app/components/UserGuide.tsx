import { useRef, useState } from "react";
import {
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  CalendarClock,
  Bell,
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Monitor,
  Search,
  Download,
  Clock,
  Filter,
  BarChart3,
  Camera,
  FileCode,
  Gauge,
  Image,
  Mail,
  Trash2,
  Play,
  Pause,
  Settings2,
  Info,
  ArrowRight,
  Layers,
  RefreshCw,
  ToggleRight,
  Star,
} from "lucide-react";
import { OmniSightLogo } from "./OmniSightLogo";

const C = {
  primary: "#0284c7",
  hover: "#0369a1",
  lightBg: "#f0f9ff",
  lightBd: "#bae6fd",
  shadow: "rgba(2,132,199,0.20)",
  badge: "#e0f2fe",
};

// ── 색상 팔레트 (섹션별) ─────────────────────────────────────
const SECTION_COLORS = [
  { bg: "#f0f9ff", border: "#bae6fd", accent: "#0284c7", light: "#e0f2fe" },  // sky
  { bg: "#f0fdf4", border: "#bbf7d0", accent: "#16a34a", light: "#dcfce7" },  // green
  { bg: "#fefce8", border: "#fde68a", accent: "#d97706", light: "#fef9c3" },  // amber
  { bg: "#fdf4ff", border: "#e9d5ff", accent: "#9333ea", light: "#f3e8ff" },  // purple
  { bg: "#fff1f2", border: "#fecdd3", accent: "#e11d48", light: "#ffe4e6" },  // rose
];

type Section = "intro" | "add" | "dashboard" | "log" | "schedule" | "alerts";

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode; short: string }[] = [
  { id: "intro",    label: "OmniSight 소개",      icon: <BookOpen size={14} />,      short: "소개" },
  { id: "add",      label: "신규 타겟 등록",       icon: <PlusCircle size={14} />,    short: "등록" },
  { id: "dashboard",label: "모니터링 대시보드",    icon: <LayoutDashboard size={14} />, short: "대시보드" },
  { id: "log",      label: "기록 조회",            icon: <Calendar size={14} />,      short: "기록 조회" },
  { id: "schedule", label: "모니터링 주기 관리",   icon: <CalendarClock size={14} />, short: "주기 관리" },
  { id: "alerts",   label: "알림 설정",            icon: <Bell size={14} />,          short: "알림" },
];

// ── 재사용 컴포넌트 ──────────────────────────────────────────
function Callout({ type, children }: { type: "tip" | "info" | "warn"; children: React.ReactNode }) {
  const styles = {
    tip:  { bg: "#f0fdf4", border: "#bbf7d0", icon: <Lightbulb size={14} style={{ color: "#16a34a", flexShrink: 0 }} />, label: "TIP" },
    info: { bg: "#f0f9ff", border: "#bae6fd", icon: <Info size={14} style={{ color: "#0284c7", flexShrink: 0 }} />, label: "INFO" },
    warn: { bg: "#fffbeb", border: "#fde68a", icon: <AlertCircle size={14} style={{ color: "#d97706", flexShrink: 0 }} />, label: "주의" },
  }[type];
  return (
    <div className="flex gap-3 p-4 rounded-xl border mt-4" style={{ backgroundColor: styles.bg, borderColor: styles.border }}>
      <div className="mt-0.5">{styles.icon}</div>
      <div style={{ fontSize: "0.8125rem", lineHeight: 1.7, color: "#374151" }}>
        <span className="inline-block px-1.5 py-0.5 rounded mr-2" style={{ fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.05em", backgroundColor: styles.border, color: "#374151" }}>
          {styles.label}
        </span>
        {children}
      </div>
    </div>
  );
}

function StepCard({ number, title, desc, extra }: { number: number; title: string; desc: string; extra?: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: C.badge, color: C.primary, fontWeight: 900, fontSize: "0.8125rem" }}
      >
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#111827" }}>{title}</p>
        <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.65, marginTop: 3 }}>{desc}</p>
        {extra}
      </div>
    </div>
  );
}

function BadgeRow({ items }: { items: { icon: React.ReactNode; label: string; desc: string; color: string; bg: string }[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
            <span style={{ color: item.color }}>{item.icon}</span>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "0.8125rem", color: "#111827" }}>{item.label}</p>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.6 }}>{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ icon, title, subtitle, color }: { icon: React.ReactNode; title: string; subtitle: string; color: typeof SECTION_COLORS[0] }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color.light, color: color.accent }}
      >
        {icon}
      </div>
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#111827", lineHeight: 1.2 }}>{title}</h2>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: 4 }}>{subtitle}</p>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────
export function UserGuide({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [activeNav, setActiveNav] = useState<Section>("intro");

  const sectionRefs: Record<Section, React.RefObject<HTMLDivElement>> = {
    intro:    useRef<HTMLDivElement>(null),
    add:      useRef<HTMLDivElement>(null),
    dashboard:useRef<HTMLDivElement>(null),
    log:      useRef<HTMLDivElement>(null),
    schedule: useRef<HTMLDivElement>(null),
    alerts:   useRef<HTMLDivElement>(null),
  };

  const scrollTo = (id: Section) => {
    setActiveNav(id);
    sectionRefs[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">

      {/* ── 히어로 ─────────────────────────────────────────── */}
      <div
        className="rounded-3xl overflow-hidden mb-8 relative"
        style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #0369a1 50%, #075985 100%)` }}
      >
        <div className="px-10 py-10 relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <OmniSightLogo size={40} color="#fff" />
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
                OmniSight
              </h1>
              <p style={{ fontSize: "0.75rem", color: "#bae6fd", fontWeight: 600, letterSpacing: "0.05em" }}>
                WEBSITE MONITORING SYSTEM
              </p>
            </div>
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", marginBottom: 8 }}>
            사용방법 가이드
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "#e0f2fe", lineHeight: 1.7, maxWidth: 560 }}>
            OmniSight는 웹사이트의 페이지 상태·이미지·응답 속도를 자동으로 모니터링하고,
            이상 발생 시 이메일로 즉시 알림을 보내는 통합 모니터링 솔루션입니다.
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              { label: "신규 타겟 등록", onClick: () => onNavigate("add") },
              { label: "대시보드 바로가기", onClick: () => onNavigate("dashboard") },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all"
                style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff", fontSize: "0.8125rem", fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.28)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.18)")}
              >
                {btn.label} <ArrowRight size={13} />
              </button>
            ))}
          </div>
        </div>
        {/* 장식용 원 */}
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: "#fff" }} />
        <div className="absolute -right-6 -bottom-20 w-52 h-52 rounded-full opacity-10" style={{ backgroundColor: "#38bdf8" }} />
      </div>

      {/* ── 퀵 네비게이션 ──────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 mb-8 p-1.5 rounded-2xl"
        style={{
          backgroundColor: "#dde3ec",
          boxShadow: "inset 0 2px 5px rgba(0,0,0,0.10), inset 0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex flex-wrap gap-1">
          {NAV_ITEMS.map((item, idx) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl transition-all"
                style={{
                  minWidth: 72,
                  backgroundColor: isActive ? "#ffffff" : "transparent",
                  color: isActive ? C.primary : "#64748b",
                  fontWeight: isActive ? 800 : 600,
                  boxShadow: isActive
                    ? "0 2px 8px rgba(0,0,0,0.13), 0 1px 2px rgba(0,0,0,0.08)"
                    : "none",
                  transform: isActive ? "translateY(-1px)" : "translateY(0)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.45)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
              >
                {/* 번호 배지 */}
                <span
                  className="inline-flex items-center justify-center rounded-md"
                  style={{
                    width: 18, height: 18,
                    fontSize: "0.5625rem", fontWeight: 900,
                    backgroundColor: isActive ? C.badge : "rgba(0,0,0,0.06)",
                    color: isActive ? C.primary : "#94a3b8",
                    letterSpacing: "0.02em",
                    marginBottom: 1,
                  }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* 아이콘 */}
                <span style={{ opacity: isActive ? 1 : 0.55 }}>{item.icon}</span>

                {/* 라벨 */}
                <span
                  className="whitespace-nowrap hidden sm:block"
                  style={{ fontSize: "0.625rem", letterSpacing: "-0.01em" }}
                >
                  {item.short}
                </span>

                {/* 하단 활성 바 */}
                {isActive && (
                  <span
                    className="block rounded-full mt-0.5"
                    style={{ height: 3, width: 20, backgroundColor: C.primary, opacity: 0.7 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 섹션 컨테이너 ──────────────────────────────────── */}
      <div className="space-y-10">

        {/* ══════════════════════════════════════════════
            01. OmniSight 소개
        ══════════════════════════════════════════════ */}
        <section ref={sectionRefs.intro} className="scroll-mt-20">
          <div className="p-7 rounded-3xl border" style={{ backgroundColor: SECTION_COLORS[0].bg, borderColor: SECTION_COLORS[0].border }}>
            <SectionTitle
              icon={<BookOpen size={22} />}
              title="OmniSight 소개"
              subtitle="무엇을 할 수 있는지 한눈에 살펴보세요"
              color={SECTION_COLORS[0]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <Monitor size={18} />, title: "실시간 페이지 감시", desc: "등록된 사이트의 모든 페이지를 주기적으로 점검하고 HTTP 상태 코드를 기록합니다.", color: "#0284c7", bg: "#e0f2fe" },
                { icon: <Image size={18} />, title: "이미지 상태 확인", desc: "각 페이지에서 깨진 이미지(Broken Image)를 감지하여 시각적 품질을 보장합니다.", color: "#d97706", bg: "#fef9c3" },
                { icon: <Gauge size={18} />, title: "응답속도 추적", desc: "페이지별 로딩 시간을 측정하고 평균 응답속도를 대시보드에서 확인할 수 있습니다.", color: "#9333ea", bg: "#f3e8ff" },
                { icon: <Calendar size={18} />, title: "일일·주간·월간 기록", desc: "날짜별 모니터링 기록을 일일·주간·월간·직접 지정 단위로 조회하고 CSV로 내보냅니다.", color: "#16a34a", bg: "#dcfce7" },
                { icon: <Bell size={18} />, title: "이메일 알림", desc: "이상 감지 시 등록된 이메일로 즉시 알림을 발송합니다. 사이트별 수신자 지정이 가능합니다.", color: "#e11d48", bg: "#ffe4e6" },
                { icon: <CalendarClock size={18} />, title: "유연한 주기 설정", desc: "5분~24시간 단위로 모니터링 간격을 설정하고, 활성 시간대도 자유롭게 지정할 수 있습니다.", color: "#0369a1", bg: "#dbeafe" },
              ].map((feat) => (
                <div key={feat.title} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: feat.bg }}>
                    <span style={{ color: feat.color }}>{feat.icon}</span>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#111827", marginBottom: 4 }}>{feat.title}</p>
                  <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.65 }}>{feat.desc}</p>
                </div>
              ))}
            </div>

            <Callout type="tip">
              좌측 사이드바의 <strong>등록된 사이트 목록</strong>에서 모니터링 타겟을 선택하면 해당 사이트의 대시보드가 표시됩니다. 타겟이 없을 경우 먼저 <strong>신규 타겟 등록</strong>을 진행하세요.
            </Callout>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            02. 신규 타겟 등록
        ══════════════════════════════════════════════ */}
        <section ref={sectionRefs.add} className="scroll-mt-20">
          <div className="p-7 rounded-3xl border" style={{ backgroundColor: SECTION_COLORS[1].bg, borderColor: SECTION_COLORS[1].border }}>
            <SectionTitle
              icon={<PlusCircle size={22} />}
              title="신규 타겟 등록"
              subtitle="모니터링할 웹사이트를 추가하는 방법"
              color={SECTION_COLORS[1]}
            />

            <div className="space-y-3">
              <StepCard
                number={1}
                title="사이드바에서 '신규 타겟 추가' 메뉴 클릭"
                desc="왼쪽 사이드바에서 ＋ 아이콘이 있는 '신규 타겟 추가' 메뉴를 클릭합니다."
              />
              <StepCard
                number={2}
                title="웹사이트 URL 입력"
                desc="입력란에 도메인만 입력합니다. 예) example.com — 'https://'는 자동으로 추가됩니다."
              />
              <StepCard
                number={3}
                title="사이트 이름 입력 (선택)"
                desc="사이트 이름을 직접 지정하면 사이드바 목록과 대시보드에서 해당 이름으로 표시됩니다."
              />
              <StepCard
                number={4}
                title="'타겟 등록' 버튼 클릭"
                desc="버튼을 누르면 탐색했던 경로가 등록되고 초기 점검이 시작됩니다."
              />
            </div>

            <Callout type="info">
              등록이 완료되면 사이드바 목록에 사이트가 추가되고 자동으로 <strong>모니터링 대시보드</strong> 탭으로 이동합니다.
            </Callout>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            03. 모니터링 대시보드
        ══════════════════════════════════════════════ */}
        <section ref={sectionRefs.dashboard} className="scroll-mt-20">
          <div className="p-7 rounded-3xl border" style={{ backgroundColor: SECTION_COLORS[2].bg, borderColor: SECTION_COLORS[2].border }}>
            <SectionTitle
              icon={<LayoutDashboard size={22} />}
              title="모니터링 대시보드"
              subtitle="현재 사이트 상태를 한눈에 확인하는 방법"
              color={SECTION_COLORS[2]}
            />

            {/* 통계 카드 */}
            <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151", marginBottom: 12 }}>📊 상단 통계 카드</p>
            <BadgeRow items={[
              { icon: <FileCode size={16} />, label: "Total Pages", desc: "현재 등록된 전체 모니터링 경로 수", color: "#1f2937", bg: "#f3f4f6" },
              { icon: <CheckCircle2 size={16} />, label: "Healthy", desc: "HTTP 200 정상 응답을 반환한 경로 수", color: "#16a34a", bg: "#dcfce7" },
              { icon: <Image size={16} />, label: "Broken Img", desc: "이미지 로딩 오류가 발견된 경로 수", color: "#dc2626", bg: "#fee2e2" },
              { icon: <Gauge size={16} />, label: "Avg Response", desc: "모든 경로의 평균 페이지 로딩 시간", color: "#0284c7", bg: "#e0f2fe" },
            ]} />

            {/* Visual Health */}
            <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Camera size={14} style={{ color: SECTION_COLORS[2].accent }} />
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151" }}>Visual Health (미리보기)</p>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.65 }}>
                통계 카드 오른쪽의 <strong>Visual Health</strong> 카드는 해당 사이트 메인 페이지의 스크린샷을 실시간으로 표시합니다. 페이지 레이아웃이 깨지거나 예상치 못한 변경이 생겼을 때 시각적으로 즉시 확인할 수 있습니다.
              </p>
            </div>

            {/* 페이지 모니터링 테이블 */}
            <div className="mt-5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Layers size={14} style={{ color: SECTION_COLORS[2].accent }} />
                <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151" }}>페이지 모니터링 상세 테이블</p>
              </div>
              <div className="space-y-2">
                {[
                  { col: "URL Path", desc: "모니터링 중인 페이지 경로" },
                  { col: "Status",   desc: "HTTP 상태 코드 — 200(정상), 404(오류) 등" },
                  { col: "Resources",desc: "이미지 상태 — Broken(이상)/OK(정상)" },
                  { col: "Response", desc: "해당 경로의 응답 시간(초)" },
                ].map((row) => (
                  <div key={row.col} className="flex gap-3 items-start">
                    <span className="px-2 py-0.5 rounded-md font-mono flex-shrink-0 mt-0.5" style={{ fontSize: "0.6875rem", fontWeight: 700, backgroundColor: SECTION_COLORS[2].light, color: SECTION_COLORS[2].accent }}>{row.col}</span>
                    <span style={{ fontSize: "0.8125rem", color: "#6b7280" }}>{row.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <Callout type="tip">
              테이블에 5개 이상의 경로가 등록된 경우 기본 3줄만 표시됩니다. <strong>"N개 더 보기"</strong> 버튼을 클릭하거나 하단 링크를 누르면 전체 목록이 펼쳐집니다.
            </Callout>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            04. 모니터링 기록 조회
        ══════════════════════════════════════════════ */}
        <section ref={sectionRefs.log} className="scroll-mt-20">
          <div className="p-7 rounded-3xl border" style={{ backgroundColor: SECTION_COLORS[3].bg, borderColor: SECTION_COLORS[3].border }}>
            <SectionTitle
              icon={<Calendar size={22} />}
              title="모니터링 기록 조회"
              subtitle="날짜 범위별로 점검 기록을 확인하고 내보내는 방법"
              color={SECTION_COLORS[3]}
            />

            {/* 조회 모드 */}
            <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151", marginBottom: 12 }}>🗂 조회 모드 4가지</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { icon: <Clock size={15} />, label: "일일", desc: "특정 하루의 기록을 시간대별(30분 단위)로 조회합니다. ← → 버튼으로 날짜를 이동하거나 달력에서 직접 선택할 수 있습니다." },
                { icon: <BarChart3 size={15} />, label: "주간", desc: "월~일 기준 7일간의 기록을 날짜별로 조회합니다. ← → 버튼으로 이전/다음 주로 이동합니다." },
                { icon: <Calendar size={15} />, label: "월간", desc: "선택한 달의 전체 날짜별 기록을 조회합니다. ← → 버튼으로 이전/다음 월로 이동합니다." },
                { icon: <Settings2 size={15} />, label: "직접 지정", desc: "시작일과 종료일을 직접 선택하여 최대 90일 범위의 기록을 조회합니다." },
              ].map((mode) => (
                <div key={mode.label} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: SECTION_COLORS[3].light, color: SECTION_COLORS[3].accent }}>
                      {mode.icon}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#111827" }}>{mode.label}</span>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.65 }}>{mode.desc}</p>
                </div>
              ))}
            </div>

            {/* 필터 & 아코디언 */}
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Filter size={13} style={{ color: SECTION_COLORS[3].accent }} />
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151" }}>필터 기능</p>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.65 }}>
                  <strong>경로 필터</strong>로 특정 URL 경로(/, /login 등)의 기록만 선택해서 볼 수 있습니다.<br />
                  <strong>상태 필터</strong>로 전체·정상만·오류만 세 가지 중 하나를 선택할 수 있습니다.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ChevronRight size={13} style={{ color: SECTION_COLORS[3].accent }} />
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151" }}>아코디언 상세 보기</p>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.65 }}>
                  각 시간대(일일) 또는 날짜(주간·월간·직접 지정) 행을 클릭하면 해당 시간대의 경로별 상세 점검 결과가 펼쳐집니다.<br />
                  주간·월간 모드에서는 날짜를 먼저 펼친 후, 그 안의 시간대를 추가로 펼칠 수 있습니다.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Download size={13} style={{ color: SECTION_COLORS[3].accent }} />
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151" }}>CSV 다운로드</p>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.65 }}>
                  헤더 우측의 <strong>CSV 다운로드</strong> 버튼을 클릭하면 현재 조회 기간 전체 데이터가 CSV 파일로 저장됩니다. 한글 깨짐 방지를 위해 BOM이 포함된 UTF-8 형식으로 저장됩니다.
                </p>
              </div>
            </div>

            <Callout type="tip">
              주간·월간 모드에서 각 날짜 행의 <strong>성공률 바</strong>를 보면 해당 날의 전반적인 상태를 빠르게 파악할 수 있습니다. 녹색(95% 이상), 주황(80~94%), 빨강(80% 미만)으로 색상이 구분됩니다.
            </Callout>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            05. 모니터링 주기 관리
        ══════════════════════════════════════════════ */}
        <section ref={sectionRefs.schedule} className="scroll-mt-20">
          <div className="p-7 rounded-3xl border" style={{ backgroundColor: SECTION_COLORS[4].bg, borderColor: SECTION_COLORS[4].border }}>
            <SectionTitle
              icon={<CalendarClock size={22} />}
              title="모니터링 주기 관리"
              subtitle="점검 간격과 활성 시간대를 유연하게 설정하는 방법"
              color={SECTION_COLORS[4]}
            />

            {/* 글로벌 설정 */}
            <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151", marginBottom: 12 }}>🌐 글로벌 설정</p>
            <div className="space-y-3 mb-6">
              <StepCard
                number={1}
                title="모니터링 간격 선택"
                desc="5분 / 15분 / 30분 / 1시간 / 3시간 / 6시간 / 12시간 / 24시간 중 선택합니다. 짧을수록 실시간 이상 감지가 빠릅니다."
                extra={
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["5분", "15분", "30분", "1시간", "3시간", "6시간", "12시간", "24시간"].map((v) => (
                      <span key={v} className="px-2 py-0.5 rounded-md" style={{ fontSize: "0.6875rem", fontWeight: 700, backgroundColor: "#ffe4e6", color: "#e11d48" }}>{v}</span>
                    ))}
                  </div>
                }
              />
              <StepCard
                number={2}
                title="활성 시간대 설정"
                desc="'항상 모니터링'은 24시간 내내 점검하고, '업무 시간(9~18시)'은 평일 업무 시간만, '직접 지정'은 시작·종료 시각을 자유롭게 설정합니다."
              />
              <StepCard
                number={3}
                title="전체 일시정지 / 재개"
                desc="'전체 정지' 토글을 켜면 모든 사이트의 모니터링이 중단됩니다. 점검 창이나 시스템 유지보수 시 활용하세요."
              />
            </div>

            {/* 개별 설정 */}
            <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151", marginBottom: 12 }}>🎛 사이트별 개별 설정</p>
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <ToggleRight size={14} style={{ color: SECTION_COLORS[4].accent }} />
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151" }}>글로벌 ↔ 개별 모드 전환</p>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.65 }}>
                  각 사이트 카드의 토글로 <strong>글로벌 설정을 따르기</strong>와 <strong>개별 설정 사용</strong>을 전환할 수 있습니다.
                  개별 모드에서는 해당 사이트만의 간격·시간대·일시정지를 독립적으로 설정합니다.
                </p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Pause size={14} style={{ color: SECTION_COLORS[4].accent }} />
                  <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#374151" }}>개별 일시정지</p>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.65 }}>
                  사이트 카드 오른쪽 상단의 일시정지 버튼으로 특정 사이트만 점검을 중단하거나 재개할 수 있습니다. 일시정지된 사이트는 알림도 발송되지 않습니다.
                </p>
              </div>
            </div>

            <Callout type="warn">
              개별 설정이 완료된 사이트는 글로벌 설정 변경의 영향을 받지 않습니다. 글로벌 설정을 다시 따르려면 해당 사이트 카드에서 <strong>글로벌 설정 사용</strong>으로 전환하세요.
            </Callout>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            06. 알림 설정
        ══════════════════════════════════════════════ */}
        <section ref={sectionRefs.alerts} className="scroll-mt-20">
          <div className="p-7 rounded-3xl border" style={{ backgroundColor: SECTION_COLORS[0].bg, borderColor: SECTION_COLORS[0].border }}>
            <SectionTitle
              icon={<Bell size={22} />}
              title="알림 설정"
              subtitle="이상 발생 시 이메일로 알림 받는 방법"
              color={SECTION_COLORS[0]}
            />

            <div className="space-y-3 mb-6">
              <StepCard
                number={1}
                title="이메일 주소 입력"
                desc="'알림 이메일' 입력란에 수신할 이메일 주소를 입력합니다."
              />
              <StepCard
                number={2}
                title="모니터링 사이트 연결"
                desc="등록된 사이트 목록이 표시됩니다. 알림을 받고 싶은 사이트 옆의 체크박스를 선택하거나, '전체 선택' 버튼으로 모든 사이트를 한번에 연결합니다."
              />
              <StepCard
                number={3}
                title="'알림 채널 추가' 클릭"
                desc="설정이 완료되면 '알림 채널 추가' 버튼을 클릭합니다. 이메일과 연결된 사이트가 알림 채널로 등록됩니다."
              />
            </div>

            <BadgeRow items={[
              { icon: <Mail size={16} />, label: "이메일 채널", desc: "이메일 주소별로 독립된 알림 채널이 생성됩니다. 여러 이메일 주소를 각각 등록할 수 있습니다.", color: "#0284c7", bg: "#e0f2fe" },
              { icon: <CheckCircle2 size={16} />, label: "사이트 매칭", desc: "하나의 이메일에 여러 사이트를 연결하거나, 사이트마다 다른 이메일을 지정할 수 있습니다.", color: "#16a34a", bg: "#dcfce7" },
              { icon: <Trash2 size={16} />, label: "채널 삭제", desc: "채널 우측의 삭제 버튼을 클릭하면 해당 이메일의 알림 채널이 완전히 제거됩니다.", color: "#dc2626", bg: "#fee2e2" },
              { icon: <Star size={16} />, label: "전체 선택/해제", desc: "사이트 연결 시 '전체 선택' / '전체 해제' 버튼으로 모든 사이트를 빠르게 조작합니다.", color: "#d97706", bg: "#fef9c3" },
            ]} />

            <Callout type="info">
              현재 버전은 알림 미리보기 기능을 제공합니다. 실제 이메일 발송을 위해서는 SMTP 또는 알림 API 연동 설정이 필요합니다.
            </Callout>
          </div>
        </section>

        {/* ── 하단 CTA ──────────────────────────────────────── */}
        <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: C.lightBg, border: `1px solid ${C.lightBd}` }}>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: C.primary, marginBottom: 8 }}>
            준비가 됐다면 지금 바로 시작해보세요!
          </p>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: 20 }}>
            신규 타겟을 등록하는 데 30초면 충분합니다.
          </p>
          <button
            onClick={() => onNavigate("add")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all"
            style={{ backgroundColor: C.primary, fontWeight: 700, fontSize: "0.9375rem", boxShadow: `0 4px 14px ${C.shadow}` }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.hover)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.primary)}
          >
            <PlusCircle size={18} />
            신규 타겟 등록하기
          </button>
        </div>

      </div>
    </div>
  );
}