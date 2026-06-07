@echo off
REM Build the DocuScan extraction sidecar for Windows.
REM Run from the project root: scripts\build-sidecar-windows.bat

setlocal

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."

echo =^> Installing Python dependencies
pip install -r "%PROJECT_ROOT%\sidecar\requirements.txt"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: pip install failed
    exit /b %ERRORLEVEL%
)

echo =^> Building sidecar binary
python "%PROJECT_ROOT%\sidecar\build.py" --platform windows
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: sidecar build failed
    exit /b %ERRORLEVEL%
)

echo =^> Done
echo     Binary: src-tauri\binaries\sidecar-x86_64-pc-windows-msvc.exe
endlocal
