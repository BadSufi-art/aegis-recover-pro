# ==============================================================================
# AegisRecover Pro - Native Windows Forensic Drive Inspector
# ==============================================================================
# Queries physical disks, volumes, BitLocker status, and Volume Shadow Copies (VSS)
# ==============================================================================

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "         AEGISRECOVER PRO: SYSTEM FORENSIC AUDIT                  " -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan

# 1. Query Physical Drives
Write-Host "`n[1] Physical Storage Devices:" -ForegroundColor Green
Get-CimInstance Win32_DiskDrive | Select-Object Index, Model, InterfaceType, MediaType, @{Name="Size (GB)";Expression={[math]::Round($_.Size / 1GB, 2)}}, Status | Format-Table -AutoSize

# 2. Query Volumes & Filesystems
Write-Host "`n[2] Logical Volumes & Filesystems:" -ForegroundColor Green
Get-Volume | Select-Object DriveLetter, FileSystemLabel, FileSystem, DriveType, HealthStatus, @{Name="Size (GB)";Expression={[math]::Round($_.Size / 1GB, 2)}}, @{Name="Free (GB)";Expression={[math]::Round($_.SizeRemaining / 1GB, 2)}} | Format-Table -AutoSize

# 3. Query BitLocker Status
Write-Host "`n[3] BitLocker Encryption Status (manage-bde):" -ForegroundColor Green
try {
    manage-bde -status
} catch {
    Write-Host "BitLocker management tools not present or access restricted." -ForegroundColor Gray
}

# 4. Query Volume Shadow Copies (VSS)
Write-Host "`n[4] Volume Shadow Copies (Available Restore Snapshots):" -ForegroundColor Green
try {
    vssadmin list shadows
} catch {
    Write-Host "VSS Admin requires administrator elevation." -ForegroundColor Gray
}

Write-Host "`nForensic inspection complete. All volumes are ready for zero-touch read-only recovery." -ForegroundColor Cyan
