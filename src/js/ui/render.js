// Renders application state into DOM elements; it does not fetch data or manage application state.

import { getEntityName, getResourceDefinition } from '../domain/resources.js';

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const appendFields = (parent, entity, fields) => {
  fields.forEach(([label, property, suffix]) => {
    const row = createElement('div', 'detail-row');
    row.append(
      createElement('span', 'detail-label', label),
      createElement('span', 'detail-value', `${entity[property] ?? 'Unknown'}${suffix}`),
    );
    parent.appendChild(row);
  });
};

const createCard = (entity, resource, index) => {
  const definition = getResourceDefinition(resource);
  const article = createElement('article', 'entity-card');
  article.dataset.index = String(index);
  article.tabIndex = 0;
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', `View details for ${getEntityName(entity, resource)}`);

  const header = createElement('div', 'entity-card-header');
  header.append(
    createElement('span', 'entity-type', definition.label.slice(0, -1)),
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

export const renderResults = (entities, resource) => {
  const results = document.getElementById('results');
  results.replaceChildren(...entities.map((entity, index) => createCard(entity, resource, index)));
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

export const renderDetails = (entity, resource) => {
  const definition = getResourceDefinition(resource);
  document.getElementById('detailsModalLabel').textContent = getEntityName(entity, resource);

  const body = document.getElementById('detailsModalBody');
  body.replaceChildren();

  body.appendChild(createElement('h6', 'details-name', getEntityName(entity, resource)));

  const fields = createElement('div', 'details-list');
  appendFields(fields, entity, definition.detailFields);
  body.appendChild(fields);

  if (definition.descriptionField) {
    const crawl = createElement('p', 'details-description', entity[definition.descriptionField] ?? '');
    body.appendChild(crawl);
  }
};
