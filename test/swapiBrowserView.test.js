// Tests the view's rendered DOM behavior.

import { beforeEach, describe, expect, it } from 'vitest';
import {
  renderEntityCards,
  renderEntityDetails,
  renderEntityPicker,
  renderStatusMessage,
} from '../src/js/presentation/swapiBrowserView.js';

const createArtworkProvider = candidates => ({
  getArtworkImageCandidates: () => Promise.resolve(candidates),
});

beforeEach(() => {
  document.body.innerHTML = `
    <div id="status"></div>
    <select id="entity-picker"></select>
    <div id="results"></div>
    <p id="detailsModalKicker"></p>
    <h2 id="detailsModalLabel"></h2>
    <div id="detailsModalBody"></div>`;
});

describe('renderStatusMessage', () => {
  it('renders the message and type', () => {
    renderStatusMessage('Loading people…');
    expect(document.getElementById('status').textContent).toBe('Loading people…');
    expect(document.getElementById('status').dataset.type).toBe('info');

    renderStatusMessage('Something failed', 'error');
    expect(document.getElementById('status').dataset.type).toBe('error');
  });
});

describe('renderEntityCards', () => {
  it('renders a card for every entity and includes its image', async () => {
    const artworkProvider = {
      getArtworkImageCandidates: (entity, resourceName) =>
        Promise.resolve([`https://images.test/${resourceName}/${entity.url.split('/').at(-2)}.jpg`]),
    };

    await renderEntityCards([
      { name: 'Luke Skywalker', url: 'https://swapi.info/api/people/1/', height: '172', mass: '77', birth_year: '19BBY' },
      { name: 'Leia Organa', url: 'https://swapi.info/api/people/5/', height: '150', mass: '49', birth_year: '19BBY' },
    ], 'people', artworkProvider);

    const cardElements = document.querySelectorAll('.entity-card');
    expect(cardElements).toHaveLength(2);
    expect(cardElements[0].textContent).toContain('Luke Skywalker');
    expect(cardElements[0].textContent).toContain('Height172 cm');
    expect(cardElements[0].dataset.index).toBe('0');
    expect(cardElements[0].querySelector('.entity-image img').src).toBe('https://images.test/people/1.jpg');
    expect(cardElements[0].querySelector('.entity-image img').alt).toBe('Luke Skywalker artwork');
  });

  it('uses the resource icon when the artwork provider rejects', async () => {
    await renderEntityCards(
      [{ name: 'Luke Skywalker', url: 'https://swapi.info/api/people/1/' }],
      'people',
      { getArtworkImageCandidates: () => Promise.reject(new Error('Network unavailable')) },
    );

    expect(document.querySelector('.entity-image img')).toBeNull();
    expect(document.querySelector('.entity-image').textContent).toBe('👤');
  });

  it('tries the next candidate when the primary image fails to load', async () => {
    await renderEntityCards(
      [{ name: 'Luke Skywalker', url: 'https://swapi.info/api/people/1/' }],
      'people',
      createArtworkProvider([
        'https://images.test/broken/luke.jpg',
        'https://starwars-visualguide.com/assets/img/characters/1.jpg',
      ]),
    );

    const image = document.querySelector('.entity-image img');
    image.dispatchEvent(new Event('error'));
    expect(image.src).toBe('https://starwars-visualguide.com/assets/img/characters/1.jpg');
  });

  it('falls back to the resource icon once every candidate has failed', async () => {
    await renderEntityCards(
      [{ name: 'Luke Skywalker', url: 'https://swapi.info/api/people/1/' }],
      'people',
      createArtworkProvider(['https://images.test/broken/luke.jpg']),
    );

    const image = document.querySelector('.entity-image img');
    image.dispatchEvent(new Event('error'));
    expect(document.querySelector('.entity-image img')).toBeNull();
    expect(document.querySelector('.entity-image').textContent).toBe('👤');
  });

  it('uses the resource icon when no artwork provider is supplied', async () => {
    await renderEntityCards([{ name: 'Luke Skywalker' }], 'people');
    expect(document.querySelector('.entity-image img')).toBeNull();
    expect(document.querySelector('.entity-image').textContent).toBe('👤');
  });

  it('uses the resource icon when a supported resource has no artwork', async () => {
    await renderEntityCards(
      [{ name: 'Wookiee', url: 'https://swapi.info/api/species/1/' }],
      'starships',
      createArtworkProvider([]),
    );
    expect(document.querySelector('.entity-image').textContent).toBe('🚀');
  });

  it('clears stale results', async () => {
    await renderEntityCards([{ name: 'Yoda' }], 'people');
    await renderEntityCards([], 'people');
    expect(document.querySelectorAll('.entity-card')).toHaveLength(0);
  });
});

describe('renderEntityPicker', () => {
  it('renders the sorted entities into the picker with a placeholder first', () => {
    renderEntityPicker([{ name: 'Yoda' }, { name: 'Luke Skywalker' }], 'people');
    const optionElements = [...document.querySelectorAll('#entity-picker option')];
    expect(optionElements.map(option => option.textContent)).toEqual(['Jump to…', 'Yoda', 'Luke Skywalker']);
    expect(optionElements[0].disabled).toBe(true);
    expect(optionElements[1].value).toBe('0');
  });

  it('clears previously rendered options', () => {
    renderEntityPicker([{ name: 'Yoda' }], 'people');
    renderEntityPicker([], 'people');
    expect(document.querySelectorAll('#entity-picker option')).toHaveLength(1);
  });
});

describe('renderEntityDetails', () => {
  it('renders details safely into the modal, escaping any markup in field values', async () => {
    await renderEntityDetails(
      { name: '<Luke>', url: 'https://swapi.info/api/people/1/', height: '172', mass: '77', birth_year: '19BBY', gender: 'male', hair_color: 'brown', eye_color: 'blue' },
      'people',
      { getArtworkImageCandidates: () => Promise.resolve(['https://images.test/characters/1.jpg']) },
    );

    expect(document.getElementById('detailsModalLabel').textContent).toBe('<Luke>');
    expect(document.getElementById('detailsModalKicker').textContent).toBe('CHARACTER DETAILS');
    expect(document.getElementById('detailsModalBody').querySelector('script')).toBeNull();
    expect(document.querySelector('.details-image img').src).toBe('https://images.test/characters/1.jpg');
  });

  it('renders the opening crawl for films', async () => {
    await renderEntityDetails(
      { title: 'A New Hope', episode_id: 4, director: 'George Lucas', opening_crawl: 'It is a period of civil war.' },
      'films',
      createArtworkProvider([]),
    );

    expect(document.querySelector('.details-description').textContent).toBe('It is a period of civil war.');
    expect(document.getElementById('detailsModalKicker').textContent).toBe('FILM DETAILS');
  });
});
