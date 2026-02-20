const STORAGE_KEY = "deskStudyTimerStateV1";

let timer = null;
let currentMode = "focus";
let durationMs = 25 * 60 * 1000;
let remainingMs = durationMs;
let endsAt = null;
let isRunning = false;

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

circle.style.strokeDasharray = circumference;

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
        isRunning
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function loadState() {
    const rawState = localStorage.getItem(STORAGE_KEY);
    if (!rawState) {
        return false;
    }

    try {
        const state = JSON.parse(rawState);

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
        return true;
    } catch (error) {
        return false;
    }
}

function syncInputsFromDurations() {
    Object.keys(modeInputs).forEach((mode) => {
        modeInputs[mode].value = modeDurations[mode];
    });
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

function startTimer() {
    if (isRunning) {
        return;
    }

    if (remainingMs <= 0) {
        remainingMs = durationMs;
    }

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

function render() {
    updateDisplayFromMs();
    updateRingFromMs();
    updateToggleButton();
    updateActiveModeUI();
}

function tick() {
    remainingMs = getRemainingMs();

    if (remainingMs <= 0) {
        remainingMs = 0;
        endsAt = null;
        isRunning = false;
        stopTicking();
        render();
        saveState();
        alert("Session complete!");
        return;
    }

    render();
    saveState();
}

function initialize() {
    const loaded = loadState();
    if (!loaded) {
        currentMode = "focus";
        durationMs = getModeDurationMs(currentMode);
        remainingMs = durationMs;
    }

    updateModeUI();
    syncInputsFromDurations();
    render();

    if (isRunning) {
        startTicking();
    }

    openTimerIntro();
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
    }
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

initialize();
