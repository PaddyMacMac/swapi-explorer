// Application layer: coordinates the "browse a resource, then inspect one
// entity" use case. Knows about the domain's resource rules, but nothing
// about the DOM or HTTP.

import { assertSupportedResource, sortEntitiesByName } from '../domain/resources.js';

export const createExplorer = ({ swapiClient }) => {
  let selectedResource = 'people';
  let entities = [];

  const loadResource = async resource => {
    assertSupportedResource(resource);
    const rawEntities = await swapiClient.get(resource);

    selectedResource = resource;
    entities = sortEntitiesByName(rawEntities, resource);
    return entities;
  };

  const getSelectedEntity = index => entities[index] ?? null;

  const getState = () => ({ resource: selectedResource, entities: [...entities] });

  return { loadResource, getSelectedEntity, getState };
};
