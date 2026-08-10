$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$required = @(
  "index.html",
  "admin.html",
  ".nojekyll",
  "assets\css\tokens.css",
  "assets\css\global.css",
  "assets\css\login.css",
  "assets\css\admin.css",
  "assets\css\responsive.css",
  "assets\css\print.css",
  "assets\img\logo-infihuila-transparent.png",
  "assets\img\logo-mark.png",
  "assets\js\login.js",
  "assets\js\admin.js",
  "assets\js\firebase-config.js",
  "assets\js\firebase-init.js",
  "assets\js\firestore.js"
)

$missing = @()
foreach($rel in $required){
  $full = Join-Path $root $rel
  if(-not (Test-Path $full)){ $missing += $rel }
}

Write-Host ""
Write-Host "Cartera INFIHUILA v3.3.4 - Verificacion de estructura" -ForegroundColor Cyan
Write-Host "Raiz: $root"
Write-Host ""

if($missing.Count -eq 0){
  Write-Host "PASS: estructura completa para GitHub Pages." -ForegroundColor Green
  Write-Host "Puede publicar index.html, admin.html, assets y .nojekyll en la raiz del repositorio."
}else{
  Write-Host "FAIL: faltan archivos:" -ForegroundColor Red
  $missing | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
  exit 1
}
