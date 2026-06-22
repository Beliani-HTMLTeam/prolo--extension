import { createRoot } from 'react-dom/client';
import { ShowAlert } from './ShowAlert';

type Entry = {
  textArea: HTMLTextAreaElement;
  updateBtn: HTMLButtonElement;
};

type Elems = {
  updateBtn: string;
  ckeTextArea: string;
  custom?: Record<string, Entry>;
};

const createBtn = (text: string, parent: HTMLElement, cb: (e: MouseEvent) => void | Promise<void>) => {
  let btn = document.createElement('button');
  btn.textContent = text;
  btn.addEventListener('click', cb);
  parent.appendChild(btn);
};

const renderAlert = (type: string, msg: string, duration: number) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<ShowAlert type={type as 'success' | 'danger'} msg={msg} duration={duration} />);

  setTimeout(() => {
    root.unmount();
    container.remove();
  }, duration);
};

export const CreateButton = (elems: Elems, target: string) => {
  switch (target) {
    case 'news_email':
      window.addEventListener('load', () => {
        // Auto switch to source in ckeeditor.
        setTimeout(() => {
          let srcBtn = document.querySelector<HTMLAnchorElement>('#cke_19');
          if (!srcBtn) return;
          srcBtn.click();
        }, 250);
      });

      const upd = document.querySelector<HTMLInputElement>(elems.updateBtn);
      if (!upd?.parentElement) return;
      createBtn('Paste and update body', upd.parentElement, async e => {
        e.preventDefault();
        try {
          let content = await navigator.clipboard.readText();
          if (!content.includes('<!DOCTYPE')) {
            renderAlert('danger', 'Missing html tags.', 2500);
            return;
          }

          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');

          const linkSelector = doc.querySelectorAll<HTMLAnchorElement>('.newsletterRecommendationHeaderLink')[1];
          const domain = new URL(linkSelector.href).hostname.split('.').pop() ?? '';
          let lang = '';

          const seller = document.querySelector<HTMLSelectElement>('#seller');
          const selected = seller?.querySelector<HTMLOptionElement>('option[selected="selected"]');
          if (!selected) {
            renderAlert('danger', 'Failed to get #seller selector.', 2500);
            return;
          }

          lang = selected.innerText.split(':')[0].toLowerCase();

          if (domain != lang) renderAlert('danger', `Pasting wrong lang '${domain}', expected '${lang}'`, 2500);

          const textArea = document.querySelector<HTMLTextAreaElement>(elems.ckeTextArea);
          if (!textArea) {
            renderAlert('danger', `Failed to get ${elems.ckeTextArea} element.`, 2500);
            return;
          }
          textArea.value = content;
          upd.click();
          renderAlert('success', 'Updating...', 2500);
        } catch (e) {
          console.log(e);
        }
      });
      break;
    case 'shop_content':
      if (!elems.custom) return;

      for (let [langKey, entry] of Object.entries(elems.custom)) {
        const parent = entry.textArea.parentElement;
        if (!parent) return;
        createBtn('Paste and update LP', parent, async e => {
          e.preventDefault();
          try {
            let content = await navigator.clipboard.readText();
            if (content.includes('<!DOCTYPE')) {
              renderAlert('danger', 'Not valid LP content', 2500);
              return;
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');

            const link = doc.querySelector<HTMLAnchorElement>('a[href*="beliani."]');
            if (!link) {
              renderAlert('danger', `Failed to get link element.`, 2500);
              return;
            }
            const domain = new URL(link.href).hostname.split('.').pop();
            const shopSelect = document.querySelector<HTMLSelectElement>('.select2-selection--multiple');
            const slectedShop = document.querySelector<HTMLOptionElement>('.select2-selection__choice');
            if (!slectedShop) {
              renderAlert('danger', `Failed to get link element.`, 2500);
              return;
            }
            const shopUrl = slectedShop.title.trim() ?? '';

            const lang = shopUrl.split('.').pop() ?? '';

            if (domain != lang) {
              renderAlert('danger', `Pasting wrong lang '${domain}', expected '${lang}'`, 2500);
              return;
            }

            entry.textArea.value = content;
            entry.updateBtn.click();
          } catch (e) {
            console.log(e);
          }
        });
      }
  }
};
