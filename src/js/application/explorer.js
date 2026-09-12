// Coordinates resource loading and selection without knowing about the DOM or HTTP details.

import { getResourceDefinition, sortEntitiesByName } from '../domain/resources.js';

export const createExplorer = ({ swapiClient }) => {
  let selectedResource = 'people';
  let entities = [];

  const loadResource = async resource => {
    getResourceDefinition(resource);
    selectedResource = resource;
    entities = sortEntitiesByName(await swapiClient.get(resource), resource);
    return entities;
  };

  const getSelectedEntity = index => entities[index] ?? null;

  return {
    loadResource,
    getSelectedEntity,
    getState: () => ({ resource: selectedResource, entities: [...entities] }),
  };
};
