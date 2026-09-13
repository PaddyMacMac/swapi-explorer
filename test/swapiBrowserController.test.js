// Tests the controller's DOM event wiring in isolation: the application use
// case and the view are fakes, so these tests prove the controller calls the
// right collaborators with the right arguments without depending on real
// rendering or network behaviour.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSwapiBrowserController } from '../src/js/presentation/swapiBrowserController.js';
import { buildSwapiExplorerDom } from './testDomEnvironment.js';

const luke = { name: 'Luke Skywalker' };

const createFakeResourceBrowser = () => ({
  loadResource: vi.fn().mockResolvedValue([luke]),
  getEntityAtIndex: vi.fn().mockReturnValue(luke),
  getResourceState: vi.fn().mockReturnValue({ resourceName: 'people', entities: [luke] }),
});

const createFakeView = () => ({
  renderStatusMessage: vi.fn(),
  renderEntityCards: vi.fn().mockResolvedValue(undefined),
  renderEntityPicker: vi.fn(entities => {
    const picker = document.getElementById('entity-picker');
    picker.replaceChildren(
      Object.assign(document.createElement('option'), {
        value: '',
        textContent: 'Jump to…',
        disabled: true,
        selected: true,
      }),
      ...entities.map((entity, entityIndex) => Object.assign(document.createElement('option'), {
        value: String(entityIndex),
        textContent: entity.name,
      })),
    );
  }),
  renderEntityDetails: vi.fn().mockResolvedValue(undefined),
});

/** Appends a fake `.entity-card` so click/keydown delegation can be tested without real rendering. */
const appendFakeEntityCard = entityIndex => {
  const card = document.createElement('article');
  card.className = 'entity-card';
  card.dataset.index = String(entityIndex);
  card.tabIndex = 0;
  document.getElementById('results').appendChild(card);
  return card;
};

let resourceBrowser;
let view;
let controller;

beforeEach(() => {
  buildSwapiExplorerDom();
  resourceBrowser = createFakeResourceBrowser();
  view = createFakeView();
  controller = createSwapiBrowserController({ resourceBrowser, artworkProvider: {}, view });
});

