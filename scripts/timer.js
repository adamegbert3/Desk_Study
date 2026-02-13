let timer;
let timeLeft;
let totalTime;
let currentMode = "focus";

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

circle.style.strokeDasharray = circumference;

function setMode(mode) {
    currentMode = mode;
    timeLeft = totalTime = modeDurations[mode] * 60;

    updateDisplay();
    resetRing();
    updateActiveModeUI();
}

function startTimer() {
    if (timer) return;

    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            timer = null;
            alert("Session complete!");
            return;
        }

        timeLeft--;
        updateDisplay();
        updateRing();
    }, 1000);
}

function pauseTimer() {
    clearInterval(timer);
    timer = null;
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
        timeLeft = totalTime = clampedValue * 60;
        updateDisplay();
        resetRing();
    }
}

Object.keys(modeInputs).forEach((mode) => {
    modeInputs[mode].addEventListener("change", () => handleDurationChange(mode));
});

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent =
        `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function updateRing() {
    const offset = circumference - (timeLeft / totalTime) * circumference;
    circle.style.strokeDashoffset = offset;
}

function resetRing() {
    circle.style.strokeDashoffset = 0;
}

// Initialize
setMode("focus");
updateModeUI();
