(() => {
    const SOUND_PREF_KEY = "deskStudyTimerSoundEnabledV1";
    const COMPLETION_SOUND_PREF_KEY = "deskStudyTimerCompletionSoundV1";
    const TUNES_STORAGE_KEY = "deskStudyTunesStateV1";
    const DEFAULT_COMPLETION_SOUND_FILE = "tunes_files/om.mp3";

    const completionSound = new Audio();
    completionSound.preload = "auto";
    completionSound.volume = 0.85;

    let primed = false;

    function normalizeFile(file) {
        try {
            return new URL(file, window.location.href).href;
        } catch {
            return String(file || "");
        }
    }

    function loadCompletionSoundPreference() {
        const direct = window.localStorage.getItem(COMPLETION_SOUND_PREF_KEY);
        if (direct) {
            return direct;
        }

        try {
            const tunesState = JSON.parse(window.localStorage.getItem(TUNES_STORAGE_KEY) || "null");
            if (tunesState && tunesState.trackFile) {
                return tunesState.trackFile;
            }
        } catch {
            // Ignore parse failures.
        }

        return DEFAULT_COMPLETION_SOUND_FILE;
    }

    function isSoundEnabled() {
        const raw = window.localStorage.getItem(SOUND_PREF_KEY);
        if (raw === null) {
            return true;
        }
        return raw === "true";
    }

    function syncSourceFromPrefs() {
        const nextSource = normalizeFile(loadCompletionSoundPreference());
        if (nextSource && completionSound.src !== nextSource) {
            completionSound.src = nextSource;
        }
    }

    function prime() {
        if (primed) {
            return;
        }

        primed = true;
        syncSourceFromPrefs();

        const previousMuted = completionSound.muted;
        completionSound.muted = true;
        completionSound.currentTime = 0;

        const playAttempt = completionSound.play();
        if (playAttempt && typeof playAttempt.then === "function") {
            playAttempt
                .then(() => {
                    completionSound.pause();
                    completionSound.currentTime = 0;
                    completionSound.muted = previousMuted;
                })
                .catch(() => {
                    completionSound.muted = previousMuted;
                });
        } else {
            completionSound.muted = previousMuted;
        }
    }

    function playCompletionSound() {
        if (!isSoundEnabled()) {
            return;
        }

        syncSourceFromPrefs();
        completionSound.loop = false;
        completionSound.currentTime = 0;

        const playAttempt = completionSound.play();
        if (playAttempt && typeof playAttempt.catch === "function") {
            playAttempt.catch(() => {
                // Autoplay restrictions or other playback failures are best-effort only.
            });
        }
    }

    function setupPrimeListeners() {
        const onFirstGesture = () => prime();

        window.addEventListener("pointerdown", onFirstGesture, { once: true, passive: true });
        window.addEventListener("keydown", onFirstGesture, { once: true });
    }

    function setupPreferenceListeners() {
        window.addEventListener("storage", (event) => {
            if (!event) return;
            if (event.key === COMPLETION_SOUND_PREF_KEY || event.key === TUNES_STORAGE_KEY) {
                syncSourceFromPrefs();
            }
        });
    }

    setupPrimeListeners();
    setupPreferenceListeners();
    syncSourceFromPrefs();

    window.deskStudyTimerAudio = window.deskStudyTimerAudio || {};
    window.deskStudyTimerAudio.playCompletionSound = playCompletionSound;
})();

