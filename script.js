// Game configuration and constants
const GAME_CONFIG = {
    BALL_SPEED_INCREASE: 0.2,
    INITIAL_BALL_SPEED: 3,
    MAX_BALL_SPEED: 12,
    PADDLE_SPEED: 8,
    SCORE_PER_HIT: 10,
    CLICK_TEST_DURATION: 10 // seconds
};

// Game state management
class GameState {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.gameStartTime = 0;
        this.currentGame = 'menu'; // 'menu', 'pong', 'clickSpeed', 'reactionTime'
    }

    // Load high score from localStorage
    loadHighScore() {
        return parseInt(localStorage.getItem('neonPongHighScore')) || 0;
    }

    // Save high score to localStorage
    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neonPongHighScore', this.highScore.toString());
            return true;
        }
        return false;
    }

    // Reset game state
    reset() {
        this.score = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.gameStartTime = 0;
    }
}

// Click Speed Test Game State
class ClickSpeedState {
    constructor() {
        this.isRunning = false;
        this.clickCount = 0;
        this.timeLeft = GAME_CONFIG.CLICK_TEST_DURATION;
        this.highScore = this.loadHighScore();
        this.timer = null;
    }

    loadHighScore() {
        return parseInt(localStorage.getItem('neonClickSpeedHighScore')) || 0;
    }

    saveHighScore() {
        if (this.clickCount > this.highScore) {
            this.highScore = this.clickCount;
            localStorage.setItem('neonClickSpeedHighScore', this.highScore.toString());
            return true;
        }
        return false;
    }

    reset() {
        this.isRunning = false;
        this.clickCount = 0;
        this.timeLeft = GAME_CONFIG.CLICK_TEST_DURATION;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

// Reaction Time Test Game State
class ReactionTimeState {
    constructor() {
        this.isRunning = false;
        this.isWaiting = false;
        this.isReady = false;
        this.startTime = 0;
        this.reactionTime = 0;
        this.lastTime = 0;
        this.bestTime = this.loadBestTime();
        this.timer = null;
        this.delayTimer = null;
    }

    loadBestTime() {
        const time = localStorage.getItem('neonReactionTimeBest');
        return time ? parseInt(time) : 0;
    }

    saveBestTime() {
        if (this.reactionTime > 0 && (this.bestTime === 0 || this.reactionTime < this.bestTime)) {
            this.bestTime = this.reactionTime;
            localStorage.setItem('neonReactionTimeBest', this.bestTime.toString());
            return true;
        }
        return false;
    }

    reset() {
        this.isRunning = false;
        this.isWaiting = false;
        this.isReady = false;
        this.startTime = 0;
        this.reactionTime = 0;
        this.lastTime = 0;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.delayTimer) {
            clearTimeout(this.delayTimer);
            this.delayTimer = null;
        }
    }
}

// Ball class with enhanced physics
class Ball {
    constructor(canvas) {
        this.canvas = canvas;
        this.radius = 8;
        this.reset();
    }

    reset() {
        this.x = this.canvas.width / 2;
        this.y = this.canvas.height / 2;
        this.speed = GAME_CONFIG.INITIAL_BALL_SPEED;
        this.dx = this.speed * (Math.random() > 0.5 ? 1 : -1);
        this.dy = -this.speed;
        this.trail = []; // For visual effects
    }

    update() {
        // Add current position to trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) {
            this.trail.shift();
        }

        // Update position
        this.x += this.dx;
        this.y += this.dy;

        // Wall collision detection
        this.handleWallCollision();
    }

    handleWallCollision() {
        // Left and right walls
        if (this.x - this.radius <= 0 || this.x + this.radius >= this.canvas.width) {
            this.dx = -this.dx;
            this.x = Math.max(this.radius, Math.min(this.canvas.width - this.radius, this.x));
        }

        // Top wall
        if (this.y - this.radius <= 0) {
            this.dy = -this.dy;
            this.y = this.radius;
        }
    }

