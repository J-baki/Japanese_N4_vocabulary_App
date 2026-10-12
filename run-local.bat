@echo off
setlocal
cd /d "%~dp0"
title Voca - Japanese Vocabulary Trainer

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm were not found.
  echo Install Node.js LTS from https://nodejs.org/ and run this file again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo First run: installing Voca dependencies. Please wait...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed. Check your internet connection and try again.
    pause
    exit /b 1
  )
)

echo Starting Voca locally. Keep this window open while using the app.
call npm run dev -- --host 127.0.0.1 --open
pause
