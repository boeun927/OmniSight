import React, { useState, useEffect } from "react";
import {
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  CalendarClock,
  Bell,
  AlertTriangle,
  Sparkles,
  UserCog,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  HelpCircle,
  List,
  Eye,
  Rocket
} from "lucide-react";

export interface TourStep {
  step: number;
  tab: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
  highlightText: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    tab: "home",
    title: "01. 전체 대시보드",
    subtitle: "모니터링 전체 현황 한눈에 보기",
    description: "등록된 전체 웹사이트의 실시간 가동 상태(Active), 정상 응답률(%), 이상 감지 수치 및 메인 페이지 Visual Health 스크린샷을 한눈에 파악하는 중앙 관제 대시보드입니다.",
    badge: "중앙 대시보드",
    icon: <LayoutDashboard size={20} className="text-sky-500" />,
    highlightText: "상단 요약 카드와 개별 사이트별 카드에서 실시간 모니터링 상태를 감시하세요."
  },
  {
    step: 2,
    tab: "monitor-list",
    title: "02. 모니터링 목록",
    subtitle: "등록된 사이트 상세 정보 조회",
    description: "현재 모니터링 중인 모든 대상 사이트의 릴레이션 목록과 수집 경로 수, 최근 점검 시각을 확인하고 클릭 한 번으로 상세 분석 뷰로 이동합니다.",
    badge: "목록 관리",
    icon: <List size={20} className="text-indigo-500" />,
    highlightText: "각 행의 '수동 점검' 버튼을 누르면 해당 사이트를 즉시 실시간 탐색합니다."
  },
  {
    step: 3,
    tab: "add",
    title: "03. 신규 타겟 추가",
    subtitle: "새 모니터링 웹사이트 등록",
    description: "새롭게 모니터링할 웹사이트 URL(예: example.com)과 사이트명을 입력하고 '자동 탐색'을 실행합니다. 사이트 내 하위 페이지 및 이미지를 수집하여 모니터링 대상으로 등록합니다.",
    badge: "사이트 등록",
    icon: <PlusCircle size={20} className="text-emerald-500" />,
    highlightText: "도메인만 입력하더라도 하위 뎁스 페이지 경로까지 자동으로 탐색하여 수집합니다."
  },
  {
    step: 4,
    tab: "schedule",
    title: "04. 모니터링 주기 관리",
    subtitle: "점검 간격 및 활성 시간대 설정",
    description: "5분, 15분, 30분부터 24시간 간격까지 자동 점검 주기를 유연하게 지정하고, 24시간 상시 감지 또는 평일 업무시간(09~18시) 전용 모니터링을 설정합니다.",
    badge: "스케줄링",
    icon: <CalendarClock size={20} className="text-amber-500" />,
    highlightText: "글로벌 공통 스케줄 설정과 사이트별 개별 스케줄 설정을 각각 지정할 수 있습니다."
  },
  {
    step: 5,
    tab: "alerts",
    title: "05. 모니터링 결과 알림설정",
    subtitle: "이메일-사이트 알림 매칭 연동",
    description: "수신할 이메일 주소를 입력하고 장애 발생 시 메일을 받을 사이트들을 선택하여 매칭합니다. 장애 발생 및 복구 시 전용 HTML 알림 메일이 실시간 자동 발송됩니다.",
    badge: "알림 연동",
    icon: <Bell size={20} className="text-rose-500" />,
    highlightText: "'테스트 메일' 버튼으로 수신 이메일로 전송된 메일 본문을 즉시 미리보기 하실 수 있습니다."
  },
  {
    step: 6,
    tab: "incidents",
    title: "06. 장애현황 관리",
    subtitle: "장애 이력 채록 & A4 보고서 출력",
    description: "HTTP 4xx/5xx 오류나 이미지 미수집 감지 시 자동으로 채록된 장애 이력을 관리합니다. '장애 보고서 보기'를 통해 A4 결재용 정형 장애 보고서를 즉시 출력 및 PDF 보관할 수 있습니다.",
    badge: "장애 관제",
    icon: <AlertTriangle size={20} className="text-orange-500" />,
    highlightText: "'조치 완료' 버튼을 누르면 총 장애 복구 소요 시간이 자동 계산되어 마감됩니다."
  },
  {
    step: 7,
    tab: "ai-analysis",
    title: "07. AI 콘텐츠 분석 (SEO & GEO)",
    subtitle: "검색엔진 & AI 인용 최적화 진단",
    description: "Google Lighthouse 기준 SEO 100점 만점 평가와 프린스턴 논문 기준 생성형 AI 인용 최적화(GEO) 점수를 진단하고, ChatGPT·Perplexity·Gemini·Claude 4대 AI 인용 예측 확률을 분석합니다.",
    badge: "AI 정밀 진단",
    icon: <Sparkles size={20} className="text-purple-500" />,
    highlightText: "'AI 개선 조치 코드 복사' 버튼으로 사이트에 즉시 적용 가능한 메타 태그를 복사하세요."
  },
  {
    step: 8,
    tab: "users",
    title: "08. 계정 관리",
    subtitle: "사용자 생성 및 비밀번호 초기화",
    description: "새로운 운영자 및 사용자 계정을 등록하고 권한 레벨(admin/user)을 지정합니다. 계정별 비밀번호 초기화 및 최초 로그인 비밀번호 변경 정책을 관제합니다.",
    badge: "권한 관리",
    icon: <UserCog size={20} className="text-sky-600" />,
    highlightText: "신규 생성된 계정은 최초 로그인 시 개인 비밀번호 변경 팝업이 활성화됩니다."
  },
  {
    step: 9,
    tab: "guide",
    title: "09. OmniSight 사용방법",
    subtitle: "언제든지 다시 보는 종합 문서",
    description: "시스템 사용 중 궁금한 점이 있으실 때 언제든지 메뉴별 캡처와 상세 가이드 문서를 찾아보실 수 있는 통합 매뉴얼 페이지입니다.",
    badge: "종합 매뉴얼",
    icon: <BookOpen size={20} className="text-sky-700" />,
    highlightText: "언제든지 상단 버튼으로 가이드 투어를 다시 시작하실 수 있습니다."
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  currentActiveTab: string;
  userLevel?: "admin" | "user";
}

