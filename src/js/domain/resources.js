// Domain layer: what resources the application understands, and the display
// rules for them (name field, which properties appear on a card/in detail,
// how entities are ordered). Nothing here knows about HTTP or the DOM.

/** The value shown when an entity is missing a field the definition asks for. */
export const UNKNOWN_VALUE = 'Unknown';

/**
 * Describes one property to display for an entity.
 * @param {string} label - Human-readable heading, e.g. "Birth year".
 * @param {string} property - Property name to read from the raw SWAPI entity.
 * @param {string} [suffix] - Unit suffix appended after the value, e.g. " cm".
 */
const field = (label, property, suffix = '') => ({ label, property, suffix });

export const RESOURCE_DEFINITIONS = {
  people: {
    label: 'Characters',
    nameField: 'name',
    cardFields: [
      field('Height', 'height', ' cm'),
      field('Mass', 'mass', ' kg'),
      field('Birth year', 'birth_year'),
    ],
    detailFields: [
      field('Height', 'height', ' cm'),
      field('Mass', 'mass', ' kg'),
      field('Birth year', 'birth_year'),
      field('Gender', 'gender'),
      field('Hair colour', 'hair_color'),
      field('Eye colour', 'eye_color'),
    ],
  },
  films: {
    label: 'Films',
    nameField: 'title',
    cardFields: [
      field('Episode', 'episode_id'),
      field('Director', 'director'),
      field('Released', 'release_date'),
    ],
    detailFields: [
      field('Episode', 'episode_id'),
      field('Director', 'director'),
      field('Producer', 'producer'),
      field('Released', 'release_date'),
    ],
    descriptionField: 'opening_crawl',
  },
  planets: {
    label: 'Planets',
    nameField: 'name',
    cardFields: [
      field('Climate', 'climate'),
      field('Terrain', 'terrain'),
      field('Population', 'population'),
    ],
    detailFields: [
      field('Climate', 'climate'),
      field('Terrain', 'terrain'),
      field('Population', 'population'),
      field('Diameter', 'diameter', ' km'),
      field('Gravity', 'gravity'),
      field('Orbital period', 'orbital_period', ' days'),
      field('Rotation period', 'rotation_period', ' hours'),
      field('Surface water', 'surface_water', '%'),
    ],
  },
  starships: {
    label: 'Starships',
    nameField: 'name',
    cardFields: [
      field('Model', 'model'),
      field('Manufacturer', 'manufacturer'),
      field('Crew', 'crew'),
    ],
    detailFields: [
      field('Model', 'model'),
      field('Manufacturer', 'manufacturer'),
      field('Crew', 'crew'),
      field('Passengers', 'passengers'),
      field('Cost', 'cost_in_credits', ' credits'),
      field('Length', 'length', ' m'),
      field('Max speed', 'max_atmosphering_speed'),
      field('Cargo capacity', 'cargo_capacity'),
    ],
  },
};

export const isSupportedResource = resource => Boolean(RESOURCE_DEFINITIONS[resource]);

/**
 * Throws when `resource` is not one of the application's supported resources.
 * Exists so callers can express "make sure this is valid" without needing
 * the resulting definition, instead of calling getResourceDefinition and
 * discarding what it returns.
 */
export const assertSupportedResource = resource => {
  if (!isSupportedResource(resource)) throw new Error(`Unsupported resource: ${resource}`);
};

export const getResourceDefinition = resource => {
  assertSupportedResource(resource);
  return RESOURCE_DEFINITIONS[resource];
};

export const getEntityName = (entity, resource) => {
  const { nameField } = getResourceDefinition(resource);
  return entity[nameField] ?? UNKNOWN_VALUE;
};

export const sortEntitiesByName = (entities, resource) =>
  [...entities].sort((first, second) =>
    getEntityName(first, resource).localeCompare(getEntityName(second, resource))
  );
