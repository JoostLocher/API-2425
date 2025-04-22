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
  
  async function loadCollectedCards() {
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
    
    // Fetch detailed data for each card and create card elements
    for (const card of collectedCards) {
      try {
        // Fetch detailed Pokémon data from API
        const pokemonData = await fetchPokemonDetails(card.name);
        
        // Create card element with full data
        const cardElement = createCardElement(pokemonData);
        if (binderGrid) {
          binderGrid.appendChild(cardElement);
        }
      } catch (error) {
        console.error(`Error loading card for ${card.name}:`, error);
      }
    }
  }
  
  async function fetchPokemonDetails(name) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${name}`);
    }
    
    return await response.json();
  }
  
  function createCardElement(pokemon) {
    // Create card container
    const cardContainer = document.createElement('div');
    cardContainer.className = 'binder-card';
    
    // Get main type for card background
    const mainType = pokemon.types[0]?.type?.name || 'normal';
    cardContainer.classList.add(`main-type-${mainType}`);
    
    // Create card inner content
    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';
    
    // Create image element
    const cardImage = document.createElement('img');
    cardImage.src = pokemon.sprites.front_default || '/images/pokemon-placeholder.png';
    cardImage.alt = pokemon.name;
    imageContainer.appendChild(cardImage);
    
    // Create info container
    const infoContainer = document.createElement('div');
    infoContainer.className = 'card-info';
    
    // Create header with ID and name
    const headerContainer = document.createElement('div');
    headerContainer.className = 'card-header';
    
    const idSpan = document.createElement('span');
    idSpan.className = 'pokemon-id';
    idSpan.textContent = `#${pokemon.id}`;
    
    const nameHeading = document.createElement('h3');
    nameHeading.className = 'pokemon-name';
    nameHeading.textContent = capitalizeFirstLetter(pokemon.name);
    
    headerContainer.appendChild(idSpan);
    headerContainer.appendChild(nameHeading);
    
    // Create types container
    const typesContainer = document.createElement('div');
    typesContainer.className = 'pokemon-types';
    
    // Add type badges
    pokemon.types.forEach(typeInfo => {
      const typeBadge = document.createElement('span');
      typeBadge.className = `type-badge type-${typeInfo.type.name}`;
      typeBadge.textContent = capitalizeFirstLetter(typeInfo.type.name);
      typesContainer.appendChild(typeBadge);
    });
    
    // Create stats container
    const statsContainer = document.createElement('div');
    statsContainer.className = 'pokemon-stats';
    
    // Add stat items (limit to 6 basic stats)
    pokemon.stats.slice(0, 6).forEach(statInfo => {
      const statItem = document.createElement('div');
      statItem.className = 'stat-item';
      
      const statName = document.createElement('span');
      statName.className = 'stat-name';
      statName.textContent = formatStatName(statInfo.stat.name);
      
      const statValue = document.createElement('span');
      statValue.className = 'stat-value';
      statValue.textContent = statInfo.base_stat;
      
      statItem.appendChild(statName);
      statItem.appendChild(statValue);
      statsContainer.appendChild(statItem);
    });
    
    // Assemble the card
    infoContainer.appendChild(headerContainer);
    infoContainer.appendChild(typesContainer);
    infoContainer.appendChild(statsContainer);
    
    cardContent.appendChild(imageContainer);
    cardContent.appendChild(infoContainer);
    
    cardContainer.appendChild(cardContent);
    
    return cardContainer;
  }
  
  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  // Helper function to format stat names
  function formatStatName(statName) {
    // Convert hyphenated names to shorter display versions
    const statNameMap = {
      'hp': 'HP',
      'attack': 'ATK',
      'defense': 'DEF',
      'special-attack': 'SP.ATK',
      'special-defense': 'SP.DEF',
      'speed': 'SPD'
    };
    
    return statNameMap[statName] || capitalizeFirstLetter(statName);
  }