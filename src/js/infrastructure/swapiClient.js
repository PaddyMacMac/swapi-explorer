// Provides the application's small HTTP boundary for retrieving data from SWAPI.

const BASE_URL = 'https://swapi.info/api';

export const createSwapiClient = (fetcher = globalThis.fetch) => ({
  async get(resource) {
    const response = await fetcher(`${BASE_URL}/${resource}`);

    if (!response.ok) {
      throw new Error(`SWAPI request failed: ${response.status}`);
    }

    return response.json();
  },
});

export const fetchFromSwapi = async (resource, fetcher = globalThis.fetch) =>
  createSwapiClient(fetcher).get(resource);
