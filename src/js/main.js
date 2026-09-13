// Composition root and browser entry point: assembles the application's
// dependencies, exposes the controller's public entry points, and starts the
// application when the expected page markup is available. Other modules do
// not need to know how their collaborators are constructed.

import { createSwapiResourceBrowser } from './application/swapiResourceBrowser.js';
import { createSwapiApiClient } from './infrastructure/swapiApiClient.js';
import { createStarWarsArtworkProvider } from './infrastructure/starWarsArtworkProvider.js';
import { createSwapiBrowserController } from './presentation/swapiBrowserController.js';
import * as swapiBrowserView from './presentation/swapiBrowserView.js';

/**
 * Creates the browser controller from its collaborators. Real infrastructure
 * is used by default, while tests and alternate entry points can provide
 * replacements through the dependency object.
 */
export const createSwapiExplorerApp = (dependencies = {}) => {
  const resourceBrowser = dependencies.resourceBrowser ?? createSwapiResourceBrowser({
    swapiApiClient: createSwapiApiClient(),
  });
  const artworkProvider = dependencies.artworkProvider ?? createStarWarsArtworkProvider();
  const view = dependencies.view ?? swapiBrowserView;

  return createSwapiBrowserController({ resourceBrowser, artworkProvider, view });
};

export const { start, loadResource, showEntityDetails } = createSwapiExplorerApp();

if (globalThis.document?.getElementById('resource-tabs')) start();
