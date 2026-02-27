@echo off
title Georgia Premium Trips — Server
color 0A
echo.
echo  ============================================
echo   Georgia Premium Trips - Starting Server...
echo  ============================================
echo.
cd /d "%~dp0"
echo  Installing dependencies...
call npm install --silent 2>nul
echo.
echo  Starting server on http://localhost:3000
echo  Admin panel: http://localhost:3000/admin
echo  Login: admin / georgia2025
echo.
start "" http://localhost:3000
node server.js
pause
