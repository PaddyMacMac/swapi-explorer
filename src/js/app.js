// Composition root: creates the application's dependencies, wires browser
// events to the application/UI layers, and starts the app. This is the only
// module that knows about all the other layers at once.

import { createExplorer } from './application/explorer.js';
import { createSwapiClient } from './infrastructure/swapiClient.js';
import { createStarWarsArtworkClient } from './infrastructure/starWarsArtworkClient.js';
import { createModalController } from './ui/modal.js';
import { renderDetails, renderPicker, renderResults, renderStatus } from './ui/render.js';

const DEFAULT_RESOURCE = 'people';

const getElement = id => document.getElementById(id);

/**
 * Builds the app's use cases and browser wiring from its dependencies.
 * Defaults create real network clients; tests or alternate entry points can
 * override any of them.
 */
export const createSwapiExplorerApp = ({
  explorer = createExplorer({ swapiClient: createSwapiClient() }),
  artworkClient = createStarWarsArtworkClient(),
} = {}) => {
  const setActiveTab = resource => {
    document.querySelectorAll('#resource-tabs [data-resource]').forEach(button => {
      button.classList.toggle('active', button.dataset.resource === resource);
    });
  };

  const resetSelection = () => {
    getElement('view-details-btn').disabled = true;
  };

  const renderEntityCollection = async (entities, resource) => {
    await renderResults(entities, resource, artworkClient);
    renderPicker(entities, resource);
    resetSelection();
  };

  const loadResource = async resource => {
    renderStatus(`Loading ${resource}…`);

    try {
      const entities = await explorer.loadResource(resource);
      await renderEntityCollection(entities, resource);
      renderStatus(`Showing ${entities.length} ${resource}`, 'success');
    } catch (error) {
      await renderEntityCollection([], resource);
      renderStatus(`Error loading ${resource}: ${error.message}`, 'error');
    }
  };

  // Set once initApp() wires up the DOM, so showDetails can stay a plain
  // "show this entity" use case instead of every caller having to know
  // which modal instance to pass it.
  let detailsModal = null;

  const showDetails = async index => {
    const { resource } = explorer.getState();
    const entity = explorer.getSelectedEntity(index);
    if (!entity || !detailsModal) return;

    await renderDetails(entity, resource, artworkClient);
    detailsModal.open();
  };

  const initApp = () => {
    const tabs = getElement('resource-tabs');
    const picker = getElement('entity-picker');
    const viewDetailsButton = getElement('view-details-btn');
    const results = getElement('results');
    detailsModal = createModalController(getElement('detailsModal'));

    tabs.addEventListener('click', event => {
      const button = event.target.closest('[data-resource]');
      if (!button) return;
      setActiveTab(button.dataset.resource);
      loadResource(button.dataset.resource);
    });

    picker.addEventListener('change', () => {
      viewDetailsButton.disabled = picker.value === '';
    });

    viewDetailsButton.addEventListener('click', () => showDetails(Number(picker.value)));

    results.addEventListener('click', event => {
      const card = event.target.closest('.entity-card');
      if (card) showDetails(Number(card.dataset.index));
    });

    results.addEventListener('keydown', event => {
      const card = event.target.closest('.entity-card');
      if (card && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        showDetails(Number(card.dataset.index));
      }
    });

    getElement('detailsModalCloseBtn').addEventListener('click', () => detailsModal.close());
    getElement('detailsModalCloseFooterBtn').addEventListener('click', () => detailsModal.close());

    loadResource(DEFAULT_RESOURCE);
  };

  return { initApp, loadResource, showDetails };
};

const isBrowserWithAppMarkup = () =>
  typeof document !== 'undefined' && getElement('resource-tabs') !== null;

const app = createSwapiExplorerApp();

export const { initApp, loadResource, showDetails } = app;

if (isBrowserWithAppMarkup()) app.initApp();
