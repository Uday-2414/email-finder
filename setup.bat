@echo off
setlocal enabledelayedexpansion

echo.
echo 🚀 Starting Contact Scraper Pro...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js found: %NODE_VERSION%
echo.

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend installation failed
    pause
    exit /b 1
)
cd ..
echo ✅ Backend dependencies installed
echo.

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend installation failed
    pause
    exit /b 1
)
cd ..
echo ✅ Frontend dependencies installed
echo.

echo 🎉 Setup complete!
echo.
echo To start the application:
echo   1. In one terminal: cd backend ^&^& npm run dev
echo   2. In another terminal: cd frontend ^&^& npm start
echo.
echo Backend will run on http://localhost:5000
echo Frontend will run on http://localhost:3000
echo.
pause
