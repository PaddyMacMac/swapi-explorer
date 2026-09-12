// modal.test.js — tests modal DOM behaviour without Bootstrap JS.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openModal, closeModal } from '../src/js/modal.js';

const setUpDom = () => 
  document.body.innerHTML = `<div class="modal" id="detailsModal" aria-hidden="true"></div>`

describe('openModal', () => {
  beforeEach(setUpDom);

  afterEach(() => closeModal(document.getElementById('detailsModal')));

  it('shows the modal and updates its accessibility attributes', () => {
    const modal = document.getElementById('detailsModal');

    openModal(modal);

    expect(modal.classList.contains('show')).toBe(true);
    expect(modal.style.display).toBe('block');
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(modal.hasAttribute('aria-hidden')).toBe(false);
  });

  it('adds the modal-open class and backdrop to the page', () => {
    const modal = document.getElementById('detailsModal');

    openModal(modal);

    expect(document.body.classList.contains('modal-open')).toBe(true);
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1);
  });

  it('closes when the backdrop is clicked', () => {
    const modal = document.getElementById('detailsModal');

    openModal(modal);
    document.querySelector('.modal-backdrop').click();

    expect(modal.classList.contains('show')).toBe(false);
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(0);
  });

  it('closes when the Escape key is pressed', () => {
    const modal = document.getElementById('detailsModal');

    openModal(modal);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(modal.classList.contains('show')).toBe(false);
  });
});

describe('closeModal', () => {
  beforeEach(setUpDom);

  it('hides the modal and restores its accessibility attributes', () => {
    const modal = document.getElementById('detailsModal');

    openModal(modal);
    closeModal(modal);

    expect(modal.classList.contains('show')).toBe(false);
    expect(modal.style.display).toBe('none');
    expect(modal.getAttribute('aria-hidden')).toBe('true');
    expect(modal.hasAttribute('aria-modal')).toBe(false);
  });

  it('removes the backdrop and modal-open class', () => {
    const modal = document.getElementById('detailsModal');

    openModal(modal);
    closeModal(modal);

    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(0);
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });

  it('is safe to call when the modal is already closed', () => {
    const modal = document.getElementById('detailsModal');

    expect(() => closeModal(modal)).not.toThrow();
  });

  it('stops responding to the Escape key after closing', () => {
    const modal = document.getElementById('detailsModal');

    openModal(modal);
    closeModal(modal);

    const addSpy = vi.spyOn(modal.classList, 'add');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(addSpy).not.toHaveBeenCalled();

    addSpy.mockRestore();
  });
});