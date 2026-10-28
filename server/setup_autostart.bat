@echo off
:: ============================================================
:: OmniSight 자동시작 및 방화벽 설정 스크립트
:: 관리자 권한으로 실행해야 합니다.
:: ============================================================

:: 관리자 권한 확인
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [오류] 관리자 권한으로 실행해주세요.
    echo 이 파일을 우클릭 후 "관리자 권한으로 실행" 선택
    pause
    exit /b 1
)

echo ============================================================
echo  OmniSight 설정 시작
echo ============================================================

:: 1. 방화벽 규칙 추가 (포트 3002)
echo.
echo [1/2] 방화벽 포트 3002 허용 중...
netsh advfirewall firewall delete rule name="OmniSight_3002" >nul 2>&1
netsh advfirewall firewall add rule name="OmniSight_3002" protocol=TCP dir=in localport=3002 action=allow
if %errorLevel% equ 0 (
    echo      완료: 포트 3002 인바운드 허용됨
) else (
    echo      [경고] 방화벽 규칙 추가 실패
)

:: 2. Windows 시작프로그램 등록 (현재 사용자)
echo.
echo [2/2] 시작프로그램 등록 중...
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set VBS_PATH=d:\행복ICT\2026년\AI 역량강화\개인과제_모니터링 툴_ver3\OmniSight\server\run_server_hidden.vbs
set SHORTCUT_PATH=%STARTUP_DIR%\OmniSight_Server.vbs

copy "%VBS_PATH%" "%SHORTCUT_PATH%" >nul
if %errorLevel% equ 0 (
    echo      완료: 시작프로그램에 등록됨
    echo      위치: %SHORTCUT_PATH%
) else (
    echo      [경고] 시작프로그램 등록 실패
)

echo.
echo ============================================================
echo  설정 완료!
echo  - 포트 3002 방화벽 허용 완료
echo  - PC 재시작 시 서버 자동 실행 등록 완료
echo  - 접속 주소: http://10.10.10.100:3002/
echo ============================================================
echo.
pause
