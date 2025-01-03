const bgMusic = document.getElementById('bgMusic');
const volumeButton = document.getElementById('volumeButton');

function showInstructions() {
  window.location.href = "instructions.html";
}

function goToAuthentication() {
  window.location.href = "authentication.html";
}

document.addEventListener('click', function startAudio() {
  bgMusic.play()
      .catch(e => console.log("Audio play failed:", e));
  document.removeEventListener('click', startAudio);
}, { once: true });


function toggleVolume() {
  if (bgMusic.paused) {
    bgMusic.play();
    volumeButton.textContent = "🔊";
  } else {
    bgMusic.pause();
    volumeButton.textContent = "🔇";
  }
}