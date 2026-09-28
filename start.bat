@echo off
title AegisRecover Pro - Mission-Critical Rescue System
color 0B
echo ======================================================================
echo           AEGISRECOVER PRO: 100%% FORENSIC DATA RESCUE SYSTEM
echo ======================================================================
echo [INFO] Initializing AegisRecover Pro Engine...
echo [INFO] Running in forensic read-only safety mode...
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [INFO] Starting AegisRecover Pro Local Control Server on port 4500...
echo [INFO] You can access the interface at http://localhost:4500
echo.
node server.js
pause