describe('createSwapiBrowserController', () => {
  it('loads the default resource and renders the loaded entities on start', async () => {
    controller.start();
    await vi.waitFor(() => expect(view.renderEntityCards).toHaveBeenCalledWith([luke], 'people', {}));

    expect(resourceBrowser.loadResource).toHaveBeenCalledWith('people');
    expect(view.renderEntityPicker).toHaveBeenCalledWith([luke], 'people');
    expect(view.renderStatusMessage).toHaveBeenLastCalledWith('Showing 1 people', 'success');
    expect(document.getElementById('view-details-btn').disabled).toBe(true);
  });

  it('starts with a custom initial resource', async () => {
    controller.start('films');
    await vi.waitFor(() => expect(resourceBrowser.loadResource).toHaveBeenCalledWith('films'));
    expect(document.querySelector('[data-resource="films"]').classList.contains('active')).toBe(true);
    expect(document.querySelector('[data-resource="people"]').classList.contains('active')).toBe(false);
  });

  it('ignores an older resource response when a newer request finishes first', async () => {
    let resolvePeople;
    let resolveFilms;
    const peopleRequest = new Promise(resolve => { resolvePeople = resolve; });
    const filmsRequest = new Promise(resolve => { resolveFilms = resolve; });
    resourceBrowser.loadResource.mockImplementation(resourceName =>
      resourceName === 'people' ? peopleRequest : filmsRequest,
    );

    controller.start();
    document.querySelector('[data-resource="films"]').click();
    resolveFilms([{ title: 'A New Hope' }]);

    await vi.waitFor(() => expect(view.renderStatusMessage).toHaveBeenLastCalledWith(
      'Showing 1 films',
      'success',
    ));
    resolvePeople([luke]);
    await peopleRequest;

    expect(view.renderEntityCards).toHaveBeenLastCalledWith([{ title: 'A New Hope' }], 'films', {});
  });

  it('renders an error status and clears entities when loading fails', async () => {
    resourceBrowser.loadResource.mockRejectedValueOnce(new Error('Network unavailable'));
    controller.start();

    await vi.waitFor(() =>
      expect(view.renderStatusMessage).toHaveBeenLastCalledWith('Error loading people: Network unavailable', 'error'),
    );
    expect(view.renderEntityCards).toHaveBeenLastCalledWith([], 'people', {});
  });

  it('disables details when a resource refresh fails after a selection', async () => {
    resourceBrowser.loadResource
      .mockResolvedValueOnce([luke])
      .mockRejectedValueOnce(new Error('Network unavailable'));
    controller.start();
    await vi.waitFor(() => expect(document.querySelector('#entity-picker option[value="0"]')).not.toBeNull());

    const picker = document.getElementById('entity-picker');
    picker.value = '0';
    picker.dispatchEvent(new Event('change'));
    document.querySelector('[data-resource="films"]').click();

    await vi.waitFor(() => expect(view.renderStatusMessage).toHaveBeenLastCalledWith(
      'Error loading films: Network unavailable',
      'error',
    ));
    expect(document.getElementById('view-details-btn').disabled).toBe(true);
  });

  it('switches the active tab and loads its resource on tab click', async () => {
    controller.start();
    await vi.waitFor(() => expect(resourceBrowser.loadResource).toHaveBeenCalledWith('people'));

    document.querySelector('[data-resource="films"]').click();

    await vi.waitFor(() => expect(resourceBrowser.loadResource).toHaveBeenCalledWith('films'));
    expect(document.querySelector('[data-resource="films"]').classList.contains('active')).toBe(true);
    expect(document.querySelector('[data-resource="people"]').classList.contains('active')).toBe(false);
    expect(document.querySelector('[data-resource="films"]').getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('[data-resource="people"]').getAttribute('aria-selected')).toBe('false');
  });

  it('ignores clicks inside the tab bar that are not on a tab', () => {
    controller.start();
    document.getElementById('resource-tabs').click();
    expect(resourceBrowser.loadResource).toHaveBeenCalledTimes(1);
  });

  it('enables the details button only once the picker has a selection', () => {
    controller.start();
    const picker = document.getElementById('entity-picker');

    picker.value = '0';
    picker.dispatchEvent(new Event('change'));
    expect(document.getElementById('view-details-btn').disabled).toBe(false);

    picker.value = '';
    picker.dispatchEvent(new Event('change'));
    expect(document.getElementById('view-details-btn').disabled).toBe(true);
  });

  it('shows details for the picker selection when the view-details button is clicked', async () => {
    controller.start();
    document.getElementById('entity-picker').value = '0';
    document.getElementById('view-details-btn').click();

    await vi.waitFor(() => expect(view.renderEntityDetails).toHaveBeenCalledWith(luke, 'people', {}));
    expect(document.getElementById('detailsModal').classList.contains('show')).toBe(true);
  });

  it('shows details when a result card is clicked', async () => {
    controller.start();
    appendFakeEntityCard(0).click();

    await vi.waitFor(() => expect(view.renderEntityDetails).toHaveBeenCalledWith(luke, 'people', {}));
  });

  it('shows details when Enter or Space is pressed on a focused card', async () => {
    controller.start();
    const card = appendFakeEntityCard(0);
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(view.renderEntityDetails).toHaveBeenCalledWith(luke, 'people', {}));
  });

  it('ignores keys other than Enter/Space on a card', () => {
    controller.start();
    const card = appendFakeEntityCard(0);
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(view.renderEntityDetails).not.toHaveBeenCalled();
  });

  it('does nothing when the requested entity index is unavailable', async () => {
    resourceBrowser.getEntityAtIndex.mockReturnValue(null);
    controller.start();
    appendFakeEntityCard(99).click();

    await Promise.resolve();
    expect(view.renderEntityDetails).not.toHaveBeenCalled();
  });

  it('closes the modal from either close button', () => {
    controller.start();
    document.getElementById('entity-picker').value = '0';
    document.getElementById('view-details-btn').click();

    document.getElementById('detailsModalCloseBtn').click();
    expect(document.getElementById('detailsModal').classList.contains('show')).toBe(false);
  });

  it('exposes loadResource and showEntityDetails for direct use', async () => {
    controller.start();
    await controller.loadResource('films');
    expect(resourceBrowser.loadResource).toHaveBeenCalledWith('films');

    await controller.showEntityDetails(0);
    expect(view.renderEntityDetails).toHaveBeenCalledWith(luke, 'people', {});
  });
});
