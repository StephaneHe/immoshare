@echo off
cd /d "%~dp0.\packages\api"
npx tsx watch src/server.ts
