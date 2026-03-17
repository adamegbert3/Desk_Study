const nowPlayingWave = document.getElementById("nowPlayingWave");
const audioPlayer = document.getElementById("audio-player");
const trackNameDisplay = document.getElementById("track-name");
const playBtn = document.getElementById("playBtn");
const quickTracksContainer = document.getElementById("quickTracks");
const hymnSelect = document.getElementById("hymnSelect");

const TUNES_DEFAULT_STATE = {
    trackName: "Rain",
    trackFile: "tunes_files/rain.mp3",
    isPlaying: false
};

// Fallback list if manifest is missing
const FALLBACK_MANIFEST = {
    quickTracks: [
        { name: "Rain", file: "tunes_files/rain.mp3" },
        { name: "Forest", file: "tunes_files/forest.mp3" },
        { name: "Wind", file: "tunes_files/wind.mp3" },
        { name: "Om", file: "tunes_files/om.mp3" }
    ],
    hymnsOld: [],
    hymnsNew: []
};

// Modal elements
const tunesIntroModal = document.getElementById("tunesIntroModal");
const tunesIntroBackdrop = document.getElementById("tunesIntroBackdrop");
const closeTunesIntroBtn = document.getElementById("closeTunesIntroBtn");
const tunesHelpBtn = document.getElementById("tunesHelpBtn");

function normalizeFile(file) {
    try {
        return new URL(file, window.location.href).href;
    } catch {
        return String(file || "");
    }
}

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

async function loadTunesManifest() {
    try {
        const res = await fetch("tunes-manifest.json", { cache: "no-store" });
        if (!res.ok) throw new Error("Manifest not found");
        const data = await res.json();
        return {
            quickTracks: Array.isArray(data.quickTracks) ? data.quickTracks : FALLBACK_MANIFEST.quickTracks,
            hymnsOld: Array.isArray(data.hymnsOld) ? data.hymnsOld : [],
            hymnsNew: Array.isArray(data.hymnsNew) ? data.hymnsNew : []
        };
    } catch {
        return FALLBACK_MANIFEST;
    }
}

function clearActiveButtons() {
    document.querySelectorAll(".sound-btn").forEach((button) => {
        button.classList.remove("active");
    });
}

function loadTrack(name, file, controlElement) {
    const resolved = normalizeFile(file);
    trackNameDisplay.innerText = name;

    clearActiveButtons();
    if (controlElement && controlElement.tagName === "BUTTON") {
        controlElement.classList.add("active");
    }

    audioPlayer.src = resolved;
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    setPlayingUi(false);

    saveTunesState({ trackName: name, trackFile: file, isPlaying: false });
}

function renderQuickTracks(tracks, initialState) {
    if (!quickTracksContainer) return;

    quickTracksContainer.innerHTML = "";
    const initialFileAbs = normalizeFile(initialState.trackFile);

    tracks.forEach((track) => {
        if (!track || !track.name || !track.file) return;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sound-btn";
        btn.textContent = track.name.toLowerCase();
        btn.addEventListener("click", () => loadTrack(track.name, track.file, btn));

        if (normalizeFile(track.file) === initialFileAbs) {
            btn.classList.add("active");
        }

        quickTracksContainer.appendChild(btn);
    });
}

function renderHymnSelect(hymnsOld, hymnsNew, initialState) {
    if (!hymnSelect) return;

    hymnSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "LDS Hymns...";
    hymnSelect.appendChild(placeholder);

    const allHymns = [...hymnsOld, ...hymnsNew];
    const initialFileAbs = normalizeFile(initialState.trackFile);
    let matchedInitial = false;

    allHymns.forEach((track) => {
        if (!track || !track.name || !track.file) return;
        const option = document.createElement("option");
        option.value = track.file;
        option.textContent = track.name;
        hymnSelect.appendChild(option);

        if (normalizeFile(track.file) === initialFileAbs) {
            option.selected = true;
            matchedInitial = true;
        }
    });

    if (!matchedInitial) {
        placeholder.selected = true;
    }

    hymnSelect.addEventListener("change", () => {
        const selectedOption = hymnSelect.options[hymnSelect.selectedIndex];
        if (!hymnSelect.value) return;
        loadTrack(selectedOption.text, hymnSelect.value, hymnSelect);
    });
}

void (async function initTunes() {
    const [savedState, manifest] = await Promise.all([loadTunesState(), loadTunesManifest()]);
    const initialTunesState = { ...TUNES_DEFAULT_STATE, ...(savedState || {}) };

    audioPlayer.src = normalizeFile(initialTunesState.trackFile || TUNES_DEFAULT_STATE.trackFile);
    trackNameDisplay.innerText = initialTunesState.trackName || TUNES_DEFAULT_STATE.trackName;
    setPlayingUi(false);

    renderQuickTracks(manifest.quickTracks, initialTunesState);
    renderHymnSelect(manifest.hymnsOld, manifest.hymnsNew, initialTunesState);
})();

function togglePlay() {
    if (audioPlayer.paused) {
        void audioPlayer.play();
        setPlayingUi(true);
        saveTunesState({
            trackName: trackNameDisplay.innerText,
            trackFile: audioPlayer.currentSrc || audioPlayer.src,
            isPlaying: true
        });
    } else {
        audioPlayer.pause();
        setPlayingUi(false);
        saveTunesState({
            trackName: trackNameDisplay.innerText,
            trackFile: audioPlayer.currentSrc || audioPlayer.src,
            isPlaying: false
        });
    }
}

function openTunesIntro() {
    if (!tunesIntroModal) return;
    tunesIntroModal.hidden = false;
}

function closeTunesIntro() {
    if (!tunesIntroModal) return;
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

function toggleSpotify() {
    const spotifyContainer = document.getElementById("spotify-container");
    if (!spotifyContainer) return;
    spotifyContainer.style.display = spotifyContainer.style.display === "none" ? "block" : "none";
}
function setPlayingUi(isPlaying) {
    playBtn.textContent = isPlaying ? "⏸" : "▶";
    if (nowPlayingWave) {
        nowPlayingWave.classList.toggle("is-playing", isPlaying);
    }
}

// Needed because your HTML still uses onclick="toggleSpotify()"
window.toggleSpotify = toggleSpotify;

audioPlayer.addEventListener("play", () => setPlayingUi(true));
audioPlayer.addEventListener("pause", () => setPlayingUi(false));
audioPlayer.addEventListener("ended", () => setPlayingUi(false));

// Show on page load
openTunesIntro();