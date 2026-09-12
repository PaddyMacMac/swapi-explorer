// app.test.js — integration of app.js against a mocked api.js, using jsdom.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/js/api.js', () => ({
  fetchFromSwapi: vi.fn(),
}));

import { fetchFromSwapi } from '../src/js/api.js';
import { loadResource, setActiveTab, initApp, showEntityDetails, getCurrentItems } from '../src/js/app.js';

const setUpDom = () => {
  document.body.innerHTML = `
    <ul id="resource-tabs">
      <li><button class="nav-link active" data-resource="people">Characters</button></li>
      <li><button class="nav-link" data-resource="films">Films</button></li>
      <li><button class="nav-link" data-resource="planets">Planets</button></li>
      <li><button class="nav-link" data-resource="starships">Starships</button></li>
    </ul>
    <select id="entity-picker"></select>
    <button id="view-details-btn" disabled>View details</button>
    <div id="status"></div>
    <div id="results"></div>
    <div class="modal" id="detailsModal" aria-hidden="true">
      <h5 id="detailsModalLabel"></h5>
      <div id="detailsModalBody"></div>
      <button id="detailsModalCloseBtn"></button>
      <button id="detailsModalCloseFooterBtn"></button>
    </div>
  `;
};

describe('loadResource', () => {
  beforeEach(() => {
    setUpDom();
    fetchFromSwapi.mockReset();
  });

  it('shows a loading message, then a success message with the item count', async () => {
    fetchFromSwapi.mockResolvedValue([{ name: 'Yoda', height: '66', mass: '17', birth_year: '896BBY' }]);

    const promise = loadResource('people');
    expect(document.getElementById('status').textContent).toBe('Loading people...');

    await promise;

    expect(document.getElementById('status').textContent).toBe('Showing 1 people');
    expect(document.querySelectorAll('#results .card')).toHaveLength(1);
  });

  it('shows an error message when the fetch rejects', async () => {
    fetchFromSwapi.mockRejectedValue(new Error('SWAPI request failed: 500'));

    await loadResource('films');

    expect(document.getElementById('status').textContent).toBe('Error loading films: SWAPI request failed: 500');
  });

  it('populates the dropdown alphabetically and clears it on error', async () => {
    fetchFromSwapi.mockResolvedValue([{ name: 'Yoda' }, { name: 'Chewbacca' }]);
    await loadResource('people');

    const options = document.querySelectorAll('#entity-picker option');
    expect(options[1].textContent).toBe('Chewbacca');
    expect(options[2].textContent).toBe('Yoda');
    expect(getCurrentItems().map(p => p.name)).toEqual(['Chewbacca', 'Yoda']);

    fetchFromSwapi.mockRejectedValue(new Error('boom'));
    await loadResource('films');

    expect(getCurrentItems()).toEqual([]);
  });

  it('disables the View details button on every fresh load', async () => {
    document.getElementById('view-details-btn').disabled = false;
    fetchFromSwapi.mockResolvedValue([{ name: 'Yoda' }]);

    await loadResource('people');

    expect(document.getElementById('view-details-btn').disabled).toBe(true);
  });
});

describe('setActiveTab', () => {
  beforeEach(setUpDom);

  it('marks only the clicked button as active', () => {
    const buttons = document.querySelectorAll('.nav-link');
    setActiveTab(buttons[1]);

    expect(buttons[0].classList.contains('active')).toBe(false);
    expect(buttons[1].classList.contains('active')).toBe(true);
  });
});

describe('showEntityDetails', () => {
  beforeEach(async () => {
    setUpDom();
    fetchFromSwapi.mockReset();
    fetchFromSwapi.mockResolvedValue([
      { name: 'Yoda', height: '66', mass: '17', birth_year: '896BBY', gender: 'male', hair_color: 'white', eye_color: 'brown' },
      { name: 'Chewbacca', height: '228', mass: '112', birth_year: '200BBY', gender: 'male', hair_color: 'brown', eye_color: 'blue' },
    ]);
    await loadResource('people');
  });

  it('renders the selected entity into the modal and shows it', () => {
    // Sorted alphabetically: Chewbacca (0), Yoda (1)
    showEntityDetails(0);

    expect(document.getElementById('detailsModalLabel').textContent).toBe('Chewbacca');
    expect(document.getElementById('detailsModalBody').textContent).toContain('228 cm');
    expect(document.getElementById('detailsModal').classList.contains('show')).toBe(true);
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1);
  });

  it('does nothing for an out-of-range index', () => {
    showEntityDetails(99);
    expect(document.getElementById('detailsModalLabel').textContent).toBe('');
    expect(document.getElementById('detailsModal').classList.contains('show')).toBe(false);
  });
});

describe('initApp', () => {
  beforeEach(() => {
    setUpDom();
    fetchFromSwapi.mockReset();
    fetchFromSwapi.mockResolvedValue([]);
  });

  it('loads people on init', () => {
    initApp();
    expect(fetchFromSwapi).toHaveBeenCalledWith('people');
  });

  it('loads the clicked tab resource and updates the active tab', async () => {
    initApp();
    fetchFromSwapi.mockClear();
    fetchFromSwapi.mockResolvedValue([{ title: 'A New Hope', episode_id: 4, director: 'George Lucas', release_date: '1977-05-25' }]);

    const filmsButton = document.querySelector('[data-resource="films"]');
    filmsButton.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchFromSwapi).toHaveBeenCalledWith('films');
    expect(filmsButton.classList.contains('active')).toBe(true);
  });

  it('ignores clicks that are not on a tab button', () => {
    initApp();
    fetchFromSwapi.mockClear();

    document.getElementById('resource-tabs').click();

    expect(fetchFromSwapi).not.toHaveBeenCalled();
  });

  it('enables the View details button once a dropdown option is picked', async () => {
    fetchFromSwapi.mockResolvedValue([{ name: 'Yoda' }]);
    initApp();
    await Promise.resolve();
    await Promise.resolve();

    const picker = document.getElementById('entity-picker');
    const viewBtn = document.getElementById('view-details-btn');
    expect(viewBtn.disabled).toBe(true);

    picker.value = '0';
    picker.dispatchEvent(new Event('change'));

    expect(viewBtn.disabled).toBe(false);
  });

  it('opens the details modal when View details is clicked', async () => {
    fetchFromSwapi.mockResolvedValue([{ name: 'Yoda', height: '66', mass: '17', birth_year: '896BBY' }]);
    initApp();
    await Promise.resolve();
    await Promise.resolve();

    const picker = document.getElementById('entity-picker');
    picker.value = '0';
    picker.dispatchEvent(new Event('change'));
    document.getElementById('view-details-btn').click();

    expect(document.getElementById('detailsModalLabel').textContent).toBe('Yoda');
    expect(document.getElementById('detailsModal').classList.contains('show')).toBe(true);
  });

  it('closes the modal from either close button', async () => {
    fetchFromSwapi.mockResolvedValue([{ name: 'Yoda' }]);
    initApp();
    await Promise.resolve();
    await Promise.resolve();

    showEntityDetails(0);
    expect(document.getElementById('detailsModal').classList.contains('show')).toBe(true);

    document.getElementById('detailsModalCloseBtn').click();
    expect(document.getElementById('detailsModal').classList.contains('show')).toBe(false);

    showEntityDetails(0);
    document.getElementById('detailsModalCloseFooterBtn').click();
    expect(document.getElementById('detailsModal').classList.contains('show')).toBe(false);
  });
});
