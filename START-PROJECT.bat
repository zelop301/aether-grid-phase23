@echo off
setlocal
cd /d "%~dp0"

if not exist package.json (
  echo ERROR: package.json was not found in this folder.
  echo Extract the ZIP first, then run START-PROJECT.bat from the extracted root.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the current Node.js LTS release and run this file again.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing Aether Grid dependencies...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed. Check your internet connection and npm configuration.
    pause
    exit /b 1
  )
)

echo Starting Aether Grid: Legacy Protocol...
call npm run dev
endlocal
