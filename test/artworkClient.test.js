import { describe, expect, it, vi } from 'vitest';
import {
  artworkResourceFor,
  createStarWarsArtworkClient,
} from '../src/js/infrastructure/starWarsArtworkClient.js';

describe('createStarWarsArtworkClient', () => {
  it.each([
    ['people', 'characters'],
    ['films', 'films'],
    ['planets', 'planets'],
    ['starships', 'starships'],
  ])('builds the artwork API endpoint for %s', (resource, endpoint) => {
    const client = createStarWarsArtworkClient();
    expect(client.getArtworkApiUrl({ url: `https://swapi.info/api/${resource}/7/` }, resource))
      .toBe(`https://swapi.thehiveresistance.com/api/${endpoint}/7`);
  });

  it('maps people to the character artwork resource', () => {
    const client = createStarWarsArtworkClient();
    expect(client.getArtworkApiUrl({ id: 1 }, 'people'))
      .toBe('https://swapi.thehiveresistance.com/api/characters/1');
    expect(client.getCharacterArtworkApiUrl({ id: 1 }, 'people'))
      .toBe('https://akabab.github.io/starwars-api/api/id/1.json');
    expect(client.getVisualGuideImageUrl({ id: 1 }, 'people'))
      .toBe('https://starwars-visualguide.com/assets/img/characters/1.jpg');
  });

  it('accepts an ID embedded in a canonical SWAPI URL', () => {
    const client = createStarWarsArtworkClient();
    expect(client.getArtworkApiUrl(
      { url: 'https://swapi.info/api/people/14/?format=json#character' }, 'people',
    )).toBe('https://swapi.thehiveresistance.com/api/characters/14');
  });

  it('returns curated artwork followed by the Visual Guide fallback', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ image: 'https://images.example/luke.jpg' }),
    });
    const client = createStarWarsArtworkClient(undefined, { fetch });

    await expect(client.getArtworkImageCandidates({ id: 1 }, 'people')).resolves.toEqual([
      'https://images.example/luke.jpg',
      'https://starwars-visualguide.com/assets/img/characters/1.jpg',
    ]);
  });

  it('returns character artwork when metadata is missing', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: 'Luke Skywalker' }),
    });
    const client = createStarWarsArtworkClient(undefined, { fetch });

    await expect(client.getArtworkImageCandidates({ id: 1 }, 'people')).resolves.toEqual([
      'https://starwars-visualguide.com/assets/img/characters/1.jpg',
    ]);
  });

  it('returns character artwork when the metadata service is unavailable', async () => {
    const fetch = vi.fn().mockRejectedValue(new Error('Network unavailable'));
    const client = createStarWarsArtworkClient(undefined, { fetch });

    await expect(client.getArtworkImageCandidates({ id: 1 }, 'people')).resolves.toEqual([
      'https://starwars-visualguide.com/assets/img/characters/1.jpg',
    ]);
  });

  it('caches the complete candidate list', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ image_url: 'https://images.example/luke.jpg' }),
    });
    const client = createStarWarsArtworkClient(undefined, { fetch });

    await client.getArtworkImageCandidates({ id: 1 }, 'people');
    await client.getArtworkImageCandidates({ id: 1 }, 'people');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://akabab.github.io/starwars-api/api/id/1.json', expect.any(Object));
  });

  it('returns no candidates for unsupported resources or missing IDs', async () => {
    const fetch = vi.fn();
    const client = createStarWarsArtworkClient(undefined, { fetch });

    await expect(client.getArtworkImageCandidates({ id: 1 }, 'species')).resolves.toEqual([]);
    await expect(client.getArtworkImageCandidates({ name: 'Luke' }, 'people')).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid provider base URL early', () => {
    expect(() => createStarWarsArtworkClient('not a URL')).toThrow(TypeError);
  });
});

describe('artworkResourceFor', () => {
  it.each([
    ['people', 'characters'],
    ['films', 'films'],
    ['planets', 'planets'],
    ['starships', 'starships'],
  ])('maps %s to %s', (resource, expected) => {
    expect(artworkResourceFor(resource)).toBe(expected);
  });

  it('returns null for unsupported resources', () => {
    expect(artworkResourceFor('vehicles')).toBeNull();
  });
});
