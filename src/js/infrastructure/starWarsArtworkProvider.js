// Resolves Star Wars artwork from external metadata APIs, with a Visual Guide
// URL as the final fallback.

const DEFAULT_ARTWORK_METADATA_API_BASE_URL = 'https://swapi.thehiveresistance.com/api';
const DEFAULT_CHARACTER_ARTWORK_API_BASE_URL = 'https://akabab.github.io/starwars-api/api';
const VISUAL_GUIDE_BASE_URL = 'https://starwars-visualguide.com/assets/img';

const ARTWORK_RESOURCE_NAMES = {
  people: 'characters',
  characters: 'characters',
  films: 'films',
  planets: 'planets',
  starships: 'starships',
};

// Supported locations for image URLs in provider responses.
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

const getNestedValue = (payload, path) =>
  path.reduce((value, key) => value?.[key], payload);

const normalizeBaseUrl = baseUrl => {
  if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    throw new TypeError('Artwork API base URL must be a non-empty string');
  }

  const normalizedUrl = new URL(baseUrl);
  normalizedUrl.pathname = normalizedUrl.pathname.replace(/\/+$/, '');
  return normalizedUrl.toString().replace(/\/$/, '');
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

const mapToArtworkResourceName = resourceName => ARTWORK_RESOURCE_NAMES[resourceName] ?? null;

const resolveArtworkRequestContext = (entity, resourceName) => {
  const artworkResourceName = mapToArtworkResourceName(resourceName);
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
    const imageUrl = resolveImageUrl(getNestedValue(payload, path));
    if (imageUrl) return imageUrl;
  }
  return null;
};

const removeDuplicateUrls = urls => [...new Set(urls.filter(Boolean))];

const buildArtworkMetadataApiUrl = (entity, resourceName, baseUrl) => {
  const context = resolveArtworkRequestContext(entity, resourceName);
  return context ? `${baseUrl}/${context.artworkResourceName}/${context.entityId}` : null;
};

const buildCharacterArtworkApiUrl = (entity, resourceName, baseUrl) => {
  if (mapToArtworkResourceName(resourceName) !== 'characters') return null;

  const entityId = extractEntityId(entity);
  return entityId ? `${baseUrl}/id/${entityId}.json` : null;
};

const buildVisualGuideImageUrl = (entity, resourceName) => {
  const context = resolveArtworkRequestContext(entity, resourceName);
  return context ? `${VISUAL_GUIDE_BASE_URL}/${context.artworkResourceName}/${context.entityId}.jpg` : null;
};

export const createStarWarsArtworkProvider = (
  artworkMetadataBaseUrl = DEFAULT_ARTWORK_METADATA_API_BASE_URL,
  options = {},
) => {
  const {
    characterArtworkBaseUrl = DEFAULT_CHARACTER_ARTWORK_API_BASE_URL,
    fetch: fetchImplementation = globalThis.fetch,
    cache = new Map(),
  } = options;
  const normalizedArtworkMetadataBaseUrl = normalizeBaseUrl(artworkMetadataBaseUrl);
  const normalizedCharacterArtworkBaseUrl = normalizeBaseUrl(characterArtworkBaseUrl);

  if (typeof fetchImplementation !== 'function') {
    throw new TypeError('Artwork API client requires a fetch implementation');
  }

  const getArtworkMetadataUrl = (entity, resourceName) =>
    buildArtworkMetadataApiUrl(entity, resourceName, normalizedArtworkMetadataBaseUrl);

  const getCharacterArtworkMetadataUrl = (entity, resourceName) =>
    buildCharacterArtworkApiUrl(entity, resourceName, normalizedCharacterArtworkBaseUrl);

  const getVisualGuideImageUrl = (entity, resourceName) =>
    buildVisualGuideImageUrl(entity, resourceName);

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

  const getArtworkImageCandidates = async (entity, resourceName) => {
    const requestUrl = getCharacterArtworkMetadataUrl(entity, resourceName)
      ?? getArtworkMetadataUrl(entity, resourceName);
    if (!requestUrl) return [];

    if (cache.has(requestUrl)) return [...cache.get(requestUrl)];

    const curatedImageUrl = await requestArtworkImageUrl(requestUrl);
    const fallbackUrl = getVisualGuideImageUrl(entity, resourceName);

    const candidates = removeDuplicateUrls([curatedImageUrl, fallbackUrl]);

    cache.set(requestUrl, candidates);
    return [...candidates];
  };

  return {
    getArtworkImageCandidates,
    getArtworkMetadataUrl,
    getCharacterArtworkMetadataUrl,
    getVisualGuideImageUrl,
    clearCache: () => cache.clear(),
  };
};

export const artworkResourceNameFor = resourceName => mapToArtworkResourceName(resourceName);
