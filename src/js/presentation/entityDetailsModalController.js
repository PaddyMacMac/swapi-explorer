export const createEntityDetailsModalController = (modalElement, rootDocument = document) => {
  let backdropElement = null;

  const removeBackdrop = () => {
    backdropElement?.remove();
    backdropElement = null;
  };

  const close = () => {
    if (!modalElement) return;

    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.removeAttribute('aria-modal');
    rootDocument.body.classList.remove('modal-open');

    removeBackdrop();
    rootDocument.removeEventListener('keydown', handleEscapeKey);
  };

  const handleEscapeKey = event => {
    if (event.key === 'Escape') close();
  };

  const open = () => {
    if (!modalElement) return;

    rootDocument.removeEventListener('keydown', handleEscapeKey);

    modalElement.classList.add('show');
    modalElement.style.display = 'block';
    modalElement.removeAttribute('aria-hidden');
    modalElement.setAttribute('aria-modal', 'true');
    rootDocument.body.classList.add('modal-open');

    removeBackdrop();
    backdropElement = rootDocument.createElement('div');
    backdropElement.className = 'modal-backdrop fade show';
    backdropElement.addEventListener('click', close);
    rootDocument.body.appendChild(backdropElement);

    rootDocument.addEventListener('keydown', handleEscapeKey);
  };

  return { open, close };
};
