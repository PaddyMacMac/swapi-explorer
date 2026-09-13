// Tests modal visibility, backdrop behaviour and keyboard accessibility.

import { beforeEach, describe, expect, it } from 'vitest';
import { createEntityDetailsModalController } from '../src/js/presentation/entityDetailsModalController.js';

let modalElement;
let modalController;

beforeEach(() => {
  document.body.innerHTML = '<div id="detailsModal" aria-hidden="true"></div>';
  modalElement = document.getElementById('detailsModal');
  modalController = createEntityDetailsModalController(modalElement);
});

describe('createEntityDetailsModalController', () => {
  it('opens with the correct accessibility state', () => {
    modalController.open();
    expect(modalElement.classList.contains('show')).toBe(true);
    expect(modalElement.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector('.modal-backdrop')).not.toBeNull();
  });

  it('closes when the backdrop is clicked', () => {
    modalController.open();
    document.querySelector('.modal-backdrop').click();
    expect(modalElement.classList.contains('show')).toBe(false);
  });

  it('closes on Escape', () => {
    modalController.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modalElement.classList.contains('show')).toBe(false);
  });

  it('ignores keys other than Escape', () => {
    modalController.open();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(modalElement.classList.contains('show')).toBe(true);
  });

  it('can be closed directly', () => {
    modalController.open();
    modalController.close();
    expect(modalElement.style.display).toBe('none');
    expect(document.querySelector('.modal-backdrop')).toBeNull();
  });

  it('is a no-op to close an already-closed modal', () => {
    expect(() => modalController.close()).not.toThrow();
    expect(document.querySelector('.modal-backdrop')).toBeNull();
  });

  it('does nothing when constructed without a modal element', () => {
    const missingElementController = createEntityDetailsModalController(null);
    expect(() => missingElementController.open()).not.toThrow();
    expect(() => missingElementController.close()).not.toThrow();
  });

  it('reopening replaces the previous backdrop instead of stacking another', () => {
    modalController.open();
    modalController.open();
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1);
  });

  it('keeps two controllers independent of one another', () => {
    document.body.innerHTML += '<div id="secondModal" aria-hidden="true"></div>';
    const secondModalElement = document.getElementById('secondModal');
    const secondModalController = createEntityDetailsModalController(secondModalElement);

    modalController.open();
    secondModalController.open();
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(2);

    modalController.close();
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1);
    expect(secondModalElement.classList.contains('show')).toBe(true);
  });
});
