const audioPlayer = document.getElementById("audio-player");
const trackNameDisplay = document.getElementById("track-name");
const playBtn = document.getElementById("playBtn");
const buttons = document.querySelectorAll(".sound-btn");

// Modal elements
const tunesIntroModal = document.getElementById("tunesIntroModal");
const tunesIntroBackdrop = document.getElementById("tunesIntroBackdrop");
const closeTunesIntroBtn = document.getElementById("closeTunesIntroBtn");
const tunesHelpBtn = document.getElementById("tunesHelpBtn");

audioPlayer.src = "tunes_files/rain.mp3";
playBtn.textContent = "▶";

function loadTrack(name, file, btnElement) {
    trackNameDisplay.innerText = name;

    buttons.forEach((button) => button.classList.remove("active"));
    btnElement.classList.add("active");

    audioPlayer.src = file;
    audioPlayer.pause();
    audioPlayer.currentTime = 0;

    playBtn.textContent = "▶";
}

function togglePlay() {
    if (audioPlayer.paused) {
        audioPlayer.play();
        playBtn.textContent = "⏸";
    } else {
        audioPlayer.pause();
        playBtn.textContent = "▶";
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