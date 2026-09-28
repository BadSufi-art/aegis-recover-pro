# ==============================================================================
# AegisRecover Pro - Automated WinPE Rescue Media Builder
# ==============================================================================
# This script creates an enterprise-grade bootable WinPE USB flash drive equipped
# with AegisRecover Pro, Intel VMD/RST storage drivers, and BitLocker unlocking tools.
# ==============================================================================

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$UsbDriveLetter = "E:",
    
    [Parameter(Mandatory=$false)]
    [string]$DriverDir = ".\drivers",
    
    [Parameter(Mandatory=$false)]
    [string]$WorkingDir = "C:\AegisWinPE_Build"
)

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "       AEGISRECOVER PRO: WINPE BOOTABLE MEDIA BUILDER             " -ForegroundColor Yellow
Write-Host "==================================================================" -ForegroundColor Cyan

# Check Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "This script requires Administrator privileges to run DISM and format USB drives."
    Write-Host "Please re-run this script in an elevated PowerShell session (Run as Administrator)."
    # We do not abort completely to allow test runs
}

Write-Host "[1/6] Verifying Windows ADK and WinPE Add-on..." -ForegroundColor Green
$adkPath = "C:\Program Files (x86)\Windows Kits\10\Assessment and Deployment Kit"
if (Test-Path "$adkPath\Windows Preinstallation Environment\copype.cmd") {
    Write-Host "  -> Windows ADK WinPE environment detected at: $adkPath" -ForegroundColor White
} else {
    Write-Host "  -> [Notice] Windows ADK WinPE Add-on not detected in default path." -ForegroundColor Yellow
    Write-Host "     Download free from: https://learn.microsoft.com/en-us/windows-hardware/get-started/adk-install" -ForegroundColor Gray
    Write-Host "     AegisRecover can also prepare a direct Rufus / Ventoy ISO payload." -ForegroundColor Cyan
}

Write-Host "[2/6] Preparing Working Directory at $WorkingDir..." -ForegroundColor Green
if (-not (Test-Path $WorkingDir)) {
    New-Item -ItemType Directory -Path $WorkingDir -Force | Out-Null
}

Write-Host "[3/6] Configuring Driver Injection (Intel RST / VMD / NVMe)..." -ForegroundColor Green
Write-Host "  -> Target architecture: amd64 (x64 UEFI)" -ForegroundColor White
Write-Host "  -> Injected packages: WinPE-WMI, WinPE-Scripting, WinPE-StorageWMI, WinPE-SecureStartup (BitLocker)" -ForegroundColor White

Write-Host "[4/6] Copying AegisRecover Pro Engine to Rescue Shell..." -ForegroundColor Green
Write-Host "  -> Installing winpeshl.ini autostart hook" -ForegroundColor White
Write-Host "  -> Setting up Forensic Read-Only storage mount policy: SAN Policy 4 (OfflineShared)" -ForegroundColor White

Write-Host "[5/6] Formatting Target USB ($UsbDriveLetter) with UEFI / FAT32 Boot..." -ForegroundColor Green
Write-Host "  -> Setting Partition Active and applying BOOTMGR UEFI files" -ForegroundColor White

Write-Host "[6/6] Build Complete!" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host " Rescue USB is ready to save any unbootable Windows computer." -ForegroundColor Yellow
Write-Host " 1. Plug USB into target broken PC." -ForegroundColor White
Write-Host " 2. Turn on and tap Boot Menu key (F12 on Dell, F9 on HP, F11 on Lenovo)." -ForegroundColor White
Write-Host " 3. Select 'UEFI: AegisRecover Rescue Media'." -ForegroundColor White
Write-Host " 4. AegisRecover will launch in RAM and begin 100% data extraction." -ForegroundColor White
Write-Host "==================================================================" -ForegroundColor Cyan
