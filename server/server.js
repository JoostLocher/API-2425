import 'dotenv/config';
import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { Liquid } from 'liquidjs';
import sirv from 'sirv';

const app = new App();

const engine = new Liquid({ extname: '.liquid' });

const renderTemplate = async (template, data) => {
  const templateData = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    ...data
  };
  return await engine.renderFile(template, templateData);
};

app
.use(logger())
.use('/', sirv(process.env.NODE_ENV === 'development' ? 'client' : 'dist'))
.listen(3000, () => console.log('Server available on http://localhost:3000'));

// ==========================================
// pokemon API ophalen
// ==========================================
const baseURL = "https://pokeapi.co/api/v2/";

const limit = 1025;
const allPokemon = `${baseURL}pokemon?offset=0&limit=${limit}`;

// ==========================================
// home pagina
// ==========================================
app.get('/', async (req, res) => {
  const searchQuery = req.query.searchbar || ''
  console.log(searchQuery)

  // Fetch search results based on the user's query
  const searchResponse = await fetch('https://pokemon-service-ucql.onrender.com/api/v1/pokemon/search?name=' + searchQuery);
  const searchResults = await searchResponse.json();

  // Extract the names of Pokémon found in the search results
  const filterNames = searchResults.map((result) => {
    return result.name
  });

  // Fetch all Pokémon data (names and URLs)
  const pokemonResponse = await fetch(allPokemon);
  const pokemonData = await pokemonResponse.json();

  // Filter Pokémon by the names found in the search
  let filteredPokemon = pokemonData.results.filter((pokemon) => {
    if (filterNames.includes(pokemon.name)) {
      return pokemon
    }
  });

  // Fetch all generations data
  // const genResponse = await fetch(`${baseURL}generation`);
  // const genData = await genResponse.json();


  // Map the generation data to a more accessible format
  // const genList = genData.results.map((gen, index) => ({
  //   id: index + 1,
  //   name: gen.name
  // }));

  // Fetch sprite details for each filtered Pokémon
  const pokemonSprites = await Promise.all(
    filteredPokemon.map(async (pokemon) => {
      const detailResponse = await fetch(pokemon.url);
      const detailData = await detailResponse.json();
      return {
        name: pokemon.name,
        sprite: detailData.sprites.front_default // Get the front sprite image
      };
    })
  );

  return res.send(
    await renderTemplate('server/views/index.liquid', {
      title: 'Home',
      pokemon: pokemonSprites,
      // generations: genList
    })
  );
});

// ==========================================
// Memory Game
// ==========================================
app.get('/pokemon/:name/memory-game', async (req, res) => {
  const name = req.params.name;
  const response = await fetch(`${baseURL}pokemon/${name}`);
  const data = await response.json();
  
  // Get the available sprites for this Pokémon
  const sprites = data.sprites;
  
  // Create array of sprites to use for the memory game
  // We'll use regular and shiny versions of front/back sprites
  const availableSprites = [
    { id: 'front_default', sprite: sprites.front_default },
    { id: 'front_shiny', sprite: sprites.front_shiny },
    { id: 'back_default', sprite: sprites.back_default },
    { id: 'back_shiny', sprite: sprites.back_shiny },
    { id: 'front_female', sprite: sprites.front_female },
    { id: 'front_shiny_female', sprite: sprites.front_shiny_female }
  ].filter(sprite => sprite.sprite !== null); // Filter out null sprites
  
  // If we don't have enough sprites, use other versions or generations
  if (availableSprites.length < 6) {
    // Add other sprites if available
    const otherSprites = [];
    
    // Check for other versions like dream_world, official-artwork, etc.
    if (sprites.other) {
      if (sprites.other['official-artwork']?.front_default) {
        otherSprites.push({
          id: 'official_artwork',
          sprite: sprites.other['official-artwork'].front_default
        });
      }
      
      if (sprites.other.dream_world?.front_default) {
        otherSprites.push({
          id: 'dream_world',
          sprite: sprites.other.dream_world.front_default
        });
      }
      
      if (sprites.other.home?.front_default) {
        otherSprites.push({
          id: 'home_default',
          sprite: sprites.other.home.front_default
        });
      }
      
      if (sprites.other.home?.front_shiny) {
        otherSprites.push({
          id: 'home_shiny',
          sprite: sprites.other.home.front_shiny
        });
      }
    }
    
    // Add game version sprites if needed
    if (availableSprites.length + otherSprites.length < 6) {
      const versionSprites = [];
      for (const version in sprites.versions) {
        for (const generation in sprites.versions[version]) {
          if (sprites.versions[version][generation].front_default) {
            versionSprites.push({
              id: `${version}_${generation}`,
              sprite: sprites.versions[version][generation].front_default
            });
          }
          
          if (sprites.versions[version][generation].front_shiny) {
            versionSprites.push({
              id: `${version}_${generation}_shiny`,
              sprite: sprites.versions[version][generation].front_shiny
            });
          }
        }
      }
      
      // Add version sprites until we have enough
      for (let i = 0; i < versionSprites.length && availableSprites.length + otherSprites.length < 6; i++) {
        otherSprites.push(versionSprites[i]);
      }
    }
    
    // Add the other sprites to our available sprites
    availableSprites.push(...otherSprites);
  }
  
  // Take the first 6 unique sprites or whatever is available
  const uniqueSprites = availableSprites.slice(0, 6);
  
  // Create pairs for each sprite (duplicate each sprite)
  const cardPairs = [];
  uniqueSprites.forEach((spriteObj, index) => {
    // Add two of each sprite for matching
    cardPairs.push({
      id: `${spriteObj.id}-1`,
      sprite: spriteObj.sprite
    });
    
    cardPairs.push({
      id: `${spriteObj.id}-2`,
      sprite: spriteObj.sprite
    });
  });
  
  return res.send(await renderTemplate('server/views/memory-game.liquid', {
    title: `${name} Memory Game`,
    pokemon: data,
    cards: cardPairs
  }));
});


// ==========================================
// Binder Route
// ==========================================
app.get('/binder', async (req, res) => {
  return res.send(
    await renderTemplate('server/views/binder.liquid', {
      title: 'Pokémon Card Collection'
    })
  );
});


// ==========================================
// Pokemon detail pagina
// ==========================================
// app.get('/pokemon/:name/', async (req, res) => {
//   const name = req.params.name;
//   const response = await fetch(`${baseURL}pokemon/${name}`);
//   const data = await response.json();

//   const types = data.types.map(typeObj => typeObj.type.name);

//   const stats = data.stats.map(stat => ({
//     name: stat.stat.name,
//     value: stat.base_stat
//   }));