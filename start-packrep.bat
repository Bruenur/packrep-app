@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies first...
  call npm install || goto :fail
)
call npx expo start -c
exit /b 0
:fail
echo.
echo Install failed. Try running: npx expo install --fix
exit /b 1
