# copy-game-assets.ps1
# ============================================================
# Run this ONCE before opening the project in Android Studio,
# and again whenever you update the web game files.
#   Usage: cd android; .\copy-game-assets.ps1
# ============================================================

$src  = "..\\"
$dst  = "app\src\main\assets\game"

Write-Host "Copying game assets..." -ForegroundColor Cyan

# Create folders
New-Item -ItemType Directory -Force -Path "$dst\css" | Out-Null
New-Item -ItemType Directory -Force -Path "$dst\js"  | Out-Null

# index.html
Copy-Item -Force "${src}index.html" "$dst\"

# CSS
Copy-Item -Force "${src}css\style.css" "$dst\css\"

# JS modules
$jsFiles = @("main.js","game.js","state.js","deck.js","constants.js",
             "renderer.js","effects.js","bot.js","ui.js")
foreach ($f in $jsFiles) {
    Copy-Item -Force "${src}js\$f" "$dst\js\"
}

Write-Host ""
Write-Host "Done! Assets copied to: $((Resolve-Path $dst))" -ForegroundColor Green
Write-Host "Open the 'android' folder in Android Studio and click 'Build > Make Project'."
