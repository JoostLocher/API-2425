// memory-game.js - Simplified version

document.addEventListener('DOMContentLoaded', initMemoryGame);

function initMemoryGame() {
  // dom elementen ophalen
  const grid = document.getElementById('memory-grid');
  if (!grid) return;

  const cards = document.querySelectorAll('.memory-card');
  const movesLeftEl = document.getElementById('moves-left');
  const timer = document.getElementById('timer');
  const winMessage = document.getElementById('win-message');
  const loseMessage = document.getElementById('lose-message');
  
  // spel instellingen
  const MAX_MOVES = 15;
  const TIME_LIMIT = 30; // seconds
  const CONFETTI_COUNT = 100;
  
  // spel status
  let hasFlippedCard = false;
  let lockBoard = false;
  let firstCard = null;
  let secondCard = null;
  let moves = 0;
  let movesRemaining = MAX_MOVES;
  let matchedPairs = 0;
  const totalPairs = cards.length / 2;
  let timerInterval = null;
  let secondsRemaining = TIME_LIMIT;
  let timerStarted = false;
  const pokemonName = grid.dataset.pokemon;

  // spel initialiseren
  movesLeftEl.textContent = MAX_MOVES;
  timer.textContent = formatTime(TIME_LIMIT);
  shuffleCards();
  cards.forEach(card => card.addEventListener('click', flipCard));

  // seconden omzetten naar MM:SS formaat
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  }

  // start de speltimer
  function startTimer() {
    if (timerStarted) return;
    
    timerStarted = true;
    timerInterval = setInterval(() => {
      secondsRemaining--;
      timer.textContent = formatTime(secondsRemaining);
      
      if (secondsRemaining <= 0) {
        clearInterval(timerInterval);
        gameOver('time');
      }
    }, 1000);
  }

  // afhandeling van kaart omdraaien
  function flipCard() {
    // voorkom omdraaien als het bord vergrendeld is of de kaart al gematcht is
    if (lockBoard || this === firstCard || this.classList.contains('matched')) return;
    
    // draai de kaart om
    this.classList.add('flipped');
    
    // laat apparaat trillen indien ondersteund
    if (navigator.vibrate) navigator.vibrate(50);
    
    // start timer bij eerste kaart omdraaien
    if (!timerStarted) startTimer();

    // eerste kaart omgedraaid
    if (!hasFlippedCard) {
      hasFlippedCard = true;
      firstCard = this;
      return;
    }

    // tweede kaart omgedraaid
    secondCard = this;
    moves++;
    movesRemaining--;
    movesLeftEl.textContent = movesRemaining;

    // controleer of kaarten overeenkomen
    checkForMatch();

    // controleer of er geen zetten meer over zijn
    if (movesRemaining <= 0 && matchedPairs < totalPairs) {
      gameOver('moves');
    }
  }

  // controleer of de omgedraaide kaarten overeenkomen
  function checkForMatch() {
    // vergelijk sprite IDs (eerste deel voor het streepje)
    const firstType = firstCard.dataset.sprite.split('-')[0];
    const secondType = secondCard.dataset.sprite.split('-')[0];
    const isMatch = firstType === secondType;
    
    if (isMatch) {
      handleMatch();
    } else {
      unflipCards();
    }
  }

  // afhandeling van gematchte kaarten
  function handleMatch() {
    // trillen bij een match
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    
    // markeer kaarten als gematcht
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    
    // verwijder event listeners
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    // tel het aantal gematchte paren op
    matchedPairs++;
    
    // controleer of het spel gewonnen is
    if (matchedPairs === totalPairs) {
      setTimeout(handleWin, 500);
    }
    
    // reset het bord voor de volgende beurt
    resetBoard();
  }

  // reset het bord na een beurt
  function resetBoard() {
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
  }

  // draai kaarten terug als ze niet overeenkomen
  function unflipCards() {
    lockBoard = true;
    
    setTimeout(() => {
      firstCard.classList.remove('flipped');
      secondCard.classList.remove('flipped');
      resetBoard();
    }, 1000);
  }

  // afhandeling van het winnen van het spel
  function handleWin() {
    clearInterval(timerInterval);
    
    // trillen bij winst
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    
    // toon win bericht
    winMessage.classList.add('active');
    
    // maak confetti effect
    createConfetti();
    
    // sla pokemon kaart op in collectie
    savePokemonCard();
  }

  // afhandeling van game over
  function gameOver(reason) {
    clearInterval(timerInterval);
    lockBoard = true;
    
    // trillen bij game over
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
    
    // stel reden tekst in
    const loseReasonEl = document.getElementById('lose-reason');
    if (loseReasonEl) {
      loseReasonEl.textContent = reason === 'time' ? "Time's up!" : "You ran out of moves!";
    }
    
    // toon verlies bericht
    loseMessage.classList.add('active');
  }

  // maak confetti animatie voor winst
  function createConfetti() {
    const colors = ['var(--color-blue)', 'var(--color-gray)', 'var(--color-white)'];
    
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const confetti = document.createElement('div');
      
      // stel confetti stijl in
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.width = (Math.random() * 10 + 5) + 'px';
      confetti.style.height = (Math.random() * 10 + 5) + 'px';
      confetti.style.opacity = Math.random();
      confetti.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
      
      document.body.appendChild(confetti);
      
      // animeer vallende confetti
      confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ], {
        duration: (Math.random() * 3 + 2) * 1000,
        easing: 'ease-out'
      }).onfinish = () => confetti.remove();
    }
  }

  // sla pokemon kaart op in localstorage collectie
  async function savePokemonCard() {
    try {
      // haal bestaande collectie op
      const collectedCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
      
      // controleer of al verzameld
      const alreadyCollected = collectedCards.some(card => card.name === pokemonName);
      
      if (!alreadyCollected) {
        // haal kaart afbeelding op
        const firstCardFront = document.querySelector('.card-front img');
        const cardImage = firstCardFront ? firstCardFront.src : null;
        
        // haal pokemon gegevens op
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        const data = await response.json();
        
        // maak nieuw kaart object
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
        
        // voeg toe aan collectie en sla op
        collectedCards.push(newCard);
        localStorage.setItem('pokemonCards', JSON.stringify(collectedCards));
      }
    } catch (err) {
      console.error('Failed to save card:', err);
    }
  }

  // kaartposities willekeurig maken
  function shuffleCards() {
    cards.forEach(card => {
      const rand = Math.floor(Math.random() * cards.length);
      card.style.order = rand;
    });
  }
}