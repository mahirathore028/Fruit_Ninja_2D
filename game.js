const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameOverElement = document.getElementById('gameOver');

const firebaseConfig = {
    apiKey: "AIzaSyB9IotfjmSerTH_vH9btkrt4xB5qZcMolc",
    authDomain: "fruit-ninja-c3dfa.firebaseapp.com",
    projectId: "fruit-ninja-c3dfa",
    storageBucket: "fruit-ninja-c3dfa.firebasestorage.app",
    messagingSenderId: "631425855927",
    appId: "1:631425855927:web:4aa28a8c6668c7d3423832"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

const highScoreElement = document.createElement('div');
highScoreElement.id = 'highScore';
highScoreElement.style.position = 'absolute';
highScoreElement.style.top = '20px';
highScoreElement.style.left = '20px';
highScoreElement.style.color = 'white';
highScoreElement.style.fontSize = '24px';
highScoreElement.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
document.body.appendChild(highScoreElement);

let highScore = localStorage.getItem('highScore') || 0;

const assets = {
    background: new Image(),
    sounds: {
        background: new Audio('bg_music.mp3'),
        watermelon: new Audio('Impact-Watermelon.wav'),
        orange: new Audio('Impact-Orange.wav'),
        apple: new Audio('Impact-Apple.wav'),
        banana: new Audio('Impact-Banana.wav'),
        strawberry: new Audio('Impact-Strawberry.wav'),
        bomb: new Audio('Bomb-explode.wav')
    }
};

console.log("Assets:", assets);

Object.values(assets.sounds).forEach(sound => {
    sound.addEventListener('error', (e) => {
        console.error('Error loading sound:', e);
    });
});

document.getElementById('playAgainBtn')?.addEventListener('click', () => {
    resetGame();
});

document.getElementById('mainMenuBtn')?.addEventListener('click', () => {
    window.location.href = 'index.html';
});


function setupCanvas() {
    const windowWidth = window.innerWidth * 0.8;
    const windowHeight = window.innerHeight * 0.8;
    
    if (windowWidth / windowHeight > 4/3) {
        canvas.height = windowHeight;
        canvas.width = windowHeight * (4/3);
    } else {
        canvas.width = windowWidth;
        canvas.height = windowWidth * (3/4);
    }
}

setupCanvas();

assets.background.src = 'bg_game.png';


let score = 0;
let lives = 5;
let fruits = [];
let mouseTrail = [];
let gameActive = true;
let powerSwordActive = false;
let powerSwordTimer = null;
let nextPowerSwordScore = 100;
let consecutiveMisses = 0;

const fruitTypes = [
    { 
        type: 'watermelon', 
        color: '#2D5A27',
        pulpColor: '#FF3B3F',
        radius: 30, 
        points: 20
    },
    { 
        type: 'orange', 
        color: '#FFA500',
        pulpColor: '#FFD700',
        radius: 20, 
        points: 15
    },
    { 
        type: 'apple', 
        color: '#FF0000',
        pulpColor: '#FFEBCD',
        radius: 22, 
        points: 10,
        stemColor: '#4A2910'
    },
    { 
        type: 'banana',
        color: '#FFE135',
        pulpColor: '#FFFAFA',
        radius: 25,
        points: 25
    },
    {
        type: 'strawberry',
        color: '#FF0000',
        pulpColor: '#FFCCCB',
        radius: 18,
        points: 40
    },
    { 
        type: 'bomb', 
        color: '#000000',
        radius: 20, 
        points: -1
    }
];

let lastMouseX = 0;
let lastMouseY = 0;
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    mouseTrail.push({ x: mouseX, y: mouseY });
    if (mouseTrail.length > 10) {
        mouseTrail.shift();
    }
});

class Fruit {
    constructor(type) {
        this.type = type.type;
        this.color = type.color;
        this.pulpColor = type.pulpColor;
        this.stemColor = type.stemColor;
        this.points = type.points;
        this.radius = type.radius;
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 50;
        this.velocityX = (Math.random() - 0.5) * 4;
        this.velocityY = -10 - Math.random() * 3;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.gravity = 0.20;
        this.sliced = false;
        this.sliceAngle = Math.random() * Math.PI * 2;
        this.sliceOffset = 0;
    }

    update() {
        this.velocityY += this.gravity;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.rotation += this.rotationSpeed;
       
    }

    drawFruit(ctx, x, y, offset = 0) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'watermelon') {
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.strokeStyle = '#1A472A';
                ctx.lineWidth = 2;
                ctx.moveTo(x - this.radius, y + i * 8);
                ctx.lineTo(x + this.radius, y + i * 8);
                ctx.stroke();
            }
        }

        if (this.type === 'apple') {
            ctx.beginPath();
            ctx.strokeStyle = this.stemColor;
            ctx.lineWidth = 3;
            ctx.moveTo(x, y - this.radius);
            ctx.lineTo(x + 5, y - this.radius - 8);
            ctx.stroke();
        }

        if (this.sliced && this.type !== 'bomb') {
            ctx.beginPath();
            ctx.fillStyle = this.pulpColor;
            ctx.arc(x, y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.type === 'bomb') {
            ctx.beginPath();
            ctx.strokeStyle = '#brown';
            ctx.lineWidth = 3;
            ctx.moveTo(x, y - this.radius);
            ctx.lineTo(x + 5, y - this.radius - 10);
            ctx.stroke();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.sliced) {
            this.drawFruit(ctx, -this.sliceOffset, 0);
            this.drawFruit(ctx, +this.sliceOffset, 0);
        } else {
            this.drawFruit(ctx, 0, 0);
        }

        ctx.restore();
    }

    checkSlice() {
        if (this.sliced) return false;
        
        for (let i = 1; i < mouseTrail.length; i++) {
            const dx = mouseTrail[i].x - this.x;
            const dy = mouseTrail[i].y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.radius) {
                this.sliced = true;
                assets.sounds[this.type].play();
                let points = this.points;
                if (powerSwordActive) {
                    points *= 2;
                }
                score += points;
                return true;
            }
        }
        return false;
    }
}


