import './style.scss';

export default defineContentScript({
  matches: ['*://*.prologistics.info/*'],
  main() {
    const cleanupSideMenu = () => {
      // // remove string(21) "www.prologistics.info" text node
      // const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      // const nodesToRemove: Node[] = [];
      // let node;
      // while ((node = walker.nextNode())) {
      //   if (node.nodeValue && node.nodeValue.includes('string(21) "www.prologistics.info"')) {
      //     nodesToRemove.push(node);
      //   }
      // }
      // nodesToRemove.forEach(n => n.parentNode?.removeChild(n));

      const sideMenu = document.querySelector('.leftSideMenu');
      if (!sideMenu) return;

      let menuElement = sideMenu.querySelector('.leftMenuInner') as HTMLElement | null;

      // czasami nie ma inner menu, style sie rozjezdzaja
      if (!menuElement) {
        menuElement = document.createElement('div');
        menuElement.classList.add('leftMenuInner');

        while (sideMenu.firstChild) {
          menuElement.appendChild(sideMenu.firstChild);
        }

        sideMenu.appendChild(menuElement);
      }
      if (!menuElement) return;

      const links = menuElement.querySelectorAll('a');
      links.forEach(a => {
        if (a.style.pointerEvents === 'none') {
          a.classList.add('hidden');
        }
      });

      const brs = menuElement.querySelectorAll('br');
      brs.forEach(br => br.remove());

      const menuEntries = Array.from(menuElement.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
      const spaceRegex = /&nbsp;/g;

      menuEntries.forEach(node => {
        const cleanedText = node.textContent?.replace(spaceRegex, '').trim();

        if (!cleanedText) {
          node.remove();
        } else if (node.textContent !== cleanedText) {
          node.textContent = cleanedText;
        }
      });
    };

    cleanupSideMenu();
  },
});
