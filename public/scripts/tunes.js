const nowPlayingWave = document.getElementById("nowPlayingWave");
const audioPlayer = document.getElementById("audio-player");
const trackNameDisplay = document.getElementById("track-name");
const playBtn = document.getElementById("playBtn");
const restartTrackBtn = document.getElementById("restartTrackBtn");

const quickTracksContainer = document.getElementById("quickTracks");
const hymnSelect = document.getElementById("hymnSelect");
const spotifyContainer = document.getElementById("spotify-container");
const spotifyToggleBtn = document.getElementById("tunesSpotifyToggleBtn");

const tunesControls = document.getElementById("tunesControls");
const tunesControlsCollapseBtn = document.getElementById("tunesControlsCollapseBtn");
const tunesControlsToggleIcon = document.getElementById("tunesControlsToggleIcon");

const tunesPlayerCard = document.getElementById("tunesPlayerCard");
const tunesPlayerCollapseBtn = document.getElementById("tunesPlayerCollapseBtn");
const tunesPlayerToggleIcon = document.getElementById("tunesPlayerToggleIcon");

const tunesIntroModal = document.getElementById("tunesIntroModal");
const tunesIntroBackdrop = document.getElementById("tunesIntroBackdrop");
const closeTunesIntroBtn = document.getElementById("closeTunesIntroBtn");
const tunesHelpBtn = document.getElementById("tunesHelpBtn");

const COLLAPSE_ICON_SRC = "styles/images/icons/collapse content.svg";
const EXPAND_ICON_SRC = "styles/images/icons/expand_content.svg";
const TUNES_INTRO_SEEN_KEY = "deskStudyTunesIntroSeenV1";

const TUNES_DEFAULT_STATE = {
    trackName: "Rain",
    trackFile: "tunes_files/rain.mp3",
    isPlaying: false
};

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
    document.querySelectorAll(".tunes-track-btn").forEach((button) => {
        button.classList.remove("is-active");
    });
}

function setPlayingUi(isPlaying) {
    if (playBtn) {
        playBtn.textContent = isPlaying ? "Pause" : "Play";
        playBtn.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
    }
    if (nowPlayingWave) {
        nowPlayingWave.classList.toggle("is-playing", isPlaying);
    }
}

function loadTrack(name, file, controlElement) {
    if (!audioPlayer || !trackNameDisplay) return;

    const resolved = normalizeFile(file);
    trackNameDisplay.innerText = name;

    clearActiveButtons();
    if (controlElement && controlElement.tagName === "BUTTON") {
        controlElement.classList.add("is-active");
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
        btn.className = "tunes-track-btn";
        btn.textContent = track.name;
        btn.addEventListener("click", () => loadTrack(track.name, track.file, btn));

        if (normalizeFile(track.file) === initialFileAbs) {
            btn.classList.add("is-active");
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
        loadTrack(selectedOption.text, hymnSelect.value, null);
    });
}

function togglePlay() {
    if (!audioPlayer) return;

    if (audioPlayer.paused) {
        void audioPlayer.play();
        setPlayingUi(true);
        saveTunesState({
            trackName: trackNameDisplay ? trackNameDisplay.innerText : "",
            trackFile: audioPlayer.currentSrc || audioPlayer.src,
            isPlaying: true
        });
        return;
    }

    audioPlayer.pause();
    setPlayingUi(false);
    saveTunesState({
        trackName: trackNameDisplay ? trackNameDisplay.innerText : "",
        trackFile: audioPlayer.currentSrc || audioPlayer.src,
        isPlaying: false
    });
}

function restartTrack() {
    if (!audioPlayer) return;
    audioPlayer.currentTime = 0;
    if (!audioPlayer.paused) {
        void audioPlayer.play();
    }
}

