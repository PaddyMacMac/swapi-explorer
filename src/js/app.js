// app.js — wires everything together. Calls api.js, hands data to render.js.
import { fetchFromSwapi } from './api.js';
import { renderStatus, renderResults, renderPicker, renderDetails } from './render.js';
import { openModal, closeModal } from './modal.js';

// Module-level state: the sorted item list backing the current dropdown, and
// which resource it belongs to, so the "View details" button click can be
// mapped back to the right full object and rendered into the modal.
let currentItems = [];
let currentResource = 'people';

export const loadResource = async (resource) => {
  currentResource = resource;
  renderStatus(`Loading ${resource}...`);
  try {
    const data = await fetchFromSwapi(resource);
    currentItems = renderPicker(data, resource);
    renderResults(data, resource);
    renderStatus(`Showing ${data.length} ${resource}`);
  } catch (err) {
    currentItems = [];
    renderStatus(`Error loading ${resource}: ${err.message}`);
  }
  // A fresh load resets the dropdown to its placeholder, so the button
  // should go back to disabled until the user picks something again.
  const viewBtn = document.getElementById('view-details-btn');
  if (viewBtn) viewBtn.disabled = true;
};

export const setActiveTab = (clickedButton) => {
  document.querySelectorAll('#resource-tabs .nav-link')
    .forEach(btn => btn.classList.remove('active'));
  clickedButton.classList.add('active');
};

// Renders the chosen entity's details into the modal and shows it.
export const showEntityDetails = (index) => {
  const item = currentItems[index];
  if (!item) return;

  renderDetails(item, currentResource);
  openModal(document.getElementById('detailsModal'));
};

// Exposed for tests that want to check what the dropdown is currently
// backed by without reaching into module internals another way.
export const getCurrentItems = () => currentItems;

// Wires up event listeners and kicks off the initial load. Exported (rather
// than run automatically at import time) so tests can build the DOM first
// and call this explicitly against jsdom.
export const initApp = () => {
  document.getElementById('resource-tabs').addEventListener('click', (event) => {
    const button = event.target.closest('[data-resource]');
    if (!button) return;
    setActiveTab(button);
    loadResource(button.dataset.resource);
  });

  const picker = document.getElementById('entity-picker');
  const viewBtn = document.getElementById('view-details-btn');

  picker.addEventListener('change', () => {
    viewBtn.disabled = picker.value === '';
  });

  viewBtn.addEventListener('click', () => {
    showEntityDetails(Number(picker.value));
  });

  const modalEl = document.getElementById('detailsModal');
  document.getElementById('detailsModalCloseBtn').addEventListener('click', () => closeModal(modalEl));
  document.getElementById('detailsModalCloseFooterBtn').addEventListener('click', () => closeModal(modalEl));

  loadResource('people');
};

// Auto-init only when actually running in a browser against the real page
// (i.e. #resource-tabs exists in the loaded document). Under Vitest, the
// module is imported without that element present, so this is a no-op there
// and tests call initApp() themselves once they've built their own DOM.
if (typeof document !== 'undefined' && document.getElementById('resource-tabs')) {
  initApp();
}
