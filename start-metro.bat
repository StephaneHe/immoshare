@echo off
cd /d "%~dp0.\apps\mobile"
set EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
node "%~dp0.\node_modules\expo\bin\cli" start --port 8082
