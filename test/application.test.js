// Tests the application use cases independently of the browser and DOM.

import { describe, expect, it, vi } from 'vitest';
import { createExplorer } from '../src/js/application/explorer.js';

describe('createExplorer', () => {
  it('loads and sorts a resource', async () => {
    const swapiClient = { get: vi.fn().mockResolvedValue([{ name: 'Yoda' }, { name: 'Luke Skywalker' }]) };
    const explorer = createExplorer({ swapiClient });

    await expect(explorer.loadResource('people')).resolves.toEqual([{ name: 'Luke Skywalker' }, { name: 'Yoda' }]);
    expect(explorer.getSelectedEntity(0)).toEqual({ name: 'Luke Skywalker' });
    expect(swapiClient.get).toHaveBeenCalledWith('people');
  });

  it('keeps resource state with the loaded entities', async () => {
    const explorer = createExplorer({ swapiClient: { get: vi.fn().mockResolvedValue([{ title: 'A New Hope' }]) } });
    await explorer.loadResource('films');
    expect(explorer.getState()).toEqual({ resource: 'films', entities: [{ title: 'A New Hope' }] });
  });

  it('returns null for an invalid selection', () => {
    const explorer = createExplorer({ swapiClient: { get: vi.fn() } });
    expect(explorer.getSelectedEntity(99)).toBeNull();
  });
});
