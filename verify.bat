@echo off
setlocal enabledelayedexpansion

echo.
echo 🔍 Verifying Contact Scraper Installation...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js: %NODE_VERSION%
)

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm: %NPM_VERSION%
)

echo.
echo Checking backend dependencies...

if exist "backend\node_modules" (
    echo ✅ Backend dependencies installed
) else (
    echo ⚠️ Backend dependencies not installed
    echo    Run: cd backend ^&^& npm install
)

echo.
echo Checking frontend dependencies...

if exist "frontend\node_modules" (
    echo ✅ Frontend dependencies installed
) else (
    echo ⚠️ Frontend dependencies not installed
    echo    Run: cd frontend ^&^& npm install
)

echo.
echo Checking file structure...

set MISSING=0

if exist "backend\server.js" (
    echo ✅ backend\server.js
) else (
    echo ❌ backend\server.js
    set /a MISSING+=1
)

if exist "backend\package.json" (
    echo ✅ backend\package.json
) else (
    echo ❌ backend\package.json
    set /a MISSING+=1
)

if exist "backend\.env" (
    echo ✅ backend\.env
) else (
    echo ❌ backend\.env
    set /a MISSING+=1
)

if exist "frontend\package.json" (
    echo ✅ frontend\package.json
) else (
    echo ❌ frontend\package.json
    set /a MISSING+=1
)

if exist "frontend\public\index.html" (
    echo ✅ frontend\public\index.html
) else (
    echo ❌ frontend\public\index.html
    set /a MISSING+=1
)

if exist "frontend\src\App.js" (
    echo ✅ frontend\src\App.js
) else (
    echo ❌ frontend\src\App.js
    set /a MISSING+=1
)

echo.
if %MISSING% equ 0 (
    echo ✅ All files present!
) else (
    echo ⚠️ %MISSING% files missing
)

echo.
echo 🎉 Verification complete!
echo.
pause