export function OnboardingTour({
  isOpen,
  onClose,
  onNavigateTab,
  currentActiveTab,
  userLevel = "user"
}: OnboardingTourProps) {
  const [isWelcomeModal, setIsWelcomeModal] = useState<boolean>(true);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [neverShowAgain, setNeverShowAgain] = useState<boolean>(false);

  const activeSteps = React.useMemo(() => {
    const rawSteps = userLevel === "admin"
      ? TOUR_STEPS
      : TOUR_STEPS.filter(s => s.tab !== "users");

    return rawSteps.map((s, idx) => ({
      ...s,
      step: idx + 1,
      title: `${String(idx + 1).padStart(2, '0')}. ${s.title.replace(/^\d+\.\s*/, '')}`
    }));
  }, [userLevel]);

  // 웰컴 팝업에서 [튜토리얼 시작] 누를 시
  const handleStartTour = () => {
    setIsWelcomeModal(false);
    setCurrentStepIdx(0);
    if (activeSteps.length > 0) {
      onNavigateTab(activeSteps[0].tab);
    }
  };

  // 닫기 및 다시 보지 않음 처리
  const handleCloseTour = () => {
    if (neverShowAgain) {
      localStorage.setItem("omnisight_skip_tour", "true");
    }
    onClose();
  };

  // 다음 단계 이동
  const handleNextStep = () => {
    if (currentStepIdx < activeSteps.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      onNavigateTab(activeSteps[nextIdx].tab);
    } else {
      // 마지막 단계 완료
      if (neverShowAgain) {
        localStorage.setItem("omnisight_skip_tour", "true");
      }
      onClose();
    }
  };

  // 이전 단계 이동
  const handlePrevStep = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      onNavigateTab(activeSteps[prevIdx].tab);
    }
  };

  if (!isOpen) return null;

  const currentStep = activeSteps[currentStepIdx] || activeSteps[0];

  // 1. 첫 웰컴 시작 팝업 모달
  if (isWelcomeModal) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* 헤더 */}
          <div className="px-7 py-6 bg-gradient-to-r from-sky-600 via-sky-700 to-blue-800 text-white relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
                <Rocket size={26} className="text-white" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-sky-100 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  INTERACTIVE ONBOARDING
                </span>
                <h3 className="font-extrabold text-xl leading-tight">OmniSight 이용방법 알아보기</h3>
              </div>
            </div>
          </div>

          {/* 바디 */}
          <div className="p-7 space-y-5">
            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-xs text-sky-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-sky-950 text-sm">
                <span>👋</span>
                <span>환영합니다! 처음 오셨나요?</span>
              </p>
              <p className="text-slate-600 text-xs leading-relaxed">
                OmniSight 모니터링 플랫폼의 핵심 기능과 메뉴를 <strong>실제 화면을 따라가며 {activeSteps.length}단계 대화형 튜토리얼</strong>로 알기 쉽게 소개해 드립니다.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>튜토리얼 특징 안내</span>
              </p>
              <ul className="space-y-1.5 pl-6 list-disc text-slate-600 leading-relaxed text-[11px]">
                <li>단계 이동 시 해당 메뉴 탭으로 <strong>자동 페이지 전환</strong>됩니다.</li>
                <li>언제든지 <strong>[중간에 닫기]</strong>나 <strong>[이전/다음]</strong>을 자유롭게 조작하실 수 있습니다.</li>
                <li>튜토리얼 종료 후에도 <strong>OmniSight 사용방법</strong> 메뉴에서 언제든 다시 시작할 수 있습니다.</li>
              </ul>
            </div>

            {/* 다시 보지 않음 체크박스 */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-2 border-t border-slate-100">
              <input
                type="checkbox"
                checked={neverShowAgain}
                onChange={(e) => setNeverShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-600">다음 로그인부터 이 안내 팝업 다시 보지 않음</span>
            </label>

            {/* 하단 버튼 그룹 */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCloseTour}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                나중에 하기 / 닫기
              </button>
              <button
                type="button"
                onClick={handleStartTour}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>🚀 튜토리얼 시작하기</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. 가이드 투어 실시간 바 / 플로팅 툴팁 (Step Bar)
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-3xl w-[92%] animate-in slide-in-from-bottom-8 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-4">
        {/* 상단 프로그레스 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              {currentStep.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-extrabold text-[10px] border border-sky-500/30">
                  Step {currentStep.step} / {activeSteps.length}
                </span>
                <span className="text-xs font-bold text-slate-300">{currentStep.badge}</span>
              </div>
              <h4 className="font-extrabold text-base text-white mt-0.5">{currentStep.title}</h4>
            </div>
          </div>

          <button
            onClick={handleCloseTour}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="튜토리얼 종료"
          >
            <X size={18} />
          </button>
        </div>

        {/* 바디 설명 영역 */}
        <div className="space-y-2">
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {currentStep.description}
          </p>

          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-sky-200">
            <HelpCircle size={15} className="text-sky-400 flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{currentStep.highlightText}</span>
          </div>
        </div>

        {/* 진행 바 & 컨트롤 버튼 */}
        <div className="pt-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={neverShowAgain}
                onChange={(e) => setNeverShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500 cursor-pointer"
              />
              <span>다음부터 팝업 보지 않음</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevStep}
              disabled={currentStepIdx === 0}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              <span>이전</span>
            </button>

            <button
              onClick={handleNextStep}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-sky-600/30 cursor-pointer active:scale-95"
            >
              <span>{currentStepIdx === activeSteps.length - 1 ? "🎉 완료" : "다음 단계"}</span>
              {currentStepIdx < activeSteps.length - 1 && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
