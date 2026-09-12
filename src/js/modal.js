// Bootstrap CSS provides the modal styling.
// This module handles the interaction without requiring Bootstrap's JS bundle.

let backdropElement;
let escapeHandler;

const createBackdrop = modalElement => {
  const backdrop = document.createElement('div');

  backdrop.className = 'modal-backdrop fade show';
  backdrop.addEventListener('click', () => closeModal(modalElement));

  document.body.appendChild(backdrop);

  return backdrop;
};

const handleEscapeKey = (event, modalElement) => {
  if (event.key === 'Escape') {
    closeModal(modalElement);
  }
};

export const openModal = modalElement => {
  modalElement.classList.add('show');
  modalElement.style.display = 'block';
  modalElement.removeAttribute('aria-hidden');
  modalElement.setAttribute('aria-modal', 'true');

  document.body.classList.add('modal-open');

  backdropElement = createBackdrop(modalElement);

  escapeHandler = event => handleEscapeKey(event, modalElement);
  document.addEventListener('keydown', escapeHandler);
};

export const closeModal = modalElement => {
  modalElement.classList.remove('show');
  modalElement.style.display = 'none';
  modalElement.setAttribute('aria-hidden', 'true');
  modalElement.removeAttribute('aria-modal');

  document.body.classList.remove('modal-open');

  backdropElement?.remove();
  backdropElement = null;

  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }
};