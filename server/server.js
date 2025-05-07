import 'dotenv/config';
import { App } from '@tinyhttp/app';
import { logger } from '@tinyhttp/logger';
import { Liquid } from 'liquidjs';
import sirv from 'sirv';

const app = new App(); //server
const engine = new Liquid({ extname: '.liquid' }); //gebruik .liquid

// opent en geeft data aan een .liquid
const renderTemplate = async (template, data) => {
  const templateData = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    ...data
  };
  return await engine.renderFile(template, templateData);
};

// start server
app
  .use(logger())
  .use('/', sirv(process.env.NODE_ENV === 'development' ? 'client' : 'dist'))
  .listen(3000, () => console.log('Server available on http://localhost:3000'));

// url + limit
const baseURL = "https://pokeapi.co/api/v2/";
const limit = 10; // Gen 1 Pokemon
const allPokemon = `${baseURL}pokemon?offset=0&limit=${limit}`;

// Home page / index.liquid route
app.get('/', async (req, res) => {
  const searchQuery = req.query.searchbar || '';

  // zoekt op naam in api en zet in lijst
  const searchResponse = await fetch('https://pokemon-service-ucql.onrender.com/api/v1/pokemon/search?name=' + searchQuery);
  const searchResults = await searchResponse.json();
  const filterNames = searchResults.map(result => result.name); //alleen name uit result halen en in lijst zetten

  // get pokemon data
  const pokemonResponse = await fetch(allPokemon);
  const pokemonData = await pokemonResponse.json(); // omzetten in js-object / lijst

  // pokemon filter op searchresult
  const filteredPokemon = pokemonData.results.filter(pokemon =>
    filterNames.includes(pokemon.name)
  );

  // get sprites
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

// memory game route
app.get('/pokemon/:name/memory-game', async (req, res) => {
  const name = req.params.name;
  const response = await fetch(`${baseURL}pokemon/${name}`);
  const data = await response.json();

  const availableSprites = [
    { id: 'front_default', sprite: data.sprites.front_default },
    { id: 'front_shiny', sprite: data.sprites.front_shiny },
    { id: 'back_default', sprite: data.sprites.back_default },
    { id: 'back_shiny', sprite: data.sprites.back_shiny },
    { id: 'official_artwork', sprite: data.sprites.other?.['official-artwork']?.front_default },
    { id: 'home_default', sprite: data.sprites.other?.home?.front_default },
    { id: 'home_shiny', sprite: data.sprites.other?.home?.front_shiny },
    { id: 'dream_world', sprite: data.sprites.other?.dream_world?.front_default }
  ].filter(entry => entry.sprite); // de null er uit halen

  // Find more sprites if needed
  if (availableSprites.length < 3) {
    const versions = data.sprites.versions; // kijkt naar versies uit verschillende games van die pokemon
    for (const group in versions) {
      for (const version in versions[group]) {
        const spriteUrl = versions[group][version]?.front_default; // als het niet bestaat dan undefined
        if (spriteUrl && !availableSprites.find(e => e.sprite === spriteUrl)) { // haalt sprite uit element
          availableSprites.push({
            id: `${group}_${version}`, // bv. gen-i_red-blue
            sprite: spriteUrl
          });
        }
        if (availableSprites.length >= 6) break;
      }
      if (availableSprites.length >= 6) break;
    }
  }

  // select sprite en make pairs
  const selected = availableSprites.slice(0, 6); // max 6 sprites
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

// binder route
app.get('/binder', async (req, res) => {
  return res.send(
    await renderTemplate('server/views/binder.liquid', {
      title: 'Card Collection'
    })
  );
});