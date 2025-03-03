document.addEventListener('DOMContentLoaded', () => {
    // Game canvas setup
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Game variables
    const gridSize = 20;
    const gridWidth = canvas.width / gridSize;
    const gridHeight = canvas.height / gridSize;
    
    let snake = [];
    let food = {};
    let foodDirection = 'right'; // Track food direction
    let foodMoveCounter = 0; // Counter for smooth movement
    let direction = 'right';
    let gameSpeed = 160; // milliseconds
    const DEFAULT_GAME_SPEED = 160; // Default speed value
    let gameInterval;
    let foodMoveInterval;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    let gameRunning = false;
    let hardMode = false;
    let currentFoodEmoji = '🐷'; // Start with pig emoji
    const foodEmojis = ['🐷', '🐘', '🦁']; // Pig, Elephant, Lion
    
    // DOM elements
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const speedStatusElement = document.getElementById('speedStatus');
    const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
    
    // Initialize high score display
    highScoreElement.textContent = highScore;
    
    // Initialize game
    function initGame() {
        // Get selected difficulty
        hardMode = document.querySelector('input[name="difficulty"]:checked').value === 'hard';
        
        // Create initial snake (3 segments)
        snake = [
            {x: 5, y: 10},
            {x: 4, y: 10},
            {x: 3, y: 10}
        ];
        
        // Generate initial food
        generateFood();
        
        // Reset score
        score = 0;
        scoreElement.textContent = score;
        
        // Reset speed to default
        gameSpeed = DEFAULT_GAME_SPEED;
        
        // Reset speed display
        updateSpeedStatus();
        
        // Set initial direction
        direction = 'right';
        
        // Clear any existing food movement interval
        if (foodMoveInterval) {
            clearInterval(foodMoveInterval);
            foodMoveInterval = null;
        }
        
        // Start food movement if in hard mode
        if (hardMode && gameRunning) {
            startFoodMovement();
        }
        
        // Draw initial state
        draw();
    }
    
    // Generate food at random position
    function generateFood() {
        food = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // Rotate to next food emoji
        const currentIndex = foodEmojis.indexOf(currentFoodEmoji);
        const nextIndex = (currentIndex + 1) % foodEmojis.length;
        currentFoodEmoji = foodEmojis[nextIndex];
        
        // Make sure food doesn't appear on snake
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                generateFood(); // Try again
                break;
            }
        }
    }
    
    // Update speed status display
    function updateSpeedStatus() {
        // Display the actual gameSpeed value in milliseconds
        speedStatusElement.textContent = gameSpeed;
    }
    
    // Game loop
    function gameLoop() {
        // Move snake
        moveSnake();
        
        // Check collisions
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        // Check if snake eats food
        if (snake[0].x === food.x && snake[0].y === food.y) {
            // Don't remove tail (snake grows)
            generateFood();
            
            // Update score
            score++;
            scoreElement.textContent = score;
            
            // Update high score if needed
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // Increase speed slightly
            if (gameSpeed > 80 && score % 2 === 0) {
                clearInterval(gameInterval);
                gameSpeed -= 1;
                gameInterval = setInterval(gameLoop, gameSpeed);
                
                // Update speed display
                updateSpeedStatus();
            }
        } else {
            // Remove tail (snake moves)
            snake.pop();
        }
        
        // Draw updated state
        draw();
    }
    
    // Move snake based on current direction
    function moveSnake() {
        const head = {x: snake[0].x, y: snake[0].y};
        
        switch (direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // Add new head
        snake.unshift(head);
    }
    
    // Check for collisions with walls or self
    function checkCollision() {
        const head = snake[0];
        
        // Check wall collision
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
            return true;
        }
        
        // Check self collision (skip head)
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    // Move food randomly (for hard mode)
    function moveFood() {
        if (!gameRunning || !hardMode) return;
        
        // Only change direction occasionally (every 10 moves)
        if (foodMoveCounter % 10 === 0) {
            // Random direction for food movement
            const directions = ['up', 'down', 'left', 'right'];
            foodDirection = directions[Math.floor(Math.random() * directions.length)];
        }
        
        foodMoveCounter++;
        
        // Store current position
        const oldX = food.x;
        const oldY = food.y;
        
        // Move food in current direction
        switch (foodDirection) {
            case 'up':
                food.y--;
                // Check top border
                if (food.y < 0) {
                    food.y = 0;
                    foodDirection = 'down'; // Bounce back
                }
                break;
            case 'down':
                food.y++;
                // Check bottom border
                if (food.y >= gridHeight) {
                    food.y = gridHeight - 1;
                    foodDirection = 'up'; // Bounce back
                }
                break;
            case 'left':
                food.x--;
                // Check left border
                if (food.x < 0) {
                    food.x = 0;
                    foodDirection = 'right'; // Bounce back
                }
                break;
            case 'right':
                food.x++;
                // Check right border
                if (food.x >= gridWidth) {
                    food.x = gridWidth - 1;
                    foodDirection = 'left'; // Bounce back
                }
                break;
        }
        
        // Check if new position collides with snake
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                // If collision, revert to old position and change direction
                food.x = oldX;
                food.y = oldY;
                
                // Change to opposite direction
                switch (foodDirection) {
                    case 'up': foodDirection = 'down'; break;
                    case 'down': foodDirection = 'up'; break;
                    case 'left': foodDirection = 'right'; break;
                    case 'right': foodDirection = 'left'; break;
                }
                break;
            }
        }
    }
    
    // Start food movement interval
    function startFoodMovement() {
        if (hardMode) {
            // Move food every 800ms (much slower than snake)
            foodMoveInterval = setInterval(moveFood, 800);
        }
    }
    
    // Stop food movement
    function stopFoodMovement() {
        if (foodMoveInterval) {
            clearInterval(foodMoveInterval);
            foodMoveInterval = null;
        }
    }
    
    // Game over
    function gameOver() {
        clearInterval(gameInterval);
        stopFoodMovement();
        gameRunning = false;
        startBtn.textContent = 'Start Game';
        
        // Display game over message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Arial';
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
    }
    
    // Draw everything
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw snake
        for (let i = 0; i < snake.length; i++) {
            // Head is a different color
            if (i === 0) {
                ctx.fillStyle = '#4CAF50'; // Green head
            } else {
                ctx.fillStyle = '#8BC34A'; // Lighter green body
            }
            
            ctx.fillRect(
                snake[i].x * gridSize,
                snake[i].y * gridSize,
                gridSize - 1,
                gridSize - 1
            );
        }
        
        // Draw food as emoji
        ctx.font = `${gridSize * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            currentFoodEmoji,
            food.x * gridSize + gridSize / 2,
            food.y * gridSize + gridSize / 2
        );
        
        // Draw grid (optional, for debugging)
        // drawGrid();
    }
    
    // Draw grid lines (helper function)
    function drawGrid() {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // Handle keyboard input
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        // Prevent default behavior for arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        
        switch (e.key) {
            case 'ArrowUp':
                if (direction !== 'down') direction = 'up';
                break;
            case 'ArrowDown':
                if (direction !== 'up') direction = 'down';
                break;
            case 'ArrowLeft':
                if (direction !== 'right') direction = 'left';
                break;
            case 'ArrowRight':
                if (direction !== 'left') direction = 'right';
                break;
        }
    });
    
    // Start button
    startBtn.addEventListener('click', () => {
        if (gameRunning) {
            // Pause game
            clearInterval(gameInterval);
            stopFoodMovement();
            gameRunning = false;
            startBtn.textContent = 'Resume Game';
        } else {
            // Start or resume game
            if (snake.length === 0 || startBtn.textContent === 'Start Game') {
                // Reset and start new game
                initGame();
            }
            gameInterval = setInterval(gameLoop, gameSpeed);
            
            // Start food movement if in hard mode
            if (hardMode) {
                startFoodMovement();
            }
            
            gameRunning = true;
            startBtn.textContent = 'Pause Game';
        }
    });
    
    // Reset button
    resetBtn.addEventListener('click', () => {
        clearInterval(gameInterval);
        stopFoodMovement();
        gameRunning = false;
        startBtn.textContent = 'Start Game';
        initGame();
    });
    
    // Difficulty change handler
    difficultyRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            hardMode = radio.value === 'hard';
            
            // Only reset if game is not running
            if (!gameRunning) {
                initGame();
            }
        });
    });
    
    // Initialize game on load
    initGame();
});
