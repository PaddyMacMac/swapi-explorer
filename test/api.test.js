// api.test.js — fetchResource against a mocked global fetch.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchResource } from '../src/js/api.js';

describe('fetchResource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the correct SWAPI URL for a resource', async () => {
    const mockJson = vi.fn().mockResolvedValue([{ name: 'Luke Skywalker' }]);
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: mockJson });
    vi.stubGlobal('fetch', mockFetch);

    await fetchResource('people');

    expect(mockFetch).toHaveBeenCalledWith('https://swapi.info/api/people');
  });

  it('returns the parsed JSON body on success', async () => {
    const people = [{ name: 'Leia Organa' }, { name: 'Han Solo' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(people),
    }));

    const result = await fetchResource('people');

    expect(result).toEqual(people);
  });

  it('throws an error including the status code when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn(),
    }));

    await expect(fetchResource('unknown')).rejects.toThrow('SWAPI request failed: 404');
  });

  it('propagates network-level rejections from fetch itself', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(fetchResource('films')).rejects.toThrow('network down');
  });
});
