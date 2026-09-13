// Tests the HTTP boundary without making real network requests.

import { describe, expect, it, vi } from 'vitest';
import { createSwapiApiClient } from '../src/js/infrastructure/swapiApiClient.js';

describe('createSwapiApiClient', () => {
  it('requests the selected SWAPI resource and returns JSON', async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'Luke Skywalker' }]),
    });
    const swapiApiClient = createSwapiApiClient(fetchImplementation);

    await expect(swapiApiClient.getResourceCollection('people')).resolves.toEqual([{ name: 'Luke Skywalker' }]);
    expect(fetchImplementation).toHaveBeenCalledWith('https://swapi.info/api/people');
  });

  it('throws a useful error for an unsuccessful response', async () => {
    const swapiApiClient = createSwapiApiClient(vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(swapiApiClient.getResourceCollection('people')).rejects.toThrow('SWAPI request failed: 500');
  });

  it('passes through network errors', async () => {
    const swapiApiClient = createSwapiApiClient(vi.fn().mockRejectedValue(new Error('Network unavailable')));
    await expect(swapiApiClient.getResourceCollection('people')).rejects.toThrow('Network unavailable');
  });

  it('defaults to the global fetch implementation when none is provided', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }));
    const swapiApiClient = createSwapiApiClient();

    await expect(swapiApiClient.getResourceCollection('films')).resolves.toEqual([]);
    expect(fetch).toHaveBeenCalledWith('https://swapi.info/api/films');
  });
});
