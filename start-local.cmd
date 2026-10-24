@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Install Node.js 24 LTS first. & pause & exit /b 1)
call npm ci || exit /b 1
call npm run ps4
pause
