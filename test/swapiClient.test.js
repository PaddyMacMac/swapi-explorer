// Tests the HTTP boundary without making real network requests.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSwapiClient } from '../src/js/infrastructure/swapiClient.js';

afterEach(() => vi.restoreAllMocks());

describe('createSwapiClient', () => {
  it('requests the selected SWAPI resource and returns JSON', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([{ name: 'Luke Skywalker' }]) });
    const client = createSwapiClient(fetcher);

    await expect(client.get('people')).resolves.toEqual([{ name: 'Luke Skywalker' }]);
    expect(fetcher).toHaveBeenCalledWith('https://swapi.info/api/people');
  });

  it('throws a useful error for an unsuccessful response', async () => {
    const client = createSwapiClient(vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(client.get('people')).rejects.toThrow('SWAPI request failed: 500');
  });

  it('passes through network errors', async () => {
    const client = createSwapiClient(vi.fn().mockRejectedValue(new Error('Network unavailable')));
    await expect(client.get('people')).rejects.toThrow('Network unavailable');
  });
});
