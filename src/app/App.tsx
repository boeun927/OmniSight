import { useState, useEffect, useRef } from "react"; 
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
  Send,
  Loader2,
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
  Copy,
  Save,
  LogOut,
  UserCog,
  Home,
  List,
  ArrowRight,
  Activity,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  Edit3,
  Check,
  Sparkles,
  Cpu,
  Bot,
  SearchCheck,
  Share2,
} from "lucide-react";
import { OmniSightLogo } from "./components/OmniSightLogo";
import { DailyLogSection } from "./components/DailyLogSection";
import { UserGuide } from "./components/UserGuide";
import { LoginPage } from "./components/LoginPage";
import { UserProfileModal } from "./components/UserProfileModal";
import { OnboardingTour } from "./components/OnboardingTour";

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

type TabName = "home" | "monitor-list" | "guide" | "dashboard" | "add" | "incidents" | "ai-analysis" | "users" | "schedule" | "alerts";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const authStr = localStorage.getItem("omnisight_auth") || sessionStorage.getItem("omnisight_auth");
    if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        return auth.isLoggedIn === true;
      } catch (e) {
        return false;
      }
    }
    return localStorage.getItem("omnisight_logged_in") === "true";
  });

  const [loggedInUser, setLoggedInUser] = useState<string>(() => {
    const authStr = localStorage.getItem("omnisight_auth") || sessionStorage.getItem("omnisight_auth");
    if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        if (auth.username) return auth.username;
      } catch (e) {}
    }
    return localStorage.getItem("omnisight_username") || "";
  });

  const [nickname, setNickname] = useState<string>(() => {
    const authStr = localStorage.getItem("omnisight_auth") || sessionStorage.getItem("omnisight_auth");
    if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        if (auth.nickname) return auth.nickname;
      } catch (e) {}
    }
    return localStorage.getItem("omnisight_nickname") || "";
  });

  const [userLevel, setUserLevel] = useState<"admin" | "user">(() => {
    const authStr = localStorage.getItem("omnisight_auth") || sessionStorage.getItem("omnisight_auth");
    if (authStr) {
      try {
        const auth = JSON.parse(authStr);
        if (auth.level === "admin" || auth.level === "user") return auth.level;
      } catch (e) {}
    }
    const savedLevel = localStorage.getItem("omnisight_user_level");
    return savedLevel === "admin" ? "admin" : "user";
  });

  const loggedInUserRef = useRef(loggedInUser);
  loggedInUserRef.current = loggedInUser;

  const userLevelRef = useRef(userLevel);
  userLevelRef.current = userLevel;

  const [lastLoginAt, setLastLoginAt] = useState<string>(() => {
    return localStorage.getItem("omnisight_last_login") || "";
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 대화형 온보딩 가이드 투어 State
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    const skip = localStorage.getItem("omnisight_skip_tour");
    const isFirstLog = localStorage.getItem("omnisight_is_first_login") === "true";
    return skip !== "true" && !isFirstLog;
  });

  // 최초 로그인 여부 지속 State
  const [isFirstLoginState, setIsFirstLoginState] = useState<boolean>(() => {
    return localStorage.getItem("omnisight_is_first_login") === "true";
  });

  // 계정 관리 state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState<boolean>(false);
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    nickname: "",
    password: "",
    confirmPassword: "",
    level: "user" as "admin" | "user"
  });

  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [targets, setTargets] = useState<Target[]>([]);
  const [currentTargetId, setCurrentTargetId] = useState<number | null>(null);
  const [alertChannels, setAlertChannels] = useState<AlertChannel[]>([]);
  const [sendingTestEmailKey, setSendingTestEmailKey] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [selectedTargetIds, setSelectedTargetIds] = useState<number[]>([]);
  const [imgError, setImgError] = useState(false);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collectState, setCollectState] = useState<"idle" | "loading" | "collected">("idle");
  const [collectedUrls, setCollectedUrls] = useState<string[]>([]);
  const [selectedCollectedUrls, setSelectedCollectedUrls] = useState<string[]>([]);
  const [checkingTargetIds, setCheckingTargetIds] = useState<number[]>([]);
  const [editingPathIdx, setEditingPathIdx] = useState<number | null>(null);
  const [editingPathValue, setEditingPathValue] = useState<string>("");
  const [customPathInput, setCustomPathInput] = useState<string>("");
  const [newTargetName, setNewTargetName] = useState<string>("");
  const [draftSchedule, setDraftSchedule] = useState<{ interval: number; activeHours: "all" | "business" | "custom"; customStart: string; customEnd: string }>({
    interval: 30, activeHours: "all", customStart: "09:00", customEnd: "18:00",
  });
  const [incidents, setIncidents] = useState<any[]>([]);
  const [incidentFilter, setIncidentFilter] = useState<"all" | "open" | "resolved">("all");
  const [selectedReportIncident, setSelectedReportIncident] = useState<any | null>(null);

  const [globalSchedule, setGlobalSchedule] = useState<MonitorSchedule>({
    interval: 30,
    activeHours: "all",
    customStart: "09:00",
    customEnd: "18:00",
    globalPaused: false,
  });
  const [targetSchedules, setTargetSchedules] = useState<TargetSchedule[]>([]);

  // AI 콘텐츠 분석 State
  const [aiSubTab, setAiSubTab] = useState<"seo" | "geo">("seo");
  const [aiUrlInput, setAiUrlInput] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);
  const [aiCopiedCode, setAiCopiedCode] = useState<boolean>(false);

  // 최초 로그인 비밀번호 변경 관련 State
  const [mustChangePasswordUser, setMustChangePasswordUser] = useState<{ username: string; nickname: string } | null>(null);
  const [firstNewPassword, setFirstNewPassword] = useState<string>("");
  const [firstConfirmPassword, setFirstConfirmPassword] = useState<string>("");
  const [isSubmittingFirstPassword, setIsSubmittingFirstPassword] = useState<boolean>(false);


  const fetchUserProfile = async (targetUserEmail?: string) => {
    const userToFetch = targetUserEmail || loggedInUserRef.current || loggedInUser;
    if (!userToFetch) return;
    try {
      const res = await fetch(`/api/user/profile?username=${encodeURIComponent(userToFetch)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.nickname) {
          setNickname(data.nickname);
          localStorage.setItem("omnisight_nickname", data.nickname);
        }
        if (data.level) {
          const validLevel = data.level === "admin" ? "admin" : "user";
          setUserLevel(validLevel);
          localStorage.setItem("omnisight_user_level", validLevel);
        }
        if (data.lastLoginAt) {
          setLastLoginAt(data.lastLoginAt);
          localStorage.setItem("omnisight_last_login", data.lastLoginAt);
        }
        if (data.isFirstLogin === true) {
          setIsFirstLoginState(true);
          localStorage.setItem("omnisight_is_first_login", "true");
        } else {
          setIsFirstLoginState(false);
          localStorage.setItem("omnisight_is_first_login", "false");
        }
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  };

  // 로그인 상태 및 사용자 변경 시 프로필 자동 동기화
  useEffect(() => {
    if (isLoggedIn && loggedInUser) {
      fetchUserProfile(loggedInUser);
    }
  }, [isLoggedIn, loggedInUser]);

  // 일반 사용자가 'users'(계정 관리) 탭에 진입하면 home으로 자동 리다이렉트
  useEffect(() => {
    if (userLevel !== "admin" && activeTab === "users") {
      setActiveTab("home");
    }
  }, [userLevel, activeTab]);

  const forceLogout = () => {
    localStorage.removeItem("omnisight_auth");
    localStorage.removeItem("omnisight_logged_in");
    localStorage.removeItem("omnisight_username");
    localStorage.removeItem("omnisight_nickname");
    localStorage.removeItem("omnisight_user_level");
    sessionStorage.removeItem("omnisight_auth");
    setLoggedInUser("");
    setNickname("");
    setUserLevel("user");
    setIsLoggedIn(false);
  };

  // ── 1시간 동안 화면 입력/액션이 없을 때 자동 로그아웃 ──
  useEffect(() => {
    if (!isLoggedIn) return;

    // 1시간 타임아웃 (60분 * 60초 * 1000밀리초 = 3,600,000ms)
    const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
    let timeoutId: NodeJS.Timeout;

    const resetIdleTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert("1시간 동안 화면 활동이 감지되지 않아 보안을 위해 자동 로그아웃되었습니다.\n서비스 이용을 위해 다시 로그인해 주세요.");
        forceLogout();
      }, IDLE_TIMEOUT_MS);
    };

    // 마우스 이동, 클릭, 키보드 입력, 터치, 스크롤 등 액션 감지
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
      "focus"
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    // 타이머 최초 실행
    resetIdleTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetIdleTimer);
      });
    };
  }, [isLoggedIn]);

  const fetchUsersList = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const handleResetUserPassword = async (userId: number, email: string) => {
    if (!window.confirm(`'${email}' 계정의 비밀번호를 'happy2690'으로 초기화하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`비밀번호가 'happy2690'으로 성공적으로 초기화되었습니다.`);
        fetchUsersList();
        if (selectedUserDetail && selectedUserDetail.id === userId) {
          setSelectedUserDetail((prev: any) => prev ? { ...prev, passwordResetMessage: "비밀번호가 happy2690으로 초기화되었습니다." } : null);
        }
      } else {
        alert(data.error || "비밀번호 초기화 중 오류가 발생했습니다.");
      }
    } catch (err) {
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { username, nickname, password, confirmPassword, level } = newUserForm;

    if (!username.trim()) {
      alert("아이디(이메일)를 입력해 주세요.");
      return;
    }
    if (!nickname.trim()) {
      alert("닉네임을 입력해 주세요.");
      return;
    }
    if (!password) {
      alert("비밀번호를 입력해 주세요.");
      return;
    }
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다. 비밀번호와 비밀번호 입력 확인이 일치하는지 확인해 주세요.");
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, nickname, password, level })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`신규 계정(${username})이 생성되었습니다.`);
        setIsCreateUserModalOpen(false);
        setNewUserForm({ username: "", nickname: "", password: "", confirmPassword: "", level: "user" });
        fetchUsersList();
      } else {
        alert(data.error || "계정 생성에 실패했습니다.");
      }
    } catch (err) {
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  const handleUpdateUserInfo = async (userId: number, newNickname: string, newLevel: "admin" | "user") => {
    if (!newNickname.trim()) {
      alert("닉네임을 입력해 주세요.");
      return;
    }
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: newNickname.trim(), level: newLevel })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("계정 정보(닉네임, 권한 레벨)가 성공적으로 수정되었습니다.");
        fetchUsersList();
        if (selectedUserDetail && selectedUserDetail.id === userId) {
          setSelectedUserDetail(prev => prev ? { ...prev, nickname: newNickname.trim(), level: newLevel, saveSuccessMessage: "정보가 성공적으로 수정되었습니다." } : null);
        }
      } else {
        alert(data.error || "수정에 실패했습니다.");
      }
    } catch (err) {
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (userId === 1) {
      alert("최고 관리자 계정은 삭제할 수 없습니다.");
      return;
    }
    if (!window.confirm(`'${email}' 계정을 정말 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("계정이 삭제되었습니다.");
        if (selectedUserDetail && selectedUserDetail.id === userId) {
          setSelectedUserDetail(null);
        }
        fetchUsersList();
      } else {
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (err) {
      alert("서버 통신 오류가 발생했습니다.");
    }
  };

  const [isRefreshingIncidents, setIsRefreshingIncidents] = useState(false);

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
      }
    } catch (err) {
      console.error("Fetch incidents failed:", err);
    }
  };

  const handleRefreshIncidents = async () => {
    setIsRefreshingIncidents(true);
    try {
      const [tRes, iRes] = await Promise.all([
        fetch('/api/targets'),
        fetch('/api/incidents')
      ]);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTargets(tData);
      }
      if (iRes.ok) {
        const iData = await iRes.json();
        setIncidents(iData);
      }
    } catch (err) {
      console.error("Refresh incidents failed:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshingIncidents(false);
      }, 500);
    }
  };

  const handleUpdateProfile = async (newNickname: string, newPassword?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loggedInUser, nickname: newNickname, newPassword }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setNickname(data.user.nickname);
        if (data.user.level) {
          setUserLevel(data.user.level);
          localStorage.setItem("omnisight_user_level", data.user.level);
        }
        localStorage.setItem("omnisight_nickname", data.user.nickname);

        const authStr = localStorage.getItem("omnisight_auth") || sessionStorage.getItem("omnisight_auth");
        if (authStr) {
          try {
            const authObj = JSON.parse(authStr);
            authObj.nickname = data.user.nickname;
            if (data.user.level) authObj.level = data.user.level;
            localStorage.setItem("omnisight_auth", JSON.stringify(authObj));
          } catch (e) {}
        }
        return true;
      }
    } catch (err) {
      console.error("Profile update error:", err);
    }
    return false;
  };

  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      forceLogout();
    }
  };


  const handleFirstPasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstNewPassword || !firstNewPassword.trim()) {
      alert("새 비밀번호를 입력해 주세요.");
      return;
    }
    if (firstNewPassword !== firstConfirmPassword) {
      alert("비밀번호가 일치하지 않습니다. 비밀번호와 비밀번호 확인 입력값을 확인해 주세요.");
      return;
    }
    if (firstNewPassword.trim() === "happy2690" || firstNewPassword.trim() === "0000") {
      alert("초기 기본 비밀번호와 다른 안전한 개인 비밀번호를 설정해 주세요.");
      return;
    }

    setIsSubmittingFirstPassword(true);
    try {
      const res = await fetch("/api/user/first-password-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: mustChangePasswordUser?.username || loggedInUser,
          newPassword: firstNewPassword.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert("비밀번호 변경이 성공적으로 완료되었습니다!\n다음 로그인부터 변경된 비밀번호로 접속해 주세요.");
        setIsFirstLoginState(false);
        localStorage.setItem("omnisight_is_first_login", "false");
        setMustChangePasswordUser(null);
        setFirstNewPassword("");
        setFirstConfirmPassword("");
      } else {
        alert(data.error || "비밀번호 변경에 실패했습니다.");
      }
    } catch (err) {
      console.error("First password change error:", err);
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingFirstPassword(false);
    }
  };

  const handleRunAiAnalysis = async (targetUrl?: string) => {
    const inputUrl = targetUrl || aiUrlInput;
    if (!inputUrl.trim()) {
      alert("분석할 웹사이트 URL을 입력해 주세요.");
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysisResult(null);

    try {
      const res = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAiAnalysisResult(data);
      } else {
        alert(data.error || "AI 분석에 실패했습니다.");
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
      alert("분석 요청 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 등록을 진행한 계정에서만 리스트가 보이도록 계정 소유권 필터링
  const userTargets = targets.filter((t: any) => {
    const owner = (t.createdBy || "admin@happyict.co.kr").trim().toLowerCase();
    const currentUser = (loggedInUser || "admin@happyict.co.kr").trim().toLowerCase();
    if (currentUser === "admin" || currentUser === "admin@happyict.co.kr") {
      return owner === "admin" || owner === "admin@happyict.co.kr";
    }
    return owner === currentUser;
  });

  // 등록을 진행한 계정(userTargets)의 장애 내역만 필터링
  const userTargetIds = userTargets.map((t: any) => t.id);
  const userIncidents = incidents.filter((inc: any) => {
    if (userTargetIds.includes(inc.targetId)) return true;
    const owner = (inc.createdBy || "").trim().toLowerCase();
    const currentUser = (loggedInUser || "").trim().toLowerCase();
    if (currentUser === "admin" || currentUser === "admin@happyict.co.kr") {
      return owner === "admin" || owner === "admin@happyict.co.kr";
    }
    return owner === currentUser;
  });

  const currentTarget = userTargets.find((t) => t.id === currentTargetId) || userTargets[0] || null;

  const fetchInitialData = async () => {
    fetchIncidents();
    try {
      const res = await fetch('/api/targets');
      const data = await res.json();
      setTargets(data);
      
      // 백엔드 데이터로 스케줄 상태 복구 (useGlobal 포함)
      if (data.length > 0) {
        const restoredSchedules = data.map((t: any) => {
          const saved = t.schedule;
          if (saved) {
            return {
              targetId: t.id,
              useGlobal: saved.useGlobal ?? true, // 서버에 저장된 useGlobal 값 우선 사용
              interval: saved.interval ?? globalSchedule.interval,
              activeHours: saved.activeHours ?? "all",
              customStart: saved.customStart ?? "09:00",
              customEnd: saved.customEnd ?? "18:00",
              paused: saved.paused ?? false,
            };
          }
          return {
            targetId: t.id,
            useGlobal: true,
            interval: t.interval || globalSchedule.interval,
            activeHours: "all",
            customStart: "09:00",
            customEnd: "18:00",
            paused: false,
          };
        });
        setTargetSchedules(restoredSchedules);
      }
    } catch (err) {
      console.error("Failed to load initial targets:", err);
    }
  };

  // ── 0. 초기 데이터 로드 ──────────────────────────────────────
  useEffect(() => {
    fetchInitialData();
  }, []);

  // ── 1. 스케줄 동기화 (Auto-save) ──────────────────────────────
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const handleSaveSchedule = async () => {
    if (targets.length === 0) {
      alert("등록된 사이트가 없습니다.");
      return;
    }

    setIsSavingSchedule(true);
    try {
      const schedulesToSync = targetSchedules.map(sched => {
        if (sched.useGlobal) {
          return {
            ...sched,
            interval: globalSchedule.interval,
            activeHours: globalSchedule.activeHours,
            customStart: globalSchedule.customStart,
            customEnd: globalSchedule.customEnd,
            paused: sched.paused !== undefined ? sched.paused : globalSchedule.globalPaused
          };
        }
        return sched;
      });

      const res = await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: schedulesToSync })
      });

      if (res.ok) {
        alert("모니터링 스케줄이 저장 및 적용되었습니다.");
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (err) {
      console.error("Save schedule error:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // ── 2. 메뉴(탭) 이동 시 즉시 새로고침 및 주기적 데이터 업데이트 ──
  const refreshTabData = async () => {
    try {
      const res = await fetch('/api/targets');
      if (res.ok) {
        const data = await res.json();
        setTargets(data);
      }
      fetchIncidents();
      if (userLevelRef.current === "admin") {
        fetchUsersList();
      }
      if (loggedInUserRef.current) {
        fetchUserProfile(loggedInUserRef.current);
      }
      fetchAlertChannels();
    } catch (err) {
      console.error("Tab refresh error:", err);
    }
  };

  useEffect(() => {
    // 메뉴 이동 시 즉시 최신 데이터 새로고침
    refreshTabData();

    // 활성 탭 유지 시 주기적 최신화 (5초)
    const interval = setInterval(refreshTabData, 5000);
    return () => clearInterval(interval);
  }, [activeTab, loggedInUser]);

  const switchTab = (tab: TabName) => {
    // 일반 사용자가 관리자 전용 'users' 탭 클릭 시 접근 제한
    if (tab === "users" && userLevelRef.current !== "admin") {
      alert("계정 관리 메뉴는 관리자 권한이 있는 계정만 접근할 수 있습니다.");
      setActiveTab("home");
      return;
    }

    // 1. 활성 탭 상태를 즉시 동기(synchronous) 전환하여 클릭 씹힘 100% 방지
    setActiveTab(tab);
    setSidebarOpen(false);

    // 2. 각 탭별 초기화 (안전하게 예외 처리)
    try {
      if (tab === "add") {
        setCollectState("idle");
        setCollectedUrls([]);
        setSelectedCollectedUrls([]);
        setUrlInput("");
      } else if (tab === "dashboard") {
        setTableExpanded(false);
        setImgError(false);
        if (userTargets.length > 0) {
          setCurrentTargetId(userTargets[0].id);
        }
      } else if (tab === "incidents") {
        setIncidentFilter("all");
        setSelectedReportIncident(null);
      } else if (tab === "ai-analysis") {
        setAiSubTab("seo");
        setAiUrlInput("");
        setAiAnalysisResult(null);
        setIsAnalyzing(false);
      } else if (tab === "alerts") {
        setSelectedTargetIds([]);
        setEmailInput("");
      } else if (tab === "users") {
        setSelectedUserDetail(null);
        fetchUsersList();
      }

      // 최신 서버 데이터 새로고침
      refreshTabData();
    } catch (err) {
      console.error("switchTab error:", err);
    }
  };

  const goToDetail = (targetId: number) => {
    setCurrentTargetId(targetId);
    setImgError(false);
    setTableExpanded(false);
    setActiveTab("dashboard");
    setSidebarOpen(false);
  };

  const handleManualCheck = async (targetId: number) => {
    if (checkingTargetIds.includes(targetId)) return;
    setCheckingTargetIds((prev) => [...prev, targetId]);
    try {
      const res = await fetch(`/api/targets/${targetId}/check`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert("수동 점검이 성공적으로 완료되었습니다!");
        const tRes = await fetch('/api/targets');
        const tData = await tRes.json();
        setTargets(tData);
      } else {
        alert(data.message || data.error || "수동 점검 실행에 실패했습니다.");
      }
    } catch (err) {
      console.error("Manual check error:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setCheckingTargetIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  const handleResolveIncident = async (id: string) => {
    if (!window.confirm("해당 장애 건을 조치 완료(복구) 처리하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/incidents/${id}/resolve`, { method: 'POST' });
      if (res.ok) {
        alert("조치 완료 처리되었습니다.");
        fetchIncidents();
      }
    } catch (err) {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!window.confirm("해당 장애 이력을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/incidents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert("삭제되었습니다.");
        fetchIncidents();
      }
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const updateReportField = (field: string, value: any) => {
    setSelectedReportIncident((prev: any) => prev ? { ...prev, [field]: value } : null);
  };

  const updateActionLog = (index: number, field: string, value: string) => {
    setSelectedReportIncident((prev: any) => {
      if (!prev) return null;
      const logs = [...(prev.actionLogs || [])];
      if (!logs[index]) logs[index] = { time: '', content: '', person: '' };
      logs[index] = { ...logs[index], [field]: value };
      return { ...prev, actionLogs: logs };
    });
  };

  const addActionLogRow = () => {
    setSelectedReportIncident((prev: any) => {
      if (!prev) return null;
      const logs = [...(prev.actionLogs || [])];
      const nowStr = new Date().toTimeString().slice(0, 8);
      logs.push({ time: nowStr, content: '', person: prev.manager || '김보은' });
      return { ...prev, actionLogs: logs };
    });
  };

  const removeActionLogRow = (index: number) => {
    setSelectedReportIncident((prev: any) => {
      if (!prev) return null;
      const logs = [...(prev.actionLogs || [])];
      logs.splice(index, 1);
      return { ...prev, actionLogs: logs };
    });
  };

  const printIncidentReport = (inc: any) => {
    if (!inc) return;
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert("팝업창이 차단되었습니다. 브라우저 팝업 허용 후 다시 시도해 주세요.");
      return;
    }

    const incNo = inc.incidentNo || inc.id;
    const createdDate = inc.createdDate || (inc.startedAt ? inc.startedAt.slice(0, 10) : new Date().toISOString().slice(0, 10));
    const dept = inc.dept || 'IT운영팀';
    const manager = inc.manager || '김보은';
    const customer = inc.customer || inc.targetName || '행복ICT';
    const severity = inc.severity || 'Major';
    const title = inc.title || `${inc.targetName} 장애 보고서`;
    const startedAt = inc.startedAt || '-';
    const resolvedAt = inc.resolvedAt || (inc.status === 'OPEN' ? '미복구 (진행 중)' : '-');
    const duration = inc.duration || '-';
    const symptom = inc.symptom || inc.errorSummary || '-';
    const rootCause = inc.rootCause || '-';
    const impactRange = inc.impactRange || '-';
    const actionSummary = inc.actionSummary || '-';
    const actionLogs = inc.actionLogs && inc.actionLogs.length > 0 ? inc.actionLogs : [
      { time: startedAt.slice(11) || '09:15:00', content: inc.errorSummary || '장애 발생 감지', person: manager }
    ];
    const preventiveAction = inc.preventiveAction || '-';
    const dueDate = inc.dueDate || '-';
    const preventiveManager = inc.preventiveManager || manager;

    const emptyLogCount = Math.max(0, 6 - actionLogs.length);
    const fullLogsHtml = actionLogs.map((log: any) => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 12px;">${log.time || '-'}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 12px;">${log.content || '-'}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 12px;">${log.person || '-'}</td>
      </tr>
    `).join('') + Array(emptyLogCount).fill(0).map(() => `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 12px;">-</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 12px;"></td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 12px;"></td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <title>장애보고서_${incNo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            font-family: 'Pretendard', 'Malgun Gothic', '맑은 고딕', sans-serif;
            margin: 0;
            padding: 20px;
            color: #000;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-title {
            background-color: #434343;
            color: #ffffff;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            padding: 12px 0;
            letter-spacing: 14px;
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 13.5px;
            font-weight: bold;
            margin-top: 16px;
            margin-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          th, td {
            border: 1px solid #000;
            padding: 6px 10px;
            font-size: 12px;
            vertical-align: middle;
          }
          .bg-label {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
          }
          .footer-container {
            margin-top: 30px;
            position: relative;
            height: 40px;
          }
          .footer-page {
            text-align: center;
            font-size: 13px;
          }
          .footer-logo {
            position: absolute;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .logo-text {
            color: #ea580c;
            font-weight: 800;
            font-size: 17px;
            font-family: sans-serif;
          }
        </style>
      </head>
      <body>
        <div class="header-title">장 애 보 고 서</div>

        <div class="section-title">▶ 장애관리</div>
        <table>
          <tr>
            <td class="bg-label" style="width:14%;">작성일자</td>
            <td style="width:20%; font-weight:bold; text-align:center;">${createdDate}</td>
            <td class="bg-label" style="width:14%;">작성부서</td>
            <td style="width:20%; text-align:center;">${dept}</td>
            <td class="bg-label" style="width:14%;">담당자</td>
            <td style="width:18%; text-align:center;">${manager}</td>
          </tr>
          <tr>
            <td class="bg-label">장애번호</td>
            <td style="font-weight:bold; text-align:center; font-family: monospace;">${incNo}</td>
            <td class="bg-label">심각도</td>
            <td style="text-align:center; font-weight:bold;">
              ${severity}
            </td>
            <td class="bg-label">고객사</td>
            <td style="text-align:center;">${customer}</td>
          </tr>
        </table>

        <div class="section-title">▶ 장애개요</div>
        <table>
          <tr>
            <td class="bg-label" style="width:14%;">서비스명</td>
            <td style="width:33%; font-weight:bold;">${inc.targetName || customer}</td>
            <td class="bg-label" style="width:14%;">장애 제목</td>
            <td style="width:39%; font-weight:bold;">${title}</td>
          </tr>
          <tr>
            <td class="bg-label">발생시간</td>
            <td style="text-align:center;">${startedAt}</td>
            <td class="bg-label">해결시간</td>
            <td style="text-align:center;">${resolvedAt}</td>
          </tr>
          <tr>
            <td class="bg-label">총 장애시간</td>
            <td colspan="3" style="font-weight:bold; color: #b91c1c;">${duration}</td>
          </tr>
          <tr>
            <td class="bg-label">현상</td>
            <td colspan="3">${symptom}</td>
          </tr>
          <tr>
            <td class="bg-label">세부원인</td>
            <td colspan="3">${rootCause}</td>
          </tr>
          <tr>
            <td class="bg-label">영향범위</td>
            <td colspan="3">${impactRange}</td>
          </tr>
          <tr>
            <td class="bg-label">조치요약</td>
            <td colspan="3">${actionSummary}</td>
          </tr>
        </table>

        <div class="section-title">▶ 시간대별 조치내역</div>
        <table>
          <thead>
            <tr>
              <th class="bg-label" style="width:20%;">조치시간</th>
              <th class="bg-label" style="width:60%;">조치 내용 및 결과</th>
              <th class="bg-label" style="width:20%;">조치자(담당자)</th>
            </tr>
          </thead>
          <tbody>
            ${fullLogsHtml}
          </tbody>
        </table>

        <div class="section-title">▶ 향후 대책</div>
        <table>
          <thead>
            <tr>
              <th class="bg-label" style="width:58%;">재발 방지 대책</th>
              <th class="bg-label" style="width:22%;">완료예정일</th>
              <th class="bg-label" style="width:20%;">조치자(담당자)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px;">${preventiveAction}</td>
              <td style="text-align:center;">${dueDate}</td>
              <td style="text-align:center;">${preventiveManager}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer-container">
          <div class="footer-page">- 1 -</div>
          <div class="footer-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ea580c">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="6" cy="8" r="2.5"/>
              <circle cx="18" cy="8" r="2.5"/>
              <circle cx="8" cy="17" r="2.5"/>
              <circle cx="16" cy="17" r="2.5"/>
            </svg>
            <span class="logo-text">행복ICT</span>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const isWithinActiveHours = (schedule: any) => {
    if (schedule.activeHours === 'all') return true;
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (schedule.activeHours === 'business') return currentTime >= '09:00' && currentTime <= '18:00';
    if (schedule.activeHours === 'custom') return currentTime >= (schedule.customStart || '00:00') && currentTime <= (schedule.customEnd || '23:59');
    return true;
  };

  const getTargetStatusInfo = (targetId: number) => {
    const ts = getTargetSchedule(targetId);
    if (globalSchedule.globalPaused || ts.paused) {
      return { label: 'PAUSED', color: '#6b7280', dot: '#9ca3af', bg: '#f3f4f6' };
    }
    if (!isWithinActiveHours(ts.useGlobal ? globalSchedule : ts)) {
      return { label: 'OFF-HOURS', color: '#92400e', dot: '#f59e0b', bg: '#fef9c3' };
    }
    return { label: 'ACTIVE', color: '#15803d', dot: '#22c55e', bg: '#dcfce7' };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("주소가 클립보드에 복사되었습니다.");
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
        if (!data.results || data.results.length === 0) {
          alert("수집된 페이지가 없습니다. URL이 정확한지 또는 접근 가능한지 확인해 주세요.");
          setCollectState("idle");
          return;
        }
        const paths = data.results.map((r: any) => r.path);
        setCollectedUrls(paths);
        setSelectedCollectedUrls(paths);
        (window as any)._lastCollection = data;
        // 자동 이름 생성: URL에서 도메인 추출
        const autoName = (data.url || url).replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0].toUpperCase();
        setNewTargetName(autoName);
        // 주기 초안 초기화
        setDraftSchedule({ interval: 30, activeHours: "all", customStart: "09:00", customEnd: "18:00" });
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
    if (selectedCollectedUrls.length === 0) {
      alert("모니터링할 대상을 하나 이상 선택해 주세요.");
      return;
    }
    
    const lastData = (window as any)._lastCollection;
    const finalUrl = lastData?.url || (url.startsWith('http') ? url : 'http://' + url);

    // 백엔드에 실제 등록 요청 (수집된 데이터 전송)
    setCollectState("loading");
    try {
      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: finalUrl,
          name: newTargetName.trim() || finalUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split(".")[0].toUpperCase(),
          createdBy: loggedInUser,
          data: lastData?.results ? lastData.results.filter((r: any) => selectedCollectedUrls.includes(r.path)) : [],
          interval: draftSchedule.interval,
          schedule: { 
            interval: draftSchedule.interval, 
            activeHours: draftSchedule.activeHours, 
            customStart: draftSchedule.customStart, 
            customEnd: draftSchedule.customEnd, 
            paused: false,
            useGlobal: false,
          }
        })
      });
      const data = await response.json();
      
      if (data.success) {
        const newTarget = data.target;
        setTargets((prev) => [...prev, newTarget]);
        setTargetSchedules((prev) => [
          ...prev,
          { targetId: newTarget.id, useGlobal: false, interval: draftSchedule.interval, activeHours: draftSchedule.activeHours, customStart: draftSchedule.customStart, customEnd: draftSchedule.customEnd, paused: false },
        ]);
        setUrlInput("");
        setNewTargetName("");
        setCurrentTargetId(newTarget.id);
        setImgError(false);
        setCollectState("idle");
        setCollectedUrls([]);
        setSelectedCollectedUrls([]);
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
    setSelectedCollectedUrls([]);
  };

  const handleSaveEditedPath = (idx: number) => {
    const val = editingPathValue.trim();
    if (!val) {
      alert("경로를 입력해 주세요.");
      return;
    }
    const formattedVal = val.startsWith('/') ? val : '/' + val;
    setCollectedUrls((prev) => {
      const updated = [...prev];
      const oldVal = updated[idx];
      updated[idx] = formattedVal;
      
      // selectedCollectedUrls도 업데이트
      setSelectedCollectedUrls((selected) =>
        selected.map((s) => s === oldVal ? formattedVal : s)
      );
      
      return updated;
    });
    setEditingPathIdx(null);
  };

  const handleDeleteCollectedPath = (idx: number) => {
    setCollectedUrls((prev) => {
      const updated = [...prev];
      const deletedVal = updated[idx];
      updated.splice(idx, 1);
      
      // selectedCollectedUrls에서도 제거
      setSelectedCollectedUrls((selected) =>
        selected.filter((s) => s !== deletedVal)
      );
      
      return updated;
    });
  };

  const handleAddNewCustomPath = () => {
    const val = customPathInput.trim();
    if (!val) {
      alert("추가할 경로를 입력해 주세요.");
      return;
    }
    const formattedVal = val.startsWith('/') ? val : '/' + val;
    if (collectedUrls.includes(formattedVal)) {
      alert("이미 존재하는 경로입니다.");
      return;
    }
    setCollectedUrls((prev) => [...prev, formattedVal]);
    setSelectedCollectedUrls((prev) => [...prev, formattedVal]);
    setCustomPathInput("");
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

  const fetchAlertChannels = async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlertChannels(data);
      }
    } catch (err) {
      console.error("Fetch alerts failed:", err);
    }
  };

  const addEmailWithSelection = async () => {
    const email = emailInput.trim();
    if (!email || !email.includes("@")) {
      alert("올바른 수신 이메일 주소를 입력해 주세요.");
      return;
    }
    if (selectedTargetIds.length === 0) {
      alert("알림을 수신할 사이트를 하나 이상 선택해 주세요.");
      return;
    }

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, targetIds: selectedTargetIds })
      });
      if (res.ok) {
        const data = await res.json();
        setAlertChannels(data.alertChannels || []);
        setEmailInput("");
        setSelectedTargetIds([]);
        alert(`'${email}' 주소가 알림 수신 이메일로 성공적으로 매칭 및 저장되었습니다!`);
      } else {
        const errData = await res.json();
        alert(errData.error || "알림 채널 등록에 실패했습니다.");
      }
    } catch (err) {
      console.error("Add alert channel error:", err);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  const removeChannel = async (email: string) => {
    if (!window.confirm(`'${email}' 알림 채널을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/alerts/${encodeURIComponent(email)}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setAlertChannels(data.alertChannels || []);
      }
    } catch (err) {
      console.error("Delete alert channel error:", err);
    }
  };

  const handleTestSendEmail = async (email: string, targetId?: number) => {
    setSendingTestEmailKey(email);
    try {
      const res = await fetch('/api/alerts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, targetId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.previewUrl) {
          if (window.confirm(`${data.message}\n\n[📫 발송된 실시간 메일함 열어보기]\n전송 완료된 테스트 이메일 본문을 보시겠습니까?`)) {
            window.open(data.previewUrl, '_blank');
          }
        } else {
          alert(data.message);
        }
      } else {
        alert(data.error || "테스트 메일 발송 실패");
      }
    } catch (err) {
      console.error("Test email send error:", err);
      alert("테스트 발송 중 오류가 발생했습니다.");
    } finally {
      setSendingTestEmailKey(null);
    }
  };

  const deleteTarget = async (id: number) => {
    if (window.confirm("해당 사이트를 목록에서 삭제하시겠습니까?")) {
      try {
        const res = await fetch(`/api/targets/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          alert("삭제에 실패했습니다. 서버 상태를 확인해주세요.");
          return;
        }
        setTargets((prev) => prev.filter((t) => t.id !== id));
        if (currentTargetId === id) {
          setCurrentTargetId(null);
          setActiveTab("guide");
        }
      } catch (err) {
        console.error("Delete failed:", err);
        alert("삭제 요청 중 네트워크 오류가 발생했습니다.");
      }
    }
  };

  const deletePath = async (targetId: number, path: string) => {
    console.log("!!! 삭제 버튼 클릭됨 !!!", { targetId, path });
    if (window.confirm(`'${path}' 경로를 삭제하시겠습니까?`)) {
      try {
        const response = await fetch(`/api/targets/${targetId}/path`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path })
        });
        const data = await response.json();
        if (data.success) {
          console.log("삭제 성공! 최신 데이터 불러오는 중...");
          const res = await fetch('/api/targets');
          const latestTargets = await res.json();
          
          // 1. 전체 targets 상태 업데이트 (새 배열로 할당하여 감지 유도)
          setTargets([...latestTargets]);
          
          // 2. 현재 활성 타겟 수동 갱신 (통계 수치 즉시 반영 핵심)
          if (currentTargetId === targetId) {
            setCurrentTargetId(null);
            setTimeout(() => setCurrentTargetId(targetId), 50);
          }
          alert("삭제되었습니다.");
        } else {
          alert("삭제에 실패했습니다: " + (data.error || "알 수 없는 오류"));
        }
      } catch (err) {
        console.error("Delete path failed:", err);
        alert("서버 통신 중 오류가 발생했습니다.");
      }
    }
  };

  const latestTarget = targets.find((t) => t.id === currentTargetId) || null;

  const stats = latestTarget
    ? {
        total: latestTarget.data.length,
        success: latestTarget.data.filter((d) => d.status === 200).length,
        broken: latestTarget.data.filter((d) => d.brokenImg).length,
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
    // 만약 개별 일시정지(paused)를 켜거나 끌 때, 글로벌 설정을 따르고 있었다면 자동으로 개별 설정 모드로 전환
    const effectivePatch = patch.paused !== undefined && patch.useGlobal === undefined
      ? { ...patch, useGlobal: false }
      : patch;

    setTargetSchedules((prev) => {
      const exists = prev.find((s) => s.targetId === id);
      const updated = exists
        ? prev.map((s) => s.targetId === id ? { ...s, ...effectivePatch } : s)
        : [...prev, { targetId: id, useGlobal: false, interval: globalSchedule.interval, activeHours: "all", customStart: "09:00", customEnd: "18:00", paused: false, ...effectivePatch }];
      
      // 서버에 즉시 비동기 자동 동기화 (저장 버튼을 누르지 않아도 즉각 적용)
      fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: updated })
      }).catch(err => console.error("Auto-sync schedule error:", err));

      return updated;
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

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLoginSuccess={(userObj: any) => {
          const username = typeof userObj === "string" ? userObj : (userObj?.username || "");
          const userRoleLevel = (typeof userObj === "object" && userObj?.level === "admin") ? "admin" : "user";
          const userNickname = typeof userObj === "object" ? (userObj?.nickname || (userRoleLevel === "admin" ? "관리자" : "사용자")) : "사용자";
          const isFirstLogin = typeof userObj === "object" && userObj?.isFirstLogin === true;

          setLoggedInUser(username);
          setNickname(userNickname);
          setUserLevel(userRoleLevel);
          setIsLoggedIn(true);

          localStorage.setItem("omnisight_username", username);
          localStorage.setItem("omnisight_nickname", userNickname);
          localStorage.setItem("omnisight_user_level", userRoleLevel);

          if (isFirstLogin) {
            setIsFirstLoginState(true);
            localStorage.setItem("omnisight_is_first_login", "true");
            setMustChangePasswordUser({ username, nickname: userNickname });
            setFirstNewPassword("");
            setFirstConfirmPassword("");
          } else {
            setIsFirstLoginState(false);
            localStorage.setItem("omnisight_is_first_login", "false");
          }

          fetchUserProfile(username);
          setActiveTab("home");
        }}
      />
    );
  }

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

        <nav className="px-2 space-y-0.5">

          {/* ── 대시보드 ── */}
          {([ { id: "home", icon: <Home size={18} />, label: "전체 대시보드" } ] as { id: TabName; icon: React.ReactNode; label: string }[]).map((item) => (
            <div
              key={item.id}
              onClick={() => switchTab(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className="p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all"
              style={activeTab === item.id ? { backgroundColor: C.lightBg, color: C.primary, borderRight: `4px solid ${C.primary}`, fontWeight: 600 } : { color: "#4b5563" }}
              onMouseEnter={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9"; }}
              onMouseLeave={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={`whitespace-nowrap ${sidebarOpen ? "" : "hidden lg:inline"}`}>{item.label}</span>
            </div>
          ))}

          {/* ── 모니터링 관리 그룹 ── */}
          <div className="pt-3 pb-0">
            {/* 라벨: 사이드바 펼쳐졌을 때 */}
            <div className={`px-1 ${sidebarOpen ? "" : "hidden lg:block"}`}>
              <p className="px-2 py-2 whitespace-nowrap font-semibold" style={{ fontSize: "0.875rem", color: "#374151" }}>
                모니터링 관리
              </p>
              <div className="h-px bg-slate-200 mx-2 mb-1" />
            </div>
            {/* 모바일 접힌 상태: 구분선만 */}
            <div className={`border-t border-slate-200 my-1 ${sidebarOpen ? "hidden" : "block lg:hidden"}`} />
          </div>

          {/* 들여쓰기된 하위 메뉴 */}
          {(
            [
              { id: "monitor-list", icon: <List size={17} />,          label: "모니터링 목록" },
              { id: "add",          icon: <PlusCircle size={17} />,    label: "신규 타겟 추가" },
              { id: "schedule",     icon: <CalendarClock size={17} />, label: "모니터링 주기 관리" },
              { id: "alerts",       icon: <Bell size={17} />,          label: "모니터링 결과 알림설정" },
            ] as { id: TabName; icon: React.ReactNode; label: string }[]
          ).map((item) => (
            <div
              key={item.id}
              onClick={() => switchTab(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className={`rounded-lg flex items-center gap-3 cursor-pointer transition-all ${sidebarOpen ? "pl-5 pr-3 py-2.5" : "p-3"}`}
              style={
                activeTab === item.id
                  ? { backgroundColor: C.lightBg, color: C.primary, borderRight: `4px solid ${C.primary}`, fontWeight: 600 }
                  : { color: "#6b7280" }
              }
              onMouseEnter={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9"; }}
              onMouseLeave={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
            >
              {/* 사이드바 펼쳐졌을 때만 들여쓰기 바(bar) 표시 */}
              {sidebarOpen && (
                <span className="w-px self-stretch bg-slate-200 flex-shrink-0 -ml-2 mr-1" style={{ minWidth: 2 }} />
              )}
              <span className="flex-shrink-0" style={{ fontSize: "0.9375rem" }}>{item.icon}</span>
              <span className={`whitespace-nowrap text-sm ${sidebarOpen ? "" : "hidden lg:inline"}`}>{item.label}</span>
            </div>
          ))}

          {/* ── 구분선 ── */}
          <div className="border-t border-slate-100 my-2 mx-1" />

          {/* ── 장애현황 관리 ── */}
          {([ { id: "incidents", icon: <AlertTriangle size={18} />, label: "장애현황 관리" } ] as { id: TabName; icon: React.ReactNode; label: string }[]).map((item) => (
            <div
              key={item.id}
              onClick={() => switchTab(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className="p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all"
              style={activeTab === item.id ? { backgroundColor: C.lightBg, color: C.primary, borderRight: `4px solid ${C.primary}`, fontWeight: 600 } : { color: "#4b5563" }}
              onMouseEnter={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9"; }}
              onMouseLeave={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={`whitespace-nowrap ${sidebarOpen ? "" : "hidden lg:inline"}`}>{item.label}</span>
            </div>
          ))}

          {/* ── AI 콘텐츠 분석 ── */}
          {([ { id: "ai-analysis", icon: <Sparkles size={18} />, label: "AI 콘텐츠 분석" } ] as { id: TabName; icon: React.ReactNode; label: string }[]).map((item) => (
            <div
              key={item.id}
              onClick={() => switchTab(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className="p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all"
              style={activeTab === item.id ? { backgroundColor: C.lightBg, color: C.primary, borderRight: `4px solid ${C.primary}`, fontWeight: 600 } : { color: "#4b5563" }}
              onMouseEnter={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9"; }}
              onMouseLeave={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={`whitespace-nowrap ${sidebarOpen ? "" : "hidden lg:inline"}`}>{item.label}</span>
            </div>
          ))}

          {/* ── 계정 관리 (관리자 전용) ── */}
          {userLevel === "admin" && ([ { id: "users", icon: <UserCog size={18} />, label: "계정 관리" } ] as { id: TabName; icon: React.ReactNode; label: string }[]).map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => switchTab(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className="w-full text-left p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all outline-none"
              style={activeTab === item.id ? { backgroundColor: C.lightBg, color: C.primary, borderRight: `4px solid ${C.primary}`, fontWeight: 600 } : { color: "#4b5563" }}
              onMouseEnter={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9"; }}
              onMouseLeave={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={`whitespace-nowrap ${sidebarOpen ? "" : "hidden lg:inline"}`}>{item.label}</span>
            </button>
          ))}

          {/* ── OmniSight 사용방법 ── */}
          {([ { id: "guide", icon: <BookOpen size={18} />, label: "OmniSight 사용방법" } ] as { id: TabName; icon: React.ReactNode; label: string }[]).map((item) => (
            <div
              key={item.id}
              onClick={() => switchTab(item.id)}
              title={!sidebarOpen ? item.label : undefined}
              className="p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all"
              style={activeTab === item.id ? { backgroundColor: C.lightBg, color: C.primary, borderRight: `4px solid ${C.primary}`, fontWeight: 600 } : { color: "#4b5563" }}
              onMouseEnter={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9"; }}
              onMouseLeave={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLElement).style.backgroundColor = ""; }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className={`whitespace-nowrap ${sidebarOpen ? "" : "hidden lg:inline"}`}>{item.label}</span>
            </div>
          ))}

        </nav>

        <div className={`mt-8 flex-1 flex flex-col px-4 overflow-hidden ${sidebarOpen ? "" : "hidden lg:flex"}`}>
          <div className="flex justify-between items-center mb-4 px-2 text-gray-400">
            <h2 style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              등록된 사이트 목록
            </h2>
            <span style={{ fontSize: "0.625rem", backgroundColor: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>
              {userTargets.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pb-4" style={{ scrollbarWidth: "none" }}>
            {userTargets.length === 0 ? (
              <div className="p-4 border border-dashed rounded-xl text-center text-gray-400" style={{ fontSize: "0.6875rem" }}>
                사이트를 추가해 주세요
              </div>
            ) : (
              userTargets.map((t) => {
                const sInfo = getTargetStatusInfo(t.id);
                return (
                  <div
                    key={t.id}
                    className="relative group p-3 border rounded-xl bg-white cursor-pointer transition-all hover:shadow-md"
                    style={
                      currentTargetId === t.id && activeTab === "dashboard"
                        ? { borderColor: C.primary, backgroundColor: C.lightBg, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                        : { borderColor: "#f9fafb" }
                    }
                    onClick={() => selectTarget(t.id)}
                  >
                    {/* 사이트 정보 */}
                    <div className="flex items-center gap-2 mb-1 pr-5">
                      <span
                        className="flex-shrink-0"
                        style={{ height: 7, width: 7, borderRadius: "50%", backgroundColor: sInfo.dot, display: "inline-block" }}
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
                );
              })
            )}
          </div>
        </div>

        {/* 로그인 사용자 프로필 및 내정보/로그아웃 버튼 (사이드바 하단) */}
        <div className={`p-3.5 border-t border-slate-100 bg-slate-50/80 flex flex-col gap-2 ${sidebarOpen ? "" : "hidden lg:flex"}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                {(loggedInUser || "U").charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">{loggedInUser}</p>
                <p className="text-[10px] text-sky-600 font-semibold leading-tight">
                  {userLevel === "admin" ? "최고관리자 접속 중" : "일반사용자 접속 중"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                title="내 정보 수정"
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-100 transition-all"
              >
                <UserCog size={16} />
              </button>
              <button
                onClick={handleLogout}
                title="로그아웃"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* 권한 레벨 표기 */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px]">
            <span className="text-slate-500 font-semibold">계정 권한</span>
            <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
              userLevel === 'admin' ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {userLevel === 'admin' ? '최고관리자 (admin)' : '일반사용자 (user)'}
            </span>
          </div>
        </div>

        <div className={`p-2 border-t border-slate-100 text-slate-400 text-center ${sidebarOpen ? "" : "hidden lg:block"}`} style={{ fontSize: "0.625rem" }}>
          v1.4.0-SmartAlert
        </div>
      </aside>

      {/* 모바일: 아이콘 스트립 너비만큼 공간 확보 */}
      <div className="w-14 flex-shrink-0 lg:hidden" />

      {/* ── 메인 컨텐츠 ── */}
      <main className="flex-1 overflow-y-auto relative" style={{ backgroundColor: "#f8fafc", scrollbarWidth: "none" }}>
        
        {/* Top Header Bar for User & Logout */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>OmniSight 시스템 가동 중</span>
            </div>
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              title="대화형 가이드 튜토리얼 투어 시작"
            >
              <span>🎓 이용방법 튜토리얼</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* 유저 정보 및 내 정보 수정 버튼 */}
            <div className="flex items-center gap-2 bg-sky-50 border border-sky-100 pl-3 pr-1 py-1 rounded-full shadow-2xs">
              <User size={14} className="text-sky-600" />
              <span className="text-xs font-extrabold text-sky-900">{nickname || (userLevel === 'admin' ? "최고관리자" : "일반사용자")}</span>
              <span className="text-[10px] text-sky-700 bg-sky-100 font-mono px-2 py-0.5 rounded-full border border-sky-200">{loggedInUser}</span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${userLevel === 'admin' ? 'bg-sky-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                {userLevel === 'admin' ? '최고관리자' : '일반사용자'}
              </span>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                title="내 정보 수정"
                className="p-1.5 rounded-full hover:bg-sky-200 text-sky-700 transition-colors flex items-center justify-center"
              >
                <UserCog size={15} />
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <LogOut size={14} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>

        {/* ═══ [탭] 대시보드 (홈) ═══ */}
        {activeTab === "home" && (
          <div className="p-8 md:p-10 max-w-7xl mx-auto">
            {/* 페이지 헤더 */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div
                  className="w-12 h-12 text-white rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: C.primary, boxShadow: `0 10px 25px ${C.shadow}` }}
                >
                  <Home size={22} />
                </div>
                <div>
                  <h2 className="text-gray-800" style={{ fontSize: "1.5rem", fontWeight: 800 }}>대시보드</h2>
                  <p className="text-gray-500" style={{ fontSize: "0.875rem" }}>등록된 모니터링 대상의 현재 상태를 한눈에 확인합니다.</p>
                </div>
              </div>
            </div>

            {/* 요약 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Globe size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">전체 사이트</p>
                  <p className="text-2xl font-extrabold text-slate-800">{userTargets.length}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">정상 운영</p>
                  <p className="text-2xl font-extrabold text-emerald-600">
                    {userTargets.filter(t => {
                      const si = getTargetStatusInfo(t.id);
                      return si.label === 'ACTIVE';
                    }).length}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">이상 감지</p>
                  <p className="text-2xl font-extrabold text-amber-600">
                    {userTargets.filter(t => t.data && t.data.some(d => d.status !== 200 || d.brokenImg)).length}
                  </p>
                </div>
              </div>
            </div>

            {/* 모니터링 대상 카드 리스트 */}
            {userTargets.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                  <Inbox size={28} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">등록된 모니터링 대상이 없습니다</h3>
                <p className="text-sm text-slate-500 mb-6">신규 타겟을 추가하여 웹사이트 모니터링을 시작하세요.</p>
                <button
                  onClick={() => switchTab("add")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: C.primary }}
                >
                  <PlusCircle size={16} /> 신규 타겟 추가
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {userTargets.map((t) => {
                  const sInfo = getTargetStatusInfo(t.id);
                  const tStats = {
                    total: t.data ? t.data.length : 0,
                    success: t.data ? t.data.filter(d => d.status === 200).length : 0,
                    broken: t.data ? t.data.filter(d => d.brokenImg).length : 0,
                    errors: t.data ? t.data.filter(d => d.status !== 200).length : 0,
                  };
                  const successRate = tStats.total > 0 ? Math.round((tStats.success / tStats.total) * 100) : 0;

                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
                    >
                      {/* 카드 상단: 상태 바 */}
                      <div className="h-1.5" style={{ backgroundColor: sInfo.dot }} />

                      <div className="p-5">
                        {/* 제목 + 상태 */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5 mb-1">
                              <span
                                className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: sInfo.dot }}
                              />
                              <h3 className="text-base font-bold text-slate-800 truncate">{t.name}</h3>
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: sInfo.bg, color: sInfo.color }}
                              >
                                {sInfo.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 pl-5">
                              <Globe size={12} className="text-slate-400 flex-shrink-0" />
                              <span className="text-xs text-slate-500 truncate">{t.url}</span>
                            </div>
                          </div>
                        </div>

                        {/* 최근 점검 일시 */}
                        <div className="flex items-center gap-2 mb-4 pl-5">
                          <Clock size={12} className="text-slate-400" />
                          <span className="text-[11px] text-slate-500">
                            최근 점검: <strong className="text-slate-700">{t.timestamp || "점검 대기 중"}</strong>
                          </span>
                        </div>

                        {/* 통계 미니 카드 */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                            <p className="text-[10px] text-slate-400 font-semibold mb-0.5">전체</p>
                            <p className="text-sm font-extrabold text-slate-800">{tStats.total}</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                            <p className="text-[10px] text-emerald-500 font-semibold mb-0.5">정상</p>
                            <p className="text-sm font-extrabold text-emerald-700">{tStats.success}</p>
                          </div>
                          <div className="bg-red-50 rounded-xl p-2.5 text-center">
                            <p className="text-[10px] text-red-400 font-semibold mb-0.5">오류</p>
                            <p className="text-sm font-extrabold text-red-600">{tStats.errors}</p>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                            <p className="text-[10px] text-amber-500 font-semibold mb-0.5">깨진 이미지</p>
                            <p className="text-sm font-extrabold text-amber-600">{tStats.broken}</p>
                          </div>
                        </div>

                        {/* 성공률 바 */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-[11px] mb-1.5">
                            <span className="text-slate-500 font-semibold">정상 응답률</span>
                            <span className="font-bold" style={{ color: successRate >= 90 ? '#16a34a' : successRate >= 70 ? '#d97706' : '#dc2626' }}>
                              {successRate}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${successRate}%`,
                                backgroundColor: successRate >= 90 ? '#22c55e' : successRate >= 70 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                        </div>

                        {/* 액션 버튼 그룹 */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleManualCheck(t.id); }}
                            disabled={checkingTargetIds.includes(t.id)}
                            className="flex-1 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                            title="수동으로 바로 점검을 수행합니다"
                          >
                            <RefreshCw size={13} className={checkingTargetIds.includes(t.id) ? "animate-spin" : ""} />
                            {checkingTargetIds.includes(t.id) ? "점검 중..." : "수동 점검"}
                          </button>
                          <button
                            onClick={() => goToDetail(t.id)}
                            className="flex-1 py-2.5 rounded-xl border border-sky-200 text-sky-700 bg-sky-50 hover:bg-sky-100 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                          >
                            <LayoutDashboard size={14} />
                            상세 모니터링 보기
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ [탭] 모니터링 목록 ═══ */}
        {activeTab === "monitor-list" && (
          <div className="p-8 md:p-10 max-w-6xl mx-auto">
            {/* 페이지 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 text-white rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: C.primary, boxShadow: `0 10px 25px ${C.shadow}` }}
                >
                  <List size={22} />
                </div>
                <div>
                  <h2 className="text-gray-800" style={{ fontSize: "1.5rem", fontWeight: 800 }}>모니터링 목록</h2>
                  <p className="text-gray-500" style={{ fontSize: "0.875rem" }}>등록된 모니터링 대상을 관리하고 상세 정보를 확인합니다.</p>
                </div>
              </div>
              <button
                onClick={() => switchTab("add")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 shadow-lg flex-shrink-0"
                style={{ backgroundColor: C.primary, boxShadow: `0 8px 20px ${C.shadow}` }}
              >
                <PlusCircle size={16} /> 신규 타겟 추가
              </button>
            </div>

            {userTargets.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                  <Inbox size={28} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">등록된 모니터링 대상이 없습니다</h3>
                <p className="text-sm text-slate-500">신규 타겟 추가 메뉴에서 웹사이트를 등록해 주세요.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* 테이블 헤더 */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-1 text-center">상태</div>
                  <div className="col-span-2">이름</div>
                  <div className="col-span-3">URL</div>
                  <div className="col-span-2 text-center">최근 점검</div>
                  <div className="col-span-1 text-center">전체</div>
                  <div className="col-span-1 text-center">정상</div>
                  <div className="col-span-2 text-center">작업</div>
                </div>

                {/* 테이블 행 */}
                {userTargets.map((t, idx) => {
                  const sInfo = getTargetStatusInfo(t.id);
                  const tTotal = t.data ? t.data.length : 0;
                  const tSuccess = t.data ? t.data.filter(d => d.status === 200).length : 0;
                  const tErrors = t.data ? t.data.filter(d => d.status !== 200).length : 0;

                  return (
                    <div
                      key={t.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-slate-50 hover:bg-sky-50/40 transition-colors cursor-pointer group"
                      onClick={() => goToDetail(t.id)}
                      style={idx % 2 === 1 ? { backgroundColor: 'rgba(248,250,252,0.5)' } : {}}
                    >
                      {/* 상태 */}
                      <div className="col-span-1 flex justify-center">
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: sInfo.bg, color: sInfo.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sInfo.dot }} />
                          {sInfo.label}
                        </span>
                      </div>

                      {/* 이름 */}
                      <div className="col-span-2">
                        <p className="text-sm font-bold text-slate-800 truncate">{t.name}</p>
                      </div>

                      {/* URL */}
                      <div className="col-span-3">
                        <p className="text-xs text-slate-500 truncate">{t.url}</p>
                      </div>

                      {/* 최근 점검 */}
                      <div className="col-span-2 text-center">
                        <span className="text-[11px] text-slate-600 font-medium">
                          {t.timestamp || "—"}
                        </span>
                      </div>

                      {/* 전체 */}
                      <div className="col-span-1 text-center">
                        <span className="text-xs font-bold text-slate-700">{tTotal}</span>
                      </div>

                      {/* 정상 */}
                      <div className="col-span-1 text-center">
                        <span className="text-xs font-bold text-emerald-600">{tSuccess}</span>
                      </div>

                      {/* 수동 점검 & 상세 보기 */}
                      <div className="col-span-2 flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleManualCheck(t.id); }}
                          disabled={checkingTargetIds.includes(t.id)}
                          className="px-2.5 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                          title="수동 점검 실행"
                        >
                          <RefreshCw size={12} className={checkingTargetIds.includes(t.id) ? "animate-spin" : ""} />
                          <span>{checkingTargetIds.includes(t.id) ? "점검 중" : "수동 점검"}</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); goToDetail(t.id); }}
                          className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-100 transition-colors opacity-60 group-hover:opacity-100"
                          title="상세 보기"
                        >
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* [탭] 사용방법 가이드 */}
        {activeTab === "guide" && (
          <UserGuide
            onNavigate={(tab) => switchTab(tab as TabName)}
            onStartTour={() => setIsTourOpen(true)}
          />
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
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && collectTargetUrls()}
                      placeholder="모니터링 대상을 입력해주세요."
                      className="w-full bg-gray-50 border border-transparent rounded-2xl outline-none transition-all"
                      style={{ paddingLeft: "1.25rem", paddingRight: "1rem", paddingTop: "1rem", paddingBottom: "1rem", fontSize: "1.125rem" }}
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
                      <div className="mb-2">
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
                  <p style={{ fontWeight: 700, fontSize: "1.125rem", color: "#111827" }}>실제 메뉴 경로 수집 중...</p>
                  <p className="text-gray-400 mt-1.5" style={{ fontSize: "0.875rem" }}>
                    <span className="font-mono" style={{ color: C.primary }}>
                      {urlInput.trim().startsWith('http') ? urlInput.trim() : 'http://' + urlInput.trim()}
                    </span>
                    {" "}에서 가짜 데이터를 제외한 실제 페이지만 선별하고 있습니다
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
                          {(window as any)._lastCollection?.url || (urlInput.trim().startsWith('http') ? urlInput.trim() : 'http://' + urlInput.trim())}
                        </p>
                      </div>
                    </div>
                    <span
                      className="px-4 py-1.5 rounded-xl flex items-center gap-1.5"
                      style={{ backgroundColor: C.badge, color: C.primary, fontWeight: 700, fontSize: "0.875rem" }}
                    >
                      <strong>{selectedCollectedUrls.length}</strong> / {collectedUrls.length} 선택
                    </span>
                  </div>
                </div>

                {/* 타겟 이름 & 모니터링 주기 초안 설정 */}
                <div className="px-8 py-5 border-b space-y-4" style={{ backgroundColor: "#fafbfc" }}>
                  {/* 타겟 이름 */}
                  <div>
                    <label className="block text-gray-500 mb-1.5" style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      모니터링 이름
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTargetName}
                        onChange={(e) => setNewTargetName(e.target.value)}
                        placeholder="사이트 이름을 입력하세요"
                        className="flex-1 bg-white border rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        style={{ borderColor: "#e5e7eb" }}
                      />
                      <span className="text-gray-400 flex-shrink-0" style={{ fontSize: "0.6875rem" }}>
                        <Edit3 size={13} className="inline mr-1" />수정 가능
                      </span>
                    </div>
                  </div>

                  {/* 모니터링 주기 초안 설정 */}
                  <div>
                    <label className="block text-gray-500 mb-1.5" style={{ fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      모니터링 주기 설정 <span className="text-gray-400 normal-case tracking-normal font-medium">(등록 후 주기 관리 메뉴에서 상세 수정 가능)</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* 점검 주기 */}
                      <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2" style={{ borderColor: "#e5e7eb" }}>
                        <CalendarClock size={14} className="text-sky-600 flex-shrink-0" />
                        <span className="text-gray-500 flex-shrink-0" style={{ fontSize: "0.75rem", fontWeight: 600 }}>점검 주기</span>
                        <select
                          value={draftSchedule.interval}
                          onChange={(e) => setDraftSchedule(prev => ({ ...prev, interval: Number(e.target.value) }))}
                          className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer"
                          style={{ minWidth: "5rem" }}
                        >
                          {intervalOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* 활성 시간대 */}
                      <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2" style={{ borderColor: "#e5e7eb" }}>
                        <Clock size={14} className="text-sky-600 flex-shrink-0" />
                        <span className="text-gray-500 flex-shrink-0" style={{ fontSize: "0.75rem", fontWeight: 600 }}>활성 시간</span>
                        <select
                          value={draftSchedule.activeHours}
                          onChange={(e) => setDraftSchedule(prev => ({ ...prev, activeHours: e.target.value as "all" | "business" | "custom" }))}
                          className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer"
                        >
                          <option value="all">24시간 상시</option>
                          <option value="business">업무시간 (09~18시)</option>
                          <option value="custom">사용자 지정</option>
                        </select>
                      </div>

                      {/* 사용자 지정 시간대 */}
                      {draftSchedule.activeHours === "custom" && (
                        <div className="flex items-center gap-1.5 bg-white border rounded-xl px-3 py-2" style={{ borderColor: "#e5e7eb" }}>
                          <input
                            type="time"
                            value={draftSchedule.customStart}
                            onChange={(e) => setDraftSchedule(prev => ({ ...prev, customStart: e.target.value }))}
                            className="bg-transparent text-sm font-bold text-gray-800 outline-none"
                          />
                          <span className="text-gray-400">~</span>
                          <input
                            type="time"
                            value={draftSchedule.customEnd}
                            onChange={(e) => setDraftSchedule(prev => ({ ...prev, customEnd: e.target.value }))}
                            className="bg-transparent text-sm font-bold text-gray-800 outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* URL 목록 */}
                <div className="px-8 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-400 uppercase" style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.07em" }}>
                      수집된 URL 목록
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer text-gray-600" style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={selectedCollectedUrls.length === collectedUrls.length && collectedUrls.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCollectedUrls([...collectedUrls]);
                          } else {
                            setSelectedCollectedUrls([]);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded"
                        style={{ accentColor: C.primary }}
                      />
                      전체 선택
                    </label>
                  </div>
                  <div
                    className="space-y-2 overflow-y-auto pr-1"
                    style={{ maxHeight: "300px", scrollbarWidth: "thin", scrollbarColor: `${C.lightBd} transparent` }}
                  >
                    {collectedUrls.map((path, idx) => {
                      const isSelected = selectedCollectedUrls.includes(path);
                      const baseUrl = (window as any)._lastCollection?.url || (urlInput.trim().startsWith('http') ? urlInput.trim() : 'http://' + urlInput.trim());
                      const displayBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
                      const fullUrl = `${displayBaseUrl}${path.startsWith('/') ? path : '/' + path}`;
                      const isEditing = editingPathIdx === idx;
                      return (
                        <div
                          key={`${path}-${idx}`}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer group"
                          style={{ backgroundColor: isSelected ? "#f9fafb" : "#ffffff", border: `1px solid ${isSelected ? "transparent" : "#f3f4f6"}` }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.lightBg)}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? "#f9fafb" : "#ffffff")}
                          onClick={() => {
                            if (isEditing) return; // 편집 중일 때는 선택 반전 비활성화
                            if (isSelected) {
                              setSelectedCollectedUrls(prev => prev.filter(p => p !== path));
                            } else {
                              setSelectedCollectedUrls(prev => [...prev, path]);
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // 부모 div의 onClick에서 처리
                            disabled={isEditing}
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ accentColor: C.primary, pointerEvents: "none" }}
                          />
                          <span
                            className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: isSelected ? C.badge : "#f3f4f6", color: isSelected ? C.primary : "#9ca3af", fontSize: "0.5625rem", fontWeight: 900 }}
                          >
                            {String(idx + 1).padStart(2, "0")}
                          </span>

                          {isEditing ? (
                            <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="text"
                                value={editingPathValue}
                                onChange={(e) => setEditingPathValue(e.target.value)}
                                className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm text-gray-800 outline-none focus:border-sky-500 font-mono"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEditedPath(idx);
                                  else if (e.key === "Escape") setEditingPathIdx(null);
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEditedPath(idx)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="저장"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setEditingPathIdx(null)}
                                className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                                title="취소"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="flex-1 font-mono text-gray-600 truncate" style={{ fontSize: "0.8125rem", opacity: isSelected ? 1 : 0.5 }}>
                                <span className="text-gray-400">
                                  {((window as any)._lastCollection?.url || (urlInput.trim().startsWith('http') ? urlInput.trim() : 'http://' + urlInput.trim())).replace(/\/$/, '')}
                                </span>
                                <span style={{ fontWeight: 700, color: "#374151" }}>{path}</span>
                              </span>
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => {
                                    setEditingPathIdx(idx);
                                    setEditingPathValue(path);
                                  }}
                                  className="p-1 text-sky-600 hover:bg-sky-100 rounded-lg transition-colors"
                                  title="경로 수정"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCollectedPath(idx)}
                                  className="p-1 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                  title="경로 삭제"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </>
                          )}
                          {!isEditing && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* 새 경로 수동 추가 영역 */}
                  <div className="mt-4 pt-4 border-t flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={customPathInput}
                      onChange={(e) => setCustomPathInput(e.target.value)}
                      placeholder="/custom-path (예: /admin/login)"
                      className="flex-1 bg-gray-50 border rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 font-mono"
                      onKeyDown={(e) => e.key === "Enter" && handleAddNewCustomPath()}
                    />
                    <button
                      onClick={handleAddNewCustomPath}
                      className="px-4 py-2.5 text-white rounded-xl font-bold text-sm transition-all"
                      style={{ backgroundColor: C.primary }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.hover)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = C.primary)}
                    >
                      경로 추가
                    </button>
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

        {/* ═══ [탭] 장애현황 관리 ═══ */}
        {activeTab === "incidents" && (
          <div className="p-8 md:p-10 max-w-6xl mx-auto">
            {/* 페이지 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 text-white rounded-2xl flex items-center justify-center flex-shrink-0 bg-red-600 shadow-lg shadow-red-200"
                >
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h2 className="text-gray-800" style={{ fontSize: "1.5rem", fontWeight: 800 }}>장애현황 관리</h2>
                  <p className="text-gray-500" style={{ fontSize: "0.875rem" }}>
                    모니터링 대상 사이트의 응답 장애 및 오류 발생 내역을 실시간 추적하고 관리합니다.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {userIncidents.length > 0 && (
                  <button
                    onClick={() => setSelectedReportIncident({ ...userIncidents[0] })}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-all shadow-md active:scale-95"
                    title="장애보고서 수정 및 PDF 다운로드 창 열기"
                  >
                    <FileText size={15} />
                    <span>장애보고서 다운로드</span>
                  </button>
                )}
                <button
                  onClick={handleRefreshIncidents}
                  disabled={isRefreshingIncidents}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 transition-all shadow-xs active:scale-95 disabled:opacity-50"
                  title="장애현황 및 타겟 상태를 최신 정보로 새로고침합니다"
                >
                  <RefreshCw size={14} className={isRefreshingIncidents ? "animate-spin text-sky-600" : ""} />
                  <span>{isRefreshingIncidents ? "조회 중..." : "새로고침"}</span>
                </button>
              </div>
            </div>

            {/* 통계 요약 카드 4개 */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-red-100 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">진행 중인 장애</p>
                  <p className="text-2xl font-extrabold text-red-600">
                    {userIncidents.filter(i => i.status === 'OPEN').length} <span className="text-xs font-semibold text-slate-500">건</span>
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-emerald-100 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">조치/복구 완료</p>
                  <p className="text-2xl font-extrabold text-emerald-600">
                    {userIncidents.filter(i => i.status === 'RESOLVED').length} <span className="text-xs font-semibold text-slate-500">건</span>
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                  <Inbox size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">총 장애 건수</p>
                  <p className="text-2xl font-extrabold text-slate-800">
                    {userIncidents.length} <span className="text-xs font-semibold text-slate-500">건</span>
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-sky-100 p-5 flex items-center gap-4 shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                  <Clock size={22} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">평균 복구 소요</p>
                  <p className="text-xl font-extrabold text-sky-700">
                    {(() => {
                      const resolvedList = userIncidents.filter(i => i.status === 'RESOLVED');
                      if (resolvedList.length === 0) return "데이터 없음";
                      const totalSec = resolvedList.reduce((acc, curr) => {
                        return acc + (curr.durationSec || 60);
                      }, 0);
                      const avgSec = Math.round(totalSec / resolvedList.length);
                      if (avgSec < 60) return `평균 ${avgSec}초`;
                      const mins = Math.floor(avgSec / 60);
                      const secs = avgSec % 60;
                      return secs > 0 ? `평균 ${mins}분 ${secs}초` : `평균 ${mins}분`;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* 필터 탭 */}
            <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
              <button
                onClick={() => setIncidentFilter("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${incidentFilter === "all" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}
              >
                전체 ({userIncidents.length})
              </button>
              <button
                onClick={() => setIncidentFilter("open")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${incidentFilter === "open" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:bg-red-50 hover:text-red-600"}`}
              >
                진행 중 ({userIncidents.filter(i => i.status === 'OPEN').length})
              </button>
              <button
                onClick={() => setIncidentFilter("resolved")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${incidentFilter === "resolved" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-600"}`}
              >
                조치 완료 ({userIncidents.filter(i => i.status === 'RESOLVED').length})
              </button>
            </div>

            {/* 목록 테이블 */}
            {userIncidents.filter(i => incidentFilter === 'all' ? true : incidentFilter === 'open' ? i.status === 'OPEN' : i.status === 'RESOLVED').length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">기록된 장애 내역이 없습니다</h3>
                <p className="text-sm text-slate-500">모든 모니터링 대상 사이트가 정상 작동 중입니다.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
                {/* 헤더 */}
                <div className="grid grid-cols-12 gap-2 px-6 py-3.5 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <div className="col-span-2 text-center">장애번호</div>
                  <div className="col-span-1 text-center">상태</div>
                  <div className="col-span-2">서비스명 (대상)</div>
                  <div className="col-span-2">장애 내용</div>
                  <div className="col-span-2 text-center">발생 / 복구일시</div>
                  <div className="col-span-3 text-center">장애보고서 다운로드 / 관리</div>
                </div>

                {/* 데이터 행 */}
                {userIncidents
                  .filter(i => incidentFilter === 'all' ? true : incidentFilter === 'open' ? i.status === 'OPEN' : i.status === 'RESOLVED')
                  .map((inc) => (
                    <div
                      key={inc.id}
                      className={`grid grid-cols-12 gap-2 px-6 py-4 items-center border-b border-slate-100 transition-colors ${inc.status === 'OPEN' ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-slate-50'}`}
                    >
                      {/* 장애번호 */}
                      <div className="col-span-2 flex justify-center">
                        <span className="font-mono font-bold text-xs text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
                          {inc.incidentNo || inc.id}
                        </span>
                      </div>

                      {/* 상태 배지 */}
                      <div className="col-span-1 flex justify-center">
                        {inc.status === 'OPEN' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-extrabold animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            진행 중
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            조치 완료
                          </span>
                        )}
                      </div>

                      {/* 발생 대상 (서비스명) */}
                      <div className="col-span-2 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={inc.targetName}>{inc.targetName}</p>
                        <p className="text-[11px] text-slate-400 truncate" title={inc.targetUrl}>{inc.targetUrl}</p>
                      </div>

                      {/* 장애 종류 / 내용 */}
                      <div className="col-span-2 min-w-0">
                        <p className={`text-xs font-bold truncate ${inc.status === 'OPEN' ? 'text-red-600' : 'text-slate-700'}`}>
                          {inc.errorType}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate" title={inc.errorSummary}>{inc.errorSummary}</p>
                      </div>

                      {/* 발생 / 복구 일시 */}
                      <div className="col-span-2 text-center text-[11px] text-slate-600 font-medium">
                        <p className="font-semibold text-slate-700">{inc.startedAt}</p>
                        <p className="text-slate-400 text-[10px]">
                          {inc.resolvedAt ? `복구: ${inc.resolvedAt}` : `소요: ${inc.duration}`}
                        </p>
                      </div>

                      {/* 관리 액션 & 장애보고서 다운로드 */}
                      <div className="col-span-3 flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedReportIncident({ ...inc })}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer ring-2 ring-sky-300/40"
                          title="보고서 내용 확인 및 수정 후 PDF 다운로드"
                        >
                          <FileText size={14} />
                          <span>보고서 다운로드</span>
                        </button>
                        {inc.status === 'OPEN' && (
                          <button
                            onClick={() => handleResolveIncident(inc.id)}
                            className="px-2 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs"
                            title="조치 완료 처리"
                          >
                            조치
                          </button>
                        )}
                        <button
                          onClick={() => goToDetail(inc.targetId)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
                          title="상세 모니터링 이동"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteIncident(inc.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="이력 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* 장애보고서 수정 및 PDF 다운로드 모달 */}
            {selectedReportIncident && (
              <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* 모달 헤더 */}
                  <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base flex items-center gap-2">
                          장애보고서 수정 및 다운로드
                          <span className="text-[11px] font-normal text-sky-300 bg-sky-950 px-2 py-0.5 rounded-full border border-sky-800">
                            내용 수정 가능
                          </span>
                        </h3>
                        <p className="text-xs text-slate-300">
                          항목별 내용을 작성/수정한 후 하단의 <span className="text-sky-400 font-bold">[PDF 다운로드]</span> 버튼을 클릭하세요.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => printIncidentReport(selectedReportIncident)}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                      >
                        <Download size={14} />
                        <span>PDF 다운로드</span>
                      </button>
                      <button
                        onClick={() => setSelectedReportIncident(null)}
                        className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* 수정 가능한 A4 서식 폼 본문 */}
                  <div className="p-6 overflow-y-auto flex-1 bg-slate-100 space-y-6 text-sm text-slate-800">
                    {/* A4 서식 용지 형태 카드 */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm space-y-6 font-sans">
                      {/* 타이틀 바 */}
                      <div className="bg-slate-700 text-white text-center py-3 font-bold text-xl tracking-[12px] rounded-lg shadow-xs">
                        장 애 보 고 서
                      </div>

                      {/* ▶ 장애관리 */}
                      <div>
                        <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1">
                          <span className="text-sky-600">▶</span> 장애관리
                        </h4>
                        <div className="grid grid-cols-6 border border-slate-300 rounded-lg overflow-hidden text-xs">
                          <div className="bg-slate-100 font-bold p-2 text-center border-r border-b border-slate-300 flex items-center justify-center">작성일자</div>
                          <div className="p-1.5 border-r border-b border-slate-300">
                            <input
                              type="date"
                              value={selectedReportIncident.createdDate || (selectedReportIncident.startedAt ? selectedReportIncident.startedAt.slice(0, 10) : '')}
                              onChange={(e) => updateReportField('createdDate', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                          <div className="bg-slate-100 font-bold p-2 text-center border-r border-b border-slate-300 flex items-center justify-center">작성부서</div>
                          <div className="p-1.5 border-r border-b border-slate-300">
                            <input
                              type="text"
                              value={selectedReportIncident.dept || 'IT운영팀'}
                              onChange={(e) => updateReportField('dept', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                          <div className="bg-slate-100 font-bold p-2 text-center border-r border-b border-slate-300 flex items-center justify-center">담당자</div>
                          <div className="p-1.5 border-b border-slate-300">
                            <input
                              type="text"
                              value={selectedReportIncident.manager || '김보은'}
                              onChange={(e) => updateReportField('manager', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-semibold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                            />
                          </div>

                          <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">장애번호</div>
                          <div className="p-1.5 border-r border-slate-300">
                            <input
                              type="text"
                              value={selectedReportIncident.incidentNo || selectedReportIncident.id}
                              onChange={(e) => updateReportField('incidentNo', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-mono font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                          <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">심각도</div>
                          <div className="p-1.5 border-r border-slate-300">
                            <select
                              value={selectedReportIncident.severity || 'Major'}
                              onChange={(e) => updateReportField('severity', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 cursor-pointer"
                            >
                              <option value="Critical">Critical</option>
                              <option value="Major">Major</option>
                              <option value="Minor">Minor</option>
                            </select>
                          </div>
                          <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">고객사</div>
                          <div className="p-1.5">
                            <input
                              type="text"
                              value={selectedReportIncident.customer || selectedReportIncident.targetName || '행복ICT'}
                              onChange={(e) => updateReportField('customer', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* ▶ 장애개요 */}
                      <div>
                        <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1">
                          <span className="text-sky-600">▶</span> 장애개요
                        </h4>
                        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs divide-y divide-slate-300">
                          <div className="grid grid-cols-6">
                            <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">서비스명</div>
                            <div className="col-span-2 p-1.5 border-r border-slate-300">
                              <input
                                type="text"
                                value={selectedReportIncident.targetName || ''}
                                onChange={(e) => updateReportField('targetName', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                            <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">장애 제목</div>
                            <div className="col-span-2 p-1.5">
                              <input
                                type="text"
                                value={selectedReportIncident.title || `${selectedReportIncident.targetName} 장애 보고서`}
                                onChange={(e) => updateReportField('title', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-6">
                            <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">발생시간</div>
                            <div className="col-span-2 p-1.5 border-r border-slate-300">
                              <input
                                type="text"
                                value={selectedReportIncident.startedAt || ''}
                                onChange={(e) => updateReportField('startedAt', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-medium text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                            <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">해결시간</div>
                            <div className="col-span-2 p-1.5">
                              <input
                                type="text"
                                value={selectedReportIncident.resolvedAt || ''}
                                onChange={(e) => updateReportField('resolvedAt', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-medium text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-6">
                            <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">총 장애시간</div>
                            <div className="col-span-5 p-1.5">
                              <input
                                type="text"
                                value={selectedReportIncident.duration || ''}
                                onChange={(e) => updateReportField('duration', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-red-600 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-6">
                            <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">현상</div>
                            <div className="col-span-5 p-1.5">
                              <textarea
                                value={selectedReportIncident.symptom || selectedReportIncident.errorSummary || ''}
                                onChange={(e) => updateReportField('symptom', e.target.value)}
                                rows={2}
                                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 resize-y"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-6">
                            <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">세부원인</div>
                            <div className="col-span-5 p-1.5">
                              <textarea
                                value={selectedReportIncident.rootCause || ''}
                                onChange={(e) => updateReportField('rootCause', e.target.value)}
                                rows={2}
                                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 resize-y"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-6">
                            <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">영향범위</div>
                            <div className="col-span-5 p-1.5">
                              <input
                                type="text"
                                value={selectedReportIncident.impactRange || ''}
                                onChange={(e) => updateReportField('impactRange', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-6">
                            <div className="bg-slate-100 font-bold p-2 text-center border-r border-slate-300 flex items-center justify-center">조치요약</div>
                            <div className="col-span-5 p-1.5">
                              <input
                                type="text"
                                value={selectedReportIncident.actionSummary || ''}
                                onChange={(e) => updateReportField('actionSummary', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ▶ 시간대별 조치내역 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-xs text-slate-700 flex items-center gap-1">
                            <span className="text-sky-600">▶</span> 시간대별 조치내역
                          </h4>
                          <button
                            type="button"
                            onClick={addActionLogRow}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold transition-all flex items-center gap-1"
                          >
                            <Plus size={12} /> 조치 항목 추가
                          </button>
                        </div>
                        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                          <div className="grid grid-cols-12 bg-slate-100 font-bold border-b border-slate-300 text-center py-2">
                            <div className="col-span-3 border-r border-slate-300">조치시간</div>
                            <div className="col-span-6 border-r border-slate-300">조치 내용 및 결과</div>
                            <div className="col-span-2 border-r border-slate-300">조치자(담당자)</div>
                            <div className="col-span-1">삭제</div>
                          </div>
                          <div className="divide-y divide-slate-200">
                            {(selectedReportIncident.actionLogs && selectedReportIncident.actionLogs.length > 0
                              ? selectedReportIncident.actionLogs
                              : [{ time: selectedReportIncident.startedAt?.slice(11) || '09:15:00', content: selectedReportIncident.errorSummary || '장애 발생 감지', person: selectedReportIncident.manager || '김보은' }]
                            ).map((log: any, idx: number) => (
                              <div key={idx} className="grid grid-cols-12 p-1 items-center text-xs gap-1">
                                <div className="col-span-3">
                                  <input
                                    type="text"
                                    value={log.time || ''}
                                    onChange={(e) => updateActionLog(idx, 'time', e.target.value)}
                                    placeholder="09:15:00"
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center font-mono text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                                  />
                                </div>
                                <div className="col-span-6">
                                  <input
                                    type="text"
                                    value={log.content || ''}
                                    onChange={(e) => updateActionLog(idx, 'content', e.target.value)}
                                    placeholder="조치 내용 입력"
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                                  />
                                </div>
                                <div className="col-span-2">
                                  <input
                                    type="text"
                                    value={log.person || ''}
                                    onChange={(e) => updateActionLog(idx, 'person', e.target.value)}
                                    placeholder="담당자"
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                                  />
                                </div>
                                <div className="col-span-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeActionLogRow(idx)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                    title="삭제"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ▶ 향후 대책 */}
                      <div>
                        <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1">
                          <span className="text-sky-600">▶</span> 향후 대책
                        </h4>
                        <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                          <div className="grid grid-cols-12 bg-slate-100 font-bold border-b border-slate-300 text-center py-2">
                            <div className="col-span-7 border-r border-slate-300">재발 방지 대책</div>
                            <div className="col-span-3 border-r border-slate-300">완료예정일</div>
                            <div className="col-span-2">조치자(담당자)</div>
                          </div>
                          <div className="grid grid-cols-12 p-1.5 items-center text-xs gap-1.5">
                            <div className="col-span-7">
                              <input
                                type="text"
                                value={selectedReportIncident.preventiveAction || ''}
                                onChange={(e) => updateReportField('preventiveAction', e.target.value)}
                                placeholder="재발 방지 대책 입력"
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="date"
                                value={selectedReportIncident.dueDate || ''}
                                onChange={(e) => updateReportField('dueDate', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={selectedReportIncident.preventiveManager || selectedReportIncident.manager || '김보은'}
                                onChange={(e) => updateReportField('preventiveManager', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-center text-slate-800 outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 하단 서명/로고 푸터 */}
                      <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                        <div>- 1 -</div>
                        <div className="flex items-center gap-1 font-bold text-orange-600 text-sm">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ea580c">
                            <circle cx="12" cy="12" r="3"/>
                            <circle cx="6" cy="8" r="2.5"/>
                            <circle cx="18" cy="8" r="2.5"/>
                            <circle cx="8" cy="17" r="2.5"/>
                            <circle cx="16" cy="17" r="2.5"/>
                          </svg>
                          <span>행복ICT</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 모달 푸터 버튼 */}
                  <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
                    <button
                      onClick={() => setSelectedReportIncident(null)}
                      className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                    >
                      취소 및 닫기
                    </button>
                    <button
                      onClick={() => printIncidentReport(selectedReportIncident)}
                      className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ring-2 ring-sky-300"
                    >
                      <Download size={15} />
                      <span>수정된 내용으로 PDF 장애보고서 다운로드</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ [탭] AI 콘텐츠 분석 (SEO & GEO) ═══ */}
        {activeTab === "ai-analysis" && (
          <div className="p-8 md:p-10 max-w-6xl mx-auto">
            {/* 페이지 헤더 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 text-white rounded-2xl flex items-center justify-center flex-shrink-0 bg-sky-600 shadow-lg shadow-sky-200">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-gray-800 flex items-center gap-2" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                    AI 콘텐츠 분석
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                      SEO & GEO Engine
                    </span>
                  </h2>
                  <p className="text-gray-500" style={{ fontSize: "0.875rem" }}>
                    검색 엔진 최적화(SEO)와 생성형 AI 최적화(GEO) 상태를 분석하고 AI 개선 가이드를 제공합니다.
                  </p>
                </div>
              </div>

              {/* SEO / GEO 서브 탭 Switcher */}
              <div className="flex items-center p-1 bg-slate-200/80 rounded-2xl flex-shrink-0 self-start md:self-auto">
                <button
                  onClick={() => setAiSubTab("seo")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    aiSubTab === "seo" ? "bg-white text-sky-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <SearchCheck size={15} />
                  <span>SEO 최적화 분석</span>
                </button>
                <button
                  onClick={() => setAiSubTab("geo")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    aiSubTab === "geo" ? "bg-white text-sky-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Bot size={15} />
                  <span>GEO (AI 검색) 최적화</span>
                </button>
              </div>
            </div>

            {/* URL 입력 및 내 등록 사이트 선택 바 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* 등록한 사이트 퀵 선택 드롭다운 */}
                {userTargets.length > 0 && (
                  <select
                    value={aiUrlInput}
                    onChange={(e) => {
                      if (e.target.value) {
                        setAiUrlInput(e.target.value);
                      } else {
                        setAiUrlInput("");
                      }
                    }}
                    className="px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500 sm:w-56 flex-shrink-0"
                  >
                    <option value="">-- 내 등록 사이트 빠른 선택 --</option>
                    {userTargets.map((t) => (
                      <option key={t.id} value={t.url}>
                        {t.name} ({t.url})
                      </option>
                    ))}
                  </select>
                )}

                {/* URL 직접 입력창 */}
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe size={18} />
                  </div>
                  <input
                    type="text"
                    value={aiUrlInput}
                    onChange={(e) => setAiUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRunAiAnalysis()}
                    placeholder="분석할 웹사이트 URL 입력 (예: https://example.com)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                <button
                  onClick={() => handleRunAiAnalysis()}
                  disabled={isAnalyzing}
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 flex-shrink-0 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>AI 분석 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>AI 분석 실행</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 로딩 상태 카드 */}
            {isAnalyzing && (
              <div className="bg-white rounded-3xl border border-sky-100 p-16 text-center shadow-sm space-y-4 animate-pulse">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 inline-flex items-center justify-center border border-sky-100">
                  <Cpu size={32} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">AI 분석 엔진이 웹사이트를 정밀 검사 중입니다</h3>
                  <p className="text-xs text-slate-500 mt-1">HTML 구조, 메타 태그, 가독성 및 Generative AI 인덱싱 최적화 지표 파싱 중...</p>
                </div>
              </div>
            )}

            {/* 분석 결과 전 초기 상태 안내 카드 */}
            {!isAnalyzing && !aiAnalysisResult && (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 inline-flex items-center justify-center">
                  <SearchCheck size={32} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-700">웹사이트 URL을 입력하고 AI 분석을 시작하세요</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Google SEO 검색 엔진 노출 점수와 ChatGPT / Perplexity / Gemini 등 생성형 AI(GEO) 답변 인용 최적화 가이드를 즉시 생성해 드립니다.
                  </p>
                </div>
              </div>
            )}

            {/* 분석 완료 결과 카드 리포트 */}
            {!isAnalyzing && aiAnalysisResult && (
              <div className="space-y-8">

                {/* ── SEO 최적화 분석 결과 ── */}
                {aiSubTab === "seo" && (
                  <div className="space-y-6">
                    {/* 상단 점수 헤더 카드 */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-extrabold shadow-sm ${
                          aiAnalysisResult.seo.score >= 80 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                          aiAnalysisResult.seo.score >= 60 ? "bg-amber-50 text-amber-600 border border-amber-200" :
                          "bg-red-50 text-red-600 border border-red-200"
                        }`}>
                          <span className="text-2xl leading-none">{aiAnalysisResult.seo.score}</span>
                          <span className="text-[10px] font-bold opacity-75 mt-0.5">/ 100점</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-800">SEO 검색엔진 최적화 평가</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              aiAnalysisResult.seo.score >= 80 ? "bg-emerald-100 text-emerald-700" :
                              aiAnalysisResult.seo.score >= 60 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {aiAnalysisResult.seo.statusLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-mono">{aiAnalysisResult.url}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">분석 일시: {aiAnalysisResult.analyzedAt}</p>
                        </div>
                      </div>
                    </div>

                    {/* SEO 세부 항목 검증 그리드 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiAnalysisResult.seo.checks.map((item: any) => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              {item.status === 'passed' ? (
                                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                              ) : item.status === 'warning' ? (
                                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                              ) : (
                                <X size={16} className="text-red-500 flex-shrink-0" />
                              )}
                              <span>{item.title}</span>
                            </h4>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              item.status === 'passed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                              item.status === 'warning' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              "bg-red-50 text-red-600 border border-red-100"
                            }`}>
                              {item.status === 'passed' ? '적합' : item.status === 'warning' ? '주의' : '미흡'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-lg break-all font-mono">
                            {item.value}
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* AI SEO 개선 권장사항 및 코드 제안 */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Sparkles size={16} className="text-sky-600" />
                          <span>AI SEO 맞춤 개선 솔루션</span>
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysisResult.seo.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                              <ChevronRight size={14} className="text-sky-600 flex-shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 추천 메타 태그 코드 스니펫 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">추천 SEO 메타 태그 스니펫 (HTML 삽입용)</label>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(aiAnalysisResult.seo.suggestedCode);
                              setAiCopiedCode(true);
                              setTimeout(() => setAiCopiedCode(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                          >
                            {aiCopiedCode ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span>{aiCopiedCode ? "복사완료!" : "코드 복사"}</span>
                          </button>
                        </div>
                        <pre className="p-4 bg-slate-900 text-sky-300 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed border border-slate-800">
                          {aiAnalysisResult.seo.suggestedCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── GEO (Generative Engine Optimization) 최적화 분석 결과 ── */}
                {aiSubTab === "geo" && (
                  <div className="space-y-6">
                    {/* 상단 점수 헤더 카드 */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center font-extrabold shadow-sm ${
                          aiAnalysisResult.geo.score >= 80 ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                          aiAnalysisResult.geo.score >= 60 ? "bg-amber-50 text-amber-600 border border-amber-200" :
                          "bg-red-50 text-red-600 border border-red-200"
                        }`}>
                          <span className="text-2xl leading-none">{aiAnalysisResult.geo.score}</span>
                          <span className="text-[10px] font-bold opacity-75 mt-0.5">/ 100점</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-800">GEO (생성형 AI 검색) 최적화 지수</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                              aiAnalysisResult.geo.score >= 80 ? "bg-emerald-100 text-emerald-700" :
                              aiAnalysisResult.geo.score >= 60 ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {aiAnalysisResult.geo.statusLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-mono">{aiAnalysisResult.url}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">ChatGPT, Perplexity, Gemini AI 인덱싱 호환성 분석</p>
                        </div>
                      </div>
                    </div>

                    {/* AI 검색 엔진별 인용 예측 지표 카드 */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Bot size={15} className="text-sky-600" />
                        <span>생성형 AI 모델별 웹사이트 인용(Citation) 예측 확률</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { name: "ChatGPT Search", score: aiAnalysisResult.geo.aiCitationScores.chatgpt, color: "#10a37f" },
                          { name: "Perplexity AI",  score: aiAnalysisResult.geo.aiCitationScores.perplexity, color: "#2563eb" },
                          { name: "Google Gemini",  score: aiAnalysisResult.geo.aiCitationScores.gemini,    color: "#8b5cf6" },
                          { name: "Claude (Anthropic)", score: aiAnalysisResult.geo.aiCitationScores.claude, color: "#d97706" },
                        ].map((item) => (
                          <div key={item.name} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-center">
                            <p className="text-[11px] font-bold text-slate-600">{item.name}</p>
                            <p className="text-xl font-extrabold" style={{ color: item.color }}>{item.score}%</p>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${item.score}%`, backgroundColor: item.color }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GEO 세부 검증 지표 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiAnalysisResult.geo.checks.map((item: any) => (
                        <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              {item.status === 'passed' ? (
                                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                              ) : (
                                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                              )}
                              <span>{item.title}</span>
                            </h4>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              item.status === 'passed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                            }`}>
                              {item.status === 'passed' ? '최적' : '개선권장'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-lg font-mono break-all">
                            {item.value}
                          </p>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* GEO AI 엔지니어링 개선 가이드 및 JSON-LD 스니펫 */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Sparkles size={16} className="text-sky-600" />
                          <span>AI 생성형 엔진 최적화(GEO) 전략 가이드</span>
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysisResult.geo.recommendations.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed bg-sky-50/50 p-3 rounded-xl border border-sky-100">
                              <ChevronRight size={14} className="text-sky-600 flex-shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 추천 Schema.org JSON-LD 구조화 태그 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">권장 Schema.org JSON-LD 구조화 데이터 코드 (HTML &lt;head&gt; 삽입)</label>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(aiAnalysisResult.geo.suggestedCode);
                              setAiCopiedCode(true);
                              setTimeout(() => setAiCopiedCode(false), 2000);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
                          >
                            {aiCopiedCode ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            <span>{aiCopiedCode ? "복사완료!" : "코드 복사"}</span>
                          </button>
                        </div>
                        <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-2xl overflow-x-auto leading-relaxed border border-slate-800">
                          {aiAnalysisResult.geo.suggestedCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* ═══ [탭] 계정 관리 ═══ */}
        {activeTab === "users" && userLevel === "admin" && (
          <div className="p-8 md:p-10 max-w-6xl mx-auto">
            {/* 페이지 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 text-white rounded-2xl flex items-center justify-center flex-shrink-0 bg-sky-600 shadow-lg shadow-sky-200">
                    <UserCog size={22} />
                  </div>
                  <div>
                    <h2 className="text-gray-800" style={{ fontSize: "1.5rem", fontWeight: 800 }}>계정 관리</h2>
                    <p className="text-gray-500" style={{ fontSize: "0.875rem" }}>
                      시스템 이용자 계정 목록을 확인하고, 신규 계정을 생성하거나 비밀번호를 초기화합니다.
                    </p>
                  </div>
                </div>

                {/* 상단 버튼: 신규 계정 생성 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setNewUserForm({ username: "", nickname: "", password: "", confirmPassword: "", level: "user" });
                      setIsCreateUserModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>계정 생성하기</span>
                  </button>
                </div>
              </div>

              {/* 통계 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-2xl border border-sky-100 p-5 flex items-center gap-4 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <UserCog size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">전체 계정 수</p>
                    <p className="text-2xl font-extrabold text-slate-800">
                      {usersList.length} <span className="text-xs font-semibold text-slate-500">개</span>
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-blue-100 p-5 flex items-center gap-4 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <UserCog size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">관리자 (admin)</p>
                    <p className="text-2xl font-extrabold text-blue-700">
                      {usersList.filter(u => u.level === 'admin').length} <span className="text-xs font-semibold text-slate-500">명</span>
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-xs">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                    <User size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">일반 사용자 (user)</p>
                    <p className="text-2xl font-extrabold text-slate-700">
                      {usersList.filter(u => u.level !== 'admin').length} <span className="text-xs font-semibold text-slate-500">명</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 목록 테이블 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
                {/* 헤더 */}
                <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <div className="col-span-4">아이디 (이메일)</div>
                  <div className="col-span-3">닉네임</div>
                  <div className="col-span-2 text-center">권한 레벨</div>
                  <div className="col-span-2 text-center">마지막 로그인 일시</div>
                  <div className="col-span-1 text-center">관리 / 상세</div>
                </div>

                {/* 데이터 행 */}
                {usersList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm">
                    등록된 계정이 없습니다.
                  </div>
                ) : (
                  usersList.map((usr) => (
                    <div
                      key={usr.id}
                      className="grid grid-cols-12 gap-3 px-6 py-4 items-center border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      {/* 아이디 (이메일) */}
                      <div className="col-span-4 font-semibold text-xs text-slate-800 font-mono truncate" title={usr.username}>
                        {usr.username}
                      </div>

                      {/* 닉네임 */}
                      <div className="col-span-3 font-bold text-xs text-slate-700 truncate">
                        {usr.nickname}
                      </div>

                      {/* 권한 레벨 */}
                      <div className="col-span-2 flex justify-center">
                        {usr.level === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold border border-sky-200">
                            관리자 (admin)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                            일반사용자 (user)
                          </span>
                        )}
                      </div>

                      {/* 마지막 로그인 일시 */}
                      <div className="col-span-2 text-center text-xs text-slate-600 font-medium">
                        {usr.lastLoginAt || "-"}
                      </div>

                      {/* 관리 / 상세 버튼 */}
                      <div className="col-span-1 flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedUserDetail(usr)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95"
                          title="상세 정보 보기 및 비밀번호 초기화"
                        >
                          상세
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 상세 보기 및 비밀번호 초기화 모달 */}
              {selectedUserDetail && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* 모달 헤더 */}
                    <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserCog size={22} className="text-sky-400" />
                        <div>
                          <h3 className="font-bold text-base leading-tight">계정 상세 정보 및 초기화</h3>
                          <p className="text-[11px] text-slate-300">선택한 계정의 정보 조회, 비밀번호 초기화 및 권한을 관리합니다.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedUserDetail(null)}
                        className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* 모달 본문 */}
                    <div className="p-6 space-y-4 text-sm text-slate-700">
                      {/* 성공 안내 메시지 */}
                      {selectedUserDetail.passwordResetMessage && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>{selectedUserDetail.passwordResetMessage}</span>
                        </div>
                      )}
                      {selectedUserDetail.saveSuccessMessage && (
                        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 text-xs font-bold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                          <span>{selectedUserDetail.saveSuccessMessage}</span>
                        </div>
                      )}

                      {/* 상세 정보 표 목록 및 정보 수정 */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3.5">
                        {/* 1. 아이디 (수정 불가능 고유값) */}
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-500">아이디 (이메일 주소)</span>
                          <span className="font-mono font-bold text-slate-800 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                            {selectedUserDetail.username}
                          </span>
                        </div>

                        {/* 2. 닉네임 (수정 가능) */}
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 gap-3">
                          <span className="text-xs font-bold text-slate-500 flex-shrink-0">닉네임 / 사용자명</span>
                          <input
                            type="text"
                            value={selectedUserDetail.nickname || ''}
                            onChange={(e) => setSelectedUserDetail(prev => prev ? { ...prev, nickname: e.target.value } : null)}
                            placeholder="닉네임 입력"
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 text-right w-44"
                          />
                        </div>

                        {/* 3. 권한 레벨 (수정 가능) */}
                        <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 gap-3">
                          <span className="text-xs font-bold text-slate-500 flex-shrink-0">권한 레벨</span>
                          <select
                            value={selectedUserDetail.level || 'user'}
                            onChange={(e) => setSelectedUserDetail(prev => prev ? { ...prev, level: e.target.value as 'admin' | 'user' } : null)}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-extrabold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer text-right w-44"
                          >
                            <option value="admin">관리자 (admin)</option>
                            <option value="user">일반사용자 (user)</option>
                          </select>
                        </div>

                        {/* 4. 정보 수정 저장 버튼 */}
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => handleUpdateUserInfo(selectedUserDetail.id, selectedUserDetail.nickname, selectedUserDetail.level)}
                            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer"
                          >
                            정보 수정 저장
                          </button>
                        </div>

                        {/* 5. 마지막 로그인 일시 */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <span className="text-xs font-bold text-slate-500">마지막 로그인 일시</span>
                          <span className="font-semibold text-slate-700 text-xs">
                            {selectedUserDetail.lastLoginAt || "기록 없음 (미접속)"}
                          </span>
                        </div>

                        {/* 6. 계정 가입일 */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                          <span className="text-xs font-bold text-slate-500">계정 생성 일시</span>
                          <span className="font-medium text-slate-600 text-xs">
                            {selectedUserDetail.createdAt || "-"}
                          </span>
                        </div>
                      </div>

                      {/* 비밀번호 초기화 박스 */}
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
                        <div>
                          <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <span>🔑</span>
                            <span>비밀번호 초기화</span>
                          </p>
                          <p className="text-[11px] text-amber-700 mt-1">
                            초기화 진행 시 비밀번호가 <strong className="bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">happy2690</strong> 으로 변경됩니다.
                          </p>
                        </div>
                        <button
                          onClick={() => handleResetUserPassword(selectedUserDetail.id, selectedUserDetail.username)}
                          className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-sm flex-shrink-0 active:scale-95 cursor-pointer ring-2 ring-amber-300"
                        >
                          비밀번호 초기화
                        </button>
                      </div>
                    </div>

                    {/* 모달 푸터 */}
                    <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
                      {selectedUserDetail.id !== 1 ? (
                        <button
                          onClick={() => handleDeleteUser(selectedUserDetail.id, selectedUserDetail.username)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>계정 삭제</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-bold">※ 최고 관리자 계정 (삭제 불가)</span>
                      )}
                      <button
                        onClick={() => setSelectedUserDetail(null)}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-all cursor-pointer"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 신규 계정 생성 모달 */}
              {isCreateUserModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* 모달 헤더 */}
                    <div className="px-6 py-4 bg-sky-700 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Plus size={20} />
                        <h3 className="font-bold text-base">신규 계정 생성</h3>
                      </div>
                      <button
                        onClick={() => setIsCreateUserModalOpen(false)}
                        className="p-1 hover:bg-sky-600 text-sky-100 hover:text-white rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* 폼 본문 */}
                    <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-4 text-sm">
                      {/* 아이디 (이메일) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          아이디 (이메일 주소) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={newUserForm.username}
                          onChange={(e) => setNewUserForm(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="아이디에 이메일을 입력해주세요."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all font-mono"
                        />
                      </div>

                      {/* 닉네임 */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          닉네임 / 사용자명 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newUserForm.nickname}
                          onChange={(e) => setNewUserForm(prev => ({ ...prev, nickname: e.target.value }))}
                          placeholder="닉네임을 입력해주세요."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all"
                        />
                      </div>

                      {/* 권한 레벨 선택 */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          권한 레벨 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newUserForm.level}
                          onChange={(e) => setNewUserForm(prev => ({ ...prev, level: e.target.value as "admin" | "user" }))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 cursor-pointer transition-all"
                        >
                          <option value="user">일반사용자 (user)</option>
                          <option value="admin">관리자 (admin)</option>
                        </select>
                      </div>

                      {/* 비밀번호 입력 */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          비밀번호 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={newUserForm.password}
                          onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="비밀번호 입력"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all"
                        />
                      </div>

                      {/* 비밀번호 입력 확인 */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          비밀번호 확인 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={newUserForm.confirmPassword}
                          onChange={(e) => setNewUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="비밀번호 입력 확인"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all"
                        />
                        {newUserForm.confirmPassword && newUserForm.password !== newUserForm.confirmPassword && (
                          <p className="text-[11px] text-red-500 font-semibold mt-1">비밀번호가 일치하지 않습니다.</p>
                        )}
                      </div>

                      {/* 모달 푸터 버튼 */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsCreateUserModalOpen(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                        >
                          취소
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
                        >
                          생성 완료
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
        )}

        {/* [탭] 모니터링 주기 관리 */}
        {activeTab === "schedule" && (
          <div className="p-10 max-w-5xl mx-auto">
            {/* 헤더 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <div className="flex items-center gap-4">
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
              
              <button
                onClick={handleSaveSchedule}
                disabled={isSavingSchedule}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-white transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: C.primary, fontWeight: 700, fontSize: "0.9375rem" }}
              >
                <Save size={18} /> {isSavingSchedule ? "저장 중..." : "설정 저장 및 적용"}
              </button>
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
                      {userTargets.map((t) => {
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
                        value: `${userTargets.length}개 사이트`,
                      },
                      {
                        label: "총 일일 요청",
                        value: `약 ${effectiveTimesPerDay() * Math.max(userTargets.length, 1)}회`,
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
                      {(() => {
                        const sInfo = getTargetStatusInfo(currentTarget.id);
                        return (
                          <span
                            className="px-3 py-1 rounded-full flex items-center gap-1.5"
                            style={{ backgroundColor: sInfo.bg, color: sInfo.color, fontSize: "0.75rem", fontWeight: 700 }}
                          >
                            <span style={{ height: 8, width: 8, borderRadius: "50%", backgroundColor: sInfo.dot, display: "inline-block" }} />{" "}
                            {sInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-gray-500 flex items-center gap-2">
                      <Link size={12} />
                      <span>{currentTarget.url}</span>
                    </p>
                  </div>

                  {/* 추가: 현재 모니터링 설정 요약 & 수동 점검 버튼 */}
                  <div className="flex flex-wrap items-center gap-3">
                    {(() => {
                      const ts = getTargetSchedule(currentTarget.id);
                      const effectiveInterval = ts.useGlobal ? globalSchedule.interval : ts.interval;
                      const intervalLabel = intervalOptions.find(o => o.value === effectiveInterval)?.label || `${effectiveInterval}분`;
                      const effectiveHoursLabel = ts.useGlobal
                        ? (globalSchedule.activeHours === "all" ? "24시간 상시"
                          : globalSchedule.activeHours === "business" ? "09:00 ~ 18:00"
                          : `${globalSchedule.customStart} ~ ${globalSchedule.customEnd}`)
                        : (ts.activeHours === "all" ? "24시간 상시"
                          : ts.activeHours === "business" ? "09:00 ~ 18:00"
                          : `${ts.customStart} ~ ${ts.customEnd}`);

                      return (
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 rounded-2xl border bg-gray-50/50" style={{ borderColor: '#f3f4f6' }}>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-gray-400 font-bold" style={{ fontSize: '0.625rem', letterSpacing: '0.05em' }}>INTERVAL</span>
                            <span className="text-gray-700 font-extrabold" style={{ fontSize: '0.8125rem' }}>{intervalLabel}</span>
                          </div>
                          <div className="hidden sm:block w-px h-4 bg-gray-200" />
                          <div className="flex items-center gap-2">
                            <CalendarClock size={14} className="text-gray-400" />
                            <span className="text-gray-400 font-bold" style={{ fontSize: '0.625rem', letterSpacing: '0.05em' }}>ACTIVE HOURS</span>
                            <span className="text-gray-700 font-extrabold" style={{ fontSize: '0.8125rem' }}>{effectiveHoursLabel}</span>
                          </div>
                          <div className="hidden sm:block w-px h-4 bg-gray-200" />
                          <div className="flex items-center gap-2">
                            <Settings2 size={14} className="text-gray-400" />
                            <span className="text-gray-400 font-bold" style={{ fontSize: '0.625rem', letterSpacing: '0.05em' }}>MODE</span>
                            <span className="px-2 py-0.5 rounded-md text-white font-black" style={{ fontSize: '0.5625rem', backgroundColor: ts.useGlobal ? '#9ca3af' : C.primary }}>
                              {ts.useGlobal ? 'GLOBAL' : 'INDIVIDUAL'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 수동 점검 실행 버튼 */}
                    <button
                      onClick={() => handleManualCheck(currentTarget.id)}
                      disabled={checkingTargetIds.includes(currentTarget.id)}
                      className="flex items-center gap-2 px-5 py-4 rounded-2xl text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{ backgroundColor: C.primary }}
                      title="설정된 주기를 기다리지 않고 지금 즉시 수동 점검을 실행합니다"
                    >
                      <RefreshCw size={16} className={checkingTargetIds.includes(currentTarget.id) ? "animate-spin" : ""} />
                      <span>{checkingTargetIds.includes(currentTarget.id) ? "수동 점검 진행 중..." : "수동 점검 실행"}</span>
                    </button>
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
                          {["URL Path", "Status", "Resources", "Response", ""].map((h) => (
                            <th key={h} className="px-6 py-4 uppercase" style={{ fontWeight: 700, fontSize: "0.65rem" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y text-gray-600">
                        {latestTarget && (tableExpanded ? latestTarget.data : latestTarget.data.slice(0, 3)).map((d, idx) => (
                          <tr
                            key={`main-row-${d.path}-${idx}`}
                            className="group transition-colors"
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#f9fafb")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "")}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-800" style={{ fontWeight: 700 }}>{d.path}</span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => copyToClipboard((currentTarget.url.endsWith('/') ? currentTarget.url.slice(0, -1) : currentTarget.url) + d.path)}
                                    className="p-1 hover:bg-white border border-transparent hover:border-gray-200 rounded text-gray-400 hover:text-primary transition-all"
                                    title="주소 복사"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  <a 
                                    href={(currentTarget.url.endsWith('/') ? currentTarget.url.slice(0, -1) : currentTarget.url) + d.path} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-white border border-transparent hover:border-gray-200 rounded text-gray-400 hover:text-primary transition-all"
                                    title="새 창에서 열기"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              </div>
                            </td>
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
                            <td className="px-6 py-4 relative group/img">
                              {d.brokenImg
                                ? (
                                  <>
                                    <span className="text-red-500 cursor-help" style={{ fontWeight: 700 }}>
                                      Broken ({d.brokenImages?.length || 1})
                                    </span>
                                    {/* 툴팁 */}
                                    <div className="absolute z-[60] left-0 top-full mt-1 hidden group-hover/img:block bg-gray-900 text-white p-3 rounded-xl shadow-2xl min-w-[240px] max-w-[400px]">
                                      <p className="text-[0.625rem] font-bold mb-2 border-b border-gray-700 pb-1 text-red-400">발견된 장애 이미지 목록</p>
                                      <ul className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                                        {(d.brokenImages || []).map((url: string, i: number) => (
                                          <li key={i} className="text-[0.5625rem] font-mono break-all opacity-80 hover:opacity-100 flex gap-1.5">
                                            <span className="text-red-400 font-bold">•</span>
                                            {url}
                                          </li>
                                        ))}
                                        {(!d.brokenImages || d.brokenImages.length === 0) && (
                                          <li className="text-[0.5625rem] italic opacity-50">상세 URL을 불러올 수 없습니다.</li>
                                        )}
                                      </ul>
                                    </div>
                                  </>
                                )
                                : <span className="text-gray-300">OK</span>}
                            </td>
                            <td className="px-6 py-4 text-gray-400 font-mono" style={{ fontSize: "0.625rem" }}>{d.loadTime}</td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  deletePath(latestTarget.id, d.path); 
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                style={{ 
                                  cursor: "pointer", 
                                  position: "relative", 
                                  zIndex: 50, 
                                  pointerEvents: "auto",
                                  border: "none",
                                  background: "none"
                                }}
                                title="모니터링 대상에서 제외"
                              >
                                <Trash2 size={14} style={{ pointerEvents: "none" }} />
                              </button>
                            </td>
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
                <DailyLogSection 
                  targetName={currentTarget.name} 
                  targetId={currentTarget.id} 
                  history={currentTarget.history || []} 
                />
              </div>
            )}
          </div>
        )}

        {/* [탭] 모니터링 결과 알림설정 */}
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
                <h2 className="text-gray-800" style={{ fontSize: "1.5rem", fontWeight: 700 }}>모니터링 결과 알림설정</h2>
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
                      {userTargets.length === 0 ? (
                        <div className="col-span-full py-8 text-center text-gray-400 italic" style={{ fontSize: "0.75rem" }}>
                          먼저 대시보드에서 사이트를 추가해 주세요.
                        </div>
                      ) : (
                        userTargets.map((t) => (
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
                        const matchedTargets = userTargets.filter((t) => channel.targetIds.includes(t.id));
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
                                  <p className="text-gray-400" style={{ fontSize: "0.625rem" }}>활성 수신 상태</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={sendingTestEmailKey === channel.email}
                                  onClick={() => handleTestSendEmail(channel.email, channel.targetIds[0])}
                                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 disabled:bg-slate-100 text-sky-700 disabled:text-slate-400 border border-sky-200 disabled:border-slate-200 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                                  title="해당 이메일로 테스트 알림 메일 즉시 발송"
                                >
                                  {sendingTestEmailKey === channel.email ? (
                                    <>
                                      <Loader2 size={10} className="animate-spin text-sky-600" />
                                      <span>발송 중...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Send size={10} />
                                      <span>테스트 메일</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => removeChannel(channel.email)}
                                  className="text-gray-300 transition-colors p-1 hover:text-red-500"
                                  title="알림 채널 삭제"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
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

        {/* 내 정보 수정 팝업 모달 */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          username={loggedInUser}
          nickname={nickname}
          lastLoginAt={lastLoginAt}
          onUpdateProfile={handleUpdateProfile}
        />

        {/* 최초 로그인 비밀번호 변경 팝업 모달 */}
        {(mustChangePasswordUser || isFirstLoginState) && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* 모달 헤더 */}
              <div className="px-6 py-5 bg-sky-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <UserCog size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight">최초 로그인 비밀번호 변경</h3>
                    <p className="text-[11px] text-sky-100 mt-0.5">
                      {mustChangePasswordUser?.nickname || nickname || "사용자"} ({mustChangePasswordUser?.username || loggedInUser}) 계정
                    </p>
                  </div>
                </div>
              </div>

              {/* 모달 바디 */}
              <form onSubmit={handleFirstPasswordChangeSubmit} className="p-6 space-y-4">
                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-xs text-sky-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-sky-950">
                    <span>🔐</span>
                    <span>안전한 서비스 이용을 위한 비밀번호 설정</span>
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    임시/초기 비밀번호로 로그인되었습니다.<br />
                    보안 강화를 위해 사용하실 <strong>새 개인 비밀번호</strong>를 설정해 주세요.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    새 비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={firstNewPassword}
                    onChange={(e) => setFirstNewPassword(e.target.value)}
                    placeholder="새로운 비밀번호 입력"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    새 비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={firstConfirmPassword}
                    onChange={(e) => setFirstConfirmPassword(e.target.value)}
                    placeholder="새로운 비밀번호 재입력"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 transition-all"
                  />
                </div>

                {firstNewPassword && firstConfirmPassword && (
                  <p className={`text-[11px] font-bold ${firstNewPassword === firstConfirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                    {firstNewPassword === firstConfirmPassword ? "✓ 비밀번호가 일치합니다." : "✕ 비밀번호가 일치하지 않습니다."}
                  </p>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoggedIn(false);
                      setMustChangePasswordUser(null);
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                  >
                    로그아웃
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFirstPassword}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmittingFirstPassword ? "저장 중..." : "비밀번호 변경 및 서비스 시작"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 대화형 인터랙티브 가이드 투어 */}
        <OnboardingTour
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
          onNavigateTab={(tab) => switchTab(tab as TabName)}
          currentActiveTab={activeTab}
          userLevel={userLevel}
        />
      </main>
    </div>
  );
}