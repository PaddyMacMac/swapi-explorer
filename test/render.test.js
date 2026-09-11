// render.test.js — DOM output of renderStatus / renderResults against jsdom.
import { describe, it, expect, beforeEach } from 'vitest';
import { renderStatus, renderResults, renderPicker, renderDetails, getEntityName } from '../src/js/render.js';

const setUpDom = () => {
  document.body.innerHTML = `
    <div id="status"></div>
    <select id="entity-picker"></select>
    <div id="results"></div>
    <h5 id="detailsModalLabel"></h5>
    <div id="detailsModalBody"></div>
  `;
};

describe('renderStatus', () => {
  beforeEach(setUpDom);

  it('writes the message into the #status element', () => {
    renderStatus('Loading people...');
    expect(document.getElementById('status').textContent).toBe('Loading people...');
  });

  it('overwrites any previous status message', () => {
    renderStatus('first');
    renderStatus('second');
    expect(document.getElementById('status').textContent).toBe('second');
  });

  it('flags error messages with the is-error class', () => {
    renderStatus('Error loading films: boom');
    expect(document.getElementById('status').classList.contains('is-error')).toBe(true);
  });

  it('does not flag non-error messages with the is-error class', () => {
    renderStatus('Showing 3 films');
    expect(document.getElementById('status').classList.contains('is-error')).toBe(false);
  });
});

describe('getEntityName', () => {
  it('reads title for films', () => {
    expect(getEntityName({ title: 'A New Hope' }, 'films')).toBe('A New Hope');
  });

  it('reads name for people, planets, and starships', () => {
    expect(getEntityName({ name: 'Yoda' }, 'people')).toBe('Yoda');
    expect(getEntityName({ name: 'Tatooine' }, 'planets')).toBe('Tatooine');
    expect(getEntityName({ name: 'X-wing' }, 'starships')).toBe('X-wing');
  });
});

describe('renderResults', () => {
  beforeEach(setUpDom);

  it('clears previous results before rendering new ones', () => {
    const results = document.getElementById('results');
    results.innerHTML = '<div class="col-md-4">stale</div>';

    renderResults([{ name: 'Yoda', height: '66', mass: '17', birth_year: '896BBY' }], 'people');

    expect(results.querySelectorAll('.col-md-4')).toHaveLength(1);
    expect(results.textContent).not.toContain('stale');
  });

  it('renders one card per item, each in a col-md-4 wrapper', () => {
    const people = [
      { name: 'Luke Skywalker', height: '172', mass: '77', birth_year: '19BBY' },
      { name: 'Leia Organa', height: '150', mass: '49', birth_year: '19BBY' },
    ];

    renderResults(people, 'people');

    const cards = document.querySelectorAll('#results .col-md-4');
    expect(cards).toHaveLength(2);
  });

  it('renders person fields correctly', () => {
    renderResults([{ name: 'Luke Skywalker', height: '172', mass: '77', birth_year: '19BBY' }], 'people');

    const card = document.querySelector('#results .card');
    expect(card.querySelector('.card-title').textContent).toBe('Luke Skywalker');
    expect(card.textContent).toContain('Height: 172 cm');
    expect(card.textContent).toContain('Mass: 77 kg');
    expect(card.textContent).toContain('Birth year: 19BBY');
  });

  it('renders film fields correctly', () => {
    renderResults([{ title: 'A New Hope', episode_id: 4, director: 'George Lucas', release_date: '1977-05-25' }], 'films');

    const card = document.querySelector('#results .card');
    expect(card.querySelector('.card-title').textContent).toBe('A New Hope');
    expect(card.textContent).toContain('Episode: 4');
    expect(card.textContent).toContain('Director: George Lucas');
    expect(card.textContent).toContain('Released: 1977-05-25');
  });

  it('renders planet fields correctly', () => {
    renderResults([{ name: 'Tatooine', climate: 'arid', terrain: 'desert', population: '200000' }], 'planets');

    const card = document.querySelector('#results .card');
    expect(card.querySelector('.card-title').textContent).toBe('Tatooine');
    expect(card.textContent).toContain('Climate: arid');
    expect(card.textContent).toContain('Terrain: desert');
    expect(card.textContent).toContain('Population: 200000');
  });

  it('renders starship fields correctly', () => {
    renderResults([{ name: 'Millennium Falcon', model: 'YT-1300', manufacturer: 'Corellian Engineering Corporation', crew: '4' }], 'starships');

    const card = document.querySelector('#results .card');
    expect(card.querySelector('.card-title').textContent).toBe('Millennium Falcon');
    expect(card.textContent).toContain('Model: YT-1300');
    expect(card.textContent).toContain('Manufacturer: Corellian Engineering Corporation');
    expect(card.textContent).toContain('Crew: 4');
  });

  it('renders nothing when given an empty list', () => {
    renderResults([], 'people');
    expect(document.getElementById('results').children).toHaveLength(0);
  });
});

