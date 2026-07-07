import { createRoot } from 'react-dom/client';
import { CreateButton } from './CreateButton';

export default defineContentScript({
  matches: [`*://*.prologistics.info/*news_email.php*`, `*://*.prologistics.info/*shop_content.php*`],
  main() {
    let locationUrl = location.href.split('/');
    const target = locationUrl[locationUrl.length - 1].split('.')[0] ?? '';

    let elems = {
      updateBtn: "input[name='update_body']",
      ckeBody: '#cke_body',
      ckeTextArea: '#cke_1_contents > textarea',
      ckeSourceBtn: '#cke_19',
      shopURL: '.select2-selection--multiple .select2-selection__choice',
    };

    // CreateButton(elems, target);
  },
});
