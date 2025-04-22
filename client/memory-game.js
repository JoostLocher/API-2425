/* Memory Game  */

document.addEventListener('DOMContentLoaded', () => {
    initMemoryGame();
  });
  
  /**
   * Initialize the memory game with all required functionality
   */
  function initMemoryGame() {
    // Get key DOM elements
    const grid = document.getElementById('memory-grid');
    
    // Exit if we're not on a memory game page
    if (!grid) return;
    
    const cards = document.querySelectorAll('.memory-card');
    const movesLeftEl = document.getElementById('moves-left');
    const timer = document.getElementById('timer');
    const winMessage = document.getElementById('win-message');
    const loseMessage = document.getElementById('lose-message');
    const finalMoves = document.getElementById('final-moves');
    const finalTime = document.getElementById('final-time');
    
    // Game configuration settings
    const GAME_CONFIG = {
      MAX_MOVES: 30,        // Maximum number of moves allowed
      TIME_LIMIT: 60,       // Time limit in seconds
      CONFETTI_COUNT: 100   // Number of confetti particles for win animation
    };
    
    // Game state variables
    const gameState = {
      hasFlippedCard: false,   // Tracks if one card is already flipped
      lockBoard: false,        // Prevents clicking during animations
      firstCard: null,         // Reference to first flipped card
      secondCard: null,        // Reference to second flipped card
      moves: 0,                // Total moves made
      movesRemaining: GAME_CONFIG.MAX_MOVES,  // Moves left
      matchedPairs: 0,         // Number of matched card pairs
      totalPairs: cards.length / 2,  // Total number of pairs to match
      timerInterval: null,     // Timer interval reference
      secondsRemaining: GAME_CONFIG.TIME_LIMIT,  // Time remaining
      timerStarted: false,     // Flag to track if timer has started
      pokemonName: grid.dataset.pokemon  // Current Pokemon name from data attribute
    };
  
    /**
     * Starts the game timer countdown
     */
    function startTimer() {
      if (!gameState.timerStarted) {
        gameState.timerStarted = true;
        gameState.timerInterval = setInterval(() => {
          gameState.secondsRemaining--;
          timer.textContent = formatTime(gameState.secondsRemaining);
          
          // Check if time is up
          if (gameState.secondsRemaining <= 0) {
            clearInterval(gameState.timerInterval);
            gameOver('time');
          }
        }, 1000);
      }
    }
    
    /**
     * Format seconds into MM:SS display format
     * @param {number} totalSeconds - Total seconds to format
     * @return {string} Formatted time string (MM:SS)
     */
    function formatTime(totalSeconds) {
      const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const secs = (totalSeconds % 60).toString().padStart(2, '0');
      return `${minutes}:${secs}`;
    }
    
    /**
     * Create celebration confetti effect for game win
     */
    function createConfetti() {
      // Use brand colors for confetti
      const colors = ['var(--color-blue)', 'var(--color-gray)', 'var(--color-white)'];
      
      for (let i = 0; i < GAME_CONFIG.CONFETTI_COUNT; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = (Math.random() * 10 + 5) + 'px';
        confetti.style.height = (Math.random() * 10 + 5) + 'px';
        confetti.style.opacity = Math.random();
        confetti.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
        
        document.body.appendChild(confetti);
        
        // Animate the confetti falling
        const animationDuration = Math.random() * 3 + 2;
        confetti.animate([
          { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
          duration: animationDuration * 1000,
          easing: 'ease-out'
        }).onfinish = () => confetti.remove();
      }
    }
    
    /**
     * Check if all pairs are matched and trigger win condition
     */
    function checkForWin() {
      if (gameState.matchedPairs === gameState.totalPairs) {
        clearInterval(gameState.timerInterval);
        
        setTimeout(() => {
          finalMoves.textContent = GAME_CONFIG.MAX_MOVES - gameState.movesRemaining;
          finalTime.textContent = formatTime(GAME_CONFIG.TIME_LIMIT - gameState.secondsRemaining);
          winMessage.classList.add('active');
          createConfetti();
          
          // Save the Pokemon card to the binder
          savePokemonCard();
        }, 500);
      }
    }
    
    /**
     * Handle game over conditions (out of moves or time)
     * @param {string} reason - Reason for game over ('time' or 'moves')
     */
    function gameOver(reason) {
      clearInterval(gameState.timerInterval);
      gameState.lockBoard = true;
      
      // Set the reason for losing
      const loseReasonEl = document.getElementById('lose-reason');
      if (reason === 'time') {
        loseReasonEl.textContent = "Time's up!";
      } else if (reason === 'moves') {
        loseReasonEl.textContent = "You ran out of moves!";
      }
      
      // Show the lose message
      loseMessage.classList.add('active');
    }
    
    /**
     * Save Pokemon card to the player's collection binder
     */
    function savePokemonCard() {
      // Get existing cards from localStorage
      const collectedCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
      
      // Check if this Pokemon is already in the collection
      const alreadyCollected = collectedCards.some(card => card.name === gameState.pokemonName);
      
      // If not already collected, add it
      if (!alreadyCollected) {
        // Get a high-quality sprite for the binder from the card-front elements
        let cardImage = null;
        const firstCardFront = document.querySelector('.card-front img');
        if (firstCardFront) {
          cardImage = firstCardFront.src;
        }
        
        collectedCards.push({
          name: gameState.pokemonName,
          image: cardImage,
          collectedDate: new Date().toISOString()
        });
        
        localStorage.setItem('pokemonCards', JSON.stringify(collectedCards));
      }
    }
    
    /**
     * Handle card flip event
     */
    function flipCard() {
      // Prevent flipping if board is locked or card is already matched
      if (gameState.lockBoard) return;
      if (this === gameState.firstCard) return;
      if (this.classList.contains('matched')) return;
      
      this.classList.add('flipped');
      
      // Start timer on first card flip
      if (!gameState.timerStarted) {
        startTimer();
      }
      
      if (!gameState.hasFlippedCard) {
        // First card flipped
        gameState.hasFlippedCard = true;
        gameState.firstCard = this;
        return;
      }
      
      // Second card flipped
      gameState.secondCard = this;
      gameState.moves++;
      gameState.movesRemaining--;
      movesLeftEl.textContent = gameState.movesRemaining;
      
      checkForMatch();
      
      // Check if out of moves
      if (gameState.movesRemaining <= 0 && gameState.matchedPairs < gameState.totalPairs) {
        gameOver('moves');
      }
    }
    
    /**
     * Check if the two flipped cards match
     */
    function checkForMatch() {
      // Get the base sprite id without the -1 or -2 suffix
      const firstCardType = gameState.firstCard.dataset.sprite.split('-')[0];
      const secondCardType = gameState.secondCard.dataset.sprite.split('-')[0];
      
      // Check if cards match
      const isMatch = firstCardType === secondCardType;
      
      if (isMatch) {
        disableCards();
        gameState.matchedPairs++;
        checkForWin();
      } else {
        unflipCards();
      }
    }
    
    /**
     * Handle matched cards - keep them flipped and add matched class
     */
    function disableCards() {
      gameState.firstCard.classList.add('matched');
      gameState.secondCard.classList.add('matched');
      
      gameState.firstCard.removeEventListener('click', flipCard);
      gameState.secondCard.removeEventListener('click', flipCard);
      
      resetBoard();
    }
    
    /**
     * Unflip non-matching cards after a short delay
     */
    function unflipCards() {
      gameState.lockBoard = true;
      
      setTimeout(() => {
        gameState.firstCard.classList.remove('flipped');
        gameState.secondCard.classList.remove('flipped');
        
        resetBoard();
      }, 1000);
    }
    
    /**
     * Reset board variables after each turn
     */
    function resetBoard() {
      [gameState.hasFlippedCard, gameState.lockBoard] = [false, false];
      [gameState.firstCard, gameState.secondCard] = [null, null];
    }
    
    /**
     * Shuffle cards using the Fisher-Yates algorithm
     */
    function shuffle() {
      const randomPositions = Array.from({ length: cards.length }, (_, i) => i);
      
      // Fisher-Yates shuffle algorithm
      for (let i = randomPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomPositions[i], randomPositions[j]] = [randomPositions[j], randomPositions[i]];
      }
      
      cards.forEach((card, index) => {
        card.style.order = randomPositions[index];
      });
    }
    
    /**
     * Reset game to initial state
     */
    function resetGame() {
      // Clear existing confetti
      document.querySelectorAll('.confetti').forEach(el => el.remove());
      
      // Reset game state variables
      clearInterval(gameState.timerInterval);
      gameState.secondsRemaining = GAME_CONFIG.TIME_LIMIT;
      gameState.moves = 0;
      gameState.movesRemaining = GAME_CONFIG.MAX_MOVES;
      gameState.matchedPairs = 0;
      gameState.timerStarted = false;
      movesLeftEl.textContent = GAME_CONFIG.MAX_MOVES;
      timer.textContent = formatTime(GAME_CONFIG.TIME_LIMIT);
      gameState.lockBoard = false;
      
      // Reset cards
      cards.forEach(card => {
        card.classList.remove('flipped', 'matched');
        card.addEventListener('click', flipCard);
      });
      
      // Shuffle cards
      shuffle();
      
      // Hide messages
      winMessage.classList.remove('active');
      loseMessage.classList.remove('active');
    }
    
    // Initialize event listeners for all cards
    cards.forEach(card => card.addEventListener('click', flipCard));
    
    // Initialize game state
    movesLeftEl.textContent = GAME_CONFIG.MAX_MOVES;
    timer.textContent = formatTime(GAME_CONFIG.TIME_LIMIT);
    shuffle();
  }