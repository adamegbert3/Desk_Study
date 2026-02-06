const audioPlayer = document.getElementById('audio-player');
const trackNameDisplay = document.getElementById('track-name');
const playBtn = document.getElementById('playBtn');
const buttons = document.querySelectorAll('.sound-btn');

    let isPlaying = false;

    function loadTrack(name, file, btnElement) {
        // Update Text
        trackNameDisplay.innerText = name;
        
        // Visual Active State for Sidebar
        buttons.forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');

        // Set Audio Source (Note: You need actual .mp3 files for this to work!)
        // For now, this just simulates the switch.
        audioPlayer.src = file; 
        
        // Reset to Pause state visually when switching
        isPlaying = false;
        playBtn.innerText = "▶"; 
        
        // If you want it to auto-play on switch, uncomment below:
        // togglePlay();
    }

    function togglePlay() {
        if (isPlaying) {
            audioPlayer.pause();
            playBtn.innerText = "▶"; 
        } else {
            audioPlayer.play(); // <--- I removed the "//" so this runs now
            playBtn.innerText = "||"; 
        }
        isPlaying = !isPlaying;
    }