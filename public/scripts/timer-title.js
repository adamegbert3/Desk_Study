(() => {
    const STORAGE_KEY = "deskStudyTimerStateV1";
    const modeLabels = {
        focus: "Focus",
        short: "Break",
        long: "Long Break"
    };

    if (document.getElementById("timerToggleBtn")) {
        return;
    }

    if (!window.__deskStudyBaseTitle) {
        window.__deskStudyBaseTitle = document.title;
    }
    const baseTitle = window.__deskStudyBaseTitle;

    let tickHandle = null;

    function safeParse(raw) {
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    function readTimerState() {
        try {
            return safeParse(window.localStorage.getItem(STORAGE_KEY));
        } catch {
            return null;
        }
    }

    function formatRemainingTime(valueMs) {
        const totalSeconds = Math.max(0, Math.ceil(valueMs / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    function computeRemainingMs(state) {
        if (!state) return null;

        const endsAt = Number(state.endsAt);
        if (state.isRunning && Number.isFinite(endsAt) && endsAt > 0) {
            return Math.max(0, endsAt - Date.now());
        }

        const remainingMs = Number(state.remainingMs);
        if (Number.isFinite(remainingMs) && remainingMs >= 0) {
            return remainingMs;
        }

        return null;
    }

    function stopTicking() {
        if (!tickHandle) return;
        clearInterval(tickHandle);
        tickHandle = null;
    }

    function startTicking() {
        if (tickHandle) return;
        tickHandle = setInterval(updateTitle, 1000);
    }

    function updateTitle() {
        const state = readTimerState();
        if (!state || !state.isRunning) {
            stopTicking();
            document.title = baseTitle;
            return;
        }

        const remainingMs = computeRemainingMs(state);
        if (remainingMs === null || remainingMs <= 0) {
            stopTicking();
            document.title = baseTitle;
            return;
        }

        const timeLabel = formatRemainingTime(remainingMs);
        const modeLabel = modeLabels[state.currentMode] || "Timer";
        document.title = `${timeLabel} • ${modeLabel} | ${baseTitle}`;
        startTicking();
    }

    updateTitle();

    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            updateTitle();
        }
    });

    window.addEventListener("storage", (event) => {
        if (event && event.key === STORAGE_KEY) {
            updateTitle();
        }
    });
})();