async function gameOver() {
    if (!gameActive) return;
    
    gameActive = false;

    const user = auth.currentUser;
    if (user) {
        try {
            const userEmail = user.email;
            const scoreDoc = {
                email: userEmail,
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('scores').add(scoreDoc);
            
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }
        } catch (error) {
            console.error("Error saving score:", error);
        }
    }
    
    window.location.href = 'leaderboard.html';
}

function handleMissedFruit() {
    consecutiveMisses++;
    lives--;
    livesElement.textContent = `Lives: ${lives}`;
    
    if (lives <= 0) {
        lives = 0;
        livesElement.textContent = `Lives: ${lives}`;
        gameOver();
    }
}


function resetConsecutiveMisses() {
    consecutiveMisses = 0;
}

function resetGame() {
    score = 0;
    lives = 5;
    fruits = [];
    gameActive = true;
    consecutiveMisses = 0;
    powerSwordActive = false;
    nextPowerSwordScore = 100;

    gameOverElement.style.display = 'none';
    scoreElement.textContent = `Score: ${score}`;
    livesElement.textContent = `Lives: ${lives}`;
    highScoreElement.textContent = `High Score: ${highScore}`;
    
    cancelAnimationFrame(animationFrameId);
    clearTimeout(spawnTimeoutId);
    spawnFruit();
    update();
}

let animationFrameId;
let spawnTimeoutId;

function update() {
    if (!gameActive) {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            highScoreElement.textContent = `High Score: ${highScore}`;
        }
        gameOverElement.style.display = 'block';
        return;
    }

    console.log("Update running, fruits length:", fruits.length);

    if (!ctx) {
        console.error("Canvas context is null!");
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (assets.background.complete) {
        ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
    } else {
        console.log("Background image not loaded yet");
    }

    if (mouseTrail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 10;
        ctx.moveTo(mouseTrail[0].x, mouseTrail[0].y);
        for (let i = 1; i < mouseTrail.length; i++) {
            ctx.lineTo(mouseTrail[i].x, mouseTrail[i].y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    for (let i = fruits.length - 1; i >= 0; i--) {
        const fruit = fruits[i];
        fruit.update();

        if (fruit.y > canvas.height + 100 && !fruit.sliced) {
            if (fruit.type !== 'bomb') {
                handleMissedFruit();
            }
            fruits.splice(i, 1);
            continue;
        }

        if (fruit.checkSlice()) {
            if (fruit.type === 'bomb') {
                gameOver();
            } else {
                resetConsecutiveMisses();
                scoreElement.textContent = `Score: ${score}`;
            }
        }

        fruit.draw();
    }
    
    animationFrameId = requestAnimationFrame(update);
}

function spawnFruit() {
    if (!gameActive) return;
    console.log("Spawning fruit...");
    const randomType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
    console.log("Selected fruit type:", randomType);
    const fruit = new Fruit(randomType);
    console.log("Created fruit:", fruit);
    fruits.push(fruit);

    let spawnDelay = 2000;
    if (score > 200) spawnDelay = 1500;
    if (score > 500) spawnDelay = 1200;
    if (score > 1000) spawnDelay = 1000;
    spawnDelay += Math.random() * 500;
    spawnTimeoutId = setTimeout(spawnFruit, 2000 + Math.random() * 1000);
}

function initializeGame() {
    assets.sounds.background = new Audio('bg_music.mp3');
    assets.sounds.background.loop = true;
    assets.sounds.background.volume = 0.3;
    document.addEventListener('click', function startAudio() {
        assets.sounds.background.play()
            .catch(e => console.log("Audio play failed:", e));
        document.removeEventListener('click', startAudio);
    }, { once: true });
    highScoreElement.textContent = `High Score: ${highScore}`;
    spawnFruit();
    update();
}

function toggleBackgroundMusic() {
    if (assets.sounds.background.paused) {
        assets.sounds.background.play();
    } else {
        assets.sounds.background.pause();
    }
}
document.addEventListener('keypress', (e) => {
    if (e.key === 'm' || e.key === 'M') {
        toggleBackgroundMusic();
    }
});

function pauseGame() {
    gameActive = false;
    assets.sounds.background.pause();
}

function resumeGame() {
    gameActive = true;
    assets.sounds.background.play();
}

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouseX = touch.clientX - rect.left;
    mouseY = touch.clientY - rect.top;

    mouseTrail.push({ x: mouseX, y: mouseY });
    if (mouseTrail.length > 10) {
        mouseTrail.shift();
    }
});

assets.background.addEventListener('error', (e) => {
    console.error('Error loading background image:', e);
});

window.addEventListener('load', () => {
    setupCanvas();
    initializeGame();
});

window.addEventListener('resize', setupCanvas);

canvas.addEventListener('click', () => {
    if (!gameActive) {
        resetGame();
    }
});

initializeGame();