document.addEventListener('DOMContentLoaded', () => {
    initBinder();
  });
  
  function initBinder() {
    const binderContainer = document.getElementById('binder-container');
    if (!binderContainer) return;
    loadCollectedCards();
  }
  
  async function loadCollectedCards() {
    const binderGrid = document.getElementById('binder-grid');
    const emptyMessage = document.getElementById('empty-binder-message');
  
    const collectedCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
  
    if (collectedCards.length === 0) {
      if (emptyMessage) emptyMessage.style.display = 'block';
      return;
    }
  
    if (emptyMessage) emptyMessage.style.display = 'none';
  
    for (const card of collectedCards) {
      try {
        const cardElement = createPokemonCard(card);
        if (binderGrid) binderGrid.appendChild(cardElement);
      } catch (error) {
        console.error(`Error creating card for ${card.name}:`, error);
      }
    }
  }
  
  function createPokemonCard(pokemon) {
    const mainType = pokemon.types[0] || 'normal';
    const card = document.createElement('div');
    card.className = `pokemon-card main-type-${mainType}`;
  
    const idElement = document.createElement('div');
    idElement.className = 'pokemon-id';
    idElement.textContent = `#${pokemon.id}`;
    card.appendChild(idElement);
  
    const imageContainer = document.createElement('div');
    imageContainer.className = `card-image type-${mainType}`;
    const imageElement = document.createElement('img');
    imageElement.src = pokemon.image || pokemon.sprites?.front_default || '/images/pokemon-placeholder.png';
    imageElement.alt = pokemon.name;
    imageContainer.appendChild(imageElement);
    card.appendChild(imageContainer);
  
    const infoContainer = document.createElement('div');
    infoContainer.className = 'card-info';
  
    const nameElement = document.createElement('h3');
    nameElement.className = 'pokemon-name';
    nameElement.textContent = capitalizeFirstLetter(pokemon.name);
    infoContainer.appendChild(nameElement);
  
    const typesContainer = document.createElement('div');
    typesContainer.className = 'pokemon-types';
    pokemon.types.forEach(type => {
      const typeName = typeof type === 'string' ? type : type.type?.name;
      const typeBadge = document.createElement('span');
      typeBadge.className = `type-badge type-${typeName}`;
      typeBadge.textContent = capitalizeFirstLetter(typeName);
      typesContainer.appendChild(typeBadge);
    });
    infoContainer.appendChild(typesContainer);
  
    const statsContainer = document.createElement('div');
    statsContainer.className = 'pokemon-stats';
  
    const stats = Array.isArray(pokemon.stats) ? pokemon.stats : [];
    stats.forEach(stat => {
      const statItem = document.createElement('div');
      statItem.className = 'stat-item';
  
      const rawStatName = typeof stat === 'object' ? (stat.stat?.name || stat.name) : stat.name;
      const statName = document.createElement('span');
      statName.className = 'stat-name';
      statName.textContent = formatStatName(rawStatName);
  
      const statValue = document.createElement('span');
      statValue.className = 'stat-value';
      statValue.textContent = typeof stat === 'object' ? (stat.value || stat.base_stat) : stat.value;
  
      statItem.appendChild(statName);
      statItem.appendChild(statValue);
      statsContainer.appendChild(statItem);
    });
  
    infoContainer.appendChild(statsContainer);
    card.appendChild(infoContainer);
  
    return card;
  }
  
  function capitalizeFirstLetter(string = '') {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  function formatStatName(statName = '') {
    const normalized = statName.toLowerCase().replace(/\s+/g, '-');
  
    const statNameMap = {
      'hp': 'HP',
      'attack': 'ATK',
      'defense': 'DEF',
      'special-attack': 'SP.ATK',
      'special-defense': 'SP.DEF',
      'speed': 'SPD'
    };
  
    return statNameMap[normalized] || statName.toUpperCase();
  }
  