let backgroundMusic;

function setupBackgroundMusic() {
    backgroundMusic = new Audio('bg_music.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;

    document.addEventListener('click', function startAudio() {
        backgroundMusic.play()
            .catch(e => console.log("Audio play failed:", e));
        document.removeEventListener('click', startAudio);
    }, { once: true });
}

function toggleBackgroundMusic() {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
    } else {
        backgroundMusic.pause();
    }
}

document.addEventListener('keypress', (e) => {
    if (e.key === 'm' || e.key === 'M') {
        toggleBackgroundMusic();
    }
});

window.addEventListener('load', () => {
    setupBackgroundMusic();
});

const firebaseConfig = {
    apiKey: "AIzaSyB9IotfjmSerTH_vH9btkrt4xB5qZcMolc",
    authDomain: "fruit-ninja-c3dfa.firebaseapp.com",
    projectId: "fruit-ninja-c3dfa",
    storageBucket: "fruit-ninja-c3dfa.firebasestorage.app",
    messagingSenderId: "631425855927",
    appId: "1:631425855927:web:4aa28a8c6668c7d3423832"
  };

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const signUpForm = document.getElementById('signUpForm');

signUpForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            auth.signOut().then(() => {
                alert('Account created successfully! Please sign in.');
                window.location.href = './authentication.html';
            });
        })
        .catch((error) => {
            alert(error.message);
        });
});