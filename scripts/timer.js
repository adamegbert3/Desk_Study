const STORAGE_KEY = "deskStudyTimerStateV1";
const SOUND_PREF_KEY = "deskStudyTimerSoundEnabledV1";
const TIMER_INTRO_SEEN_KEY = "deskStudyTimerIntroSeenV1";
const QUICK_TEST_DURATION_MS = 10 * 1000;

let timer = null;
let currentMode = "focus";
let durationMs = 25 * 60 * 1000;
let remainingMs = durationMs;
let endsAt = null;
let isRunning = false;
let soundEnabled = true;
let soundPrimed = false;
let intervalActive = false;
let intervalTotalCycles = 4;
let intervalRemainingCycles = 0;

const modeDurations = {
    focus: 25,
    short: 5,
    long: 15
};

const modeLabels = {
    focus: "Focus",
    short: "Break",
    long: "Long Break"
};

const timeDisplay = document.getElementById("time");
const timerToggleBtn = document.getElementById("timerToggleBtn");
const circle = document.querySelector(".progress-ring__circle");
const circumference = 2 * Math.PI * 110;
const modeInputs = {
    focus: document.getElementById("focusMinutes"),
    short: document.getElementById("shortMinutes"),
    long: document.getElementById("longMinutes")
};
const modeButtons = {
    focus: document.getElementById("focusBtn"),
    short: document.getElementById("shortBtn"),
    long: document.getElementById("longBtn")
};
const timerIntroModal = document.getElementById("timerIntroModal");
const timerIntroBackdrop = document.getElementById("timerIntroBackdrop");
const closeTimerIntroBtn = document.getElementById("closeTimerIntroBtn");
const timerHelpBtn = document.getElementById("timerHelpBtn");
const timerSoundToggleBtn = document.getElementById("timerSoundToggleBtn");
const intervalBtn = document.getElementById("intervalBtn");
const intervalCyclesInput = document.getElementById("intervalCycles");
const intervalStatus = document.getElementById("intervalStatus");
const timerLayout = document.getElementById("timerLayout");
const timerControls = document.getElementById("timerControls");
const settingsToggleBtn = document.getElementById("settingsToggleBtn");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const controlsBackdrop = document.getElementById("controlsBackdrop");
const mobileSidebarMediaQuery = window.matchMedia("(max-width: 768px)");
const presets = {
    classic: { focus: 25, short: 5, long: 15 },
    deepWork: { focus: 50, short: 10, long: 20 },
    lightStart: { focus: 15, short: 3, long: 10 }
};
const completionSound = new Audio("tunes_files/om.mp3");

circle.style.strokeDasharray = circumference;
completionSound.preload = "auto";
completionSound.volume = 0.85;

function getModeDurationMs(mode) {
    return modeDurations[mode] * 60 * 1000;
}

function getRemainingMs() {
    if (!isRunning || !endsAt) {
        return remainingMs;
    }

    return Math.max(0, endsAt - Date.now());
}

function startTicking() {
    if (timer) {
        return;
    }

    timer = setInterval(tick, 1000);
}

function stopTicking() {
    clearInterval(timer);
    timer = null;
}

function saveState() {
    const snapshot = {
        currentMode,
        modeDurations,
        durationMs,
        remainingMs: getRemainingMs(),
        endsAt,
        isRunning,
        intervalActive,
        intervalTotalCycles,
        intervalRemainingCycles
    };
    if (window.dataStore && typeof window.dataStore.saveTimerState === "function") {
        void window.dataStore.saveTimerState(snapshot);
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    }
}

