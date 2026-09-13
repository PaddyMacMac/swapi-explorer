// Tests the UI renderer and verifies that API data becomes visible, interactive cards.

import { beforeEach, describe, expect, it } from 'vitest';
import { renderDetails, renderPicker, renderResults, renderStatus } from '../src/js/ui/render.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="status"></div><select id="entity-picker"></select><div id="results"></div><h5 id="detailsModalLabel"></h5><div id="detailsModalBody"></div>';
});

describe('renderStatus', () => {
  it('renders status and type', () => {
    renderStatus('Loading people…');
    expect(document.getElementById('status').textContent).toBe('Loading people…');
    renderStatus('Something failed', 'error');
    expect(document.getElementById('status').dataset.type).toBe('error');
  });
});

describe('renderResults', () => {
  it('renders a card for every API entity and includes its image', async () => {
    const imageClient = {
      getArtworkImageCandidates: (entity, resource) =>
        Promise.resolve([`https://images.test/${resource}/${entity.url.split('/').at(-2)}.jpg`]),
    };

    await renderResults([
      { name: 'Luke Skywalker', url: 'https://swapi.info/api/people/1/', height: '172', mass: '77', birth_year: '19BBY' },
      { name: 'Leia Organa', url: 'https://swapi.info/api/people/5/', height: '150', mass: '49', birth_year: '19BBY' },
    ], 'people', imageClient);

    const cards = document.querySelectorAll('.entity-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Luke Skywalker');
    expect(cards[0].textContent).toContain('Height172 cm');
    expect(cards[0].dataset.index).toBe('0');
    expect(cards[0].querySelector('.entity-image img').src).toBe('https://images.test/people/1.jpg');
    expect(cards[0].querySelector('.entity-image img').alt).toBe('Luke Skywalker artwork');
  });

  it('uses the resource icon when the real artwork API fails', async () => {
    await renderResults(
      [{ name: 'Luke Skywalker', url: 'https://swapi.info/api/people/1/' }],
      'people',
      { getArtworkImageCandidates: () => Promise.reject(new Error('Network unavailable')) },
    );

    expect(document.querySelector('.entity-image img')).toBeNull();
    expect(document.querySelector('.entity-image').textContent).toBe('👤');
  });

  it('tries the Visual Guide candidate when the primary character image fails', async () => {
    await renderResults(
      [{ name: 'Luke Skywalker', url: 'https://swapi.info/api/people/1/' }],
      'people',
      {
        getArtworkImageCandidates: () => Promise.resolve([
          'https://images.test/broken/luke.jpg',
          'https://starwars-visualguide.com/assets/img/characters/1.jpg',
        ]),
      },
    );

    const image = document.querySelector('.entity-image img');
    image.dispatchEvent(new Event('error'));
    expect(image.src).toBe('https://starwars-visualguide.com/assets/img/characters/1.jpg');
  });

  it('uses the resource icon when artwork is unavailable', async () => {
    await renderResults(
      [{ name: 'Luke Skywalker', url: 'https://swapi.info/api/people/1/' }],
      'people',
      { getArtworkImageCandidates: () => Promise.resolve([]) },
    );

    expect(document.querySelector('.entity-image img')).toBeNull();
    expect(document.querySelector('.entity-image').textContent).toBe('👤');
  });

  it('clears stale results', async () => {
    await renderResults([{ name: 'Yoda' }], 'people');
    await renderResults([], 'people');
    expect(document.querySelectorAll('.entity-card')).toHaveLength(0);
  });
});

describe('renderPicker', () => {
  it('renders the sorted entities into the picker', () => {
    renderPicker([{ name: 'Yoda' }, { name: 'Luke Skywalker' }], 'people');
    const options = [...document.querySelectorAll('#entity-picker option')];
    expect(options.map(option => option.textContent)).toEqual(['Jump to…', 'Yoda', 'Luke Skywalker']);
  });
});

describe('renderDetails', () => {
  it('renders details safely into the modal', async () => {
    await renderDetails(
      { name: '<Luke>', url: 'https://swapi.info/api/people/1/', height: '172', mass: '77', birth_year: '19BBY', gender: 'male', hair_color: 'brown', eye_color: 'blue' },
      'people',
      { getArtworkImageCandidates: () => Promise.resolve(['https://images.test/characters/1.jpg']) },
    );
    expect(document.getElementById('detailsModalLabel').textContent).toBe('<Luke>');
    expect(document.getElementById('detailsModalBody').textContent).toContain('<Luke>');
    expect(document.getElementById('detailsModalBody').querySelector('script')).toBeNull();
    expect(document.querySelector('.details-image img').src).toBe('https://images.test/characters/1.jpg');
  });
});
