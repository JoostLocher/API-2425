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

const limit = 100;
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
  const genResponse = await fetch(`${baseURL}generation`);
  const genData = await genResponse.json();


  // Map the generation data to a more accessible format
  const genList = genData.results.map((gen, index) => ({
    id: index + 1,
    name: gen.name
  }));

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
      generations: genList
    })
  );
});

// ==========================================
// Pokemon detail pagina
// ==========================================
app.get('/pokemon/:name/', async (req, res) => {
    const name = req.params.name;
    const response = await fetch(`${baseURL}pokemon/${name}`);
    const data = await response.json();

    const types = data.types.map(typeObj => typeObj.type.name);

    const stats = data.stats.map(stat => ({
      name: stat.stat.name,
      value: stat.base_stat
    }));
    

    return res.send(await renderTemplate('server/views/detail.liquid', {
      title: `${name}`,
      pokemon: data,
      stats,
      types
    })); 
});

// // Pokémon detail page route
// app.get('/pokemon/:pokemonName', async (req, res) => {
//   try {
//     const pokemonName = req.params.pokemonName;
//     const pokemonDetailResponse = await fetch(`${apiBaseURL}pokemon/${pokemonName}`);
//     const pokemonDetailData = await pokemonDetailResponse.json();

//     // Get Pokémon types
//     const pokemonTypes = pokemonDetailData.types.map(typeObj => typeObj.type.name);

//     // Get Pokémon stats
//     const pokemonStats = pokemonDetailData.stats.map(stat => ({
//       name: stat.stat.name,
//       value: stat.base_stat
//     }));

//     // Render the Pokémon detail page with the fetched data
//     return res.send(await renderPage('server/views/detail.liquid', {
//       title: pokemonName,
//       pokemon: pokemonDetailData,
//       stats: pokemonStats,
//       types: pokemonTypes
//     }));
//   }
// });
