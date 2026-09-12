// Starts the SWAPI Explorer and connects browser events to the application use cases and UI.

import { createExplorer } from './application/explorer.js';
import { createSwapiClient } from './infrastructure/swapiClient.js';
import { closeModal, openModal } from './ui/modal.js';
import { renderDetails, renderPicker, renderResults, renderStatus } from './ui/render.js';

const explorer = createExplorer({ swapiClient: createSwapiClient() });

const getElement = id => document.getElementById(id);

const setActiveTab = resource => {
  document.querySelectorAll('#resource-tabs [data-resource]').forEach(button => {
    button.classList.toggle('active', button.dataset.resource === resource);
  });
};

const showDetails = index => {
  const state = explorer.getState();
  const entity = explorer.getSelectedEntity(index);
  if (!entity) return;

  renderDetails(entity, state.resource);
  openModal(getElement('detailsModal'));
};

export const loadResource = async resource => {
  renderStatus(`Loading ${resource}…`);

  try {
    const entities = await explorer.loadResource(resource);
    renderResults(entities, resource);
    renderPicker(entities, resource);
    getElement('view-details-btn').disabled = true;
    renderStatus(`Showing ${entities.length} ${resource}`, 'success');
  } catch (error) {
    renderResults([], resource);
    renderPicker([], resource);
    getElement('view-details-btn').disabled = true;
    renderStatus(`Error loading ${resource}: ${error.message}`, 'error');
  }
};

export const initApp = () => {
  const tabs = getElement('resource-tabs');
  const picker = getElement('entity-picker');
  const viewDetailsButton = getElement('view-details-btn');
  const results = getElement('results');
  const modal = getElement('detailsModal');

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

  getElement('detailsModalCloseBtn').addEventListener('click', () => closeModal(modal));
  getElement('detailsModalCloseFooterBtn').addEventListener('click', () => closeModal(modal));

  loadResource('people');
};

if (typeof document !== 'undefined' && getElement('resource-tabs')) initApp();

export { showDetails };
