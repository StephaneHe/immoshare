@echo off
cd /d "%~dp0.\packages\api"
npx tsx src/server.ts >> "%USERPROFILE%\AppData\Local\Temp\api-debug.log" 2>&1
echo "EXIT CODE: %ERRORLEVEL%" >> "%USERPROFILE%\AppData\Local\Temp\api-debug.log"
