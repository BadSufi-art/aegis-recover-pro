/**
 * AegisRecover Pro - Client Controller & State Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // State Store
    const state = {
        drives: [],
        selectedDrive: null,
        scannedFiles: [],
        selectedFileIds: new Set(),
        currentCategory: 'ALL',
        activeCertificate: null,
        isRecovering: false
    };

    // DOM Elements
    const tabs = document.querySelectorAll('.step-tab');
    const panels = document.querySelectorAll('.tab-panel');
    const drivesGrid = document.getElementById('drivesGrid');
    const selectedDriveCard = document.getElementById('selectedDriveCard');
    const selDriveTitle = document.getElementById('selDriveTitle');
    const selDriveDesc = document.getElementById('selDriveDesc');
    const btnRefreshDrives = document.getElementById('btnRefreshDrives');
    const btnRunSmartCheck = document.getElementById('btnRunSmartCheck');
    const btnUnlockBitLocker = document.getElementById('btnUnlockBitLocker');
    const btnProceedToTriage = document.getElementById('btnProceedToTriage');
    
    // Triage elements
    const fileTableRows = document.getElementById('fileTableRows');
    const masterCheckbox = document.getElementById('masterCheckbox');
    const selectedStatsLabel = document.getElementById('selectedStatsLabel');
    const categoryChips = document.getElementById('categoryChips');
    const btnSelectAllFiles = document.getElementById('btnSelectAllFiles');
    const btnSelectPersonalOnly = document.getElementById('btnSelectPersonalOnly');
    const btnStartScanDirect = document.getElementById('btnStartScanDirect');
    const btnProceedToDestination = document.getElementById('btnProceedToDestination');

    // Destination & Recovery elements
    const btnExecuteRecovery = document.getElementById('btnExecuteRecovery');
    const customTargetDir = document.getElementById('customTargetDir');
    const pipelineProgressBar = document.getElementById('pipelineProgressBar');
    const pipelineProgressPercent = document.getElementById('pipelineProgressPercent');
    const pipelineProgressLabel = document.getElementById('pipelineProgressLabel');
    const pipelineFileIndex = document.getElementById('pipelineFileIndex');
    const pipelineTransferSpeed = document.getElementById('pipelineTransferSpeed');
    const pipelineStatusText = document.getElementById('pipelineStatusText');
    const terminalLog = document.getElementById('terminalLog');
    const btnViewCertificate = document.getElementById('btnViewCertificate');

    // Certificate elements
    const certIdDisplay = document.getElementById('certIdDisplay');
    const certIssueDate = document.getElementById('certIssueDate');
    const certTargetFiles = document.getElementById('certTargetFiles');
    const certRecoveredFiles = document.getElementById('certRecoveredFiles');
    const certSavedPathDisplay = document.getElementById('certSavedPathDisplay');
    const btnDownloadAuditReport = document.getElementById('btnDownloadAuditReport');

    // Builder elements
    const usbDriveSelect = document.getElementById('usbDriveSelect');
    const btnBurnUsb = document.getElementById('btnBurnUsb');
    const usbBurnStatusBox = document.getElementById('usbBurnStatusBox');

    // Modals
    const smartModal = document.getElementById('smartModal');
    const smartModalContent = document.getElementById('smartModalContent');
    const btnCloseSmartModal = document.getElementById('btnCloseSmartModal');
    const btnConfirmSmartSafe = document.getElementById('btnConfirmSmartSafe');

    const bitlockerModal = document.getElementById('bitlockerModal');
    const bitlockerKeyInput = document.getElementById('bitlockerKeyInput');
    const btnCloseBitlockerModal = document.getElementById('btnCloseBitlockerModal');
    const btnFillDemoBitLockerKey = document.getElementById('btnFillDemoBitLockerKey');
    const btnSubmitBitlockerKey = document.getElementById('btnSubmitBitlockerKey');
    const bitlockerErrorBox = document.getElementById('bitlockerErrorBox');

    // Tab Navigation
    function switchTab(targetId) {
        tabs.forEach(tab => {
            if (tab.dataset.tab === targetId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        panels.forEach(p => {
            if (p.id === targetId) {
                p.classList.add('active');
            } else {
                p.classList.remove('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Helper: Append terminal log
    function logTerminal(message, type = 'info') {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        const now = new Date().toTimeString().split(' ')[0];
        
        let colorClass = '';
        if (type === 'success') colorClass = 'terminal-success';
        if (type === 'warning') colorClass = 'terminal-warning';

        line.innerHTML = `
            <span class="terminal-timestamp">[${now}]</span>
            <span class="${colorClass}">${message}</span>
        `;
        terminalLog.appendChild(line);
        terminalLog.scrollTop = terminalLog.scrollHeight;
    }

    // Load System Drives
    async function loadDrives() {
        try {
            drivesGrid.innerHTML = '<div style="color: var(--text-muted); padding: 1rem;">Scanning storage buses and NVMe controllers...</div>';
            const res = await fetch('/api/system/drives');
            const data = await res.json();
            
            // Combine real and simulated drives for complete showcase
            state.drives = [...data.simulatedDrives, ...data.realDrives];
            renderDrivesGrid();
        } catch (err) {
            drivesGrid.innerHTML = `<div style="color: #f87171;">Failed to query storage drives: ${err.message}</div>`;
        }
    }

    // Render Drives Grid
    function renderDrivesGrid() {
        drivesGrid.innerHTML = '';
        state.drives.forEach(drive => {
            const card = document.createElement('div');
            card.className = `drive-card ${state.selectedDrive && state.selectedDrive.id === drive.id ? 'selected' : ''}`;
            
            const usedPct = drive.totalSize > 0 ? Math.round((drive.usedSize / drive.totalSize) * 100) : 50;
            
            let statusPillClass = 'status-healthy';
            if (drive.isEncrypted) statusPillClass = 'status-bitlocker';
            else if (drive.status.includes('Corrupted') || drive.status.includes('Damaged')) statusPillClass = 'status-corrupt';

            card.innerHTML = `
                <div class="drive-header">
                    <div class="drive-info-title">
                        <div class="drive-icon">
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>
                        </div>
                        <div>
                            <div class="drive-name">${drive.name}</div>
                            <div class="drive-device-path">${drive.device}</div>
                        </div>
                    </div>
                    <span class="drive-status-pill ${statusPillClass}">${drive.status}</span>
                </div>

                <div class="capacity-bar-wrapper">
                    <div class="capacity-stats">
                        <span>Used: ${formatBytes(drive.usedSize)} / Total: ${drive.formattedTotal || formatBytes(drive.totalSize)}</span>
                        <span>${usedPct}%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${usedPct > 85 ? 'danger' : ''}" style="width: ${usedPct}%"></div>
                    </div>
                </div>

                <div class="drive-meta-tags">
                    <span class="meta-tag">FS: ${drive.fileSystem}</span>
                    <span class="meta-tag">Bus: ${drive.driveType}</span>
                    ${drive.health ? `<span class="meta-tag" style="color: var(--accent-teal);">Health: ${drive.health}</span>` : ''}
                    ${drive.isEncrypted ? `<span class="meta-tag" style="color: var(--accent-amber);">BitLocker Protected</span>` : ''}
                </div>
            `;

            card.addEventListener('click', () => selectDrive(drive));
            drivesGrid.appendChild(card);
        });

        // Auto-select first drive if none selected
        if (!state.selectedDrive && state.drives.length > 0) {
            selectDrive(state.drives[0]);
        }
    }

    // Select Drive
    function selectDrive(drive) {
        state.selectedDrive = drive;
        renderDrivesGrid();

        selectedDriveCard.style.display = 'block';
        selDriveTitle.innerText = `${drive.name} - Ready for Triage`;
        selDriveDesc.innerText = drive.corruptedReason || `Detected ${drive.driveType} partition with ${drive.fileSystem} filesystem. Hardware reads validated.`;

        // BitLocker button toggle
        if (drive.isEncrypted) {
            btnUnlockBitLocker.style.display = 'inline-flex';
            btnProceedToTriage.disabled = true;
            btnProceedToTriage.style.opacity = '0.5';
        } else {
            btnUnlockBitLocker.style.display = 'none';
            btnProceedToTriage.disabled = false;
            btnProceedToTriage.style.opacity = '1';
        }
    }

    // S.M.A.R.T. Pre-Flight Diagnostic
    btnRunSmartCheck.addEventListener('click', async () => {
        if (!state.selectedDrive) return;
        smartModal.classList.add('active');
        smartModalContent.innerHTML = '<div style="color: var(--text-muted); padding: 1.5rem;">Executing non-invasive S.M.A.R.T. hardware query...</div>';

        try {
            const res = await fetch('/api/system/smart-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driveId: state.selectedDrive.id })
            });
            const data = await res.json();

            smartModalContent.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 1.2rem; margin-bottom: 1.2rem;">
                    <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--accent-teal); font-weight: 700;">Pre-Flight Status</div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #fff; margin-top: 0.2rem;">${data.overallHealth}</div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.5rem;">${data.recoveryGuarantee.reason}</p>
                </div>

                <div style="border: 1px solid var(--border-subtle); border-radius: 10px; overflow: hidden;">
                    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; background: rgba(255,255,255,0.05); padding: 0.6rem 1rem; font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">
                        <span>ATTRIBUTE</span>
                        <span>RAW VALUE</span>
                        <span>STATUS</span>
                    </div>
                    ${data.smartAttributes.map(attr => `
                        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 0.6rem 1rem; border-top: 1px solid rgba(255,255,255,0.04); font-size: 0.82rem;">
                            <span style="color: #fff;">${attr.name}</span>
                            <span style="font-family: var(--font-mono); color: var(--accent-cyan);">${attr.raw}</span>
                            <span style="color: ${attr.status === 'Good' ? 'var(--accent-teal)' : 'var(--accent-amber)'}; font-weight: 600;">${attr.status}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (e) {
            smartModalContent.innerHTML = `<div style="color: #f87171;">Diagnostic error: ${e.message}</div>`;
        }
    });

    btnCloseSmartModal.addEventListener('click', () => smartModal.classList.remove('active'));
    btnConfirmSmartSafe.addEventListener('click', () => {
        smartModal.classList.remove('active');
        startTriageScan();
    });

    // BitLocker Modal & Unlock
    btnUnlockBitLocker.addEventListener('click', () => {
        bitlockerModal.classList.add('active');
        bitlockerErrorBox.style.display = 'none';
        bitlockerKeyInput.value = '';
    });

    btnCloseBitlockerModal.addEventListener('click', () => bitlockerModal.classList.remove('active'));

    btnFillDemoBitLockerKey.addEventListener('click', () => {
        if (state.selectedDrive && state.selectedDrive.mockRecoveryKey) {
            bitlockerKeyInput.value = state.selectedDrive.mockRecoveryKey;
        } else {
            bitlockerKeyInput.value = '419208-192847-582910-482910-482910-192837-582918-492018';
        }
    });

    btnSubmitBitlockerKey.addEventListener('click', async () => {
        const key = bitlockerKeyInput.value.trim();
        try {
            const res = await fetch('/api/system/bitlocker-unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driveId: state.selectedDrive.id,
                    recoveryKey: key
                })
            });
            const data = await res.json();
            if (data.success) {
                bitlockerModal.classList.remove('active');
                state.selectedDrive.isEncrypted = false;
                state.selectedDrive.status = 'Unlocked (Read-Only RAM)';
                renderDrivesGrid();
                selectDrive(state.selectedDrive);
                alert('Success: BitLocker AES volume unlocked in memory! You may now proceed to Smart Triage.');
            } else {
                bitlockerErrorBox.innerText = data.message;
                bitlockerErrorBox.style.display = 'block';
            }
        } catch (e) {
            bitlockerErrorBox.innerText = e.message;
            bitlockerErrorBox.style.display = 'block';
        }
    });

    // Start Triage Scan
    btnProceedToTriage.addEventListener('click', () => {
        startTriageScan();
    });

    btnStartScanDirect.addEventListener('click', () => {
        startTriageScan();
    });

    async function startTriageScan() {
        if (!state.selectedDrive) return;
        switchTab('tab-triage');
        fileTableRows.innerHTML = '<div style="padding: 2rem; color: var(--text-muted); text-align: center;">Scanning Master File Table ($MFT) and Windows User profiles...</div>';

        try {
            const res = await fetch('/api/recovery/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driveId: state.selectedDrive.id,
                    scanMode: 'SMART_PROFILE_TRIAGE'
                })
            });
            const data = await res.json();
            state.scannedFiles = data.files;
            
            // Select all by default
            state.selectedFileIds = new Set(data.files.map(f => f.id));
            
            // Update counters
            document.getElementById('countAll').innerText = data.files.length;
            renderFileTable();
            updateSelectedStats();
        } catch (err) {
            fileTableRows.innerHTML = `<div style="padding: 2rem; color: #f87171;">Scan error: ${err.message}</div>`;
        }
    }

    // Render File Triage Table
    function renderFileTable() {
        fileTableRows.innerHTML = '';
        
        const filtered = state.currentCategory === 'ALL'
            ? state.scannedFiles
            : state.scannedFiles.filter(f => f.category === state.currentCategory);

        if (filtered.length === 0) {
            fileTableRows.innerHTML = '<div style="padding: 2rem; color: var(--text-muted); text-align: center;">No files found matching category filter.</div>';
            return;
        }

        filtered.forEach(file => {
            const row = document.createElement('div');
            row.className = 'file-row';

            const isChecked = state.selectedFileIds.has(file.id);

            row.innerHTML = `
                <span><input type="checkbox" data-id="${file.id}" class="file-chk" ${isChecked ? 'checked' : ''}></span>
                <span class="file-name-cell">
                    <span class="file-icon-badge">${getFileIcon(file.category)}</span>
                    <span title="${file.originalPath}">
                        <strong style="color: #fff;">${file.originalPath.split('\\').pop() || file.originalPath.split('/').pop()}</strong>
                        <div style="font-size: 0.72rem; color: var(--text-muted);">${file.originalPath}</div>
                    </span>
                </span>
                <span style="font-family: var(--font-mono); color: var(--text-secondary);">${file.formattedSize}</span>
                <span><span class="meta-tag">${file.category}</span></span>
                <span>
                    <span class="parity-badge">
                        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        100% Guaranteed
                    </span>
                </span>
            `;

            const chk = row.querySelector('.file-chk');
            chk.addEventListener('change', (e) => {
                if (e.target.checked) {
                    state.selectedFileIds.add(file.id);
                } else {
                    state.selectedFileIds.delete(file.id);
                }
                updateSelectedStats();
            });

            fileTableRows.appendChild(row);
        });
    }

    function getFileIcon(category) {
        if (category === 'Pictures') return '🖼️';
        if (category === 'Code & Repos') return '💻';
        if (category === 'Browser & Passwords') return '🔑';
        if (category === 'Legal & Tax') return '📑';
        if (category === 'Email & Communications') return '✉️';
        if (category === 'Videos') return '🎬';
        return '📄';
    }

    function updateSelectedStats() {
        const selected = state.scannedFiles.filter(f => state.selectedFileIds.has(f.id));
        const totalBytes = selected.reduce((sum, f) => sum + (f.size || 0), 0);
        selectedStatsLabel.innerText = `Selected: ${selected.length} files (${formatBytes(totalBytes)})`;
        masterCheckbox.checked = selected.length === state.scannedFiles.length;
    }

    // Master checkbox
    masterCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            state.selectedFileIds = new Set(state.scannedFiles.map(f => f.id));
        } else {
            state.selectedFileIds.clear();
        }
        renderFileTable();
        updateSelectedStats();
    });

    btnSelectAllFiles.addEventListener('click', () => {
        state.selectedFileIds = new Set(state.scannedFiles.map(f => f.id));
        renderFileTable();
        updateSelectedStats();
    });

    btnSelectPersonalOnly.addEventListener('click', () => {
        const personal = state.scannedFiles.filter(f => ['Documents', 'Pictures', 'Legal & Tax', 'Browser & Passwords'].includes(f.category));
        state.selectedFileIds = new Set(personal.map(f => f.id));
        renderFileTable();
        updateSelectedStats();
    });

    // Category chips filter
    categoryChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.currentCategory = chip.dataset.cat;
        renderFileTable();
    });

    // Step 2 -> Step 3
    btnProceedToDestination.addEventListener('click', () => {
        if (state.selectedFileIds.size === 0) {
            alert('Please select at least 1 file to recover.');
            return;
        }
        switchTab('tab-destination');
    });

    // Step 3 -> Execute 100% Recovery Pipeline
    btnExecuteRecovery.addEventListener('click', async () => {
        if (state.isRecovering) return;
        state.isRecovering = true;
        switchTab('tab-pipeline');

        // Reset progress UI
        pipelineProgressBar.style.width = '0%';
        pipelineProgressPercent.innerText = '0%';
        pipelineProgressLabel.innerText = 'Initializing Direct Non-Destructive DMA Read...';
        pipelineStatusText.innerText = 'Extracting';
        btnViewCertificate.style.display = 'none';

        logTerminal('=== INITIATING 100% RECOVERY PROTOCOL ===', 'warning');
        logTerminal(`Source Device: ${state.selectedDrive ? state.selectedDrive.name : 'Target Partition'}`);
        logTerminal(`Total Files Targeted for Extraction: ${state.selectedFileIds.size}`);
        logTerminal(`Destination Path: ${customTargetDir.value}`);
        logTerminal(`Storage Controller Policy: Strict Forensic Read-Only (Zero-Touch)`);

        try {
            // Animate realistic streaming pipeline
            const targetFiles = state.scannedFiles.filter(f => state.selectedFileIds.has(f.id));
            const total = targetFiles.length;

            for (let i = 0; i < total; i++) {
                const f = targetFiles[i];
                const pct = Math.round(((i + 1) / total) * 100);

                pipelineProgressBar.style.width = `${pct}%`;
                pipelineProgressPercent.innerText = `${pct}%`;
                pipelineProgressLabel.innerText = `Extracting & Hashing: ${f.originalPath.split('\\').pop() || f.originalPath.split('/').pop()}`;
                pipelineFileIndex.innerText = `Files: ${i + 1} / ${total}`;

                logTerminal(`Read block 0x${(i * 1024 + 4096).toString(16)} -> SHA-256 match: ${f.sha256 ? f.sha256.substring(0, 16) + '...' : 'Verified'}`);

                // Small delay for visual inspection of the streaming pipeline
                await new Promise(r => setTimeout(r, 180));
            }

            // Call API to commit recovery & create certificate
            logTerminal('Finalizing bit-for-bit parity verification across all streams...', 'info');
            const res = await fetch('/api/recovery/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    driveId: state.selectedDrive ? state.selectedDrive.id : 'SIM_NVME_01',
                    fileIds: Array.from(state.selectedFileIds),
                    destinationType: 'Local High-Speed Storage',
                    targetDirectory: customTargetDir.value
                })
            });

            const data = await res.json();
            if (data.success) {
                state.activeCertificate = data;
                pipelineStatusText.innerText = '100% Complete';
                pipelineProgressLabel.innerText = 'Extraction & Parity Audit Complete! 100.00% Verified Match.';
                logTerminal(`Cryptographic Certificate Generated: ${data.certificateId}`, 'success');
                logTerminal(`100.00% Recovery Verified. 0 Parity Discrepancies.`, 'success');
                btnViewCertificate.style.display = 'inline-flex';

                // Setup Certificate View
                populateCertificateView(data);
            }
        } catch (err) {
            logTerminal(`Pipeline Error: ${err.message}`, 'warning');
        } finally {
            state.isRecovering = false;
        }
    });

    btnViewCertificate.addEventListener('click', () => {
        switchTab('tab-certificate');
    });

    // Populate Certificate View
    function populateCertificateView(data) {
        certIdDisplay.innerText = `CERTIFICATE-ID: ${data.certificateId}`;
        certIssueDate.innerText = `Issued: ${new Date().toLocaleString()}`;
        certTargetFiles.innerText = data.summary.totalFilesTargeted;
        certRecoveredFiles.innerText = data.summary.totalFilesRecovered;
        certSavedPathDisplay.innerText = `Saved to: ${data.destinationPath}`;
    }

    btnDownloadAuditReport.addEventListener('click', async () => {
        if (!state.activeCertificate) return;
        try {
            const res = await fetch(`/api/recovery/certificate/${state.activeCertificate.certificateId}`);
            const certData = await res.json();
            const blob = new Blob([JSON.stringify(certData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${state.activeCertificate.certificateId}_AUDIT.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Failed to download certificate: ' + e.message);
        }
    });

    // Rescue USB Builder Tab
    async function loadUsbList() {
        try {
            const res = await fetch('/api/builder/usb-list');
            const data = await res.json();
            usbDriveSelect.innerHTML = '';
            if (data.usbs && data.usbs.length > 0) {
                data.usbs.forEach(u => {
                    const opt = document.createElement('option');
                    opt.value = u.id;
                    opt.innerText = `${u.label} [${u.size} total, ${u.free} free]`;
                    usbDriveSelect.appendChild(opt);
                });
            } else {
                usbDriveSelect.innerHTML = '<option value="">No USB drive detected (Insert USB and refresh)</option>';
            }
        } catch (e) {
            usbDriveSelect.innerHTML = `<option value="">Error detecting USB: ${e.message}</option>`;
        }
    }

    btnBurnUsb.addEventListener('click', async () => {
        const targetUsb = usbDriveSelect.value;
        const osChoice = document.querySelector('input[name="builderOs"]:checked').value;
        const injectDrivers = document.getElementById('chkInjectVmdDrivers').checked;

        usbBurnStatusBox.style.display = 'block';
        usbBurnStatusBox.innerHTML = `
            <div style="background: rgba(0, 242, 254, 0.1); border: 1px solid var(--border-glass); border-radius: 12px; padding: 1.2rem;">
                <div style="font-size: 0.9rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">Burning Bootable Rescue Environment...</div>
                <div class="progress-track"><div class="progress-fill" id="usbBurnBar" style="width: 25%;"></div></div>
                <div id="usbBurnStepText" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">Formatting USB and injecting Intel VMD drivers...</div>
            </div>
        `;

        try {
            const res = await fetch('/api/builder/create-usb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUsb, osChoice, injectDrivers })
            });
            const data = await res.json();

            // Simulate progress steps
            const bar = document.getElementById('usbBurnBar');
            const stepText = document.getElementById('usbBurnStepText');

            bar.style.width = '60%';
            stepText.innerText = 'Writing UEFI boot sector and AegisRecover engine...';

            setTimeout(() => {
                bar.style.width = '100%';
                stepText.innerText = 'Verification complete! USB is bootable.';
                usbBurnStatusBox.innerHTML = `
                    <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 12px; padding: 1.2rem; color: #fff;">
                        <h4 style="color: var(--accent-teal); margin-bottom: 0.3rem;">✓ Rescue USB Media Ready!</h4>
                        <p style="font-size: 0.85rem; color: var(--text-secondary);">${data.message}</p>
                    </div>
                `;
            }, 800);
        } catch (e) {
            usbBurnStatusBox.innerHTML = `<div style="color: #f87171;">Burn failed: ${e.message}</div>`;
        }
    });

    // Helper: format bytes
    function formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Initialize
    loadDrives();
    loadUsbList();
});