async function loadState() {
    let state = null;
    if (window.dataStore && typeof window.dataStore.loadTimerState === "function") {
        state = await window.dataStore.loadTimerState();
    } else {
        const rawState = localStorage.getItem(STORAGE_KEY);
        if (rawState) {
            try {
                state = JSON.parse(rawState);
            } catch {
                state = null;
            }
        }
    }

    if (!state) {
        return false;
    }

    if (state.modeDurations && typeof state.modeDurations === "object") {
        Object.keys(modeDurations).forEach((mode) => {
            const parsed = Number.parseInt(state.modeDurations[mode], 10);
            if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 180) {
                modeDurations[mode] = parsed;
            }
        });
    }

    if (Object.prototype.hasOwnProperty.call(modeDurations, state.currentMode)) {
        currentMode = state.currentMode;
    }

    durationMs = Number.isFinite(state.durationMs) && state.durationMs > 0
        ? state.durationMs
        : getModeDurationMs(currentMode);

    remainingMs = Number.isFinite(state.remainingMs) && state.remainingMs >= 0
        ? state.remainingMs
        : durationMs;

    endsAt = Number.isFinite(state.endsAt) ? state.endsAt : null;
    isRunning = Boolean(state.isRunning);

    if (isRunning && endsAt) {
        remainingMs = Math.max(0, endsAt - Date.now());
        if (remainingMs === 0) {
            isRunning = false;
            endsAt = null;
        }
    } else {
        isRunning = false;
        endsAt = null;
    }

    remainingMs = Math.min(remainingMs, durationMs);

    if (typeof state.intervalActive === "boolean") {
        intervalActive = state.intervalActive;
    }

    if (Number.isFinite(state.intervalTotalCycles) && state.intervalTotalCycles >= 1) {
        intervalTotalCycles = Math.min(Math.max(Number.parseInt(state.intervalTotalCycles, 10), 1), 12);
    }

    if (Number.isFinite(state.intervalRemainingCycles) && state.intervalRemainingCycles >= 0) {
        intervalRemainingCycles = Math.min(Math.max(Number.parseInt(state.intervalRemainingCycles, 10), 0), intervalTotalCycles);
    }

    if (intervalActive && intervalBtn) {
        intervalBtn.textContent = "Stop Interval";
    } else if (intervalBtn) {
        intervalBtn.textContent = "Start Interval";
    }

    return true;
}

function syncInputsFromDurations() {
    Object.keys(modeInputs).forEach((mode) => {
        modeInputs[mode].value = modeDurations[mode];
    });
}

function syncIntervalInputs() {
    if (intervalCyclesInput) {
        intervalCyclesInput.value = String(intervalTotalCycles);
    }
}

function setMode(mode) {
    if (!Object.prototype.hasOwnProperty.call(modeDurations, mode)) {
        return;
    }

    currentMode = mode;
    durationMs = getModeDurationMs(mode);
    remainingMs = durationMs;
    endsAt = null;
    isRunning = false;

    stopTicking();
    render();
    saveState();
}

function stopInterval() {
    intervalActive = false;
    intervalRemainingCycles = 0;
    if (intervalBtn) {
        intervalBtn.textContent = "Start Interval";
    }
}

function startInterval() {
    let raw = Number.parseInt(intervalCyclesInput?.value, 10);
    if (Number.isNaN(raw) || raw < 1) {
        raw = 4;
    }
    intervalTotalCycles = Math.min(Math.max(raw, 1), 12);
    intervalRemainingCycles = intervalTotalCycles;
    intervalActive = true;

    if (intervalBtn) {
        intervalBtn.textContent = "Stop Interval";
    }

    setMode("focus");
    startTimer();
}

function toggleInterval() {
    if (!intervalActive) {
        startInterval();
    } else {
        stopInterval();
        pauseTimer();
    }
}

function applyPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) {
        return;
    }

    Object.keys(modeDurations).forEach((mode) => {
        modeDurations[mode] = preset[mode];
    });

    syncInputsFromDurations();
    updateModeUI();

    durationMs = getModeDurationMs(currentMode);
    remainingMs = durationMs;
    endsAt = null;
    isRunning = false;
    stopTicking();

    render();
    saveState();
}

function setQuickTestDuration() {
    durationMs = QUICK_TEST_DURATION_MS;
    remainingMs = QUICK_TEST_DURATION_MS;
    endsAt = null;
    isRunning = false;
    stopTicking();
    render();
    saveState();
}

function loadSoundPreference() {
    // Async version is used during initialize().
    return true;
}

async function loadSoundPreferenceAsync() {
    if (window.dataStore && typeof window.dataStore.loadTimerSoundPref === "function") {
        const value = await window.dataStore.loadTimerSoundPref();
        if (value === null) return true;
        return Boolean(value);
    }
    const stored = localStorage.getItem(SOUND_PREF_KEY);
    if (stored === null) {
        return true;
    }
    return stored === "true";
}

function saveSoundPreference() {
    if (window.dataStore && typeof window.dataStore.saveTimerSoundPref === "function") {
        void window.dataStore.saveTimerSoundPref(soundEnabled);
    } else {
        localStorage.setItem(SOUND_PREF_KEY, `${soundEnabled}`);
    }
}

function updateSoundToggleUI() {
    if (!timerSoundToggleBtn) {
        return;
    }

    timerSoundToggleBtn.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    updateSoundToggleUI();
    saveSoundPreference();
}

