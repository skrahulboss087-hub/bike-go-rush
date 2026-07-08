/**
 * Bike Go Rush Engine - v3.0 (Coin Height Fix & Mega Jackpot Update)
 * Powered by SA GAMEZ
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Central Screen State Manager ---
function switchScreen(screenId) {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';
    document.getElementById('pause-screen').style.display = 'none';
    
    if (screenId === null) {
        document.getElementById('hud-pause-btn').style.visibility = 'visible';
    } else {
        document.getElementById('hud-pause-btn').style.visibility = 'hidden';
    }

    if (screenId) {
        document.getElementById(screenId).style.display = 'flex';
    }
}

// --- Gameplay Vectors ---
let gameState = 'MENU';
let score = 0;
let runCoins = 0;
let gameSpeed = 5;
let speedLevel = 1;
const gravity = 0.55;
const groundY = 500; 

// --- Jackpot Alert System Timer ---
let jackpotActiveTimer = 0;

// --- Offline Save Mechanics ---
let totalCoins = parseInt(localStorage.getItem('bgr_coins')) || 0;
let highScore = parseInt(localStorage.getItem('bgr_highscore')) || 0;
let unlockedBikes = JSON.parse(localStorage.getItem('bgr_unlocked')) || [0]; 
let currentBikeIndex = parseInt(localStorage.getItem('bgr_current_bike')) || 0;

// --- 7 Premium Bikes Database ---
const bikesData = [
    { name: "Alpha Rider", price: 0, color: "#00f5ff", jumpForce: 11.5, desc: "Classic Cyber Sport" },
    { name: "Neon Pulse", price: 40, color: "#ff0055", jumpForce: 12.0, desc: "Aero Drag Racer" },
    { name: "Cyber Ghost", price: 120, color: "#e2e2e2", jumpForce: 12.5, desc: "Futuristic Stealth Mode" },
    { name: "Ninja Blade", price: 300, color: "#39ff14", jumpForce: 13.0, desc: "Aggressive Superbike" },
    { name: "Nitro Beast", price: 600, color: "#ff6700", jumpForce: 13.5, desc: "Heavy Chopper V-Twin" },
    { name: "Rogue Titan", price: 1000, color: "#9400d3", jumpForce: 14.0, desc: "Armored Shield Cruiser" },
    { name: "Apex Phantom", price: 2000, color: "#ffd700", jumpForce: 14.8, desc: "Legendary Hyper-Wing" }
];

let bike = {
    x: 60, 
    y: groundY - 40,
    width: 60,  
    height: 38, 
    vy: 0,
    isJumping: false,
    color: "#00f5ff",
    jumpForce: 11.5
};

let obstacles = []; let coins = []; let particles = [];
let spawnTimer = 0; let coinTimer = 0; let speedIncrementTimer = 0;

// --- HUD UI Synchronizer ---
function updateHUD() {
    document.getElementById('live-score').innerText = String(Math.floor(score)).padStart(5, '0');
    document.getElementById('live-coins').innerText = totalCoins + runCoins;
    document.getElementById('hud-highscore').innerText = String(highScore).padStart(5, '0');
    document.getElementById('menu-highscore').innerText = highScore;
    document.getElementById('menu-coins').innerText = totalCoins;
    document.getElementById('speed-text').innerText = `SPD: ${speedLevel}X`;
}

// --- Input Controls ---
window.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'ArrowUp') && gameState === 'PLAYING') {
        e.preventDefault(); jump();
    }
});
canvas.addEventListener('touchstart', (e) => {
    if (gameState === 'PLAYING') {
        e.preventDefault(); 
        jump();
    }
}, { passive: false });
canvas.addEventListener('mousedown', () => {
    if (gameState === 'PLAYING') jump();
});

function jump() {
    if (!bike.isJumping) {
        bike.vy = -bike.jumpForce;
        bike.isJumping = true;
    }
}

// --- Pause Engine Feature ---
function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        switchScreen('pause-screen');
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        switchScreen(null);
    }
}

// --- Navigation Layout System ---
function toMenu() {
    gameState = 'MENU';
    switchScreen('menu-screen');
    updateHUD();
}

function openShop() {
    switchScreen('shop-screen');
    renderShop();
}

function closeShop() {
    switchScreen('menu-screen');
    updateHUD();
}

// --- Garage Customization Module ---
function renderShop() {
    document.getElementById('shop-coins').innerText = totalCoins;
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';

    bikesData.forEach((b, index) => {
        const isUnlocked = unlockedBikes.includes(index);
        const isSelected = currentBikeIndex === index;
        
        let btnText = isUnlocked ? "SELECT" : `🪙 ${b.price}`;
        let btnStyle = isUnlocked ? "background:#334155;color:#fff;" : "background:#ffd700;color:#000;";
        if (isSelected) { btnText = "EQUIPPED"; btnStyle = "background:#22c55e;color:#000;"; }

        const card = document.createElement('div');
        card.className = `shop-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
            <div class="bike-info-panel">
                <div class="bike-name-text" style="color:${b.color}">🏍️ ${b.name}</div>
                <div class="bike-stat-text">${b.desc} | POW: ${Math.floor(b.jumpForce * 10)}</div>
            </div>
            <button class="menu-btn shop-buy-btn" style="${btnStyle}" 
                onclick="buyOrSelectBike(${index})" ${isSelected ? 'disabled' : ''}>
                ${btnText}
            </button>
        `;
        grid.appendChild(card);
    });
}

function buyOrSelectBike(index) {
    const bikeInfo = bikesData[index];
    if (unlockedBikes.includes(index)) {
        currentBikeIndex = index;
        localStorage.setItem('bgr_current_bike', currentBikeIndex);
    } else {
        if (totalCoins >= bikeInfo.price) {
            totalCoins -= bikeInfo.price;
            unlockedBikes.push(index);
            currentBikeIndex = index;
            localStorage.setItem('bgr_coins', totalCoins);
            localStorage.setItem('bgr_unlocked', JSON.stringify(unlockedBikes));
            localStorage.setItem('bgr_current_bike', currentBikeIndex);
        } else {
            alert("NOT ENOUGH COINS!");
        }
    }
    renderShop();
}

// --- Game Life-Cycle ---
function startGame() {
    switchScreen(null); 
    gameState = 'PLAYING';
    
    score = 0; runCoins = 0; gameSpeed = 5; speedLevel = 1; jackpotActiveTimer = 0;
    obstacles = []; coins = []; particles = [];
    spawnTimer = 0; coinTimer = 0; speedIncrementTimer = 0;

    const selected = bikesData[currentBikeIndex];
    bike.color = selected.color;
    bike.jumpForce = selected.jumpForce;
    bike.y = groundY - bike.height;
    bike.vy = 0;
    bike.isJumping = false;
    updateHUD();
}

function gameOver() {
    gameState = 'GAMEOVER';
    totalCoins += runCoins;
    
    document.getElementById('new-record-tag').style.display = 'none';
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('bgr_highscore', highScore);
        document.getElementById('new-record-tag').style.display = 'block';
    }
    localStorage.setItem('bgr_coins', totalCoins);

    document.getElementById('final-score').innerText = Math.floor(score);
    document.getElementById('final-coins').innerText = runCoins;
    
    switchScreen('gameover-screen'); 
    updateHUD();
}

// --- Vector Bike Custom Drawing Config ---
function drawCustomBike(x, y, index, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;

    // 1. Tyres
    ctx.fillStyle = "#05060b";
    ctx.beginPath(); ctx.arc(x + 14, y + bike.height - 11, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + bike.width - 14, y + bike.height - 11, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x+14, y+bike.height-22); ctx.lineTo(x+14, y+bike.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+bike.width-14, y+bike.height-22); ctx.lineTo(x+bike.width-14, y+bike.height); ctx.stroke();

    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    // 2. Custom Chassis Core Logic
    switch(index) {
        case 0: 
            ctx.fillRect(x + 10, y + 10, bike.width - 20, 14); 
            ctx.fillRect(x + bike.width - 22, y + 2, 7, 12); 
            ctx.fillStyle = "#fff"; ctx.fillRect(x + bike.width - 18, y, 6, 3); 
            break;
        case 1: 
            ctx.beginPath(); ctx.moveTo(x + 6, y + 20); ctx.lineTo(x + bike.width - 12, y + 6); ctx.lineTo(x + bike.width - 6, y + 24); ctx.lineTo(x + 6, y + 24); ctx.fill();
            ctx.fillRect(x + 4, y + 5, 5, 15); 
            break;
        case 2: 
            ctx.fillRect(x + 6, y + 12, 16, 12); ctx.fillRect(x + 34, y + 12, 20, 12); 
            ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 20, y + 18); ctx.lineTo(x + 36, y + 18); ctx.stroke();
            break;
        case 3: 
            ctx.beginPath(); ctx.moveTo(x + 5, y + 8); ctx.lineTo(x + bike.width - 8, y + 2); ctx.lineTo(x + bike.width - 18, y + 24); ctx.lineTo(x + 5, y + 24); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.fillRect(x + bike.width - 14, y + 4, 8, 3); 
            break;
        case 4: 
            ctx.fillRect(x + 8, y + 15, 32, 11); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 30, y + 16); ctx.lineTo(x + bike.width - 10, y - 1); ctx.stroke();
            ctx.fillRect(x + bike.width - 14, y - 3, 8, 4); 
            break;
        case 5: 
            ctx.fillRect(x + 4, y + 4, bike.width - 12, 22); ctx.style = "#1e293b"; ctx.fillRect(x + 16, y + 8, 20, 10); 
            break;
        case 6: 
            ctx.fillRect(x + 8, y + 10, bike.width - 16, 14); ctx.fillStyle = "rgba(255, 215, 0, 0.4)"; ctx.beginPath(); ctx.moveTo(x + 12, y + 10); ctx.lineTo(x - 4, y - 4); ctx.lineTo(x + 22, y + 10); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.fillRect(x + bike.width - 14, y + 8, 6, 6);
            break;
    }

    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(x + 14, y + bike.height - 11, 3, 0, Math.PI * 2); ctx.arc(x + bike.width - 14, y + bike.height - 11, 3, 0, Math.PI * 2); ctx.fill();
}

// --- Main Engine Refresh Loop ---
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render Neon Track Ground Line
    ctx.strokeStyle = "#ff0055"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(canvas.width, groundY); ctx.stroke();

    if (gameState === 'PLAYING') {
        speedIncrementTimer++;
        if (speedIncrementTimer % 600 === 0) { 
            gameSpeed += 0.6;
            speedLevel += 1;
        }

        score += 0.15;
        bike.vy += gravity; bike.y += bike.vy;

        if (bike.y >= groundY - bike.height) {
            bike.y = groundY - bike.height;
            bike.vy = 0;
            bike.isJumping = false;
        }

        // Exhaust Fire Stream
        if(Math.random() < 0.4) {
            particles.push({x: bike.x, y: bike.y + bike.height - 14, size: Math.random()*5+2, alpha: 1});
            if(currentBikeIndex === 4) {
                particles.push({x: bike.x, y: bike.y + bike.height - 22, size: Math.random()*4+1, alpha: 1});
            }
        }

        // Obstacles Generation
        spawnTimer--;
        if (spawnTimer <= 0) {
            let obsH = Math.random() * 25 + 25;
            obstacles.push({ x: canvas.width, y: groundY - obsH, width: 20, height: obsH });
            spawnTimer = Math.random() * 90 + 60 - (gameSpeed * 2);
        }

        // --- CRITICAL FIXED: Reachable Coins & Jackpot Spawner ---
        coinTimer--;
        if (coinTimer <= 0) {
            let isJackpot = Math.random() < 0.07; // 7% Chance to spawn a Jackpot item
            
            if (isJackpot) {
                // Jackpot Coin is bigger and placed perfectly mid-air
                coins.push({ x: canvas.width, y: groundY - 70, size: 15, isJackpot: true, collected: false });
            } else {
                // Regular coin: math constraints ensure height is between Y=400 and Y=460 (100% collectable by all bikes)
                let safeCoinY = groundY - (Math.random() * 65 + 20); 
                coins.push({ x: canvas.width, y: safeCoinY, size: 7, isJackpot: false, collected: false });
            }
            coinTimer = Math.random() * 80 + 40;
        }
        updateHUD();
    }

    // Draw Tail Exhaust Particles
    particles.forEach((p, idx) => {
        if (gameState === 'PLAYING') p.x -= gameSpeed - 1; 
        p.alpha -= 0.05;
        ctx.fillStyle = bike.color; ctx.globalAlpha = p.alpha;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
        if(p.alpha <= 0) particles.splice(idx, 1);
    });
    ctx.globalAlpha = 1.0;

    // Render Bike
    drawCustomBike(bike.x, bike.y, currentBikeIndex, bike.color);

    // Process Barriers & Collisions
    obstacles.forEach((obs, index) => {
        if (gameState === 'PLAYING') {
            obs.x -= gameSpeed;
            if (bike.x < obs.x + obs.width && bike.x + bike.width > obs.x &&
                bike.y < obs.y + obs.height && bike.y + bike.height > obs.y) {
                gameOver();
            }
        }

        ctx.fillStyle = "#ff0055";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        if (obs.x + obs.width < 0) obstacles.splice(index, 1);
    });

    // Process Coins & Mega Jackpot Hitbox
    coins.forEach((coin, index) => {
        if (gameState === 'PLAYING') {
            coin.x -= gameSpeed;

            let distX = Math.abs(coin.x - (bike.x + bike.width / 2));
            let distY = Math.abs(coin.y - (bike.y + bike.height / 2));

            if (distX < (bike.width / 2 + coin.size) && distY < (bike.height / 2 + coin.size)) {
                coin.collected = true; 
                if (coin.isJackpot) {
                    runCoins += 50; // Mega Loot!
                    jackpotActiveTimer = 90; // Flash notice for 90 frames (~1.5 seconds)
                } else {
                    runCoins++;
                }
            }
        }

        if (!coin.collected) {
            if (coin.isJackpot) {
                // Draw Mega Flashing Jackpot Golden Coin
                let flashColor = Math.floor(Date.now() / 100) % 2 === 0 ? "#ffd700" : "#ffaa00";
                ctx.fillStyle = flashColor;
                ctx.beginPath(); ctx.arc(coin.x, coin.y, coin.size, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
                
                ctx.fillStyle = "#000"; ctx.font = "bold 9px sans-serif";
                ctx.fillText("777", coin.x - 8, coin.y + 3);
            } else {
                // Draw Normal Reachable Coin
                ctx.fillStyle = "#ffd700";
                ctx.beginPath(); ctx.arc(coin.x, coin.y, coin.size, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#000"; ctx.font = "bold 9px sans-serif";
                ctx.fillText("$", coin.x - 3, coin.y + 3);
            }
        }
        if (coin.x + coin.size < 0 || coin.collected) coins.splice(index, 1);
    });

    // --- Draw Floating Live Jackpot Text Banner ---
    if (jackpotActiveTimer > 0) {
        jackpotActiveTimer--;
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        
        // Neon text outer glow shadow effects
        ctx.shadowColor = "#ffaa00";
        ctx.shadowBlur = 12;
        ctx.fillText("✨ JACKPOT! +50 🪙 ✨", canvas.width / 2, 240);
        
        // Reset canvas context config defaults safely
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
    }

    requestAnimationFrame(loop);
}

// --- Initial Boot Trigger ---
toMenu();
loop();
