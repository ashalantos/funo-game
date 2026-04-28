@echo off
:: ============================================================
:: copy-game-assets.bat
:: Run this ONCE before opening the project in Android Studio,
:: and again whenever you update the web game files.
:: ============================================================

SET SRC=..\
SET DST=app\src\main\assets\game\

echo Copying game assets to Android assets folder...

:: Create destination directories
if not exist "%DST%css" mkdir "%DST%css"
if not exist "%DST%js"  mkdir "%DST%js"

:: Copy root files
copy /Y "%SRC%index.html" "%DST%"

:: Copy CSS
copy /Y "%SRC%css\style.css" "%DST%css\"

:: Copy JS modules
for %%f in (main.js game.js state.js deck.js constants.js renderer.js effects.js bot.js ui.js) do (
    copy /Y "%SRC%js\%%f" "%DST%js\"
)

echo.
echo Done! Game assets copied to:
echo   %CD%\%DST%
echo.
echo You can now open the android\ folder in Android Studio and build the APK.
pause