function primeCompletionSound() {
    if (soundPrimed) {
        return;
    }

    const playAttempt = completionSound.play();
    if (playAttempt && typeof playAttempt.then === "function") {
        playAttempt
            .then(() => {
                completionSound.pause();
                completionSound.currentTime = 0;
                soundPrimed = true;
            })
            .catch(() => {
                // Ignore autoplay restrictions; we'll try again on completion.
            });
    }
}

function playCompletionSound() {
    if (!soundEnabled) {
        return;
    }

    completionSound.currentTime = 0;
    const playAttempt = completionSound.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
        playAttempt.catch(() => {
            // Best effort only; notifications/alerts still communicate completion.
        });
    }
}

function startTimer() {
    if (isRunning) {
        return;
    }

    if (remainingMs <= 0) {
        remainingMs = durationMs;
    }

    primeCompletionSound();
    endsAt = Date.now() + remainingMs;
    isRunning = true;
    startTicking();
    render();
    saveState();
}

function pauseTimer() {
    remainingMs = getRemainingMs();
    endsAt = null;
    isRunning = false;
    stopTicking();
    render();
    saveState();
}

function toggleTimer() {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function updateModeUI() {
    Object.keys(modeDurations).forEach((mode) => {
        modeButtons[mode].textContent = modeLabels[mode];
    });
}

function updateActiveModeUI() {
    Object.keys(modeButtons).forEach((mode) => {
        modeButtons[mode].classList.toggle("active-mode", mode === currentMode);
    });
}

function handleDurationChange(mode) {
    const rawValue = Number.parseInt(modeInputs[mode].value, 10);
    if (Number.isNaN(rawValue) || rawValue < 1) {
        modeInputs[mode].value = modeDurations[mode];
        return;
    }

    const clampedValue = Math.min(rawValue, 180);
    modeDurations[mode] = clampedValue;
    modeInputs[mode].value = clampedValue;
    updateModeUI();

    if (mode === currentMode) {
        durationMs = getModeDurationMs(mode);
        remainingMs = durationMs;
        endsAt = null;
        isRunning = false;
        stopTicking();
    }

    render();
    saveState();
}

Object.keys(modeInputs).forEach((mode) => {
    modeInputs[mode].addEventListener("change", () => handleDurationChange(mode));
});

function updateDisplayFromMs() {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateRingFromMs() {
    const safeDuration = Math.max(durationMs, 1);
    const offset = circumference - (remainingMs / safeDuration) * circumference;
    circle.style.strokeDashoffset = offset;
}

function updateToggleButton() {
    timerToggleBtn.textContent = isRunning ? "Pause" : "Start";
    timerToggleBtn.classList.toggle("is-running", isRunning);
}

function updateIntervalStatusUI() {
    if (!intervalStatus) {
        return;
    }

    if (!intervalActive) {
        intervalStatus.textContent = "";
        return;
    }

    const currentCycle = intervalTotalCycles - intervalRemainingCycles + 1;
    const cycleLabel = Math.max(1, Math.min(currentCycle, intervalTotalCycles));
    intervalStatus.textContent = `Interval ${cycleLabel}/${intervalTotalCycles} • ${modeLabels[currentMode]}`;
}

function render() {
    updateDisplayFromMs();
    updateRingFromMs();
    updateToggleButton();
    updateActiveModeUI();
    updateIntervalStatusUI();
}

function tick() {
    remainingMs = getRemainingMs();

    if (remainingMs <= 0) {
        const completedEndsAt = endsAt || Date.now();
        remainingMs = 0;
        endsAt = null;
        isRunning = false;
        stopTicking();
        render();
        saveState();
        let completionHandled = false;
        if (window.deskStudyTimerNotifier && typeof window.deskStudyTimerNotifier.handleCompletion === "function") {
            completionHandled = window.deskStudyTimerNotifier.handleCompletion({
                mode: currentMode,
                endsAt: completedEndsAt,
                fallbackToAlert: true
            });
        } else {
            alert("Session complete!");
            completionHandled = true;
        }

        if (completionHandled) {
            playCompletionSound();
        }

        if (intervalActive) {
            if (currentMode === "focus") {
                setMode("short");
                startTimer();
                return;
            }

            if (currentMode === "short") {
                intervalRemainingCycles = Math.max(0, intervalRemainingCycles - 1);

                if (intervalRemainingCycles > 0) {
                    setMode("focus");
                    startTimer();
                    return;
                }

                setMode("long");
                startTimer();
                stopInterval();
                return;
            }

            if (currentMode === "long") {
                stopInterval();
                return;
            }
        }

        return;
    }

    render();
    saveState();
}

async function initialize() {
    const loaded = await loadState();
    if (!loaded) {
        currentMode = "focus";
        durationMs = getModeDurationMs(currentMode);
        remainingMs = durationMs;
    }

    updateModeUI();
    syncInputsFromDurations();
    syncIntervalInputs();
    soundEnabled = await loadSoundPreferenceAsync();
    updateSoundToggleUI();
    render();

    if (isRunning) {
        startTicking();
    }

    if (localStorage.getItem(TIMER_INTRO_SEEN_KEY) !== "true") {
        openTimerIntro();
        localStorage.setItem(TIMER_INTRO_SEEN_KEY, "true");
    }
}

function openTimerIntro() {
    if (!timerIntroModal) {
        return;
    }

    timerIntroModal.hidden = false;
}

function closeTimerIntro() {
    if (!timerIntroModal) {
        return;
    }

    timerIntroModal.hidden = true;
}

function isMobileSidebarLayout() {
    return mobileSidebarMediaQuery.matches;
}

function updateSidebarButtonUI(isOpen) {
    if (!settingsToggleBtn) {
        return;
    }

    settingsToggleBtn.setAttribute("aria-expanded", `${isOpen}`);
}

function syncSidebarBackdrop(isOpen) {
    if (!controlsBackdrop) {
        return;
    }

    controlsBackdrop.hidden = !(isOpen && isMobileSidebarLayout());
}

function isSidebarOpen() {
    if (!timerLayout) {
        return false;
    }

    if (isMobileSidebarLayout()) {
        return timerLayout.classList.contains("sidebar-open");
    }

    return !timerLayout.classList.contains("sidebar-collapsed");
}

function setSidebarOpenState(isOpen) {
    if (!timerLayout) {
        return;
    }

    if (isMobileSidebarLayout()) {
        timerLayout.classList.toggle("sidebar-open", isOpen);
        timerLayout.classList.remove("sidebar-collapsed");
    } else {
        timerLayout.classList.toggle("sidebar-collapsed", !isOpen);
        timerLayout.classList.remove("sidebar-open");
    }

    updateSidebarButtonUI(isOpen);
    syncSidebarBackdrop(isOpen);
}

function toggleSidebar() {
    setSidebarOpenState(!isSidebarOpen());
}

function handleViewportSidebarState() {
    setSidebarOpenState(!isMobileSidebarLayout());
}

window.addEventListener("beforeunload", saveState);
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        if (isRunning) {
            tick();
            return;
        }

        render();
    }
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && timerIntroModal && !timerIntroModal.hidden) {
        closeTimerIntro();
        return;
    }

    if (event.key === "Escape" && isSidebarOpen()) {
        setSidebarOpenState(false);
    }
});

