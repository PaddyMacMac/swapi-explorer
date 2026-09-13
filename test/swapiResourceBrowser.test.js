// Tests the browsing use case independently of the browser and DOM.

import { describe, expect, it, vi } from 'vitest';
import { createSwapiResourceBrowser } from '../src/js/application/swapiResourceBrowser.js';

const createResourceBrowser = (entities = []) => {
  const getResourceCollection = vi.fn().mockResolvedValue(entities);
  const resourceBrowser = createSwapiResourceBrowser({ swapiApiClient: { getResourceCollection } });

  return { resourceBrowser, getResourceCollection };
};

describe('createSwapiResourceBrowser', () => {
  it('loads a resource from the API in display order', async () => {
    const { resourceBrowser, getResourceCollection } = createResourceBrowser([
      { name: 'Yoda' },
      { name: 'Luke Skywalker' },
    ]);

    await expect(resourceBrowser.loadResource('people')).resolves.toEqual([
      { name: 'Luke Skywalker' },
      { name: 'Yoda' },
    ]);
    expect(getResourceCollection).toHaveBeenCalledWith('people');
  });

  it('resolves an entity by its position in the loaded resource', async () => {
    const { resourceBrowser } = createResourceBrowser([{ name: 'Luke Skywalker' }]);

    await resourceBrowser.loadResource('people');

    expect(resourceBrowser.getEntityAtIndex(0)).toEqual({ name: 'Luke Skywalker' });
  });

  it('exposes the loaded resource and entities as browsing state', async () => {
    const { resourceBrowser } = createResourceBrowser([{ title: 'A New Hope' }]);

    await resourceBrowser.loadResource('films');
    expect(resourceBrowser.getResourceState()).toEqual({ resourceName: 'films', entities: [{ title: 'A New Hope' }] });
  });

  it('protects its internal entity list from state mutations', async () => {
    const { resourceBrowser } = createResourceBrowser([{ name: 'Yoda' }]);

    await resourceBrowser.loadResource('people');
    const state = resourceBrowser.getResourceState();
    state.entities.push({ name: 'Intruder' });

    expect(resourceBrowser.getResourceState().entities).toEqual([{ name: 'Yoda' }]);
  });

  it('keeps the last successful state when a later load fails', async () => {
    const getResourceCollection = vi.fn()
      .mockResolvedValueOnce([{ name: 'Luke Skywalker' }])
      .mockRejectedValueOnce(new Error('Network unavailable'));
    const resourceBrowser = createSwapiResourceBrowser({ swapiApiClient: { getResourceCollection } });

    await resourceBrowser.loadResource('people');
    await expect(resourceBrowser.loadResource('films')).rejects.toThrow('Network unavailable');

    expect(resourceBrowser.getResourceState()).toEqual({
      resourceName: 'people',
      entities: [{ name: 'Luke Skywalker' }],
    });
  });

  it('returns null when an entity position does not exist', () => {
    const { resourceBrowser } = createResourceBrowser();

    expect(resourceBrowser.getEntityAtIndex(99)).toBeNull();
  });

  it('rejects unsupported resources before calling the API', async () => {
    const { resourceBrowser, getResourceCollection } = createResourceBrowser();

    await expect(resourceBrowser.loadResource('droids')).rejects.toThrow('Unsupported resource: droids');
    expect(getResourceCollection).not.toHaveBeenCalled();
  });
});
