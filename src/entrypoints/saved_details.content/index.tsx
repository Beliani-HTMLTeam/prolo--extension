import { createRoot } from 'react-dom/client';
import { CopyButton } from './CopyButton';
import { initDownloadProductsListener, runDownloadProducts } from './downloadProducts';

export default defineContentScript({
  matches: [`*://*.prologistics.info/*saved_details.php*`],
  main() {
    initDownloadProductsListener();
    addDownloadButton();
    initCopyButtons();
  },
});
function addDownloadButton() {
  if (document.getElementById('prolo-download-products')) return;

  const btn = document.createElement('button');
  btn.id = 'prolo-download-products';
  btn.type = 'button';
  btn.textContent = 'Download products';
  btn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99999;
    padding: 10px 14px;
    cursor: pointer;
    font-family: Arial, sans-serif;
    font-size: 13px;
  `;

  btn.addEventListener('click', async () => {
    if (btn.disabled) return;

    setLoading(true, btn);

    try {
      await runDownloadProducts();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Download failed: ${msg}`);
    } finally {
      setLoading(false, btn);
    }
  });

  document.body.appendChild(btn);
}

function setLoading(isLoading: boolean, btn: HTMLButtonElement) {
  btn.disabled = isLoading;
  btn.textContent = isLoading ? 'Downloading…' : 'Download products';
    btn.style.cursor = isLoading ? 'wait' : 'pointer';

  const overlayId = 'prolo-download-loader';
  let overlay = document.getElementById(overlayId);

  if (isLoading) {
  if (!overlay) {
  overlay = document.createElement('div');
overlay.id = overlayId;
overlay.style.cssText = `
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
`;

overlay.innerHTML = `
  <style>
    #${overlayId} .loaderProducts {
      --color-1: #fff;
      --size: 2px;
      width: calc(48 * var(--size));
      height: calc(48 * var(--size));
      border: calc(5 * var(--size)) solid var(--color-1);
      border-bottom-color: transparent;
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: prolo-rotation 1s linear infinite;
    }
    @keyframes prolo-rotation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  
    <span class="loaderProducts"></span>

`;

document.body.appendChild(overlay);
  }
} else {
    overlay?.remove();
  }
}

function initCopyButtons() {
  const rows = Array.from(document.querySelectorAll('tr')).filter(
    tr => tr.cells.length > 2,
  );

  rows.forEach(row => {
    const saCell = row.cells[2];
    if (!saCell) return;

    const link = saCell.querySelector('a');
    if (!link || saCell.querySelector('.prolo-copy-react-root')) return;

    const valToCopy = link.innerText.trim();

    const container = document.createElement('span');
    container.className = 'prolo-copy-react-root';
    saCell.appendChild(container);

    createRoot(container).render(<CopyButton textToCopy={valToCopy} />);
  });
}