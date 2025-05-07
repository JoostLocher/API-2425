// wacht tot de pagina volledig is geladen
document.addEventListener('DOMContentLoaded', () => {
  // zoek de binder container in de HTML
  const binderContainer = document.getElementById('binder-container');

  // als de container niet bestaat, doe dan niets
  if (!binderContainer) return;
  
  // als de container wel bestaat, laad dan de verzamelde kaarten
  toonVerzameldeKaarten();
});

// functie om verzamelde kaarten weer te geven in de binder
function toonVerzameldeKaarten() {
  // haal de HTML elementen op die we nodig hebben
  const binderGrid = document.getElementById('binder-grid');
  const leegBericht = document.getElementById('empty-binder-message');

  // haal de opgeslagen kaarten uit de lokale opslag van de browser
  const verzameldeKaarten = JSON.parse(localStorage.getItem('pokemonCards') || '[]');

  // als er geen kaarten zijn, toon dan het 'lege binder' bericht
  if (verzameldeKaarten.length === 0) {
    if (leegBericht) leegBericht.style.display = 'block';
    return;
  }

  // als er wel kaarten zijn, verberg dan het 'lege binder' bericht
  if (leegBericht) leegBericht.style.display = 'none';

  // maak voor elke kaart een HTML element en voeg het toe aan de grid
  verzameldeKaarten.forEach(kaart => {
    try {
      binderGrid?.appendChild(maakPokemonKaart(kaart));
    } catch (fout) {
      console.error(`Fout bij het maken van kaart voor ${kaart.name}:`, fout);
    }
  });
}

// functie om een HTML element voor een Pokemon kaart te maken
function maakPokemonKaart(pokemon) {
  // Bepaal het hoofdtype van de Pokemon (of gebruik 'normal' als er geen type is)
  const hoofdType = pokemon.types[0] || 'normal';
  
  // maak een nieuw div element voor de kaart
  const kaart = document.createElement('div');
  kaart.className = `pokemon-card main-type-${hoofdType}`;

  // vul de kaart met HTML inhoud
  kaart.innerHTML = `
    <div class="pokemon-id">#${pokemon.id}</div>
    
    <div class="card-image type-${hoofdType}">
      <img src="${pokemon.image || '/images/pokemon-placeholder.png'}" alt="${pokemon.name}">
    </div>
    
    <div class="card-info">
      <h3 class="pokemon-name">${eersteLetterHoofdletter(pokemon.name)}</h3>
      
      <div class="pokemon-types">
        ${maakTypeLabels(pokemon.types)}
      </div>
      
      <div class="pokemon-stats">
        ${maakStatsHtml(pokemon.stats || [])}
      </div>
    </div>
  `;
  
  return kaart;
}

// functie om type labels te genereren
function maakTypeLabels(types) {
return types.map(type => {
  const typeNaam = typeof type === 'string' ? type : type.type?.name;
  return `<span class="type-badge type-${typeNaam}">${eersteLetterHoofdletter(typeNaam)}</span>`;
}).join('');
}

// functie om stats HTML te genereren
function maakStatsHtml(stats) {
return stats.map(stat => {
  const statNaam = typeof stat === 'object' ? (stat.stat?.name || stat.name) : stat.name;
  const statWaarde = typeof stat === 'object' ? (stat.value || stat.base_stat) : stat.value;
  
  return `
    <div class="stat-item">
      <span class="stat-name">${formateerStatNaam(statNaam)}</span>
      <span class="stat-value">${statWaarde}</span>
    </div>
  `;
}).join('');
}

// functie om de eerste letter van een string hoofdletter te maken
function eersteLetterHoofdletter(tekst = '') {
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

// functie om stat namen te formatteren naar afkortingen
function formateerStatNaam(statNaam = '') {
  const statNaamMap = {
    'hp': 'HP',
    'attack': 'ATK',
    'defense': 'DEF',
    'special-attack': 'SP.ATK',
    'special-defense': 'SP.DEF',
    'speed': 'SPD'
  };
  
  const genormaliseerd = statNaam.toLowerCase().replace(/\s+/g, '-');
  
  return statNaamMap[genormaliseerd] || statNaam.toUpperCase();
}