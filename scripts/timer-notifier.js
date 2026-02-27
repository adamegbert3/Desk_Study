(() => {
    const STORAGE_KEY = "deskStudyTimerStateV1";
    const COMPLETION_KEY = "deskStudyTimerLastCompletionEndsAtV1";
    const MODE_LABELS = {
        focus: "Focus",
        short: "Break",
        long: "Long Break"
    };

    function parseState() {
        const rawState = localStorage.getItem(STORAGE_KEY);
        if (!rawState) {
            return null;
        }

        try {
            return JSON.parse(rawState);
        } catch (error) {
            return null;
        }
    }

    function isCompletionHandled(endsAtValue) {
        const handledValue = Number.parseInt(localStorage.getItem(COMPLETION_KEY), 10);
        if (!Number.isFinite(handledValue)) {
            return false;
        }

        return handledValue === Math.floor(endsAtValue);
    }

    function markCompletionHandled(endsAtValue) {
        localStorage.setItem(COMPLETION_KEY, `${Math.floor(endsAtValue)}`);
    }

    function notify(mode) {
        if (!("Notification" in window) || Notification.permission !== "granted") {
            return false;
        }

        const modeName = MODE_LABELS[mode] || "Session";
        new Notification("Desk Study Timer", {
            body: `${modeName} session complete.`,
            tag: "desk-study-timer-complete"
        });
        return true;
    }

    function handleCompletion({ mode, endsAt, fallbackToAlert = false }) {
        const completedEndsAt = Number.isFinite(endsAt) ? endsAt : Date.now();

        if (isCompletionHandled(completedEndsAt)) {
            return false;
        }

        const notificationShown = notify(mode);
        if (!notificationShown && fallbackToAlert) {
            alert("Session complete!");
        }

        markCompletionHandled(completedEndsAt);
        return true;
    }

    function requestPermission() {
        if (!("Notification" in window) || Notification.permission !== "default") {
            return;
        }

        Notification.requestPermission().catch(() => {
            // Silent failure; timer still works without notifications.
        });
    }

    function stopExpiredTimer(state) {
        const completedEndsAt = Number.isFinite(state.endsAt) ? state.endsAt : Date.now();
        const updatedState = {
            ...state,
            remainingMs: 0,
            endsAt: null,
            isRunning: false
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));

        handleCompletion({
            mode: state.currentMode,
            endsAt: completedEndsAt,
            fallbackToAlert: false
        });
    }

    function checkTimer() {
        const state = parseState();
        if (!state || !state.isRunning || !Number.isFinite(state.endsAt)) {
            return;
        }

        if (Date.now() >= state.endsAt) {
            stopExpiredTimer(state);
        }
    }

    requestPermission();
    checkTimer();
    setInterval(checkTimer, 1000);

    window.deskStudyTimerNotifier = {
        requestPermission,
        handleCompletion
    };
})();
