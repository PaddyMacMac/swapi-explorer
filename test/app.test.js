// Tests the browser event wiring and proves that clicking a rendered card opens its details.

import { beforeEach, describe, expect, it, vi } from 'vitest';

const people = [
  { name: 'Luke Skywalker', height: '172', mass: '77', birth_year: '19BBY', gender: 'male', hair_color: 'brown', eye_color: 'blue' },
  { name: 'Yoda', height: '66', mass: '17', birth_year: '896BBY', gender: 'male', hair_color: 'white', eye_color: 'brown' },
];

const buildDom = () => {
  document.body.innerHTML = `
    <div id="resource-tabs"><button class="nav-link active" data-resource="people">Characters</button><button class="nav-link" data-resource="films">Films</button></div>
    <select id="entity-picker"></select>
    <button id="view-details-btn" disabled>View details</button>
    <div id="status"></div><div id="results"></div>
    <div id="detailsModal" aria-hidden="true"><h5 id="detailsModalLabel"></h5><div id="detailsModalBody"></div><button id="detailsModalCloseBtn"></button><button id="detailsModalCloseFooterBtn"></button></div>`;
};

beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(people) }));
  buildDom();
});

describe('app', () => {
  it('loads people and displays API results', async () => {
    await import('../src/js/app.js');
    await vi.waitFor(() => expect(document.querySelectorAll('.entity-card')).toHaveLength(2));
    expect(document.getElementById('status').textContent).toContain('Showing 2 people');
    expect(document.getElementById('results').textContent).toContain('Luke Skywalker');
  });

  it('opens the modal when a card is clicked', async () => {
    await import('../src/js/app.js');
    await vi.waitFor(() => expect(document.querySelector('.entity-card')).not.toBeNull());

    document.querySelector('.entity-card').click();

    expect(document.getElementById('detailsModal').classList.contains('show')).toBe(true);
    expect(document.getElementById('detailsModalLabel').textContent).toBe('Luke Skywalker');
  });

  it('enables the details button after a picker selection', async () => {
    await import('../src/js/app.js');
    await vi.waitFor(() => expect(document.querySelectorAll('#entity-picker option')).toHaveLength(3));

    const picker = document.getElementById('entity-picker');
    picker.value = '0';
    picker.dispatchEvent(new Event('change'));
    expect(document.getElementById('view-details-btn').disabled).toBe(false);
  });

  it('handles an API error without leaving stale cards', async () => {
    fetch.mockRejectedValueOnce(new Error('Network unavailable'));
    await import('../src/js/app.js');
    await vi.waitFor(() => expect(document.getElementById('status').dataset.type).toBe('error'));
    expect(document.querySelectorAll('.entity-card')).toHaveLength(0);
  });
});
