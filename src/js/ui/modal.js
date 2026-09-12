// Controls the details modal, including its backdrop, keyboard handling and accessibility state.

let backdrop;
let escapeHandler;

export const openModal = modal => {
  if (!modal) return;

  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }

  modal.classList.add('show');
  modal.style.display = 'block';
  modal.removeAttribute('aria-hidden');
  modal.setAttribute('aria-modal', 'true');
  document.body.classList.add('modal-open');

  backdrop?.remove();
  backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop fade show';
  backdrop.addEventListener('click', () => closeModal(modal));
  document.body.appendChild(backdrop);

  escapeHandler = event => {
    if (event.key === 'Escape') closeModal(modal);
  };
  document.addEventListener('keydown', escapeHandler);
};

export const closeModal = modal => {
  if (!modal) return;

  modal.classList.remove('show');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  modal.removeAttribute('aria-modal');
  document.body.classList.remove('modal-open');

  backdrop?.remove();
  backdrop = null;

  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }
};
