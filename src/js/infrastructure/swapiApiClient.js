// HTTP boundary for retrieving raw resource collections from SWAPI.

const SWAPI_BASE_URL = 'https://swapi.info/api';

export const createSwapiApiClient = (fetchImplementation = globalThis.fetch) => ({
  async getResourceCollection(resourceName) {
    const response = await fetchImplementation(
      `${SWAPI_BASE_URL}/${encodeURIComponent(resourceName)}`,
    );

    if (!response.ok) {
      throw new Error(`SWAPI request failed: ${response.status}`);
    }

    return response.json();
  },
});