document.addEventListener("click", (event) => {
    if (!isMobileSidebarLayout() || !timerLayout || !timerControls || !settingsToggleBtn || !isSidebarOpen()) {
        return;
    }

    if (timerControls.contains(event.target) || settingsToggleBtn.contains(event.target)) {
        return;
    }

    setSidebarOpenState(false);
});

if (closeTimerIntroBtn) {
    closeTimerIntroBtn.addEventListener("click", closeTimerIntro);
}

if (timerIntroBackdrop) {
    timerIntroBackdrop.addEventListener("click", closeTimerIntro);
}

if (timerHelpBtn) {
    timerHelpBtn.addEventListener("click", openTimerIntro);
}

if (timerSoundToggleBtn) {
    timerSoundToggleBtn.addEventListener("click", toggleSound);
}

if (intervalBtn) {
    intervalBtn.addEventListener("click", toggleInterval);
}

if (settingsToggleBtn) {
    settingsToggleBtn.addEventListener("click", toggleSidebar);
}

if (settingsCloseBtn) {
    settingsCloseBtn.addEventListener("click", () => setSidebarOpenState(false));
}

if (controlsBackdrop) {
    controlsBackdrop.addEventListener("click", () => setSidebarOpenState(false));
}

if (mobileSidebarMediaQuery && typeof mobileSidebarMediaQuery.addEventListener === "function") {
    mobileSidebarMediaQuery.addEventListener("change", handleViewportSidebarState);
} else if (mobileSidebarMediaQuery && typeof mobileSidebarMediaQuery.addListener === "function") {
    mobileSidebarMediaQuery.addListener(handleViewportSidebarState);
}

window.deskStudyTimerAudio = {
    playCompletionSound
};
initialize();
handleViewportSidebarState();
