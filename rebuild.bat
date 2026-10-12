@echo off
rem Rebuilds the site after you edit anything under guide\src or guide\public. Restart start.bat afterwards.
cd /d "%~dp0guide"
call npm run build
pause