    // Check if ball is below canvas (game over)
    isOutOfBounds() {
        return this.y - this.radius > this.canvas.height;
    }

    // Increase speed when hitting paddle
    increaseSpeed() {
        this.speed = Math.min(this.speed + GAME_CONFIG.BALL_SPEED_INCREASE, GAME_CONFIG.MAX_BALL_SPEED);
        // Recalculate velocity with new speed
        const angle = Math.atan2(this.dy, this.dx);
        this.dx = this.speed * Math.cos(angle);
        this.dy = this.speed * Math.sin(angle);
    }

    // Draw ball with trail effect
    draw(ctx) {
        // Draw trail
        this.trail.forEach((pos, index) => {
            const alpha = (index + 1) / this.trail.length * 0.3;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(78, 205, 196, ${alpha})`;
            ctx.fill();
        });

        // Draw main ball
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Create gradient for neon effect
        const gradient = ctx.createRadialGradient(
            this.x - this.radius/3, this.y - this.radius/3, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, '#4ecdc4');
        gradient.addColorStop(0.7, '#45b7d1');
        gradient.addColorStop(1, 'rgba(78, 205, 196, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = '#4ecdc4';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

// Paddle class with smooth movement
class Paddle {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 120;
        this.height = 12;
        this.speed = GAME_CONFIG.PADDLE_SPEED;
        this.reset();
    }

    reset() {
        this.x = this.canvas.width / 2 - this.width / 2;
        this.y = this.canvas.height - 40;
        this.dx = 0;
    }

    update() {
        // Update position
        this.x += this.dx;

        // Keep paddle within bounds
        this.x = Math.max(0, Math.min(this.canvas.width - this.width, this.x));
    }

    // Handle keyboard input
    handleInput(keys) {
        this.dx = 0;
        if (keys.left) this.dx = -this.speed;
        if (keys.right) this.dx = this.speed;
    }

    // Check collision with ball
    checkCollision(ball) {
        return ball.x + ball.radius > this.x &&
               ball.x - ball.radius < this.x + this.width &&
               ball.y + ball.radius > this.y &&
               ball.y - ball.radius < this.y + this.height;
    }

    // Draw paddle with neon effect
    draw(ctx) {
        // Draw glow effect
        ctx.shadowColor = '#4ecdc4';
        ctx.shadowBlur = 20;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#4ecdc4');
        gradient.addColorStop(0.5, '#45b7d1');
        gradient.addColorStop(1, '#4ecdc4');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw border
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.shadowBlur = 0;
    }
}

// Main game class
class NeonPongGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game elements
        this.gameState = new GameState();
        this.clickSpeedState = new ClickSpeedState();
        this.reactionTimeState = new ReactionTimeState();
        this.ball = new Ball(this.canvas);
        this.paddle = new Paddle(this.canvas);
        
        // Input handling
        this.keys = { left: false, right: false };
        this.mouseActive = false;
        
        // UI elements
        this.startScreen = document.getElementById('startScreen');
        this.gameOverlay = document.getElementById('gameOverlay');
        this.gameSelection = document.getElementById('gameSelection');
        this.clickSpeedGame = document.getElementById('clickSpeedGame');
        this.currentScoreElement = document.getElementById('currentScore');
        this.highScoreElement = document.getElementById('highScore');
        this.finalScoreElement = document.getElementById('finalScore');
        this.scoreContainer = document.getElementById('scoreContainer');
        
        // Click Speed Test elements
        this.clickTimerElement = document.getElementById('clickTimer');
        this.clickCountElement = document.getElementById('clickCount');
        this.clickButton = document.getElementById('clickButton');
        this.clickResults = document.getElementById('clickResults');
        this.finalClickScoreElement = document.getElementById('finalClickScore');
        this.clickHighScoreElement = document.getElementById('clickHighScore');
        
        // Reaction Time Test elements
        this.reactionTimeGame = document.getElementById('reactionTimeGame');
        this.reactionScreen = document.getElementById('reactionScreen');
        this.reactionMessage = document.getElementById('reactionMessage');
        this.reactionStartBtn = document.getElementById('reactionStartBtn');
        this.reactionResults = document.getElementById('reactionResults');
        this.reactionTimeResult = document.getElementById('reactionTimeResult');
        this.reactionBestTimeResult = document.getElementById('reactionBestTimeResult');
        this.reactionBestTimeElement = document.getElementById('reactionBestTime');
        this.reactionLastTimeElement = document.getElementById('reactionLastTime');
        
        // Initialize
        this.init();
    }

    init() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Update high score display
        this.updateScoreDisplay();
        this.updateClickSpeedDisplay();
        this.updateReactionTimeDisplay();
        
        // Show game selection menu
        this.showGameSelection();
        
        // Hide score container on home screen
        this.scoreContainer.style.display = 'none';
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse events for paddle control (allow control even outside canvas)
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        
        // Button events
        document.getElementById('startBtn').addEventListener('click', () => this.startPongGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartPongGame());
        
        // Back to menu buttons
        document.getElementById('backToMenuFromPongBtn').addEventListener('click', () => this.showGameSelection());
        document.getElementById('backToMenuFromGameOverBtn').addEventListener('click', () => this.showGameSelection());
        document.getElementById('backToMenuFromClickSpeedBtn').addEventListener('click', () => this.showGameSelection());
        document.getElementById('backToMenuFromReactionBtn').addEventListener('click', () => this.showGameSelection());
        
        // Game selection events
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const game = e.currentTarget.dataset.game;
                this.selectGame(game);
            });
        });
        
        // Click Speed Test events
        this.clickButton.addEventListener('click', () => this.handleClickSpeedClick());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.restartClickSpeedGame());
        
        // Reaction Time Test events
        // Prevent the Start button from bubbling up to the reaction area
        this.reactionStartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.startReactionTest();
        });
        this.reactionScreen.addEventListener('click', () => this.handleReactionClick());
        document.getElementById('reactionPlayAgainBtn').addEventListener('click', () => this.restartReactionGame());
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Reset High Scores button
        const resetBtn = document.getElementById('resetScoresBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (!window.confirm('Are you sure you want to reset ALL high scores? This cannot be undone.')) return;
                localStorage.removeItem('neonPongHighScore');
                localStorage.removeItem('neonClickSpeedHighScore');
                localStorage.removeItem('neonReactionTimeBest');
                // Reset in-memory values
                this.gameState.highScore = 0;
                this.clickSpeedState.highScore = 0;
                this.reactionTimeState.bestTime = 0;
                // Update UI
                this.updateScoreDisplay();
                this.updateClickSpeedHighScoreDisplay();
                this.updateReactionTimeHighScoreDisplay();
                alert('All Neon Games high scores have been reset!');
            });
        }
    }

    handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'Left':
                this.keys.left = true;
                break;
            case 'ArrowRight':
            case 'Right':
                this.keys.right = true;
                break;
            case ' ':
                e.preventDefault();
                if (this.gameState.currentGame === 'pong' && !this.gameState.isRunning) {
                    this.startPongGame();
                }
                break;
        }
    }

    handleKeyUp(e) {
        switch(e.key) {
            case 'ArrowLeft':
            case 'Left':
                this.keys.left = false;
                break;
            case 'ArrowRight':
            case 'Right':
                this.keys.right = false;
                break;
        }
    }

    // Handle mouse movement for paddle control
    handleMouseMove(e) {
        if (!this.gameState.isRunning || this.gameState.currentGame !== 'pong') return;
        this.mouseActive = true;
        const rect = this.canvas.getBoundingClientRect();
        // Clamp mouseX to the canvas area, but allow control even if mouse is outside
        let mouseX = e.clientX - rect.left;
        // If mouse is left of canvas, set to 0; if right, set to canvas.width
        if (e.clientX < rect.left) mouseX = 0;
        if (e.clientX > rect.right) mouseX = this.canvas.width;
        // Center the paddle on the mouse cursor
        this.paddle.x = mouseX - this.paddle.width / 2;
        // Keep paddle within canvas bounds
        this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x));
    }

    // Handle mouse click to start game
    handleMouseDown(e) {
        if (this.gameState.currentGame === 'pong' && !this.gameState.isRunning && this.startScreen.classList.contains('hidden')) {
            this.startPongGame();
        }
    }

    // Game selection methods
    selectGame(game) {
        this.gameState.currentGame = game;
        
        if (game === 'pong') {
            this.showPongGame();
        } else if (game === 'clickSpeed') {
            this.showClickSpeedGame();
        } else if (game === 'reactionTime') {
            this.showReactionTimeGame();
        }
    }

    showGameSelection() {
        this.hideAllScreens();
        this.gameSelection.classList.remove('hidden');
        this.gameState.currentGame = 'menu';
        
        // Hide score container on home screen
        this.scoreContainer.style.display = 'none';
    }

    showPongGame() {
        this.hideAllScreens();
        this.startScreen.classList.remove('hidden');
        this.gameState.currentGame = 'pong';
        
        // Show score container and update with Pong high score
        this.scoreContainer.style.display = 'flex';
        this.updateScoreDisplay();
    }

    showClickSpeedGame() {
        this.hideAllScreens();
        this.clickSpeedGame.classList.remove('hidden');
        this.gameState.currentGame = 'clickSpeed';
        this.updateClickSpeedDisplay();
        
        // Show score container and update with Click Speed high score
        this.scoreContainer.style.display = 'flex';
        this.updateClickSpeedHighScoreDisplay();
        
        // Ensure button is enabled when game is loaded
        this.clickButton.disabled = false;
        this.clickButton.style.opacity = '1';
        this.clickButton.style.cursor = 'pointer';
    }

    showReactionTimeGame() {
        this.hideAllScreens();
        this.reactionTimeGame.classList.remove('hidden');
        this.gameState.currentGame = 'reactionTime';
        this.updateReactionTimeDisplay();
        
        // Show score container and update with Reaction Time high score
        this.scoreContainer.style.display = 'flex';
        this.updateReactionTimeHighScoreDisplay();
        
        // Ensure button is enabled when game is loaded
        this.reactionStartBtn.disabled = false;
        this.reactionStartBtn.style.opacity = '1';
        this.reactionStartBtn.style.cursor = 'pointer';
    }

    hideAllScreens() {
        this.startScreen.classList.add('hidden');
        this.gameOverlay.classList.add('hidden');
        this.gameSelection.classList.add('hidden');
        this.clickSpeedGame.classList.add('hidden');
        this.reactionTimeGame.classList.add('hidden');
    }

    // Pong Game methods
    startPongGame() {
        this.gameState.isRunning = true;
        this.gameState.gameStartTime = Date.now();
        this.hideStartScreen();
        this.gameLoop();
    }

    restartPongGame() {
        this.gameState.reset();
        this.ball.reset();
        this.paddle.reset();
        this.updateScoreDisplay();
        this.hideGameOver();
        this.showPongGame();
    }

    pongGameOver() {
        this.gameState.isRunning = false;
        
        // Update high score
        const newHighScore = this.gameState.saveHighScore();
        
        // Update final score display
        this.finalScoreElement.textContent = this.gameState.score;
        this.updateScoreDisplay();
        
        // Show game over screen
        this.showGameOver();
        
        // Add celebration effect for new high score
        if (newHighScore) {
            this.celebrateNewHighScore();
        }
    }

    celebrateNewHighScore() {
        // Add visual celebration effect
        const title = document.querySelector('.overlay-title');
        title.textContent = 'NEW HIGH SCORE!';
        title.style.color = '#ff6b6b';
        title.style.animation = 'neonGlow 0.5s ease-in-out infinite';
        
        setTimeout(() => {
            title.textContent = 'GAME OVER';
            title.style.animation = '';
        }, 3000);
    }

    // Click Speed Test methods
    handleClickSpeedClick() {
        if (!this.clickSpeedState.isRunning) {
            this.startClickSpeedTest();
        } else {
            this.clickSpeedState.clickCount++;
            this.updateClickSpeedDisplay();
        }
    }

    startClickSpeedTest() {
        this.clickSpeedState.isRunning = true;
        this.clickSpeedState.clickCount = 1; // First click
        this.clickSpeedState.timeLeft = GAME_CONFIG.CLICK_TEST_DURATION;
        this.updateClickSpeedDisplay();
        this.updateClickSpeedHighScoreDisplay();
        
        // Hide results if showing
        this.clickResults.style.display = 'none';
        
        // Enable the click button
        this.clickButton.disabled = false;
        this.clickButton.style.opacity = '1';
        this.clickButton.style.cursor = 'pointer';
        
        // Start timer
        this.clickSpeedState.timer = setInterval(() => {
            this.clickSpeedState.timeLeft--;
            this.updateClickSpeedDisplay();
            this.currentScoreElement.textContent = this.clickSpeedState.clickCount;
            
            if (this.clickSpeedState.timeLeft <= 0) {
                this.endClickSpeedTest();
            }
        }, 1000);
    }

    endClickSpeedTest() {
        this.clickSpeedState.isRunning = false;
        clearInterval(this.clickSpeedState.timer);
        
        // Disable the click button
        this.clickButton.disabled = true;
        this.clickButton.style.opacity = '0.5';
        this.clickButton.style.cursor = 'not-allowed';
        
        // Update high score
        const newHighScore = this.clickSpeedState.saveHighScore();
        
        // Update header display
        this.updateClickSpeedHighScoreDisplay();
        
        // Show results
        this.finalClickScoreElement.textContent = this.clickSpeedState.clickCount;
        this.clickHighScoreElement.textContent = this.clickSpeedState.highScore;
        this.clickResults.style.display = 'block';
        
        // Celebration for new high score
        if (newHighScore) {
            this.celebrateClickSpeedHighScore();
        }
    }

    celebrateClickSpeedHighScore() {
        const resultsTitle = document.querySelector('.results-title');
        resultsTitle.textContent = 'NEW HIGH SCORE!';
        resultsTitle.style.color = '#ff6b6b';
        resultsTitle.style.animation = 'neonGlow 0.5s ease-in-out infinite';
        
        setTimeout(() => {
            resultsTitle.textContent = 'RESULTS';
            resultsTitle.style.animation = '';
        }, 3000);
    }

    restartClickSpeedGame() {
        this.clickSpeedState.reset();
        this.updateClickSpeedDisplay();
        this.updateClickSpeedHighScoreDisplay();
        this.clickResults.style.display = 'none';
        
        // Re-enable the click button
        this.clickButton.disabled = false;
        this.clickButton.style.opacity = '1';
        this.clickButton.style.cursor = 'pointer';
    }

    updateClickSpeedDisplay() {
        this.clickTimerElement.textContent = this.clickSpeedState.timeLeft;
        this.clickCountElement.textContent = this.clickSpeedState.clickCount;
        this.clickHighScoreElement.textContent = this.clickSpeedState.highScore;
    }

    updateClickSpeedHighScoreDisplay() {
        this.highScoreElement.textContent = this.clickSpeedState.highScore;
        this.currentScoreElement.textContent = '0';
    }

    // --- Reaction Time Test methods ---
    startReactionTest() {
        // Reset state and UI
        this.reactionTimeState.reset();
        this.reactionTimeState.isRunning = true;
        this.reactionTimeState.isWaiting = true;
        this.reactionTimeState.isReady = false;

        // Hide results if showing
        this.reactionResults.style.display = 'none';

        // Update UI to waiting state
        this.reactionScreen.classList.add('waiting');
        this.reactionScreen.classList.remove('ready');
        this.reactionMessage.textContent = 'Wait for the screen to turn green...';
        this.reactionMessage.className = 'reaction-message';
        this.reactionStartBtn.style.display = 'none';

        // Random delay between 2-5 seconds
        const delay = Math.random() * 3000 + 2000; // 2000-5000ms
        this.reactionTimeState.delayTimer = setTimeout(() => {
            this.makeReactionReady();
        }, delay);
    }

    makeReactionReady() {
        this.reactionTimeState.isWaiting = false;
        this.reactionTimeState.isReady = true;
        this.reactionTimeState.startTime = Date.now();

        // Update UI to ready state
        this.reactionScreen.classList.remove('waiting');
        this.reactionScreen.classList.add('ready');
        this.reactionMessage.textContent = 'CLICK NOW!';
        this.reactionMessage.className = 'reaction-message ready';
    }

    handleReactionClick() {
        if (!this.reactionTimeState.isRunning) return;

        if (this.reactionTimeState.isWaiting) {
            // Clicked too soon
            this.reactionTimeState.isRunning = false;
            this.reactionTimeState.isWaiting = false;
            this.reactionTimeState.isReady = false;
            if (this.reactionTimeState.delayTimer) {
                clearTimeout(this.reactionTimeState.delayTimer);
            }
            // Show too soon message
            this.reactionScreen.classList.remove('waiting', 'ready');
            this.reactionMessage.textContent = 'Too Soon!';
            this.reactionMessage.className = 'reaction-message too-soon';
            this.reactionStartBtn.textContent = 'TRY AGAIN';
            this.reactionStartBtn.style.display = 'block';
            // Update event listener for try again
            this.reactionStartBtn.onclick = () => this.restartReactionGame();
        } else if (this.reactionTimeState.isReady) {
            // Valid reaction time
            this.reactionTimeState.isRunning = false;
            this.reactionTimeState.isReady = false;
            this.reactionTimeState.reactionTime = Date.now() - this.reactionTimeState.startTime;
            this.reactionTimeState.lastTime = this.reactionTimeState.reactionTime;
            // Update high score
            const newBestTime = this.reactionTimeState.saveBestTime();
            // Show results
            this.showReactionResults(newBestTime);
        }
    }

    showReactionResults(newBestTime) {
        // Update UI
        this.reactionScreen.classList.remove('ready');
        this.reactionMessage.textContent = `${this.reactionTimeState.reactionTime}ms`;
        this.reactionMessage.className = 'reaction-message';
        // Update result displays
        this.reactionTimeResult.textContent = this.reactionTimeState.reactionTime;
        this.reactionBestTimeResult.textContent = this.reactionTimeState.bestTime;
        // Update header display
        this.updateReactionTimeHighScoreDisplay();
        // Show results
        this.reactionResults.style.display = 'block';
        // Celebration for new best time
        if (newBestTime) {
            this.celebrateReactionBestTime();
        }
    }

    celebrateReactionBestTime() {
        const resultsTitle = document.querySelector('#reactionResults .results-title');
        resultsTitle.textContent = 'NEW BEST TIME!';
        resultsTitle.style.color = '#ff6b6b';
        resultsTitle.style.animation = 'neonGlow 0.5s ease-in-out infinite';
        
        setTimeout(() => {
            resultsTitle.textContent = 'RESULTS';
            resultsTitle.style.animation = '';
        }, 3000);
    }

    restartReactionGame() {
        this.reactionTimeState.reset();
        this.updateReactionTimeDisplay();
        this.updateReactionTimeHighScoreDisplay();
        this.reactionResults.style.display = 'none';
        // Reset UI
        this.reactionScreen.classList.remove('waiting', 'ready');
        this.reactionMessage.textContent = 'Click START to begin';
        this.reactionMessage.className = 'reaction-message';
        this.reactionStartBtn.textContent = 'START';
        this.reactionStartBtn.style.display = 'block';
        // Reset event listener to start test
        this.reactionStartBtn.onclick = () => this.startReactionTest();
    }

    updateReactionTimeDisplay() {
        this.reactionBestTimeElement.textContent = this.reactionTimeState.bestTime;
        this.reactionLastTimeElement.textContent = this.reactionTimeState.lastTime;
    }

    updateReactionTimeHighScoreDisplay() {
        this.highScoreElement.textContent = this.reactionTimeState.bestTime;
        this.currentScoreElement.textContent = this.reactionTimeState.lastTime;
    }

    update() {
        if (!this.gameState.isRunning || this.gameState.currentGame !== 'pong') return;

        // Update paddle (mouse control is handled in handleMouseMove)
        // Only use keyboard input if mouse is not being used
        if (!this.mouseActive) {
            this.paddle.handleInput(this.keys);
        }
        this.paddle.update();

        // Update ball
        this.ball.update();

        // Check paddle collision
        if (this.paddle.checkCollision(this.ball)) {
            // --- Enhanced ball reaction based on paddle movement ---
            // Calculate hit position relative to paddle center
            const paddleCenter = this.paddle.x + this.paddle.width / 2;
            const hitPos = (this.ball.x - paddleCenter) / (this.paddle.width / 2); // -1 (left) to 1 (right)
            // Nudge dx based on paddle movement
            let paddleInfluence = 0;
            if (this.paddle.dx < 0) paddleInfluence = -1;
            else if (this.paddle.dx > 0) paddleInfluence = 1;
            // Calculate new angle: base angle + influence + hit position
            const maxBounceAngle = Math.PI / 3; // 60 degrees
            const angle = hitPos * maxBounceAngle + paddleInfluence * 0.15; // paddle movement adds to angle
            const speed = Math.min(this.ball.speed + GAME_CONFIG.BALL_SPEED_INCREASE, GAME_CONFIG.MAX_BALL_SPEED);
            this.ball.dx = speed * Math.sin(angle);
            this.ball.dy = -Math.abs(speed * Math.cos(angle));
            this.ball.speed = speed;
            this.gameState.score += GAME_CONFIG.SCORE_PER_HIT;
            this.updateScoreDisplay();
        }

        // Check if ball is out of bounds
        if (this.ball.isOutOfBounds()) {
            this.pongGameOver();
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        this.drawCenterLine();

        // Draw game objects
        this.ball.draw(this.ctx);
        this.paddle.draw(this.ctx);

        // Draw particle effects
        this.drawParticles();
    }

    drawCenterLine() {
        this.ctx.setLineDash([5, 15]);
        this.ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawParticles() {
        // Simple particle effect for visual appeal
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const alpha = Math.random() * 0.3;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(78, 205, 196, ${alpha})`;
            this.ctx.fill();
        }
    }

    gameLoop() {
        if (this.gameState.isRunning && this.gameState.currentGame === 'pong') {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    // UI management methods
    showStartScreen() {
        this.startScreen.classList.remove('hidden');
        this.gameOverlay.classList.add('hidden');
    }

    hideStartScreen() {
        this.startScreen.classList.add('hidden');
    }

    showGameOver() {
        this.gameOverlay.classList.remove('hidden');
    }

    hideGameOver() {
        this.gameOverlay.classList.add('hidden');
    }

    updateScoreDisplay() {
        this.currentScoreElement.textContent = this.gameState.score;
        this.highScoreElement.textContent = this.gameState.highScore;
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NeonPongGame();
}); 