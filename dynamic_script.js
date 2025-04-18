// dynamic_script.js
(function() {
    'use strict';

    // --- DOM Cache ---
    const canvas = document.getElementById('background-canvas');
    const ctx = canvas.getContext('2d');
    const mainHeading = document.getElementById('main-heading');
    const systemStatusEl = document.getElementById('system-status');
    const securityLevelEl = document.getElementById('security-level');
    const systemActionEl = document.getElementById('system-action');
    const logOutput = document.getElementById('log-output');
    const hackerProgressContainer = document.getElementById('hacker-progress-container');
    const hackerProgressBar = document.getElementById('hacker-progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');
    const finalStageArea = document.getElementById('final-stage-area'); // Đổi tên ID
    const countdownTimerEl = document.getElementById('countdown-timer');
    const promiseButton = document.getElementById('promise-button');
    const fullscreenBtn = document.getElementById('fullscreen-btn'); // Nút fullscreen thủ công
    const container = document.querySelector('.container');
    const root = document.documentElement;

    // --- State & Configuration ---
    let lastTimestamp = 0;
    let animationFrameId = null;
    let glitchIntensity = 0;
    let currentSystemStage = 0;
    let lockdownProgress = 0;
    const typingSpeed = 60; // Nhanh hơn chút
    let currentActionText = "";
    let actionQueue = [];
    let finalCountdownValue = 10; // Đếm ngược 10 giây
    let countdownIntervalId = null;
    let isFinalStageReached = false;

    // --- Hacker Progress Bar Config ---
    const progressBarWidth = 45; // Giảm chiều rộng chút
    const progressCharFull = '■'; // Ký tự khối vuông
    const progressCharEmpty = '□'; // Ký tự rỗng

    // --- Simulation Stages (Tập trung vào Geo) ---
    const stages = [
        { status: "UNAUTHORIZED", level: "ALERT", action: "Geo-location check FAILED...", colorClass: "status-warning", glitch: 0.1, duration: 2500 },
        { status: "ACCESS_DENIED", level: "HIGH", action: "User refused location. Security risk detected...", colorClass: "status-warning", glitch: 0.2, duration: 3500 },
        { status: "CONTAINMENT_FIELD", level: "CRITICAL", action: "Engaging system lockdown...", colorClass: "status-critical", glitch: 0.5, duration: 6000 }, // Stage này chạy progress bar
        { status: "SYSTEM_LOCKED", level: "MAXIMUM", action: "Compliance required for unlock.", colorClass: "status-critical", glitch: 0.1, duration: Infinity } // Stage cuối, chờ countdown
    ];

    // --- Canvas Binary Rain (Giữ nguyên logic) ---
    let fontSize = 14; // Nhỏ hơn
    let columns; let drops = [];
    function setupBinaryRain() { /* ... (Giữ nguyên) ... */
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        columns = Math.floor(canvas.width / fontSize);
        drops = [];
        for (let i = 0; i < columns; i++) {
            drops[i] = 1 + Math.random() * canvas.height;
        }
         console.log("Binary rain setup complete."); // Debug
    }
    function drawBinaryRain() { /* ... (Giữ nguyên, chỉ thay đổi màu fillStyle nếu cần) ... */
         ctx.fillStyle = 'rgba(3, 3, 3, 0.06)'; // Nền mờ hơn
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = getComputedStyle(root).getPropertyValue('--color-accent').trim() || '#00b336'; // Lấy màu từ CSS
        ctx.font = `${fontSize}px monospace`;
         for (let i = 0; i < drops.length; i++) {
            const text = Math.random() > 0.5 ? '1' : '0';
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    // --- Logging (Thêm level rõ hơn) ---
    function logMessage(message, level = 'INFO') {
        const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
        const logEntry = document.createElement('div');
        let prefix = '[INFO]';
        if (level === 'WARN') prefix = '[WARN]';
        else if (level === 'ERROR') prefix = '[CRITICAL]'; // Rõ hơn

        logEntry.textContent = `[${timestamp}] ${prefix} ${message}`;
        logOutput.appendChild(logEntry);
        logOutput.scrollTop = logOutput.scrollHeight;
        if (logOutput.children.length > 100) {
            logOutput.removeChild(logOutput.firstElementChild);
        }
    }

    // --- Typing Effect (Giữ nguyên) ---
    let typeTimeout; function typeWriter(text, element, callback) { /* ... (Giữ nguyên) ... */
        let i = 0; clearTimeout(typeTimeout); element.textContent = '';
        element.classList.add('typing-effect');
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i); i++;
                typeTimeout = setTimeout(type, typingSpeed * (Math.random() * 0.5 + 0.75));
            } else { if (callback) callback(); }
        } type();
    }
    function processActionQueue() { /* ... (Giữ nguyên) ... */
        if (actionQueue.length > 0) { const nextAction = actionQueue.shift(); typeWriter(nextAction, systemActionEl, processActionQueue); }
    }
    function addActionToActionQueue(actionText) { /* ... (Giữ nguyên) ... */
        actionQueue.push(actionText); if (!systemActionEl.textContent || systemActionEl.textContent === currentActionText) { processActionQueue(); } currentActionText = actionText;
    }

    // --- Glitch Effect (Giữ nguyên) ---
    function applyGlitch(targetElement) { /* ... (Giữ nguyên) ... */
        const shouldGlitch = Math.random() < glitchIntensity;
        if (shouldGlitch && !targetElement.classList.contains('glitch-active')) {
            targetElement.setAttribute('data-text', targetElement.textContent);
            targetElement.classList.add('glitch-active');
            setTimeout(() => { targetElement.classList.remove('glitch-active'); }, Math.random() * 80 + 40); // Ngắn hơn
        } else if (!shouldGlitch && targetElement.classList.contains('glitch-active')) {
             targetElement.classList.remove('glitch-active');
        }
    }

    // --- Hacker Progress Bar Update ---
    function updateHackerProgress(progress) {
        // **Đảm bảo container được hiển thị khi progress > 0**
        if (progress > 0 && hackerProgressContainer.classList.contains('hidden')) {
            console.log("Showing Progress Bar Container"); // Debug
            hackerProgressContainer.classList.remove('hidden');
            hackerProgressContainer.classList.add('visible'); // Thêm class visible nếu dùng opacity
        } else if (progress <= 0 && !hackerProgressContainer.classList.contains('hidden')) {
            console.log("Hiding Progress Bar Container"); // Debug
             hackerProgressContainer.classList.add('hidden');
             hackerProgressContainer.classList.remove('visible');
        }


        const filledCount = Math.round((progress / 100) * progressBarWidth);
        const emptyCount = progressBarWidth - filledCount;
        const filledStr = progressCharFull.repeat(filledCount);
        const emptyStr = progressCharEmpty.repeat(emptyCount);
        let displayStr = filledStr;

        // Hiệu ứng nháy ở cuối thanh progress
        if (filledCount < progressBarWidth && filledCount > 0 && Math.random() > 0.5) {
            displayStr = filledStr.slice(0, -1) + (Math.random() < 0.6 ? progressCharEmpty : progressCharFull);
        }

        hackerProgressBar.innerHTML = `${displayStr}<span>${emptyStr}</span>`;
        progressPercentage.textContent = `${Math.round(progress)}%`;
    }


    // --- Update UI based on Stage ---
    function updateUIForStage(stageIndex) {
        const stage = stages[stageIndex];
        if (!stage) {
            console.error("Invalid stage index:", stageIndex);
            return;
        }
        console.log(`Updating UI for Stage ${stageIndex}: ${stage.status}`); // Debug

        logMessage(`Stage ${stageIndex + 1}/${stages.length}: ${stage.status}`, stageIndex >= 2 ? 'ERROR' : 'WARN');

        systemStatusEl.textContent = stage.status;
        securityLevelEl.textContent = stage.level;
        addActionToActionQueue(stage.action);

        systemStatusEl.className = `value ${stage.colorClass}`;
        securityLevelEl.className = `value ${stage.colorClass}`;

        glitchIntensity = stage.glitch;
        root.style.setProperty('--glitch-intensity', glitchIntensity);

        // --- Kích hoạt Countdown & Nút bấm khi đến stage CUỐI CÙNG ---
        if (stageIndex === stages.length - 1 && !isFinalStageReached) {
            console.log("Final stage reached, starting countdown trigger."); // Debug
            isFinalStageReached = true; // Đánh dấu đã đến stage cuối
            logMessage("Final Stage Reached. Compliance window initiating...", "ERROR");
            // **Đảm bảo progress bar ở 100% khi vào stage cuối**
             updateHackerProgress(100);
             hackerProgressContainer.classList.remove('hidden'); // Đảm bảo hiện progress bar
             hackerProgressContainer.classList.add('visible');

            // Bắt đầu đếm ngược SAU một khoảng trễ ngắn để người dùng đọc action
            setTimeout(startFinalCountdown, 2000); // Delay 2 giây
        }
    }

    // --- Final Countdown Logic ---
    function startFinalCountdown() {
        console.log("Starting Final Countdown Sequence."); // Debug
        if (!finalStageArea) { console.error("Final Stage Area not found!"); return; }

        finalStageArea.classList.remove('hidden');
        finalStageArea.classList.add('visible'); // Hiển thị khu vực
        finalCountdownValue = 10; // Reset giá trị đếm ngược
        countdownTimerEl.textContent = `[ COMPLIANCE WINDOW: ${finalCountdownValue}s ]`; // Text đếm ngược
        countdownTimerEl.style.animation = 'none'; // Reset animation cũ (nếu có)
        promiseButton.classList.add('hidden'); // Đảm bảo nút ẩn ban đầu
        promiseButton.classList.remove('visible');

        clearInterval(countdownIntervalId); // Xóa interval cũ
        countdownIntervalId = setInterval(() => {
            finalCountdownValue--;
            countdownTimerEl.textContent = `[ COMPLIANCE WINDOW: ${finalCountdownValue}s ]`;

            // Hiệu ứng đỏ nhấp nháy khi gần hết giờ
            if (finalCountdownValue <= 5 && finalCountdownValue > 0) {
                 countdownTimerEl.style.animation = 'pulseRed 0.7s infinite';
            } else {
                 countdownTimerEl.style.animation = 'none';
            }

            if (finalCountdownValue <= 0) {
                console.log("Countdown finished."); // Debug
                clearInterval(countdownIntervalId);
                countdownTimerEl.textContent = "[ ACTION REQUIRED ]";
                countdownTimerEl.style.color = 'var(--color-secondary)'; // Đổi màu vàng
                promiseButton.classList.remove('hidden'); // **HIỆN NÚT**
                promiseButton.classList.add('visible');
                console.log("Promise button should be visible now."); // Debug
                logMessage("User action required. Select compliance option.", "WARN");
            }
        }, 1000);
    }
     // Đảm bảo có keyframes pulseRed (giữ nguyên từ trước)
    try { document.styleSheets[0].insertRule(`@keyframes pulseRed{0%,100%{color:var(--color-primary);transform:scale(1)}50%{color:#ff6a6a;transform:scale(1.03)}}`, document.styleSheets[0].cssRules.length); } catch(e) {}


    // --- Update Lockdown Progress ---
    function updateLockdown(deltaTime) {
        // Chỉ chạy progress bar ở stage 2 (index=2)
        if (currentSystemStage === 2 && lockdownProgress < 100) {
            lockdownProgress += deltaTime * 0.020; // Tốc độ khóa (2%/s)
            lockdownProgress = Math.min(100, lockdownProgress);
            updateHackerProgress(lockdownProgress);

            if (lockdownProgress >= 100) {
                 logMessage("System lockdown procedures complete.", "WARN");
                 // Stage sẽ tự chuyển sau duration của stage 2
            }
        }
        // **Reset progress bar nếu chưa đến stage 2**
         else if (currentSystemStage < 2 && lockdownProgress > 0) {
             lockdownProgress = 0;
             updateHackerProgress(lockdownProgress);
             // Ẩn lại progress bar nếu cần
             if (!hackerProgressContainer.classList.contains('hidden')) {
                  hackerProgressContainer.classList.add('hidden');
                  hackerProgressContainer.classList.remove('visible');
             }
        }
        // **Giữ progress bar ở 100% ở stage cuối cùng**
         else if (currentSystemStage > 2 && lockdownProgress < 100) {
             lockdownProgress = 100;
             updateHackerProgress(lockdownProgress);
              if (hackerProgressContainer.classList.contains('hidden')) {
                  hackerProgressContainer.classList.remove('hidden');
                  hackerProgressContainer.classList.add('visible');
             }
         }
    }


    // --- Main Loop ---
    function mainLoop(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const deltaTime = timestamp - lastTimestamp;

        drawBinaryRain();
        updateLockdown(deltaTime); // Cập nhật progress bar

        if (glitchIntensity > 0) {
            if (!mainHeading.classList.contains('glitch-target')) mainHeading.classList.add('glitch-target'); // Thêm class nếu chưa có
            applyGlitch(mainHeading);
        } else {
             mainHeading.classList.remove('glitch-target', 'glitch-active');
        }

        lastTimestamp = timestamp;
        animationFrameId = requestAnimationFrame(mainLoop);
    }

    // --- Attempt Fullscreen ---
    function requestBrowserFullscreen() {
         console.log("Attempting to enter fullscreen..."); // Debug
         const element = document.documentElement; // Fullscreen toàn bộ trang
         if (element.requestFullscreen) {
             element.requestFullscreen().catch(err => {
                 logMessage(`Fullscreen request failed: ${err.message}. Manual activation required.`, 'WARN');
                 console.warn('Fullscreen request failed:', err);
                 // Hiện nút fullscreen thủ công nếu tự động thất bại
                 if(fullscreenBtn) fullscreenBtn.style.display = 'block';
             });
         } else if (element.mozRequestFullScreen) { /* Firefox */
             element.mozRequestFullScreen().catch(err => { console.warn('Fullscreen request failed:', err); if(fullscreenBtn) fullscreenBtn.style.display = 'block';});
         } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
             element.webkitRequestFullscreen().catch(err => { console.warn('Fullscreen request failed:', err); if(fullscreenBtn) fullscreenBtn.style.display = 'block';});
         } else if (element.msRequestFullscreen) { /* IE/Edge */
             element.msRequestFullscreen().catch(err => { console.warn('Fullscreen request failed:', err); if(fullscreenBtn) fullscreenBtn.style.display = 'block';});
         } else {
              logMessage("Fullscreen API not supported by this browser.", "WARN");
              if(fullscreenBtn) fullscreenBtn.style.display = 'block';
         }
    }

    // --- Initialization ---
    function initialize() {
        setupBinaryRain();
        window.addEventListener('resize', setupBinaryRain);

        logMessage("Initializing Security Interface...");
        logMessage("Attempting Geolocation Verification...");
        updateHackerProgress(0); // Đảm bảo progress bar reset ban đầu
        hackerProgressContainer.classList.add('hidden'); // Đảm bảo progress bar ẩn ban đầu
        finalStageArea.classList.add('hidden'); // Đảm bảo khu vực cuối ẩn ban đầu
        promiseButton.classList.add('hidden'); // Đảm bảo nút ẩn ban đầu

        // **Thử vào fullscreen sau 1 chút delay**
        setTimeout(requestBrowserFullscreen, 500);

        setTimeout(() => {
            logMessage("Geolocation DENIED by user protocol. Initiating countermeasures.", "ERROR");
            updateUIForStage(currentSystemStage); // Bắt đầu stage 0
            scheduleNextStage();
        }, 2000); // Tăng delay để dễ theo dõi

        // Event Listener cho nút "Hứa"
        promiseButton.addEventListener('click', () => {
            logMessage("User Compliance Detected. Reversing lockdown...", "INFO");
            promiseButton.textContent = "REDIRECTING...";
            promiseButton.disabled = true;
             promiseButton.style.cursor = 'wait';
             // Ngừng các hiệu ứng động khác nếu muốn
             // cancelAnimationFrame(animationFrameId);
             // clearInterval(countdownIntervalId);
            setTimeout(() => {
                 window.location.href = 'error.html'; // Điều hướng
            }, 700);
        });

        // Event Listener cho nút Fullscreen thủ công
         if (fullscreenBtn) {
             fullscreenBtn.style.display = 'none'; // Ẩn ban đầu, chỉ hiện nếu auto fail
             fullscreenBtn.addEventListener('click', requestBrowserFullscreen);
         }


        animationFrameId = requestAnimationFrame(mainLoop);
        console.log("Initialization complete. Main loop started."); // Debug
    }

    // --- Stage Scheduling ---
    function scheduleNextStage() {
        const currentStageData = stages[currentSystemStage];
        if (currentStageData && currentStageData.duration !== Infinity) {
            console.log(`Scheduling next stage after ${currentStageData.duration}ms`); // Debug
            setTimeout(() => {
                if (currentSystemStage < stages.length - 1) {
                    currentSystemStage++;
                    console.log(`Moving to Stage ${currentSystemStage}`); // Debug
                    // Reset progress bar KHI BẮT ĐẦU stage 2
                    if (currentSystemStage === 2) {
                        lockdownProgress = 0;
                        updateHackerProgress(lockdownProgress);
                    }
                    updateUIForStage(currentSystemStage);
                    scheduleNextStage();
                } else {
                     console.log("Already at the final stage."); // Debug
                }
            }, currentStageData.duration);
        } else {
             console.log(`Reached final stage (${currentSystemStage}) or stage has infinite duration.`); // Debug
        }
    }

    // --- Start ---
    initialize();

})();