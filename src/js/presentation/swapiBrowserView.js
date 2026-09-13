// Renders resource entities, status messages, picker options, and details.

import { getEntityName, getResourceDefinition, UNKNOWN_VALUE } from '../domain/swapiResourceDefinitions.js';

const RESOURCE_ICONS = {
  people: '👤',
  films: '🎬',
  planets: '🪐',
  starships: '🚀',
};

const createElement = (tagName, className, textContent) => {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (textContent !== undefined) element.textContent = textContent;
  return element;
};

const appendEntityFieldRows = (parentElement, entity, fieldDescriptors) => {
  fieldDescriptors.forEach(({ label, property, suffix }) => {
    const row = createElement('div', 'detail-row');
    row.append(
      createElement('span', 'detail-label', label),
      createElement('span', 'detail-value', `${entity[property] ?? UNKNOWN_VALUE}${suffix}`),
    );
    parentElement.appendChild(row);
  });
};

const createFallbackArtworkElement = (resourceName, className) => {
  const container = createElement('div', className);
  container.textContent = RESOURCE_ICONS[resourceName] ?? '★';
  container.setAttribute('aria-hidden', 'true');
  return container;
};

const resolveArtworkImageCandidates = async (entity, resourceName, artworkProvider) => {
  if (typeof artworkProvider?.getArtworkImageCandidates !== 'function') return [];

  try {
    return await artworkProvider.getArtworkImageCandidates(entity, resourceName);
  } catch {
    return [];
  }
};

const createArtworkElement = async (entity, resourceName, artworkProvider, className) => {
  const candidateImageUrls = await resolveArtworkImageCandidates(entity, resourceName, artworkProvider);
  if (!candidateImageUrls.length) return createFallbackArtworkElement(resourceName, className);

  const container = createElement('div', className);
  const image = createElement('img');
  image.alt = `${getEntityName(entity, resourceName)} artwork`;
  image.loading = 'lazy';
  container.appendChild(image);

  let nextCandidateIndex = 0;
  const loadNextCandidate = () => {
    if (nextCandidateIndex >= candidateImageUrls.length) {
      container.replaceWith(createFallbackArtworkElement(resourceName, className));
      return;
    }
    image.src = candidateImageUrls[nextCandidateIndex++];
  };

  image.addEventListener('error', loadNextCandidate);
  loadNextCandidate();
  return container;
};

const createEntityCard = async (entity, resourceName, entityIndex, artworkProvider) => {
  const definition = getResourceDefinition(resourceName);
  const entityName = getEntityName(entity, resourceName);
  const entityTypeLabel = definition.label.slice(0, -1);

  const card = createElement('article', 'entity-card');
  card.dataset.index = String(entityIndex);
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View details for ${entityName}`);

  const header = createElement('div', 'entity-card-header');
  header.append(
    await createArtworkElement(entity, resourceName, artworkProvider, 'entity-image'),
    createElement('span', 'entity-type', entityTypeLabel),
    createElement('h2', 'entity-name', entityName),
  );

  const body = createElement('div', 'entity-card-body');
  appendEntityFieldRows(body, entity, definition.cardFields);

  card.append(header, body);
  return card;
};

export const renderStatusMessage = (message, statusType = 'info') => {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.dataset.type = statusType;
};

export const renderEntityCards = async (entities, resourceName, artworkProvider) => {
  const resultsElement = document.getElementById('results');
  const cardElements = await Promise.all(
    entities.map((entity, entityIndex) => createEntityCard(entity, resourceName, entityIndex, artworkProvider)),
  );
  resultsElement.replaceChildren(...cardElements);
};

export const renderEntityPicker = (entities, resourceName) => {
  const pickerElement = document.getElementById('entity-picker');
  pickerElement.replaceChildren();

  const placeholderOption = createElement('option', '', 'Jump to…');
  placeholderOption.value = '';
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  pickerElement.appendChild(placeholderOption);

  entities.forEach((entity, entityIndex) => {
    const option = createElement('option', '', getEntityName(entity, resourceName));
    option.value = String(entityIndex);
    pickerElement.appendChild(option);
  });
};

export const renderEntityDetails = async (entity, resourceName, artworkProvider) => {
  const definition = getResourceDefinition(resourceName);
  const entityType = definition.label.slice(0, -1).toUpperCase();
  document.getElementById('detailsModalKicker').textContent = `${entityType} DETAILS`;
  document.getElementById('detailsModalLabel').textContent = getEntityName(entity, resourceName);

  const bodyElement = document.getElementById('detailsModalBody');
  bodyElement.replaceChildren();
  bodyElement.appendChild(await createArtworkElement(entity, resourceName, artworkProvider, 'details-image'));

  const fieldsElement = createElement('div', 'details-list');
  appendEntityFieldRows(fieldsElement, entity, definition.detailFields);
  bodyElement.appendChild(fieldsElement);

  if (definition.descriptionField) {
    bodyElement.appendChild(
      createElement('p', 'details-description', entity[definition.descriptionField] ?? ''),
    );
  }
};
