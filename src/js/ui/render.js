// UI layer: turns domain entities into DOM. It never knows where artwork is
// hosted or how it is fetched — only that an artwork client can be asked for
// image candidates.

import { getEntityName, getResourceDefinition, UNKNOWN_VALUE } from '../domain/resources.js';

const RESOURCE_ICONS = Object.freeze({
  people: '👤',
  films: '🎬',
  planets: '🪐',
  starships: '🚀',
});

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const appendFields = (parent, entity, fields) => {
  fields.forEach(({ label, property, suffix }) => {
    const row = createElement('div', 'detail-row');
    row.append(
      createElement('span', 'detail-label', label),
      createElement('span', 'detail-value', `${entity[property] ?? UNKNOWN_VALUE}${suffix}`),
    );
    parent.appendChild(row);
  });
};

const createFallbackArtwork = (resource, className) => {
  const container = createElement('div', className);
  container.textContent = RESOURCE_ICONS[resource] ?? '★';
  container.setAttribute('aria-hidden', 'true');
  return container;
};

const getArtworkImageCandidates = async (entity, resource, artworkClient) => {
  if (typeof artworkClient?.getArtworkImageCandidates !== 'function') return [];

  try {
    return await artworkClient.getArtworkImageCandidates(entity, resource);
  } catch {
    return [];
  }
};

/**
 * An image showing the entity's artwork, or a resource-themed fallback icon
 * when no candidate URL is available. If a candidate fails to load in the
 * browser, the element advances to the next candidate before giving up and
 * swapping itself for the fallback icon.
 */
const createArtworkElement = async (entity, resource, artworkClient, className) => {
  const candidates = await getArtworkImageCandidates(entity, resource, artworkClient);
  if (!candidates.length) return createFallbackArtwork(resource, className);

  const container = createElement('div', className);
  const image = createElement('img');
  image.alt = `${getEntityName(entity, resource)} artwork`;
  image.loading = 'lazy';
  container.appendChild(image);

  let nextCandidateIndex = 0;
  const tryNextCandidate = () => {
    if (nextCandidateIndex >= candidates.length) {
      container.replaceWith(createFallbackArtwork(resource, className));
      return;
    }
    image.src = candidates[nextCandidateIndex++];
  };

  image.addEventListener('error', tryNextCandidate);
  tryNextCandidate();
  return container;
};

const createCard = async (entity, resource, index, artworkClient) => {
  const definition = getResourceDefinition(resource);
  const entityTypeLabel = definition.label.slice(0, -1);

  const article = createElement('article', 'entity-card');
  article.dataset.index = String(index);
  article.tabIndex = 0;
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', `View details for ${getEntityName(entity, resource)}`);

  const header = createElement('div', 'entity-card-header');
  header.append(
    await createArtworkElement(entity, resource, artworkClient, 'entity-image'),
    createElement('span', 'entity-type', entityTypeLabel),
    createElement('h2', 'entity-name', getEntityName(entity, resource)),
  );

  const body = createElement('div', 'entity-card-body');
  appendFields(body, entity, definition.cardFields);

  const footer = createElement('div', 'entity-card-footer', 'View details →');
  article.append(header, body, footer);
  return article;
};

export const renderStatus = (message, type = 'info') => {
  const status = document.getElementById('status');
  status.textContent = message;
  status.dataset.type = type;
};

export const renderResults = async (entities, resource, artworkClient) => {
  const results = document.getElementById('results');
  const cards = await Promise.all(
    entities.map((entity, index) => createCard(entity, resource, index, artworkClient)),
  );
  results.replaceChildren(...cards);
};

export const renderPicker = (entities, resource) => {
  const picker = document.getElementById('entity-picker');
  picker.replaceChildren();

  const placeholder = createElement('option', '', 'Jump to…');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  picker.appendChild(placeholder);

  entities.forEach((entity, index) => {
    const option = createElement('option', '', getEntityName(entity, resource));
    option.value = String(index);
    picker.appendChild(option);
  });
};

export const renderDetails = async (entity, resource, artworkClient) => {
  const definition = getResourceDefinition(resource);
  document.getElementById('detailsModalLabel').textContent = getEntityName(entity, resource);

  const body = document.getElementById('detailsModalBody');
  body.replaceChildren();
  body.appendChild(await createArtworkElement(entity, resource, artworkClient, 'details-image'));
  body.appendChild(createElement('h6', 'details-name', getEntityName(entity, resource)));

  const fields = createElement('div', 'details-list');
  appendFields(fields, entity, definition.detailFields);
  body.appendChild(fields);

  if (definition.descriptionField) {
    body.appendChild(
      createElement('p', 'details-description', entity[definition.descriptionField] ?? ''),
    );
  }
};
