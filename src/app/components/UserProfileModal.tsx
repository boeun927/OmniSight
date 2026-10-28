import React, { useState } from "react";
import { X, User, Lock, Clock, Shield, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  nickname: string;
  lastLoginAt: string;
  onUpdateProfile: (newNickname: string, newPassword?: string) => Promise<boolean>;
}

export function UserProfileModal({
  isOpen,
  onClose,
  username,
  nickname,
  lastLoginAt,
  onUpdateProfile,
}: UserProfileModalProps) {
  const [editedNickname, setEditedNickname] = useState(nickname);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Modal resets when opened
  React.useEffect(() => {
    if (isOpen) {
      setEditedNickname(nickname);
      setNewPassword("");
      setConfirmPassword("");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, nickname]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!editedNickname.trim()) {
      setErrorMsg("닉네임을 입력해 주세요.");
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 4) {
        setErrorMsg("비밀번호는 최소 4자리 이상이어야 합니다.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const ok = await onUpdateProfile(
        editedNickname.trim(),
        newPassword ? newPassword : undefined
      );
      if (ok) {
        setSuccessMsg("내 정보가 성공적으로 수정되었습니다.");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg("정보 수정에 실패했습니다. 다시 시도해 주세요.");
      }
    } catch (err) {
      setErrorMsg("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn" style={{ fontFamily: "'Pretendard', sans-serif" }}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-50 to-indigo-50/50 border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold shadow-md shadow-sky-500/20">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-tight">내 정보 수정</h3>
              <p className="text-xs text-slate-500">계정 프로필 및 보안 정보 변경</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <Check size={16} className="flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ID (Read-only) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>아이디</span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal">수정불가</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Shield size={18} />
              </div>
              <input
                type="text"
                value={username}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-slate-100/80 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Nickname (Editable) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              닉네임 <span className="text-sky-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={editedNickname}
                onChange={(e) => setEditedNickname(e.target.value)}
                placeholder="사용할 닉네임을 입력해 주세요"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 pl-1">
              * 변경한 닉네임은 시스템 상단 및 사이드바 프로필 영역에 표시됩니다.
            </p>
          </div>

          {/* Password Change Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Lock size={14} className="text-sky-600" />
              <span>비밀번호 변경</span>
              <span className="text-[10px] font-normal text-slate-400">(변경 시에만 입력)</span>
            </h4>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-600">새 비밀번호</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력 (4자리 이상)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-600">새 비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 재입력"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Last Login Timestamp */}
          <div className="p-3.5 bg-sky-50/60 border border-sky-100 rounded-xl flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Clock size={15} className="text-sky-600" />
              <span>마지막 로그인 일시</span>
            </span>
            <span className="font-mono font-bold text-sky-900">
              {lastLoginAt || "기록 없음"}
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={16} />
                  <span>저장</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