function toggleSpotify() {
    if (!spotifyContainer) return;
    const willOpen = Boolean(spotifyContainer.hidden);
    spotifyContainer.hidden = !willOpen;

    if (tunesPlayerCard) {
        tunesPlayerCard.classList.toggle("is-spotify-open", willOpen);
    }
    if (spotifyToggleBtn) {
        spotifyToggleBtn.setAttribute("aria-expanded", `${willOpen}`);
    }

    if (willOpen) {
        setPlayerCollapsed(false);
        if (audioPlayer) {
            audioPlayer.pause();
            setPlayingUi(false);
        }
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

function setControlsCollapsed(isCollapsed) {
    if (!tunesControls) return;
    tunesControls.classList.toggle("is-collapsed", isCollapsed);

    if (tunesControlsToggleIcon) {
        tunesControlsToggleIcon.src = isCollapsed ? EXPAND_ICON_SRC : COLLAPSE_ICON_SRC;
    }
    if (tunesControlsCollapseBtn) {
        tunesControlsCollapseBtn.setAttribute("aria-label", isCollapsed ? "Expand library" : "Collapse library");
    }
}

function setPlayerCollapsed(isCollapsed) {
    if (!tunesPlayerCard) return;
    tunesPlayerCard.classList.toggle("is-collapsed", isCollapsed);

    if (tunesPlayerToggleIcon) {
        tunesPlayerToggleIcon.src = isCollapsed ? EXPAND_ICON_SRC : COLLAPSE_ICON_SRC;
    }
    if (tunesPlayerCollapseBtn) {
        tunesPlayerCollapseBtn.setAttribute("aria-label", isCollapsed ? "Expand player" : "Collapse player");
        tunesPlayerCollapseBtn.setAttribute("aria-expanded", `${!isCollapsed}`);
    }
}

void (async function initTunes() {
    const [savedState, manifest] = await Promise.all([loadTunesState(), loadTunesManifest()]);
    const initialTunesState = { ...TUNES_DEFAULT_STATE, ...(savedState || {}) };

    if (audioPlayer) {
        audioPlayer.src = normalizeFile(initialTunesState.trackFile || TUNES_DEFAULT_STATE.trackFile);
    }
    if (trackNameDisplay) {
        trackNameDisplay.innerText = initialTunesState.trackName || TUNES_DEFAULT_STATE.trackName;
    }
    setPlayingUi(false);

    renderQuickTracks(manifest.quickTracks, initialTunesState);
    renderHymnSelect(manifest.hymnsOld, manifest.hymnsNew, initialTunesState);

    if (spotifyContainer) {
        spotifyContainer.hidden = true;
    }
    if (tunesPlayerCard) {
        tunesPlayerCard.classList.remove("is-spotify-open");
    }
    if (spotifyToggleBtn) {
        spotifyToggleBtn.setAttribute("aria-expanded", "false");
    }

    if (localStorage.getItem(TUNES_INTRO_SEEN_KEY) !== "true") {
        openTunesIntro();
        localStorage.setItem(TUNES_INTRO_SEEN_KEY, "true");
    }
})();

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tunesIntroModal && !tunesIntroModal.hidden) {
        closeTunesIntro();
    }
});

if (playBtn) playBtn.addEventListener("click", togglePlay);
if (restartTrackBtn) restartTrackBtn.addEventListener("click", restartTrack);
if (spotifyToggleBtn) spotifyToggleBtn.addEventListener("click", toggleSpotify);

if (tunesControlsCollapseBtn) {
    tunesControlsCollapseBtn.addEventListener("click", () => {
        if (!tunesControls) return;
        setControlsCollapsed(!tunesControls.classList.contains("is-collapsed"));
    });
}

if (tunesPlayerCollapseBtn) {
    tunesPlayerCollapseBtn.addEventListener("click", () => {
        if (!tunesPlayerCard) return;
        setPlayerCollapsed(!tunesPlayerCard.classList.contains("is-collapsed"));
    });
}

if (closeTunesIntroBtn) closeTunesIntroBtn.addEventListener("click", closeTunesIntro);
if (tunesIntroBackdrop) tunesIntroBackdrop.addEventListener("click", closeTunesIntro);
if (tunesHelpBtn) tunesHelpBtn.addEventListener("click", openTunesIntro);

if (audioPlayer) {
    audioPlayer.addEventListener("play", () => setPlayingUi(true));
    audioPlayer.addEventListener("pause", () => setPlayingUi(false));
    audioPlayer.addEventListener("ended", () => setPlayingUi(false));
}
