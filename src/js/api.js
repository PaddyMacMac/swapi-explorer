// api.js — talks to SWAPI, nothing else.
// swapi.info mirrors swapi.dev but returns full arrays (no pagination, CORS-friendly).

const BASE_URL = 'https://swapi.info/api';

export const fetchFromSwapi = async (endpoint) => {
  const response = await fetch(`${BASE_URL}/${endpoint}`);

  if (!response.ok) {
    throw new Error(`SWAPI request failed: ${response.status}`);
  }

  return response.json();
};
