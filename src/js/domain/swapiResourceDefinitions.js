// Domain layer: what SWAPI resources this application understands, and the
// display rules for them (name field, which properties appear on a card/in
// detail, how entities are ordered). Nothing here knows about HTTP or the DOM.

export const UNKNOWN_VALUE = 'Unknown';

const createFieldDescriptor = (label, property, suffix = '') => ({ label, property, suffix });

const RESOURCE_DEFINITIONS = {
  people: {
    label: 'Characters',
    nameField: 'name',
    cardFields: [
      createFieldDescriptor('Height', 'height', ' cm'),
      createFieldDescriptor('Mass', 'mass', ' kg'),
      createFieldDescriptor('Birth year', 'birth_year'),
    ],
    detailFields: [
      createFieldDescriptor('Height', 'height', ' cm'),
      createFieldDescriptor('Mass', 'mass', ' kg'),
      createFieldDescriptor('Birth year', 'birth_year'),
      createFieldDescriptor('Gender', 'gender'),
      createFieldDescriptor('Hair colour', 'hair_color'),
      createFieldDescriptor('Eye colour', 'eye_color'),
    ],
  },
  films: {
    label: 'Films',
    nameField: 'title',
    cardFields: [
      createFieldDescriptor('Episode', 'episode_id'),
      createFieldDescriptor('Director', 'director'),
      createFieldDescriptor('Released', 'release_date'),
    ],
    detailFields: [
      createFieldDescriptor('Episode', 'episode_id'),
      createFieldDescriptor('Director', 'director'),
      createFieldDescriptor('Producer', 'producer'),
      createFieldDescriptor('Released', 'release_date'),
    ],
    descriptionField: 'opening_crawl',
  },
  planets: {
    label: 'Planets',
    nameField: 'name',
    cardFields: [
      createFieldDescriptor('Climate', 'climate'),
      createFieldDescriptor('Terrain', 'terrain'),
      createFieldDescriptor('Population', 'population'),
    ],
    detailFields: [
      createFieldDescriptor('Climate', 'climate'),
      createFieldDescriptor('Terrain', 'terrain'),
      createFieldDescriptor('Population', 'population'),
      createFieldDescriptor('Diameter', 'diameter', ' km'),
      createFieldDescriptor('Gravity', 'gravity'),
      createFieldDescriptor('Orbital period', 'orbital_period', ' days'),
      createFieldDescriptor('Rotation period', 'rotation_period', ' hours'),
      createFieldDescriptor('Surface water', 'surface_water', '%'),
    ],
  },
  starships: {
    label: 'Starships',
    nameField: 'name',
    cardFields: [
      createFieldDescriptor('Model', 'model'),
      createFieldDescriptor('Manufacturer', 'manufacturer'),
      createFieldDescriptor('Crew', 'crew'),
    ],
    detailFields: [
      createFieldDescriptor('Model', 'model'),
      createFieldDescriptor('Manufacturer', 'manufacturer'),
      createFieldDescriptor('Crew', 'crew'),
      createFieldDescriptor('Passengers', 'passengers'),
      createFieldDescriptor('Cost', 'cost_in_credits', ' credits'),
      createFieldDescriptor('Length', 'length', ' m'),
      createFieldDescriptor('Max speed', 'max_atmosphering_speed'),
      createFieldDescriptor('Cargo capacity', 'cargo_capacity'),
    ],
  },
};

export const isSupportedResource = resourceName =>
  typeof resourceName === 'string' && Object.hasOwn(RESOURCE_DEFINITIONS, resourceName);

export const assertSupportedResource = resourceName => {
  if (!isSupportedResource(resourceName)) {
    throw new Error(`Unsupported resource: ${resourceName}`);
  }
};

export const getResourceDefinition = resourceName => {
  assertSupportedResource(resourceName);
  return RESOURCE_DEFINITIONS[resourceName];
};

export const getEntityName = (entity, resourceName) => {
  const { nameField } = getResourceDefinition(resourceName);
  return entity[nameField] ?? UNKNOWN_VALUE;
};

export const sortEntitiesByName = (entities, resourceName) => [...entities].sort((firstEntity, secondEntity) => {
  const firstName = getEntityName(firstEntity, resourceName);
  const secondName = getEntityName(secondEntity, resourceName);
  return firstName.localeCompare(secondName);
});
