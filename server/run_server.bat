@echo off
cd /d "%~dp0"
:loop
echo [%date% %time%] Starting OmniSight Server... >> server_run.log
node index.js >> server_run.log 2>&1
echo [%date% %time%] Server crashed or stopped. Restarting in 5 seconds... >> server_run.log
timeout /t 5 > nul
goto loop
