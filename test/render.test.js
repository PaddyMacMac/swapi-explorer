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
  it('renders a card for every API entity', () => {
    renderResults([
      { name: 'Luke Skywalker', height: '172', mass: '77', birth_year: '19BBY' },
      { name: 'Leia Organa', height: '150', mass: '49', birth_year: '19BBY' },
    ], 'people');

    const cards = document.querySelectorAll('.entity-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Luke Skywalker');
    expect(cards[0].textContent).toContain('Height172 cm');
    expect(cards[0].dataset.index).toBe('0');
  });

  it('clears stale results', () => {
    renderResults([{ name: 'Yoda' }], 'people');
    renderResults([], 'people');
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
  it('renders details safely into the modal', () => {
    renderDetails({ name: '<Luke>', height: '172', mass: '77', birth_year: '19BBY', gender: 'male', hair_color: 'brown', eye_color: 'blue' }, 'people');
    expect(document.getElementById('detailsModalLabel').textContent).toBe('<Luke>');
    expect(document.getElementById('detailsModalBody').textContent).toContain('<Luke>');
    expect(document.getElementById('detailsModalBody').querySelector('script')).toBeNull();
  });
});
