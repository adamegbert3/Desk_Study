const audioPlayer = document.getElementById("audio-player");
const trackNameDisplay = document.getElementById("track-name");
const playBtn = document.getElementById("playBtn");
const buttons = document.querySelectorAll(".sound-btn");

let isPlaying = false;
audioPlayer.src = "tunes_files/rain.mp3";

function loadTrack(name, file, btnElement) {
    trackNameDisplay.innerText = name;

    buttons.forEach((button) => button.classList.remove("active"));
    btnElement.classList.add("active");

    audioPlayer.src = file;
    audioPlayer.pause();
    audioPlayer.currentTime = 0;

    isPlaying = false;
    playBtn.innerText = "Play";
}

function togglePlay() {
    if (isPlaying) {
        audioPlayer.pause();
        playBtn.innerText = "Play";
    } else {
        audioPlayer.play();
        playBtn.innerText = "Pause";
    }

    isPlaying = !isPlaying;
}
