// UI layer: a single modal's visibility, backdrop and keyboard handling.
//
// This is a factory rather than a set of functions closing over module-level
// variables, so each modal owns its own backdrop/escape-key state instead of
// that state being a hidden global shared by every caller (and every test).

const ESCAPE_KEY = 'Escape';

export const createModalController = modal => {
  let backdrop = null;
  let escapeHandler = null;

  const removeEscapeHandler = () => {
    if (!escapeHandler) return;
    document.removeEventListener('keydown', escapeHandler);
    escapeHandler = null;
  };

  const close = () => {
    if (!modal) return;

    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    modal.removeAttribute('aria-modal');
    document.body.classList.remove('modal-open');

    backdrop?.remove();
    backdrop = null;

    removeEscapeHandler();
  };

  const open = () => {
    if (!modal) return;

    removeEscapeHandler();

    modal.classList.add('show');
    modal.style.display = 'block';
    modal.removeAttribute('aria-hidden');
    modal.setAttribute('aria-modal', 'true');
    document.body.classList.add('modal-open');

    backdrop?.remove();
    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    backdrop.addEventListener('click', close);
    document.body.appendChild(backdrop);

    escapeHandler = event => {
      if (event.key === ESCAPE_KEY) close();
    };
    document.addEventListener('keydown', escapeHandler);
  };

  return { open, close };
};
