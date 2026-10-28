import React, { useState } from "react";
import { User, Lock, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { OmniSightLogo } from "./OmniSightLogo";

interface LoginPageProps {
  onLoginSuccess: (user: { username: string; nickname: string; level: 'admin' | 'user'; isFirstLogin?: boolean }) => void;
}

const C = {
  primary: "#0284c7",
  hover: "#0369a1",
  lightBg: "#f0f9ff",
  lightBd: "#bae6fd",
  badge: "#e0f2fe",
};

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim()) {
      setErrorMsg("아이디를 입력해 주세요.");
      return;
    }
    if (!password) {
      setErrorMsg("비밀번호를 입력해 주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // API 로그인 확인 요청
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        const userObj = {
          username: data.user.username || username,
          nickname: data.user.nickname || "사용자",
          level: (data.user.level === "admin" ? "admin" : "user") as "admin" | "user",
          isFirstLogin: data.user.isFirstLogin === true
        };
        localStorage.removeItem("omnisight_auth");
        sessionStorage.removeItem("omnisight_auth");
        localStorage.removeItem("omnisight_user_level");

        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("omnisight_auth", JSON.stringify({
          isLoggedIn: true,
          ...userObj,
          token: data.token || "token_user"
        }));
        localStorage.setItem("omnisight_logged_in", "true");
        localStorage.setItem("omnisight_username", userObj.username);
        localStorage.setItem("omnisight_nickname", userObj.nickname);
        localStorage.setItem("omnisight_user_level", userObj.level);

        onLoginSuccess(userObj);
      } else {
        setErrorMsg(data.error || "아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (err) {
      // 네트워크 에러 발생 시 클라이언트 직접 체크 폴백
      if (username.trim() === "admin" && password === "0000") {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("omnisight_auth", JSON.stringify({
          isLoggedIn: true,
          username: "admin",
          token: "omnisight_admin_token"
        }));
        localStorage.setItem("omnisight_logged_in", "true");
        localStorage.setItem("omnisight_username", "admin");

        onLoginSuccess("admin");
      } else {
        setErrorMsg("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-900" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      {/* Dynamic Ambient Glow Background */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Card Container */}
      <div className="w-full max-w-md mx-4 z-10">
        <div className="bg-white/95 backdrop-blur-md border border-slate-100 rounded-3xl p-8 shadow-2xl shadow-sky-950/20 space-y-6">
          
          {/* Top Logo & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 shadow-sm border border-sky-100 mb-1">
              <OmniSightLogo size={36} color={C.primary} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center justify-center gap-2">
                OmniSight <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">System</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1">웹 사이트 모니터링 자동화 플랫폼</p>
            </div>
          </div>


          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message Alert */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl p-3 flex items-center gap-2 animate-shake">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">아이디</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">비밀번호</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-xs font-medium text-slate-600">로그인 상태 유지</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all hover:bg-sky-700 active:scale-[0.99] disabled:opacity-70"
              style={{ backgroundColor: C.primary }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>로그인</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Footer */}
          <div className="pt-2 text-center border-t border-slate-100 text-[11px] text-slate-400">
            OmniSight Monitoring System &copy; 2026. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
