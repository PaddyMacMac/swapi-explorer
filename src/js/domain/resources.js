// Defines the application's supported SWAPI resources and their display fields.

export const RESOURCE_DEFINITIONS = {
  people: {
    label: 'Characters',
    nameField: 'name',
    cardFields: [
      ['Height', 'height', ' cm'],
      ['Mass', 'mass', ' kg'],
      ['Birth year', 'birth_year', ''],
    ],
    detailFields: [
      ['Height', 'height', ' cm'],
      ['Mass', 'mass', ' kg'],
      ['Birth year', 'birth_year', ''],
      ['Gender', 'gender', ''],
      ['Hair colour', 'hair_color', ''],
      ['Eye colour', 'eye_color', ''],
    ],
  },
  films: {
    label: 'Films',
    nameField: 'title',
    cardFields: [
      ['Episode', 'episode_id', ''],
      ['Director', 'director', ''],
      ['Released', 'release_date', ''],
    ],
    detailFields: [
      ['Episode', 'episode_id', ''],
      ['Director', 'director', ''],
      ['Producer', 'producer', ''],
      ['Released', 'release_date', ''],
    ],
    descriptionField: 'opening_crawl',
  },
  planets: {
    label: 'Planets',
    nameField: 'name',
    cardFields: [
      ['Climate', 'climate', ''],
      ['Terrain', 'terrain', ''],
      ['Population', 'population', ''],
    ],
    detailFields: [
      ['Climate', 'climate', ''],
      ['Terrain', 'terrain', ''],
      ['Population', 'population', ''],
      ['Diameter', 'diameter', ' km'],
      ['Gravity', 'gravity', ''],
      ['Orbital period', 'orbital_period', ' days'],
      ['Rotation period', 'rotation_period', ' hours'],
      ['Surface water', 'surface_water', '%'],
    ],
  },
  starships: {
    label: 'Starships',
    nameField: 'name',
    cardFields: [
      ['Model', 'model', ''],
      ['Manufacturer', 'manufacturer', ''],
      ['Crew', 'crew', ''],
    ],
    detailFields: [
      ['Model', 'model', ''],
      ['Manufacturer', 'manufacturer', ''],
      ['Crew', 'crew', ''],
      ['Passengers', 'passengers', ''],
      ['Cost', 'cost_in_credits', ' credits'],
      ['Length', 'length', ' m'],
      ['Max speed', 'max_atmosphering_speed', ''],
      ['Cargo capacity', 'cargo_capacity', ''],
    ],
  },
};

export const isSupportedResource = resource => Boolean(RESOURCE_DEFINITIONS[resource]);

export const getResourceDefinition = resource => {
  const definition = RESOURCE_DEFINITIONS[resource];
  if (!definition) throw new Error(`Unsupported resource: ${resource}`);
  return definition;
};

export const getEntityName = (entity, resource) => {
  const { nameField } = getResourceDefinition(resource);
  return entity[nameField] ?? 'Unknown';
};

export const sortEntitiesByName = (entities, resource) =>
  [...entities].sort((first, second) =>
    getEntityName(first, resource).localeCompare(getEntityName(second, resource))
  );
