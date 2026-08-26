param (
    [string]$Command = "backup",
    [string]$BackupDir = ".\backups"
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DbUser = if ($env:MYSQL_USER) { $env:MYSQL_USER } else { "root" }
$DbPass = if ($env:MYSQL_PASSWORD) { $env:MYSQL_PASSWORD } else { "" }
$DbName = if ($env:MYSQL_DATABASE) { $env:MYSQL_DATABASE } else { "DEIMS" }
$EncryptedDir = ".\encrypted"

if (-Not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

if ($Command -eq "backup") {
    Write-Host "Starting DEIMS Backup..." -ForegroundColor Cyan
    
    # 1. Backup Database
    Write-Host "Dumping MySQL Database..."
    $SqlBackupFile = Join-Path $BackupDir "db_backup_$Timestamp.sql"
    if ($DbPass -eq "") {
        mysqldump -u $DbUser $DbName > $SqlBackupFile
    } else {
        mysqldump -u $DbUser -p$DbPass $DbName > $SqlBackupFile
    }
    
    # 2. Backup Encrypted Evidence
    Write-Host "Backing up encrypted evidence..."
    $ZipBackupFile = Join-Path $BackupDir "evidence_backup_$Timestamp.zip"
    Compress-Archive -Path "$EncryptedDir\*" -DestinationPath $ZipBackupFile -Force
    
    Write-Host "Backup completed successfully! Stored in $BackupDir" -ForegroundColor Green
}
elseif ($Command -eq "restore") {
    Write-Host "Starting DEIMS Restore..." -ForegroundColor Cyan
    
    $LatestSql = Get-ChildItem -Path $BackupDir -Filter "db_backup_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $LatestZip = Get-ChildItem -Path $BackupDir -Filter "evidence_backup_*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    
    if (-Not $LatestSql -or -Not $LatestZip) {
        Write-Host "No backups found in $BackupDir" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Restoring Database from $($LatestSql.FullName)..."
    if ($DbPass -eq "") {
        cmd.exe /c "mysql -u $DbUser $DbName < `"$($LatestSql.FullName)`""
    } else {
        cmd.exe /c "mysql -u $DbUser -p$DbPass $DbName < `"$($LatestSql.FullName)`""
    }
    
    Write-Host "Restoring Evidence from $($LatestZip.FullName)..."
    if (-Not (Test-Path $EncryptedDir)) {
        New-Item -ItemType Directory -Path $EncryptedDir | Out-Null
    }
    Expand-Archive -Path $LatestZip.FullName -DestinationPath $EncryptedDir -Force
    
    Write-Host "Restore completed successfully!" -ForegroundColor Green
}
else {
    Write-Host "Usage: .\backup_recovery.ps1 -Command [backup|restore] -BackupDir [path]" -ForegroundColor Yellow
}
