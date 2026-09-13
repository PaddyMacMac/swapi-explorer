// Application layer: coordinates the "browse a resource, then inspect one
// entity" use case. Knows about the domain's resource rules, but nothing
// about the DOM or HTTP.

import { assertSupportedResource, sortEntitiesByName } from '../domain/swapiResourceDefinitions.js';

export const createSwapiResourceBrowser = ({ swapiApiClient }) => {
  let resourceState = {
    resourceName: 'people',
    entities: [],
  };

  const loadResource = async resourceName => {
    assertSupportedResource(resourceName);
    const fetchedEntities = await swapiApiClient.getResourceCollection(resourceName);
    const sortedEntities = sortEntitiesByName(fetchedEntities, resourceName);

    resourceState = { resourceName, entities: sortedEntities };
    return sortedEntities;
  };

  const getEntityAtIndex = entityIndex => resourceState.entities[entityIndex] ?? null;

  const getResourceState = () => ({
    ...resourceState,
    entities: [...resourceState.entities],
  });

  return { loadResource, getEntityAtIndex, getResourceState };
};
