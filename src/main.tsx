import React, { Component, ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[OmniSight Global Error]", error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          fontFamily: "'Pretendard', sans-serif",
          padding: "24px"
        }}>
          <div style={{
            maxWidth: "520px",
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            padding: "32px",
            textAlign: "center"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              fontSize: "24px"
            }}>
              ⚠️
            </div>
            <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#0f172a", marginBottom: "8px" }}>
              화면을 불러오는 중 일시적인 오류가 발생했습니다
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px", lineHeight: "1.5" }}>
              {this.state.error?.message || "알 수 없는 오류가 발생했습니다."}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                새로고침
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                캐시 초기화 후 재접속
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);