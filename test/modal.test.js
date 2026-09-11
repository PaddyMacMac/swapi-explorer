// modal.test.js — pure DOM behavior of openModal/closeModal, no Bootstrap JS involved.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openModal, closeModal } from '../src/js/modal.js';

const setUpDom = () => {
  document.body.innerHTML = `
    <div class="modal" id="detailsModal" aria-hidden="true"></div>
  `;
};

describe('openModal', () => {
  beforeEach(setUpDom);
  afterEach(() => closeModal(document.getElementById('detailsModal')));

  it('adds the show class and makes the modal visible', () => {
    const modalEl = document.getElementById('detailsModal');
    openModal(modalEl);

    expect(modalEl.classList.contains('show')).toBe(true);
    expect(modalEl.style.display).toBe('block');
    expect(modalEl.getAttribute('aria-modal')).toBe('true');
    expect(modalEl.hasAttribute('aria-hidden')).toBe(false);
  });

  it('marks the body as modal-open and appends a backdrop', () => {
    openModal(document.getElementById('detailsModal'));

    expect(document.body.classList.contains('modal-open')).toBe(true);
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1);
  });

  it('closes when the backdrop is clicked', () => {
    const modalEl = document.getElementById('detailsModal');
    openModal(modalEl);

    document.querySelector('.modal-backdrop').click();

    expect(modalEl.classList.contains('show')).toBe(false);
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(0);
  });

  it('closes on the Escape key', () => {
    const modalEl = document.getElementById('detailsModal');
    openModal(modalEl);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(modalEl.classList.contains('show')).toBe(false);
  });
});

describe('closeModal', () => {
  beforeEach(setUpDom);

  it('removes the show class, hides the element, and restores aria-hidden', () => {
    const modalEl = document.getElementById('detailsModal');
    openModal(modalEl);

    closeModal(modalEl);

    expect(modalEl.classList.contains('show')).toBe(false);
    expect(modalEl.style.display).toBe('none');
    expect(modalEl.getAttribute('aria-hidden')).toBe('true');
    expect(modalEl.hasAttribute('aria-modal')).toBe(false);
  });

  it('removes the backdrop and the body modal-open class', () => {
    const modalEl = document.getElementById('detailsModal');
    openModal(modalEl);

    closeModal(modalEl);

    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(0);
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });

  it('is safe to call when the modal was never opened', () => {
    expect(() => closeModal(document.getElementById('detailsModal'))).not.toThrow();
  });

  it('stops listening for Escape after closing', () => {
    const modalEl = document.getElementById('detailsModal');
    openModal(modalEl);
    closeModal(modalEl);

    const addSpy = vi.spyOn(modalEl.classList, 'add');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(addSpy).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });
});
