// Binder.js - Client-side functionality for the Pokémon card binder
document.addEventListener('DOMContentLoaded', () => {
    initBinder();
  });
  
  function initBinder() {
    const binderContainer = document.getElementById('binder-container');
    
    // If we're not on the binder page, exit
    if (!binderContainer) return;
    
    // Load cards from localStorage
    loadCollectedCards();
  }
  
  function loadCollectedCards() {
    const binderGrid = document.getElementById('binder-grid');
    const emptyMessage = document.getElementById('empty-binder-message');
    
    // Get cards from localStorage
    const collectedCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
    
    // Show empty message or cards
    if (collectedCards.length === 0) {
      if (emptyMessage) {
        emptyMessage.style.display = 'block';
      }
      return;
    }
    
    // Hide empty message if we have cards
    if (emptyMessage) {
      emptyMessage.style.display = 'none';
    }
    
    // Create card elements
    collectedCards.forEach(card => {
      const cardElement = createCardElement(card);
      if (binderGrid) {
        binderGrid.appendChild(cardElement);
      }
    });
  }
  
  function createCardElement(card) {
    // Create card container
    const cardContainer = document.createElement('div');
    cardContainer.className = 'binder-card';
    
    // Create card inner content
    const cardContent = document.createElement('div');
    cardContent.className = 'binder-card-content';
    
    // Create image element
    const cardImage = document.createElement('img');
    cardImage.src = card.image || '/images/pokemon-placeholder.png';
    cardImage.alt = card.name;
    cardContent.appendChild(cardImage);
    
    // Create card name
    const cardName = document.createElement('h3');
    cardName.textContent = card.name.charAt(0).toUpperCase() + card.name.slice(1);
    cardContent.appendChild(cardName);
    
    // Create collected date
    const collectedDate = document.createElement('p');
    const date = new Date(card.collectedDate);
    collectedDate.textContent = `Collected: ${date.toLocaleDateString()}`;
    collectedDate.className = 'collected-date';
    cardContent.appendChild(collectedDate);
    
    // Add content to card container
    cardContainer.appendChild(cardContent);
    
    return cardContainer;
  }