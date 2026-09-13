// Integration tests for the real composition root with network calls faked.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSwapiExplorerDom } from './testDomEnvironment.js';

const people = [
  {
    name: 'Luke Skywalker',
    url: 'https://swapi.info/api/people/1/',
    height: '172',
    mass: '77',
    birth_year: '19BBY',
    gender: 'male',
    hair_color: 'brown',
    eye_color: 'blue',
  },
  {
    name: 'Yoda',
    url: 'https://swapi.info/api/people/20/',
    height: '66',
    mass: '17',
    birth_year: '896BBY',
    gender: 'male',
    hair_color: 'white',
    eye_color: 'brown',
  },
];

const importMain = () => import('../src/js/main.js');

const createFakeView = () => ({
  renderStatusMessage: vi.fn(),
  renderEntityCards: vi.fn().mockResolvedValue(undefined),
  renderEntityPicker: vi.fn(),
  renderEntityDetails: vi.fn().mockResolvedValue(undefined),
});

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(people) }));
  buildSwapiExplorerDom();
});

describe('main', () => {
  it('loads people and displays them as cards on startup', async () => {
    await importMain();
    await vi.waitFor(() => expect(document.querySelectorAll('.entity-card')).toHaveLength(2));

    expect(document.getElementById('status').textContent).toContain('Showing 2 people');
    expect(document.getElementById('results').textContent).toContain('Luke Skywalker');
  });

  it('opens the modal when a card is clicked', async () => {
    await importMain();
    await vi.waitFor(() => expect(document.querySelector('.entity-card')).not.toBeNull());

    document.querySelector('.entity-card').click();

    await vi.waitFor(() => expect(document.getElementById('detailsModal').classList.contains('show')).toBe(true));
    expect(document.getElementById('detailsModalLabel').textContent).toBe('Luke Skywalker');
  });

  it('enables the details button after a picker selection', async () => {
    await importMain();
    await vi.waitFor(() => expect(document.querySelectorAll('#entity-picker option')).toHaveLength(3));

    const picker = document.getElementById('entity-picker');
    picker.value = '0';
    picker.dispatchEvent(new Event('change'));
    expect(document.getElementById('view-details-btn').disabled).toBe(false);
  });

  it('handles an API error without leaving stale cards', async () => {
    fetch.mockRejectedValueOnce(new Error('Network unavailable'));
    await importMain();

    await vi.waitFor(() => expect(document.getElementById('status').dataset.type).toBe('error'));
    expect(document.querySelectorAll('.entity-card')).toHaveLength(0);
  });

  it('does not auto-start when the page markup is absent', async () => {
    document.body.innerHTML = '';
    const { createSwapiExplorerApp } = await importMain();
    expect(typeof createSwapiExplorerApp).toBe('function');
    expect(document.getElementById('status')).toBeNull();
  });

  it('lets an alternate entry point override the default dependencies', async () => {
    const { createSwapiExplorerApp } = await importMain();

    const resourceBrowser = {
      loadResource: vi.fn().mockResolvedValue([{ name: 'Custom Entity' }]),
      getEntityAtIndex: vi.fn().mockReturnValue({ name: 'Custom Entity' }),
      getResourceState: vi.fn().mockReturnValue({ resourceName: 'people', entities: [{ name: 'Custom Entity' }] }),
    };
    const view = createFakeView();

    const app = createSwapiExplorerApp({ resourceBrowser, artworkProvider: {}, view });
    app.start();

    await vi.waitFor(() => expect(view.renderEntityCards).toHaveBeenCalledWith([{ name: 'Custom Entity' }], 'people', {}));
  });
});
