@echo off
chcp 65001 >nul 2>nul
echo ============================================
echo   Blog Local Preview Server
echo ============================================
echo.
echo Starting local server...
echo Visit: http://localhost:8080
echo Press Ctrl+C to stop
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    echo [Python HTTP Server]
    python -m http.server 8080
    goto :eof
)

where python3 >nul 2>nul
if %errorlevel%==0 (
    echo [Python3 HTTP Server]
    python3 -m http.server 8080
    goto :eof
)

where npx >nul 2>nul
if %errorlevel%==0 (
    echo [Node.js http-server]
    npx -y http-server -p 8080 -c-1
    goto :eof
)

echo ERROR: Python or Node.js not found.
echo Please install Python (python.org) or Node.js (nodejs.org)
pause
