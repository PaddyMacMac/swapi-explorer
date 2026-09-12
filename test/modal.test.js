// Tests modal visibility, backdrop behaviour and keyboard accessibility.

import { beforeEach, describe, expect, it } from 'vitest';
import { closeModal, openModal } from '../src/js/ui/modal.js';

beforeEach(() => {
  document.body.innerHTML = '<div id="detailsModal" aria-hidden="true"></div>';
});

describe('modal', () => {
  it('opens with the correct accessibility state', () => {
    const modal = document.getElementById('detailsModal');
    openModal(modal);
    expect(modal.classList.contains('show')).toBe(true);
    expect(modal.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector('.modal-backdrop')).not.toBeNull();
  });

  it('closes when the backdrop is clicked', () => {
    const modal = document.getElementById('detailsModal');
    openModal(modal);
    document.querySelector('.modal-backdrop').click();
    expect(modal.classList.contains('show')).toBe(false);
  });

  it('closes on Escape', () => {
    const modal = document.getElementById('detailsModal');
    openModal(modal);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modal.classList.contains('show')).toBe(false);
  });

  it('can be closed directly', () => {
    const modal = document.getElementById('detailsModal');
    openModal(modal);
    closeModal(modal);
    expect(modal.style.display).toBe('none');
    expect(document.querySelector('.modal-backdrop')).toBeNull();
  });
});
