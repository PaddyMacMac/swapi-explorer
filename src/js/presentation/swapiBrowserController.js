// Coordinates page DOM events between the resource browser and the view.

import { createEntityDetailsModalController } from './entityDetailsModalController.js';

const ACTIVATION_KEYS = ['Enter', ' '];
const RESOURCE_TAB_SELECTOR = '[data-resource]';
const ENTITY_CARD_SELECTOR = '.entity-card';

export const createSwapiBrowserController = ({
  resourceBrowser,
  artworkProvider,
  view,
  rootDocument = document,
}) => {
  const getElementById = elementId => rootDocument.getElementById(elementId);

  let elements = null;
  let entityDetailsModal = null;
  let latestLoadRequest = 0;

  const setActiveResourceTab = resourceName => {
    elements.resourceTabsContainer.querySelectorAll(RESOURCE_TAB_SELECTOR).forEach(tabButton => {
      const isActive = tabButton.dataset.resource === resourceName;
      tabButton.classList.toggle('active', isActive);
      tabButton.setAttribute('aria-selected', String(isActive));
    });
  };

  const setDetailsButtonEnabled = isEnabled => {
    elements.viewDetailsButton.disabled = !isEnabled;
  };

  const renderEntityCollection = async (entities, resourceName) => {
    const previousEntityIndex = elements.entityPicker.value;
    await view.renderEntityCards(entities, resourceName, artworkProvider);
    view.renderEntityPicker(entities, resourceName);
    const hasSelectionToRestore = previousEntityIndex !== ''
      && entities[Number(previousEntityIndex)] !== undefined;
    if (hasSelectionToRestore) {
      elements.entityPicker.value = previousEntityIndex;
    }
    setDetailsButtonEnabled(hasSelectionToRestore);
  };

  const loadResource = async resourceName => {
    const requestId = ++latestLoadRequest;
    const isCurrentRequest = () => requestId === latestLoadRequest;
    view.renderStatusMessage(`Loading ${resourceName}…`);

    try {
      const entities = await resourceBrowser.loadResource(resourceName);
      if (!isCurrentRequest()) return;

      await renderEntityCollection(entities, resourceName);
      view.renderStatusMessage(`Showing ${entities.length} ${resourceName}`, 'success');
    } catch (error) {
      if (!isCurrentRequest()) return;

      await renderEntityCollection([], resourceName);
      view.renderStatusMessage(`Error loading ${resourceName}: ${error.message}`, 'error');
    }
  };

  const showEntityDetails = async entityIndex => {
    const { resourceName } = resourceBrowser.getResourceState();
    const entity = resourceBrowser.getEntityAtIndex(entityIndex);
    if (!entity || !entityDetailsModal) return;

    await view.renderEntityDetails(entity, resourceName, artworkProvider);
    entityDetailsModal.open();
  };

  const findEntityCard = eventTarget => eventTarget.closest(ENTITY_CARD_SELECTOR);

  const handleResourceTabClick = event => {
    const tabButton = event.target.closest(RESOURCE_TAB_SELECTOR);
    if (!tabButton) return;

    setActiveResourceTab(tabButton.dataset.resource);
    loadResource(tabButton.dataset.resource);
  };

  const handleEntityPickerChange = () => {
    setDetailsButtonEnabled(elements.entityPicker.value !== '');
  };

  const handleViewDetailsButtonClick = () => showEntityDetails(Number(elements.entityPicker.value));

  const showEntityCardDetails = entityCard => {
    if (entityCard) showEntityDetails(Number(entityCard.dataset.index));
  };

  const handleResultsClick = event => showEntityCardDetails(findEntityCard(event.target));

  const handleResultsKeydown = event => {
    const entityCard = findEntityCard(event.target);
    if (!entityCard || !ACTIVATION_KEYS.includes(event.key)) return;

    event.preventDefault();
    showEntityCardDetails(entityCard);
  };

  const handleModalClose = () => entityDetailsModal.close();

  const queryRequiredElements = () => ({
    resourceTabsContainer: getElementById('resource-tabs'),
    entityPicker: getElementById('entity-picker'),
    viewDetailsButton: getElementById('view-details-btn'),
    resultsContainer: getElementById('results'),
    detailsModal: getElementById('detailsModal'),
    detailsModalCloseButton: getElementById('detailsModalCloseBtn'),
    detailsModalCloseFooterButton: getElementById('detailsModalCloseFooterBtn'),
  });

  const attachEventListeners = () => {
    elements.resourceTabsContainer.addEventListener('click', handleResourceTabClick);
    elements.entityPicker.addEventListener('change', handleEntityPickerChange);
    elements.viewDetailsButton.addEventListener('click', handleViewDetailsButtonClick);
    elements.resultsContainer.addEventListener('click', handleResultsClick);
    elements.resultsContainer.addEventListener('keydown', handleResultsKeydown);
    elements.detailsModalCloseButton.addEventListener('click', handleModalClose);
    elements.detailsModalCloseFooterButton.addEventListener('click', handleModalClose);
  };

  const start = (initialResourceName = 'people') => {
    elements = queryRequiredElements();
    entityDetailsModal = createEntityDetailsModalController(elements.detailsModal, rootDocument);

    attachEventListeners();
    setActiveResourceTab(initialResourceName);
    const { entities, resourceName } = resourceBrowser.getResourceState();
    view.renderEntityPicker(entities, resourceName);
    setDetailsButtonEnabled(entities.length > 0);
    loadResource(initialResourceName);
  };

  return { start, loadResource, showEntityDetails };
};