describe('renderPicker', () => {
  beforeEach(setUpDom);

  it('sorts items alphabetically by display name and returns the sorted array', () => {
    const people = [{ name: 'Yoda' }, { name: 'Luke Skywalker' }, { name: 'Chewbacca' }];

    const sorted = renderPicker(people, 'people');

    expect(sorted.map(p => p.name)).toEqual(['Chewbacca', 'Luke Skywalker', 'Yoda']);
  });

  it('sorts films by title', () => {
    const films = [{ title: 'Return of the Jedi' }, { title: 'A New Hope' }, { title: 'The Empire Strikes Back' }];

    const sorted = renderPicker(films, 'films');

    expect(sorted.map(f => f.title)).toEqual(['A New Hope', 'Return of the Jedi', 'The Empire Strikes Back']);
  });

  it('populates the select with a disabled placeholder plus one option per item', () => {
    renderPicker([{ name: 'Yoda' }, { name: 'Chewbacca' }], 'people');

    const picker = document.getElementById('entity-picker');
    const options = picker.querySelectorAll('option');

    expect(options).toHaveLength(3);
    expect(options[0].disabled).toBe(true);
    expect(options[1].textContent).toBe('Chewbacca');
    expect(options[1].value).toBe('0');
    expect(options[2].textContent).toBe('Yoda');
    expect(options[2].value).toBe('1');
  });

  it('clears previously populated options on a subsequent call', () => {
    renderPicker([{ name: 'Yoda' }, { name: 'Chewbacca' }], 'people');
    renderPicker([{ title: 'A New Hope' }], 'films');

    const picker = document.getElementById('entity-picker');
    expect(picker.querySelectorAll('option')).toHaveLength(2);
    expect(picker.textContent).not.toContain('Yoda');
  });

  it('handles an empty list by leaving only the placeholder', () => {
    renderPicker([], 'people');
    expect(document.getElementById('entity-picker').querySelectorAll('option')).toHaveLength(1);
  });
});

describe('renderDetails', () => {
  beforeEach(setUpDom);

  it('sets the modal title to the entity display name', () => {
    renderDetails({ name: 'Yoda', height: '66', mass: '17', birth_year: '896BBY', gender: 'male', hair_color: 'white', eye_color: 'brown' }, 'people');
    expect(document.getElementById('detailsModalLabel').textContent).toBe('Yoda');
  });

  it('renders person details in the modal body', () => {
    renderDetails({ name: 'Yoda', height: '66', mass: '17', birth_year: '896BBY', gender: 'male', hair_color: 'white', eye_color: 'brown' }, 'people');

    const body = document.getElementById('detailsModalBody').textContent;
    expect(body).toContain('66 cm');
    expect(body).toContain('17 kg');
    expect(body).toContain('896BBY');
    expect(body).toContain('male');
    expect(body).toContain('white');
    expect(body).toContain('brown');
  });

  it('renders film details including the opening crawl', () => {
    renderDetails({
      title: 'A New Hope',
      episode_id: 4,
      director: 'George Lucas',
      producer: 'Gary Kurtz, Rick McCallum',
      release_date: '1977-05-25',
      opening_crawl: 'It is a period of civil war.',
    }, 'films');

    expect(document.getElementById('detailsModalLabel').textContent).toBe('A New Hope');
    const body = document.getElementById('detailsModalBody').textContent;
    expect(body).toContain('George Lucas');
    expect(body).toContain('Gary Kurtz, Rick McCallum');
    expect(body).toContain('1977-05-25');
    expect(body).toContain('It is a period of civil war.');
  });

  it('renders planet details', () => {
    renderDetails({
      name: 'Tatooine',
      climate: 'arid',
      terrain: 'desert',
      population: '200000',
      diameter: '10465',
      gravity: '1 standard',
      orbital_period: '304',
      rotation_period: '23',
      surface_water: '1',
    }, 'planets');

    const body = document.getElementById('detailsModalBody').textContent;
    expect(body).toContain('arid');
    expect(body).toContain('10465 km');
    expect(body).toContain('1 standard');
    expect(body).toContain('304 days');
    expect(body).toContain('23 hours');
    expect(body).toContain('1%');
  });

  it('renders starship details', () => {
    renderDetails({
      name: 'Millennium Falcon',
      model: 'YT-1300',
      manufacturer: 'Corellian Engineering Corporation',
      crew: '4',
      passengers: '6',
      cost_in_credits: '100000',
      length: '34.37',
      max_atmosphering_speed: '1050',
      cargo_capacity: '100000',
    }, 'starships');

    const body = document.getElementById('detailsModalBody').textContent;
    expect(body).toContain('YT-1300');
    expect(body).toContain('Corellian Engineering Corporation');
    expect(body).toContain('100000 credits');
    expect(body).toContain('34.37 m');
    expect(body).toContain('1050');
  });
});
