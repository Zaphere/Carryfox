@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

rem ===========================================================================
rem  Carryfox / Future Freight — local dev launcher (Windows)
rem  Starts the API server and the Vite web app in their own windows,
rem  then opens the site in your browser. Ctrl+C in a window stops it.
rem ===========================================================================

rem --- load .env (comments and blank lines are skipped) ---------------------
if exist .env (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if not "%%A"=="" if not "%%B"=="" set "%%A=%%B"
  )
)

if "%API_PORT%"=="" set "API_PORT=8080"
if "%WEB_PORT%"=="" set "WEB_PORT=25806"
if "%BASE_PATH%"=="" set "BASE_PATH=/"

echo  Carryfox dev launcher
echo  ---------------------
echo  API  ->  http://localhost:%API_PORT%
echo  Web  ->  http://localhost:%WEB_PORT%
echo.

rem --- build the API bundle if it is missing --------------------------------
if not exist "artifacts\api-server\dist\index.mjs" (
  echo  Building API server...
  call pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run build
  echo.
)

rem --- start API (unless its port is already in use) ------------------------
netstat -ano | findstr /c:":%API_PORT% " | findstr /c:"LISTENING" >nul
if not errorlevel 1 (
  echo  API already running on port %API_PORT% - not starting a second one.
) else (
  echo  Starting API server...
  start "Carryfox API :%API_PORT%" cmd /k "set "PORT=%API_PORT%"&& set "NODE_ENV=development"&& node --enable-source-maps artifacts\api-server\dist\index.mjs"
)

rem --- start web app (unless its port is already in use) --------------------
netstat -ano | findstr /c:":%WEB_PORT% " | findstr /c:"LISTENING" >nul
if not errorlevel 1 (
  echo  Web already running on port %WEB_PORT% - not starting a second one.
) else (
  echo  Starting web app...
  start "Carryfox Web :%WEB_PORT%" cmd /k "set "PORT=%WEB_PORT%"&& set "BASE_PATH=%BASE_PATH%"&& pnpm --config.verify-deps-before-run=false --filter @workspace/carryfox run dev"
)

rem --- open the site once Vite is up ----------------------------------------
echo  Waiting for the dev server, then opening the browser...
timeout /t 8 /nobreak >nul
start "" "http://localhost:%WEB_PORT%"

echo.
echo  Done. Close a window (or press Ctrl+C in it) to stop that service.
timeout /t 4 >nul
endlocal
