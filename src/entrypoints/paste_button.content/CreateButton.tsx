import { createRoot } from 'react-dom/client';
import { toast, Toaster } from 'sonner';

type Entry = {
  textArea: HTMLTextAreaElement;
  updateBtn: HTMLInputElement;
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

const ensureToaster = () => {
  if (document.getElementById('prolo-toaster')) return;

  const container = document.createElement('div');
  container.id = 'prolo-toaster';
  document.body.appendChild(container);

  createRoot(container).render(<Toaster position="top-right" richColors />);
};

export const CreateButton = (elems: Elems, target: string) => {
  ensureToaster();
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
          let srcBtn = document.querySelector<HTMLAnchorElement>('#cke_19');

          if (srcBtn?.classList.contains('cke_button_off')) {
            toast.error('Please enable source view.', { duration: 2500 });
            return;
          }

          let content = await navigator.clipboard.readText();
          if (!content.includes('<!DOCTYPE')) {
            toast.error('Missing HTML tags.', { duration: 2500 });
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
            toast.error('Failed to get #seller selector.', { duration: 2500 });
            return;
          }

          lang = selected.innerText.split(':')[0].toLowerCase();

          if (domain != lang) toast.error(`Pasting wrong lang '${domain}', expected '${lang}'`, { duration: 2500 });

          const textArea = document.querySelector<HTMLTextAreaElement>(elems.ckeTextArea);
          if (!textArea) {
            toast.error(`Failed to get ${elems.ckeTextArea} element.`, { duration: 2500 });
            return;
          }
          textArea.value = content;
          upd.click();
          toast.success('Updating...', { duration: 2500 });
        } catch (e) {
          console.log(e);
        }
      });
      break;
    case 'shop_content':
      window.addEventListener('load', () => {
        let lngSelect = [];
        let elems_ = document.querySelectorAll<HTMLInputElement>('input[value="Update"]');
        for (let elem of elems_) {
          const fnStr = elem.getAttribute('onclick');
          if (!fnStr) continue;

          let langPart = fnStr.split(', ')[1];
          if (!langPart) continue;

          if (langPart.includes("'") && !langPart.includes(';')) {
            lngSelect.push({ lang: langPart.replace(/'(.*)'/, '$1'), elem: elem });
          }
        }

        elems.custom = {};
        for (let lng of lngSelect) {
          const textArea = lng.elem.parentElement?.querySelector('textarea');
          if (!textArea) continue;

          elems.custom[lng.lang] = {
            textArea: textArea,
            updateBtn: lng.elem,
          };

          elems.custom[lng.lang].textArea?.setAttribute('data-lang', lng.lang);
        }

        if (!elems.custom) return;

        for (let [langKey, entry] of Object.entries(elems.custom)) {
          const parent = entry.textArea.parentElement;
          if (!parent) return;
          createBtn('Paste and update LP', parent, async e => {
            e.preventDefault();
            try {
              let content = await navigator.clipboard.readText();
              if (content.includes('<!DOCTYPE')) {
                toast.error('Not valid LP content', { duration: 2500 });
                return;
              }

              const parser = new DOMParser();
              const doc = parser.parseFromString(content, 'text/html');

              const link = doc.querySelector<HTMLAnchorElement>('a[href*="beliani."]');
              if (!link) {
                toast.error(`Failed to get link element.`, { duration: 2500 });
                return;
              }
              const domain = new URL(link.href).hostname.split('.').pop();
              const shopSelect = document.querySelector<HTMLSelectElement>('.select2-selection--multiple');
              const slectedShop = shopSelect?.querySelector<HTMLOptionElement>('.select2-selection__choice');
              if (!slectedShop) {
                toast.error(`Failed to get link element.`, { duration: 2500 });
                return;
              }
              const shopUrl = slectedShop.title.trim() ?? '';

              const lang = shopUrl.split('.').pop() ?? '';

              if (domain != lang) {
                toast.error(`Pasting wrong lang '${domain}', expected '${lang}'`, { duration: 2500 });
                return;
              }

              entry.textArea.value = content;
              entry.updateBtn.click();
            } catch (e) {
              console.log(e);
            }
          });
        }
      });
      break;
  }
};
