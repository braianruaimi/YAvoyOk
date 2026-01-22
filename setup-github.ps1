Write-Host ""
Write-Host "========================================"
Write-Host "   YAVOYOK - Setup GitHub"
Write-Host "========================================"
Write-Host ""

if (-not (Test-Path ".git")) {
    Write-Host "Error: No estas en un repositorio git"
    exit 1
}

Write-Host "Estado actual:"
git log --oneline -5
Write-Host ""

Write-Host "Ingresa tu usuario de GitHub:"
$githubUser = Read-Host "Usuario"

if ([string]::IsNullOrWhiteSpace($githubUser)) {
    Write-Host "Error: Usuario requerido"
    exit 1
}

$repoUrl = "https://github.com/$githubUser/YAvoyOk.git"

Write-Host ""
Write-Host "URL: $repoUrl"
Write-Host ""

Write-Host "Agregando remoto..."
git remote add origin $repoUrl

Write-Host "Remoto configurado:"
git remote -v
Write-Host ""

Write-Host "Deseas hacer push ahora? (S/N)"
Write-Host "IMPORTANTE: Crea primero el repo en https://github.com/new"
$doPush = Read-Host

if ($doPush -eq "S" -or $doPush -eq "s") {
    Write-Host "Haciendo push..."
    git push -u origin main --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "EXITO!"
        Write-Host "https://github.com/$githubUser/YAvoyOk"
    }
    else {
        Write-Host "Error al hacer push"
    }
}
else {
    Write-Host "Push cancelado"
    Write-Host "Comando: git push -u origin main --force"
}

Write-Host ""
