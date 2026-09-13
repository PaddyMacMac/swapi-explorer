import { describe, expect, it, vi } from 'vitest';
import {
  artworkResourceNameFor,
  createStarWarsArtworkProvider,
} from '../src/js/infrastructure/starWarsArtworkProvider.js';

const createProviderWithFetch = fetch => createStarWarsArtworkProvider(undefined, { fetch });

describe('createStarWarsArtworkProvider', () => {
  it.each([
    ['films', 'films'],
    ['planets', 'planets'],
    ['starships', 'starships'],
  ])('builds the artwork metadata endpoint for %s', (resourceName, artworkResourceName) => {
    const artworkProvider = createStarWarsArtworkProvider();
    expect(
      artworkProvider.getArtworkMetadataUrl({ url: `https://swapi.info/api/${resourceName}/7/` }, resourceName),
    ).toBe(`https://swapi.thehiveresistance.com/api/${artworkResourceName}/7`);
  });

  it('maps people to the character artwork resource', () => {
    const artworkProvider = createStarWarsArtworkProvider();
    expect(artworkProvider.getArtworkMetadataUrl({ id: 1 }, 'people'))
      .toBe('https://swapi.thehiveresistance.com/api/characters/1');
    expect(artworkProvider.getCharacterArtworkMetadataUrl({ id: 1 }, 'people'))
      .toBe('https://akabab.github.io/starwars-api/api/id/1.json');
    expect(artworkProvider.getVisualGuideImageUrl({ id: 1 }, 'people'))
      .toBe('https://starwars-visualguide.com/assets/img/characters/1.jpg');
  });

  it('accepts an ID embedded in a canonical SWAPI URL', () => {
    const artworkProvider = createStarWarsArtworkProvider();
    expect(artworkProvider.getArtworkMetadataUrl(
      { url: 'https://swapi.info/api/people/14/?format=json#character' }, 'people',
    )).toBe('https://swapi.thehiveresistance.com/api/characters/14');
  });

  it('accepts a numeric ID given as a string', () => {
    const artworkProvider = createStarWarsArtworkProvider();
    expect(artworkProvider.getArtworkMetadataUrl({ id: '9' }, 'people'))
      .toBe('https://swapi.thehiveresistance.com/api/characters/9');
  });

  it('returns curated artwork followed by the Visual Guide fallback', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ image: 'https://images.example/luke.jpg' }),
    });
    const artworkProvider = createProviderWithFetch(fetch);

    await expect(artworkProvider.getArtworkImageCandidates({ id: 1 }, 'people')).resolves.toEqual([
      'https://images.example/luke.jpg',
      'https://starwars-visualguide.com/assets/img/characters/1.jpg',
    ]);
  });

  it('returns only the Visual Guide fallback when metadata is missing', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: 'Luke Skywalker' }),
    });
    const artworkProvider = createProviderWithFetch(fetch);

    await expect(artworkProvider.getArtworkImageCandidates({ id: 1 }, 'people')).resolves.toEqual([
      'https://starwars-visualguide.com/assets/img/characters/1.jpg',
    ]);
  });

  it('returns only the Visual Guide fallback when the metadata request is not ok', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false });
    const artworkProvider = createProviderWithFetch(fetch);

    await expect(artworkProvider.getArtworkImageCandidates({ id: 1 }, 'people')).resolves.toEqual([
      'https://starwars-visualguide.com/assets/img/characters/1.jpg',
    ]);
  });

  it('returns the Visual Guide fallback when the metadata service is unavailable', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('Network unavailable'));
    const artworkProvider = createProviderWithFetch(fetch);

    await expect(artworkProvider.getArtworkImageCandidates({ id: 1 }, 'people')).resolves.toEqual([
      'https://starwars-visualguide.com/assets/img/characters/1.jpg',
    ]);
  });

  it('ignores an unusable image URL from the metadata response', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ image: '   ' }),
    });
    const artworkProvider = createProviderWithFetch(fetch);

    await expect(artworkProvider.getArtworkImageCandidates({ id: 1 }, 'people')).resolves.toEqual([
      'https://starwars-visualguide.com/assets/img/characters/1.jpg',
    ]);
  });

  it('caches the complete candidate list', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ image_url: 'https://images.example/luke.jpg' }),
    });
    const artworkProvider = createProviderWithFetch(fetch);

    await artworkProvider.getArtworkImageCandidates({ id: 1 }, 'people');
    await artworkProvider.getArtworkImageCandidates({ id: 1 }, 'people');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://akabab.github.io/starwars-api/api/id/1.json', expect.any(Object));
  });

  it('clears the cache on request', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ image_url: 'https://images.example/luke.jpg' }),
    });
    const artworkProvider = createProviderWithFetch(fetch);

    await artworkProvider.getArtworkImageCandidates({ id: 1 }, 'people');
    artworkProvider.clearCache();
    await artworkProvider.getArtworkImageCandidates({ id: 1 }, 'people');

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('returns no candidates for unsupported resources or missing IDs', async () => {
    const fetch = vi.fn();
    const artworkProvider = createProviderWithFetch(fetch);

    await expect(artworkProvider.getArtworkImageCandidates({ id: 1 }, 'species')).resolves.toEqual([]);
    await expect(artworkProvider.getArtworkImageCandidates({ name: 'Luke' }, 'people')).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid provider base URL early', () => {
    expect(() => createStarWarsArtworkProvider('not a URL')).toThrow(TypeError);
  });

  it('rejects an invalid character artwork base URL', () => {
    expect(() => createStarWarsArtworkProvider(undefined, { characterArtworkBaseUrl: '' })).toThrow(TypeError);
  });

  it('requires a fetch implementation', () => {
    expect(() => createStarWarsArtworkProvider(undefined, { fetch: 'not-a-function' })).toThrow(TypeError);
  });
});

describe('artworkResourceNameFor', () => {
  it.each([
    ['people', 'characters'],
    ['films', 'films'],
    ['planets', 'planets'],
    ['starships', 'starships'],
  ])('maps %s to %s', (resourceName, expectedArtworkResourceName) => {
    expect(artworkResourceNameFor(resourceName)).toBe(expectedArtworkResourceName);
  });

  it('returns null for unsupported resources', () => {
    expect(artworkResourceNameFor('vehicles')).toBeNull();
  });
});
