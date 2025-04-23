document.addEventListener('DOMContentLoaded', () => {
    const binderContainer = document.getElementById('binder-container');

    if (!binderContainer) return;
    // if container exists start loading collected cards
    loadCollectedCards();
});
  
// function to display it in the binder
function loadCollectedCards() {
    
    const binderGrid = document.getElementById('binder-grid');
    const emptyMessage = document.getElementById('empty-binder-message');

    const collectedCards = JSON.parse(localStorage.getItem('pokemonCards') || '[]');
  
    if (collectedCards.length === 0) {
      if (emptyMessage) emptyMessage.style.display = 'block';
      return;
    }
  
    // if cards exist hide empty message
    if (emptyMessage) emptyMessage.style.display = 'none';

    collectedCards.forEach(card => {
      try {
        binderGrid?.appendChild(createPokemonCard(card));
      } catch (error) {
        console.error(`Error creating card for ${card.name}:`, error);
      }
    });
}

function createPokemonCard(pokemon) {

    const mainType = pokemon.types[0] || 'normal';
    
    const card = document.createElement('div');
    
    card.className = `pokemon-card main-type-${mainType}`;

    // card template
    card.innerHTML = `
      <div class="pokemon-id">#${pokemon.id}</div>
      
      <div class="card-image type-${mainType}">
        <!-- Display Pokémon image, or a placeholder if image is missing -->
        <img src="${pokemon.image || '/images/pokemon-placeholder.png'}" alt="${pokemon.name}">
      </div>
      
      <div class="card-info">
        <!-- Pokémon name with first letter capitalized -->
        <h3 class="pokemon-name">${capitalize(pokemon.name)}</h3>
        
        <div class="pokemon-types">
          ${pokemon.types.map(type => {
            const typeName = typeof type === 'string' ? type : type.type?.name;
            
            return `<span class="type-badge type-${typeName}">${capitalize(typeName)}</span>`;
          }).join('')}
        </div>
        
        <div class="pokemon-stats">
          ${(pokemon.stats || []).map(stat => {
            const rawStatName = typeof stat === 'object' ? (stat.stat?.name || stat.name) : stat.name;
            
            const statValue = typeof stat === 'object' ? (stat.value || stat.base_stat) : stat.value;
            
            return `
              <div class="stat-item">
                <span class="stat-name">${formatStatName(rawStatName)}</span>
                <span class="stat-value">${statValue}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    return card;
}
  
function capitalize(string = '') {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
  
function formatStatName(statName = '') {
    const statNameMap = {
      'hp': 'HP',
      'attack': 'ATK',
      'defense': 'DEF',
      'special-attack': 'SP.ATK',
      'special-defense': 'SP.DEF',
      'speed': 'SPD'
    };
    
    const normalized = statName.toLowerCase().replace(/\s+/g, '-');
    
    return statNameMap[normalized] || statName.toUpperCase();
}