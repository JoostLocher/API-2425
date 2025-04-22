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

// 1025
const limit = 105;
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

  const get = (obj, path) =>
    path.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : null, obj);

  // Define primary sprite sources
  const spriteSources = [
    { id: 'front_default', path: ['sprites', 'front_default'] },
    { id: 'front_shiny', path: ['sprites', 'front_shiny'] },
    { id: 'back_default', path: ['sprites', 'back_default'] },
    { id: 'back_shiny', path: ['sprites', 'back_shiny'] },
    { id: 'official_artwork', path: ['sprites', 'other', 'official-artwork', 'front_default'] },
    { id: 'home_default', path: ['sprites', 'other', 'home', 'front_default'] },
    { id: 'home_shiny', path: ['sprites', 'other', 'home', 'front_shiny'] },
    { id: 'dream_world', path: ['sprites', 'other', 'dream_world', 'front_default'] }
  ];

  const availableSprites = spriteSources
    .map(source => ({ id: source.id, sprite: get(data, source.path) }))
    .filter(entry => !!entry.sprite);

  // If fewer than 3 unique sprite sources, try to find more in game versions
  if (availableSprites.length < 3) {
    const versions = data.sprites.versions;
    for (const group in versions) {
      for (const version in versions[group]) {
        const spriteUrl = versions[group][version]?.front_default;
        if (spriteUrl && !availableSprites.find(e => e.sprite === spriteUrl)) {
          availableSprites.push({
            id: `${group}_${version}`,
            sprite: spriteUrl
          });
        }
        if (availableSprites.length >= 6) break;
      }
      if (availableSprites.length >= 6) break;
    }
  }

  // Take first 3–6 unique sprites
  const selected = availableSprites.slice(0, 6);

  // Duplicate each for matching pairs
  const cardPairs = selected.flatMap(sprite => ([
    { id: `${sprite.id}-1`, sprite: sprite.sprite },
    { id: `${sprite.id}-2`, sprite: sprite.sprite }
  ]));

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