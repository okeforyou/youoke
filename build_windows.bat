@echo off
echo ==============================================
echo 🚀 YouOke Desktop Plugin Builder for Windows
echo ==============================================
echo.

echo 1. Installing Python dependencies...
pip install -r scripts\local-bridge\requirements.txt
pip install pyinstaller

echo.
echo 2. Packing Python Server into Standalone EXE...
pyinstaller --name youoke-server --onefile scripts\local-bridge\server.py

echo.
echo 3. Copying EXE to Electron Plugin directory...
if not exist "youoke-plugin\bin" mkdir youoke-plugin\bin
copy "dist\youoke-server.exe" "youoke-plugin\bin\"

echo.
echo 4. Building Electron App (.exe installer)...
cd youoke-plugin
call npm install
call npm run dist:win

echo.
echo ==============================================
echo ✅ Build Complete! 
echo You can find the installer in: youoke-plugin\dist\
echo ==============================================
pause
