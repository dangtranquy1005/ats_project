@echo off
set "PATH=C:\Users\ADMIN\nodejs;%PATH%"
cd /d "%~dp0frontend"
echo ===================================================
echo   Dang khoi chay AutoScreen Frontend (React + Vite)
echo ===================================================
npm run dev
pause
