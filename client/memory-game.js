document.addEventListener('DOMContentLoaded', () => {
    initMemoryGame();
  });
  
  function initMemoryGame() {
    const grid = document.getElementById('memory-grid');
    if (!grid) return;
  
    const cards = document.querySelectorAll('.memory-card');
    const movesLeftEl = document.getElementById('moves-left');
    const timer = document.getElementById('timer');
    const winMessage = document.getElementById('win-message');
    const loseMessage = document.getElementById('lose-message');
  
    const GAME_CONFIG = {
      MAX_MOVES: 15,
      TIME_LIMIT: 30,
      CONFETTI_COUNT: 100
    };
  
    const gameState = {
      hasFlippedCard: false,
      lockBoard: false,
      firstCard: null,
      secondCard: null,
      moves: 0,
      movesRemaining: GAME_CONFIG.MAX_MOVES,
      matchedPairs: 0,
      totalPairs: cards.length / 2,
      timerInterval: null,
      secondsRemaining: GAME_CONFIG.TIME_LIMIT,
      timerStarted: false,
      pokemonName: grid.dataset.pokemon
    };
  
    function startTimer() {
      if (!gameState.timerStarted) {
        gameState.timerStarted = true;
        gameState.timerInterval = setInterval(() => {
          gameState.secondsRemaining--;
          timer.textContent = formatTime(gameState.secondsRemaining);
          if (gameState.secondsRemaining <= 0) {
            clearInterval(gameState.timerInterval);
            gameOver('time');
          }
        }, 1000);
      }
    }
  
    function formatTime(totalSeconds) {
      const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
      const secs = (totalSeconds % 60).toString().padStart(2, '0');
      return `${minutes}:${secs}`;
    }
  
    function createConfetti() {
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
        confetti.animate([
          { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
        ], {
          duration: (Math.random() * 3 + 2) * 1000,
          easing: 'ease-out'
        }).onfinish = () => confetti.remove();
      }
    }
  
    function checkForWin() {
      if (gameState.matchedPairs === gameState.totalPairs) {
        clearInterval(gameState.timerInterval);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]); // win buzz
        setTimeout(() => {
          winMessage.classList.add('active');
          createConfetti();
          savePokemonCard();
        }, 500);
      }
    }
  
    function gameOver(reason) {
      clearInterval(gameState.timerInterval);
      gameState.lockBoard = true;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]); // game over buzz
      const loseReasonEl = document.getElementById('lose-reason');
      if (loseReasonEl) {
        loseReasonEl.textContent = reason === 'time' ? "Time's up!" : "You ran out of moves!";
      }
      loseMessage.classList.add('active');
    }
  
    async function savePokemonCard() {
      try {
        const collectedCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
        const alreadyCollected = collectedCards.some(card => card.name === gameState.pokemonName);
        if (!alreadyCollected) {
          const firstCardFront = document.querySelector('.card-front img');
          const cardImage = firstCardFront ? firstCardFront.src : null;
          const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${gameState.pokemonName}`);
          const data = await response.json();
          const newCard = {
            id: data.id,
            name: data.name,
            image: cardImage,
            types: data.types.map(t => t.type.name),
            stats: data.stats.map(s => ({
              name: s.stat.name.replace('-', ' '),
              value: s.base_stat
            }))
          };
          collectedCards.push(newCard);
          localStorage.setItem('pokemonCards', JSON.stringify(collectedCards));
        }
      } catch (err) {
        console.error('Failed to save card:', err);
      }
    }
  
    function flipCard() {
      if (gameState.lockBoard || this === gameState.firstCard || this.classList.contains('matched')) return;
      this.classList.add('flipped');
      if (navigator.vibrate) navigator.vibrate(50); // flip buzz
      if (!gameState.timerStarted) startTimer();
  
      if (!gameState.hasFlippedCard) {
        gameState.hasFlippedCard = true;
        gameState.firstCard = this;
        return;
      }
  
      gameState.secondCard = this;
      gameState.moves++;
      gameState.movesRemaining--;
      movesLeftEl.textContent = gameState.movesRemaining;
  
      checkForMatch();
  
      if (gameState.movesRemaining <= 0 && gameState.matchedPairs < gameState.totalPairs) {
        gameOver('moves');
      }
    }
  
    function checkForMatch() {
      const firstType = gameState.firstCard.dataset.sprite.split('-')[0];
      const secondType = gameState.secondCard.dataset.sprite.split('-')[0];
      const isMatch = firstType === secondType;
      isMatch ? disableCards() : unflipCards();
      if (isMatch) {
        gameState.matchedPairs++;
        checkForWin();
      }
    }
  
    function disableCards() {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // match buzz
      gameState.firstCard.classList.add('matched');
      gameState.secondCard.classList.add('matched');
      gameState.firstCard.removeEventListener('click', flipCard);
      gameState.secondCard.removeEventListener('click', flipCard);
      resetBoard();
    }
  
    function unflipCards() {
      gameState.lockBoard = true;
      setTimeout(() => {
        gameState.firstCard.classList.remove('flipped');
        gameState.secondCard.classList.remove('flipped');
        resetBoard();
      }, 1000);
    }
  
    function resetBoard() {
      [gameState.hasFlippedCard, gameState.lockBoard] = [false, false];
      [gameState.firstCard, gameState.secondCard] = [null, null];
    }
  
    function shuffle() {
      cards.forEach(card => {
        const rand = Math.floor(Math.random() * cards.length);
        card.style.order = rand;
      });
    }
  
    cards.forEach(card => card.addEventListener('click', flipCard));
    movesLeftEl.textContent = GAME_CONFIG.MAX_MOVES;
    timer.textContent = formatTime(GAME_CONFIG.TIME_LIMIT);
    shuffle();
  }
  