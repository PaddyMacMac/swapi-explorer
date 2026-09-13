// Tests modal visibility, backdrop behaviour and keyboard accessibility.

import { beforeEach, describe, expect, it } from 'vitest';
import { createModalController } from '../src/js/ui/modal.js';

let modalElement;
let modal;

beforeEach(() => {
  document.body.innerHTML = '<div id="detailsModal" aria-hidden="true"></div>';
  modalElement = document.getElementById('detailsModal');
  modal = createModalController(modalElement);
});

describe('createModalController', () => {
  it('opens with the correct accessibility state', () => {
    modal.open();
    expect(modalElement.classList.contains('show')).toBe(true);
    expect(modalElement.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector('.modal-backdrop')).not.toBeNull();
  });

  it('closes when the backdrop is clicked', () => {
    modal.open();
    document.querySelector('.modal-backdrop').click();
    expect(modalElement.classList.contains('show')).toBe(false);
  });

  it('closes on Escape', () => {
    modal.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modalElement.classList.contains('show')).toBe(false);
  });

  it('can be closed directly', () => {
    modal.open();
    modal.close();
    expect(modalElement.style.display).toBe('none');
    expect(document.querySelector('.modal-backdrop')).toBeNull();
  });

  it('keeps two controllers independent of one another', () => {
    document.body.innerHTML += '<div id="secondModal" aria-hidden="true"></div>';
    const secondModalElement = document.getElementById('secondModal');
    const secondModal = createModalController(secondModalElement);

    modal.open();
    secondModal.open();
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(2);

    modal.close();
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1);
    expect(secondModalElement.classList.contains('show')).toBe(true);
  });
});
