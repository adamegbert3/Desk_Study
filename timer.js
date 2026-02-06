let timer;
let timeLeft;
let totalTime;

const timeDisplay = document.getElementById("time");
const circle = document.querySelector(".progress-ring__circle");
const circumference = 2 * Math.PI * 110;

circle.style.strokeDasharray = circumference;

function setMode(mode) {
    if (mode === "focus") timeLeft = totalTime = 25 * 60;
    if (mode === "short") timeLeft = totalTime = 5 * 60;
    if (mode === "long") timeLeft = totalTime = 15 * 60;

    updateDisplay();
    resetRing();
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
