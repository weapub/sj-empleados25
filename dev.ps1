Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"
