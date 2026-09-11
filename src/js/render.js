// render.js — builds DOM from data, nothing else. No fetching here.

export const renderStatus = (message) => {
  const status = document.getElementById('status');
  status.textContent = message;
  status.classList.toggle('is-error', message.startsWith('Error'));
};

// films use `title`, everything else uses `name`.
export const getEntityName = (item, resource) => (resource === 'films' ? item.title : item.name);

export const renderResults = (items, resource) => {
  const container = document.getElementById('results');
  container.innerHTML = '';

  const cardBuilders = {
    people: renderPersonCard,
    films: renderFilmCard,
    planets: renderPlanetCard,
    starships: renderStarshipCard,
  };
  const buildCard = cardBuilders[resource];

  items.forEach(item => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = buildCard(item);
    container.appendChild(col);
  });
};

// Fills the "jump to" dropdown with the given items, sorted alphabetically
// by their display name. Returns the sorted array so the caller can map a
// selected option's index back to the original item.
export const renderPicker = (items, resource) => {
  const picker = document.getElementById('entity-picker');
  const sorted = [...items].sort((a, b) =>
    getEntityName(a, resource).localeCompare(getEntityName(b, resource))
  );

  picker.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Jump to…';
  placeholder.disabled = true;
  placeholder.selected = true;
  picker.appendChild(placeholder);

  sorted.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = getEntityName(item, resource);
    picker.appendChild(option);
  });

  return sorted;
};

// Populates the details modal's title + body for a single entity.
export const renderDetails = (item, resource) => {
  const detailBuilders = {
    people: renderPersonDetail,
    films: renderFilmDetail,
    planets: renderPlanetDetail,
    starships: renderStarshipDetail,
  };

  document.getElementById('detailsModalLabel').textContent = getEntityName(item, resource);
  document.getElementById('detailsModalBody').innerHTML = detailBuilders[resource](item);
};

const renderPersonCard = (person) => {
  return `
    <div class="card h-100">
      <div class="card-body">
        <h5 class="card-title">${person.name}</h5>
        <p class="card-text mb-1">Height: ${person.height} cm</p>
        <p class="card-text mb-1">Mass: ${person.mass} kg</p>
        <p class="card-text">Birth year: ${person.birth_year}</p>
      </div>
    </div>`;
};

const renderFilmCard = (film) => {
  return `
    <div class="card h-100">
      <div class="card-body">
        <h5 class="card-title">${film.title}</h5>
        <p class="card-text mb-1">Episode: ${film.episode_id}</p>
        <p class="card-text mb-1">Director: ${film.director}</p>
        <p class="card-text">Released: ${film.release_date}</p>
      </div>
    </div>`;
};

const renderPlanetCard = (planet) => {
  return `
    <div class="card h-100">
      <div class="card-body">
        <h5 class="card-title">${planet.name}</h5>
        <p class="card-text mb-1">Climate: ${planet.climate}</p>
        <p class="card-text mb-1">Terrain: ${planet.terrain}</p>
        <p class="card-text">Population: ${planet.population}</p>
      </div>
    </div>`;
};

const renderStarshipCard = (starship) => {
  return `
    <div class="card h-100">
      <div class="card-body">
        <h5 class="card-title">${starship.name}</h5>
        <p class="card-text mb-1">Model: ${starship.model}</p>
        <p class="card-text mb-1">Manufacturer: ${starship.manufacturer}</p>
        <p class="card-text">Crew: ${starship.crew}</p>
      </div>
    </div>`;
};

const detailRow = (label, value) => `
  <dt class="col-5">${label}</dt>
  <dd class="col-7">${value}</dd>`;

const renderPersonDetail = (person) => `
  <dl class="row mb-0">
    ${detailRow('Height', `${person.height} cm`)}
    ${detailRow('Mass', `${person.mass} kg`)}
    ${detailRow('Birth year', person.birth_year)}
    ${detailRow('Gender', person.gender)}
    ${detailRow('Hair color', person.hair_color)}
    ${detailRow('Eye color', person.eye_color)}
  </dl>`;

const renderFilmDetail = (film) => `
  <dl class="row mb-2">
    ${detailRow('Episode', film.episode_id)}
    ${detailRow('Director', film.director)}
    ${detailRow('Producer', film.producer)}
    ${detailRow('Released', film.release_date)}
  </dl>
  <p class="mb-0 fst-italic">${film.opening_crawl}</p>`;

const renderPlanetDetail = (planet) => `
  <dl class="row mb-0">
    ${detailRow('Climate', planet.climate)}
    ${detailRow('Terrain', planet.terrain)}
    ${detailRow('Population', planet.population)}
    ${detailRow('Diameter', `${planet.diameter} km`)}
    ${detailRow('Gravity', planet.gravity)}
    ${detailRow('Orbital period', `${planet.orbital_period} days`)}
    ${detailRow('Rotation period', `${planet.rotation_period} hours`)}
    ${detailRow('Surface water', `${planet.surface_water}%`)}
  </dl>`;

const renderStarshipDetail = (starship) => `
  <dl class="row mb-0">
    ${detailRow('Model', starship.model)}
    ${detailRow('Manufacturer', starship.manufacturer)}
    ${detailRow('Crew', starship.crew)}
    ${detailRow('Passengers', starship.passengers)}
    ${detailRow('Cost', `${starship.cost_in_credits} credits`)}
    ${detailRow('Length', `${starship.length} m`)}
    ${detailRow('Max speed', starship.max_atmosphering_speed)}
    ${detailRow('Cargo capacity', starship.cargo_capacity)}
  </dl>`;
