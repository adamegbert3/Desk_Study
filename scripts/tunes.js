const audioPlayer = document.getElementById("audio-player");
const trackNameDisplay = document.getElementById("track-name");
const playBtn = document.getElementById("playBtn");
const buttons = document.querySelectorAll(".sound-btn");
const TUNES_DEFAULT_STATE = { trackName: "Rain", trackFile: "tunes_files/rain.mp3", isPlaying: false };

// Modal elements
const tunesIntroModal = document.getElementById("tunesIntroModal");
const tunesIntroBackdrop = document.getElementById("tunesIntroBackdrop");
const closeTunesIntroBtn = document.getElementById("closeTunesIntroBtn");
const tunesHelpBtn = document.getElementById("tunesHelpBtn");

async function loadTunesState() {
    if (window.dataStore && typeof window.dataStore.loadTunesState === "function") {
        return (await window.dataStore.loadTunesState()) || null;
    }
    try {
        return JSON.parse(localStorage.getItem("deskStudyTunesStateV1") || "null");
    } catch {
        return null;
    }
}

function saveTunesState(state) {
    if (window.dataStore && typeof window.dataStore.saveTunesState === "function") {
        void window.dataStore.saveTunesState(state);
        return;
    }
    try {
        localStorage.setItem("deskStudyTunesStateV1", JSON.stringify(state || {}));
    } catch {}
}

void (async function initTunes() {
    const initialTunesState = { ...TUNES_DEFAULT_STATE, ...((await loadTunesState()) || {}) };
    audioPlayer.src = initialTunesState.trackFile || TUNES_DEFAULT_STATE.trackFile;
    trackNameDisplay.innerText = initialTunesState.trackName || TUNES_DEFAULT_STATE.trackName;
    playBtn.textContent = "▶";
})();

function loadTrack(name, file, btnElement) {
    trackNameDisplay.innerText = name;

    buttons.forEach((button) => button.classList.remove("active"));
    btnElement.classList.add("active");

    audioPlayer.src = file;
    audioPlayer.pause();
    audioPlayer.currentTime = 0;

    playBtn.textContent = "▶";
    saveTunesState({ trackName: name, trackFile: file, isPlaying: false });
}

function togglePlay() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playBtn.textContent = "⏸";
        saveTunesState({ trackName: trackNameDisplay.innerText, trackFile: audioPlayer.src, isPlaying: true });
    } else {
        audioPlayer.pause();
        playBtn.textContent = "▶";
        saveTunesState({ trackName: trackNameDisplay.innerText, trackFile: audioPlayer.src, isPlaying: false });
    }
}

function openTunesIntro() {
    if (!tunesIntroModal) {
        return;
    }

    tunesIntroModal.hidden = false;
}

function closeTunesIntro() {
    if (!tunesIntroModal) {
        return;
    }

    tunesIntroModal.hidden = true;
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tunesIntroModal && !tunesIntroModal.hidden) {
        closeTunesIntro();
    }
});

if (closeTunesIntroBtn) {
    closeTunesIntroBtn.addEventListener("click", closeTunesIntro);
}

if (tunesIntroBackdrop) {
    tunesIntroBackdrop.addEventListener("click", closeTunesIntro);
}

if (tunesHelpBtn) {
    tunesHelpBtn.addEventListener("click", openTunesIntro);
}

// Show on page load
openTunesIntro();