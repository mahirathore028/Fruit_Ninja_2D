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
    initializeLeaderboard();
});

const firebaseConfig = {
    apiKey: "AIzaSyB9IotfjmSerTH_vH9btkrt4xB5qZcMolc",
    authDomain: "fruit-ninja-c3dfa.firebaseapp.com",
    projectId: "fruit-ninja-c3dfa",
    storageBucket: "fruit-ninja-c3dfa.firebasestorage.app",
    messagingSenderId: "631425855927",
    appId: "1:631425855927:web:4aa28a8c6668c7d3423832"
};

let db;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
} catch (error) {
    console.error("Failed to initialize Firebase:", error);
    showError("Failed to initialize game services. Please refresh the page.");
}

const REFRESH_INTERVAL = 30000;
const MAX_LEADERBOARD_ENTRIES = 7;
const LOADING_MESSAGE = '<div class="loading">Loading leaderboard...</div>';
const NO_SCORES_MESSAGE = '<div class="no-scores">No scores yet! Be the first to play!</div>';

function formatPlayerName(email) {
    if (!email) return 'Anonymous';
    return email.split('@')[0].replace(/[.<>#$[\]/]/g, '');
}

function showError(message) {
    const errorHTML = `<div class="error-message">${message}</div>`;
    getLeaderboardElement().innerHTML = errorHTML;
}

function getLeaderboardElement() {
    return document.getElementById('leaderboard') || document.querySelector('.leaderboard-entries');
}

function createLeaderboardEntry(data, rank) {
    return `
        <div class="leaderboard-entry ${rank === 1 ? 'top-score' : ''}">
            <span class="rank">${rank}</span>
            <span class="player">${formatPlayerName(data.email)}</span>
            <span class="score">${data.score.toLocaleString()}</span>
        </div>
    `;
}

async function updateLeaderboard() {
    const leaderboardElement = document.getElementById('leaderboard');
    
    try {
        const scoresSnapshot = await db.collection('scores')
            .orderBy('score', 'desc')
            .limit(7)
            .get();

        if (scoresSnapshot.empty) {
            leaderboardElement.innerHTML = '<div class="no-scores">No scores yet!</div>';
            return;
        }

        let leaderboardHTML = '';
        let rank = 1;

        scoresSnapshot.forEach((doc) => {
            const data = doc.data();
            const playerName = data.email.split('@')[0];
            leaderboardHTML += `
                <div class="leaderboard-entry ${rank === 1 ? 'top-score' : ''}">
                    <span class="rank">#${rank}</span>
                    <span class="player">${playerName}</span>
                    <span class="score">${data.score.toLocaleString()}</span>
                </div>
            `;
            rank++;
        });

        leaderboardElement.innerHTML = leaderboardHTML;

    } catch (error) {
        console.error("Error updating leaderboard:", error);
        leaderboardElement.innerHTML = '<div class="error">Unable to load leaderboard</div>';
    }
}

function initializeLeaderboard() {
    try {
        updateLeaderboard();

        const refreshInterval = setInterval(updateLeaderboard, REFRESH_INTERVAL);
        
        window.addEventListener('unload', () => {
            clearInterval(refreshInterval);
        });
    } catch (error) {
        console.error("Failed to initialize leaderboard:", error);
        showError("Failed to initialize leaderboard. Please refresh the page.");
    }
}

initializeLeaderboard();