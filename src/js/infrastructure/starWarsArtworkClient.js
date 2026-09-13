// Infrastructure adapter for resolving Star Wars artwork.
// Character artwork comes from a dedicated character API because the SWAPI
// resource itself does not expose image metadata. Other resources use the
// existing artwork metadata API, with a deterministic Visual Guide URL as
// the last-resort fallback for every resource.

const DEFAULT_ARTWORK_API_BASE_URL = 'https://swapi.thehiveresistance.com/api';
const CHARACTER_ARTWORK_API_BASE_URL = 'https://akabab.github.io/starwars-api/api';
const VISUAL_GUIDE_BASE_URL = 'https://starwars-visualguide.com/assets/img';

// Translates the application's SWAPI resource names into the artwork
// providers' resource names. SWAPI calls people "people"; every artwork
// provider calls them "characters".
const ARTWORK_RESOURCE_NAMES = Object.freeze({
  people: 'characters',
  characters: 'characters',
  films: 'films',
  planets: 'planets',
  starships: 'starships',
});

// Where a usable image URL might be found in a provider's JSON response.
// Declarative and additive: supporting a new provider shape means adding a
// path here, not editing a chain of `??` fallbacks.
const IMAGE_URL_PATHS = [
  ['image'],
  ['image_url'],
  ['imageUrl'],
  ['data', 'image_url'],
  ['data', 'imageUrl'],
  ['result', 'image_url'],
  ['result', 'imageUrl'],
  ['result', 'properties', 'image_url'],
];

const readPath = (payload, path) =>
  path.reduce((value, key) => value?.[key], payload);

const normalizeBaseUrl = baseUrl => {
  if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    throw new TypeError('Artwork API base URL must be a non-empty string');
  }

  const url = new URL(baseUrl);
  url.pathname = url.pathname.replace(/\/+$/, '');
  return url.toString().replace(/\/$/, '');
};

const extractEntityId = entity => {
  if (Number.isInteger(entity?.id) && entity.id > 0) return String(entity.id);

  if (typeof entity?.id === 'string' && /^\d+$/.test(entity.id.trim())) {
    const id = entity.id.trim();
    return Number(id) > 0 ? id : null;
  }

  if (typeof entity?.url !== 'string') return null;

  try {
    const segments = new URL(entity.url).pathname.split('/').filter(Boolean);
    const id = segments.at(-1);
    return id && /^\d+$/.test(id) && Number(id) > 0 ? id : null;
  } catch {
    return null;
  }
};

const resolveArtworkResourceName = resource => ARTWORK_RESOURCE_NAMES[resource] ?? null;

/**
 * The two things every artwork URL builder needs: the provider's name for
 * this resource, and the entity's numeric id. Returns null when either is
 * missing so callers can bail out with a single guard instead of repeating
 * the "resource AND id must both resolve" check themselves.
 */
const resolveArtworkContext = (entity, resource) => {
  const artworkResourceName = resolveArtworkResourceName(resource);
  const entityId = extractEntityId(entity);

  return artworkResourceName && entityId ? { artworkResourceName, entityId } : null;
};

const resolveImageUrl = value => {
  if (typeof value !== 'string' || value.trim() === '') return null;

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
};

const extractArtworkImageUrl = payload => {
  for (const path of IMAGE_URL_PATHS) {
    const imageUrl = resolveImageUrl(readPath(payload, path));
    if (imageUrl) return imageUrl;
  }
  return null;
};

const buildArtworkApiUrl = (entity, resource, baseUrl) => {
  const context = resolveArtworkContext(entity, resource);
  return context ? `${baseUrl}/${context.artworkResourceName}/${context.entityId}` : null;
};

const buildCharacterArtworkApiUrl = (entity, resource, baseUrl) => {
  if (resolveArtworkResourceName(resource) !== 'characters') return null;

  const entityId = extractEntityId(entity);
  return entityId ? `${baseUrl}/id/${entityId}.json` : null;
};

const buildVisualGuideImageUrl = (entity, resource) => {
  const context = resolveArtworkContext(entity, resource);
  return context ? `${VISUAL_GUIDE_BASE_URL}/${context.artworkResourceName}/${context.entityId}.jpg` : null;
};

export const createStarWarsArtworkClient = (
  baseUrl = DEFAULT_ARTWORK_API_BASE_URL,
  options = {},
) => {
  const artworkApiBaseUrl = normalizeBaseUrl(baseUrl);
  const characterArtworkApiBaseUrl = normalizeBaseUrl(
    options.characterArtworkBaseUrl ?? CHARACTER_ARTWORK_API_BASE_URL,
  );
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  const requestCache = options.cache ?? new Map();

  if (typeof fetchImplementation !== 'function') {
    throw new TypeError('Artwork API client requires a fetch implementation');
  }

  const getArtworkApiUrl = (entity, resource) =>
    buildArtworkApiUrl(entity, resource, artworkApiBaseUrl);

  const getCharacterArtworkApiUrl = (entity, resource) =>
    buildCharacterArtworkApiUrl(entity, resource, characterArtworkApiBaseUrl);

  const getVisualGuideImageUrl = (entity, resource) =>
    buildVisualGuideImageUrl(entity, resource);

  const requestArtworkImageUrl = async requestUrl => {
    try {
      const response = await fetchImplementation(requestUrl, {
        headers: { Accept: 'application/json' },
      });

      if (!response?.ok) return null;
      return extractArtworkImageUrl(await response.json());
    } catch {
      return null;
    }
  };

  /**
   * All candidate image URLs for an entity, best first: a curated image
   * from the artwork metadata API (when the request or the entity is
   * eligible for one), followed by the deterministic Visual Guide URL as a
   * fallback. The UI tries each in order until one loads.
   */
  const getArtworkImageCandidates = async (entity, resource) => {
    const requestUrl = getCharacterArtworkApiUrl(entity, resource) ?? getArtworkApiUrl(entity, resource);
    if (!requestUrl) return [];

    if (requestCache.has(requestUrl)) return [...requestCache.get(requestUrl)];

    const curatedImageUrl = await requestArtworkImageUrl(requestUrl);
    const fallbackUrl = getVisualGuideImageUrl(entity, resource);

    const candidates = [curatedImageUrl, fallbackUrl].filter(
      (url, index, all) => url && all.indexOf(url) === index,
    );

    requestCache.set(requestUrl, candidates);
    return [...candidates];
  };

  return Object.freeze({
    getArtworkImageCandidates,
    getArtworkApiUrl,
    getCharacterArtworkApiUrl,
    getVisualGuideImageUrl,
    clearCache: () => requestCache.clear(),
  });
};

export const artworkResourceFor = resource => resolveArtworkResourceName(resource);
