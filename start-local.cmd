@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Install Node.js 24 LTS first. & pause & exit /b 1)
call npm ci || exit /b 1
node scripts/setup.mjs || exit /b 1
call npm run build || exit /b 1
call npm start
pause
