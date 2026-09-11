// modal.js — minimal show/hide for a Bootstrap-styled modal, with no
// dependency on bootstrap.bundle.min.js. Bootstrap's CSS (already loaded via
// the CDN <link> in index.html) fully styles .modal/.show/.modal-backdrop —
// only the interaction logic (toggling those classes, building a backdrop,
// wiring Escape/backdrop-click to close) needs JS, and that's cheap enough
// to own directly rather than pull in a whole extra script.

let backdropEl = null;
let escapeHandler = null;

export const openModal = (modalEl) => {
  modalEl.classList.add('show');
  modalEl.style.display = 'block';
  modalEl.removeAttribute('aria-hidden');
  modalEl.setAttribute('aria-modal', 'true');
  document.body.classList.add('modal-open');

  backdropEl = document.createElement('div');
  backdropEl.className = 'modal-backdrop fade show';
  backdropEl.addEventListener('click', () => closeModal(modalEl));
  document.body.appendChild(backdropEl);

  escapeHandler = (event) => {
    if (event.key === 'Escape') closeModal(modalEl);
  };
  document.addEventListener('keydown', escapeHandler);
};

export const closeModal = (modalEl) => {
  modalEl.classList.remove('show');
  modalEl.style.display = 'none';
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.removeAttribute('aria-modal');
  document.body.classList.remove('modal-open');

  if (backdropEl) {
    backdropEl.remove();
    backdropEl = null;
  }
  if (escapeHandler) {
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  }
};
