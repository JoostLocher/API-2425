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

// Serve static assets
app
  .use(logger())
  .use('/', sirv(process.env.NODE_ENV === 'development' ? 'client' : 'dist'))
  .listen(3000, () => console.log('Server available on http://localhost:3000'));

// ----------------------------------------------
// Constants
// ----------------------------------------------
const baseURL = "https://pokeapi.co/api/v2/";
const limit = 151;
const allPokemon = `${baseURL}pokemon?offset=0&limit=${limit}`;

// ----------------------------------------------
// Home Route
// ----------------------------------------------
app.get('/', async (req, res) => {
  const searchQuery = req.query.searchbar || '';
  let filteredPokemon = [];

  try {
    // Try to get filtered names from your external service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const searchResponse = await fetch(`https://pokemon-service-ucql.onrender.com/api/v1/pokemon/search?name=${searchQuery}`, {
      signal: controller.signal
    });

    const searchResults = await searchResponse.json();
    clearTimeout(timeoutId);

    const filterNames = searchResults.map((result) => result.name);

    const pokemonResponse = await fetch(allPokemon);
    const pokemonData = await pokemonResponse.json();

    filteredPokemon = pokemonData.results.filter(pokemon =>
      filterNames.includes(pokemon.name)
    );
  } catch (err) {
    console.error("🔥 External service failed or timed out:", err);

    // Fallback: basic Pokémon fetch without filtering
    const pokemonResponse = await fetch(allPokemon);
    const pokemonData = await pokemonResponse.json();
    filteredPokemon = pokemonData.results;
  }

  // Fetch sprite images
  const pokemonSprites = await Promise.all(
    filteredPokemon.map(async (pokemon) => {
      const detailResponse = await fetch(pokemon.url);
      const detailData = await detailResponse.json();
      return {
        name: pokemon.name,
        sprite: detailData.sprites.front_default
      };
    })
  );

  return res.send(
    await renderTemplate('server/views/index.liquid', {
      title: 'Home',
      pokemon: pokemonSprites
    })
  );
});

// ----------------------------------------------
// Memory Game Route
// ----------------------------------------------
app.get('/pokemon/:name/memory-game', async (req, res) => {
  const name = req.params.name;
  const response = await fetch(`${baseURL}pokemon/${name}`);
  const data = await response.json();

  const get = (obj, path) =>
    path.reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : null, obj);

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

  if (availableSprites.length < 3) {
    const versions = data.sprites.versions;
    for (const group in versions) {
      for (const version in versions[group]) {
        const spriteUrl = versions[group][version]?.front_default;
        if (spriteUrl && !availableSprites.find(e => e.sprite === spriteUrl)) {
          availableSprites.push({ id: `${group}_${version}`, sprite: spriteUrl });
        }
        if (availableSprites.length >= 6) break;
      }
      if (availableSprites.length >= 6) break;
    }
  }

  const selected = availableSprites.slice(0, 6);

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

// ----------------------------------------------
// Binder Route
// ----------------------------------------------
app.get('/binder', async (req, res) => {
  return res.send(
    await renderTemplate('server/views/binder.liquid', {
      title: 'Card Collection'
    })
  );
});
