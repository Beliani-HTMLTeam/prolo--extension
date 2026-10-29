import './chatSections.scss';

const CHAT_LIST_SELECTOR = '[data-testid="simple-collab-dnd-rail"]';
const CHAT_ITEM_SELECTOR = '[role="treeitem"][aria-labelledby*="title-chat-list-item_"]';
const FILTER_BAR_SELECTOR = '[data-testid="simple-collab-left-rail-sticky-filter-v2"]';
const CHAT_TITLE_ID_PREFIX = 'title-chat-list-item_';
const CHAT_HEADER_ID_PREFIX = 'chat-header-';
const STORAGE_KEY = 'teamsChatSections';
const UNGROUPED_ID = '__ungrouped';
const UNREAD_LABEL_ID = 'chat_list_unread_text';
const DEBOUNCE_MS = 300;
const DELETE_CONFIRM_MS = 3000;

interface SectionChat {
  id: string;
  name: string;
}

interface Section {
  id: string;
  name: string;
  chats: SectionChat[];
}

let sections: Section[] = [];
let activeSectionId: string | null = null;
let draggedChat: SectionChat | null = null;

let row: HTMLElement | null = null;
let menu: HTMLElement | null = null;
const filterStyle = document.createElement('style');

export async function setupChatSections() {
  filterStyle.id = 'prolo-chat-sections-filter';
  document.head.append(filterStyle);

  sections = await loadSections();

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !(STORAGE_KEY in changes)) return;
    sections = (changes[STORAGE_KEY].newValue as Section[] | undefined) ?? [];
    if (activeSectionId !== UNGROUPED_ID && !sections.some(section => section.id === activeSectionId)) {
      activeSectionId = null;
    }
    render();
  });

  let scheduled = false;
  new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      if (!row?.isConnected) render();
      else updateIndicators();
    }, DEBOUNCE_MS);
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-labelledby'] });

  document.addEventListener('dragstart', onDragStart, true);
  document.addEventListener('dragend', () => (draggedChat = null), true);
  document.addEventListener('mousedown', event => {
    if (menu && !menu.hidden && !(event.target instanceof Node && menu.contains(event.target))) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  render();
}

async function loadSections(): Promise<Section[]> {
  const stored = await browser.storage.local.get(STORAGE_KEY);
  return (stored[STORAGE_KEY] as Section[] | undefined) ?? [];
}

async function saveSections(next: Section[]) {
  sections = next;
  render();
  await browser.storage.local.set({ [STORAGE_KEY]: next });
}

function updateSection(id: string, change: (section: Section) => Section) {
  void saveSections(sections.map(section => (section.id === id ? change(section) : section)));
}

function getChatFromItem(item: Element): SectionChat | null {
  const id = item.getAttribute('aria-labelledby')?.match(new RegExp(`${CHAT_TITLE_ID_PREFIX}(\\S+)`))?.[1];
  if (!id) return null;
  const name = document.getElementById(`${CHAT_TITLE_ID_PREFIX}${id}`)?.textContent?.trim() || id;
  return { id, name };
}

function getListedChats(): SectionChat[] {
  const chats = new Map<string, SectionChat>();
  for (const item of document.querySelectorAll(`${CHAT_LIST_SELECTOR} ${CHAT_ITEM_SELECTOR}`)) {
    const chat = getChatFromItem(item);
    if (chat && !chats.has(chat.id)) chats.set(chat.id, chat);
  }
  return [...chats.values()];
}

function getUnreadChatIds(): Set<string> {
  const ids = new Set<string>();
  for (const item of document.querySelectorAll(
    `${CHAT_LIST_SELECTOR} ${CHAT_ITEM_SELECTOR}[aria-labelledby~="${UNREAD_LABEL_ID}"]`,
  )) {
    const chat = getChatFromItem(item);
    if (chat) ids.add(chat.id);
  }
  return ids;
}

function getOpenChat(): SectionChat | null {
  const id = document.querySelector(`[id^="${CHAT_HEADER_ID_PREFIX}"]`)?.id.slice(CHAT_HEADER_ID_PREFIX.length);
  if (!id) return null;
  const name =
    document.getElementById(`${CHAT_TITLE_ID_PREFIX}${id}`)?.textContent?.trim() ||
    document.title.split(' | ').slice(1, -1).join(' | ') ||
    id;
  return { id, name };
}

function onDragStart(event: DragEvent) {
  const item = event.target instanceof Element ? event.target.closest(CHAT_ITEM_SELECTOR) : null;
  draggedChat = item ? getChatFromItem(item) : null;
}

function render() {
  if (activeSectionId === UNGROUPED_ID && !sections.length) activeSectionId = null;
  renderFilter();

  const filterBar = document.querySelector(FILTER_BAR_SELECTOR);
  if (!filterBar?.parentElement) return;

  if (!row) {
    row = document.createElement('div');
    row.className = 'prolo-sections';
    row.setAttribute('role', 'toolbar');
    row.setAttribute('aria-label', 'Chat sections');
  }
  if (row.previousElementSibling !== filterBar) filterBar.after(row);
  const filterStyles = getComputedStyle(filterBar);
  row.style.marginLeft = filterStyles.marginLeft;
  row.style.paddingLeft = filterStyles.paddingLeft;
  row.style.paddingRight = filterStyles.paddingRight;

  row.replaceChildren(
    ...sections.map(renderChip),
    ...(sections.length ? [renderUngroupedChip()] : []),
    renderAddChip(),
  );
  updateIndicators();
}

function updateIndicators() {
  if (!row) return;
  const unread = getUnreadChatIds();

  for (const chip of row.querySelectorAll<HTMLElement>('[data-section-id]')) {
    const section = sections.find(candidate => candidate.id === chip.dataset.sectionId);
    if (!section) continue;
    const hasUnread = section.chats.some(chat => unread.has(chat.id));
    setChipState(chip, section.name, section.chats.length, hasUnread);
  }

  const ungroupedChip = row.querySelector<HTMLElement>('.prolo-sections__chip--ungrouped');
  if (ungroupedChip) {
    const grouped = getGroupedChatIds();
    const ungrouped = getListedChats().filter(chat => !grouped.has(chat.id));
    const countEl = ungroupedChip.querySelector('.prolo-sections__count');
    if (countEl) countEl.textContent = String(ungrouped.length);
    const hasUnread = ungrouped.some(chat => unread.has(chat.id));
    setChipState(ungroupedChip, 'Ungrouped', ungrouped.length, hasUnread);
  }
}

function setChipState(chip: HTMLElement, name: string, count: number, hasUnread: boolean) {
  chip.classList.toggle('prolo-sections__chip--unread', hasUnread);
  chip.setAttribute('aria-label', `${name}, ${count} chats${hasUnread ? ', unread messages' : ''}`);
}

function renderFilter() {
  if (activeSectionId === UNGROUPED_ID) {
    const grouped = getGroupedChatIds();
    filterStyle.textContent = grouped.size
      ? `${[...grouped].map(id => `${CHAT_LIST_SELECTOR} ${CHAT_ITEM_SELECTOR}${chatIdAttr(id)}`).join(',\n')} { display: none !important; }`
      : '';
    return;
  }

  const section = sections.find(candidate => candidate.id === activeSectionId);
  if (!section) {
    filterStyle.textContent = '';
    return;
  }
  const keep = section.chats.map(chat => `:not(${chatIdAttr(chat.id)})`).join('');
  filterStyle.textContent = `${CHAT_LIST_SELECTOR} ${CHAT_ITEM_SELECTOR}${keep} { display: none !important; }`;
}

function chatIdAttr(chatId: string): string {
  return `[aria-labelledby~="${CHAT_TITLE_ID_PREFIX}${cssString(chatId)}"]`;
}

function getGroupedChatIds(): Set<string> {
  return new Set(sections.flatMap(section => section.chats.map(chat => chat.id)));
}

function cssString(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

function renderChip(section: Section): HTMLElement {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'prolo-sections__chip';
  chip.dataset.sectionId = section.id;
  chip.setAttribute('aria-pressed', String(section.id === activeSectionId));
  chip.title = 'Click to filter · drag a chat here to add it · right-click for options';
  chip.append(section.name, createCount(section.chats.length));

  chip.addEventListener('click', () => {
    activeSectionId = activeSectionId === section.id ? null : section.id;
    render();
  });
  chip.addEventListener('contextmenu', event => {
    event.preventDefault();
    openSectionMenu(section.id, chip);
  });

  chip.addEventListener('dragover', event => {
    if (!draggedChat) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    chip.classList.add('prolo-sections__chip--drop');
  });
  chip.addEventListener('dragleave', () => chip.classList.remove('prolo-sections__chip--drop'));
  chip.addEventListener('drop', event => {
    chip.classList.remove('prolo-sections__chip--drop');
    if (!draggedChat) return;
    event.preventDefault();
    event.stopPropagation();
    addChat(section.id, draggedChat);
    draggedChat = null;
  });

  return chip;
}

function renderUngroupedChip(): HTMLElement {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'prolo-sections__chip prolo-sections__chip--ungrouped';
  chip.setAttribute('aria-pressed', String(activeSectionId === UNGROUPED_ID));
  chip.title = 'Chats that are not in any section';
  chip.append('Ungrouped', createCount(0));
  chip.addEventListener('click', () => {
    activeSectionId = activeSectionId === UNGROUPED_ID ? null : UNGROUPED_ID;
    render();
  });
  return chip;
}

function createCount(count: number): HTMLElement {
  const countElement = document.createElement('span');
  countElement.className = 'prolo-sections__count';
  countElement.textContent = String(count);
  return countElement;
}

function renderAddChip(): HTMLElement {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'prolo-sections__chip prolo-sections__chip--add';
  chip.textContent = '+ Section';
  chip.addEventListener('click', () => openNameMenu(chip, '', name => createSection(name)));
  return chip;
}

function createSection(name: string) {
  const id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  void saveSections([...sections, { id, name, chats: [] }]);
}

function addChat(sectionId: string, chat: SectionChat) {
  updateSection(sectionId, section =>
    section.chats.some(existing => existing.id === chat.id) ? section : { ...section, chats: [...section.chats, chat] },
  );
}

function removeChat(sectionId: string, chatId: string) {
  updateSection(sectionId, section => ({ ...section, chats: section.chats.filter(chat => chat.id !== chatId) }));
}

function deleteSection(sectionId: string) {
  if (activeSectionId === sectionId) activeSectionId = null;
  void saveSections(sections.filter(section => section.id !== sectionId));
}

function ensureMenu(): HTMLElement {
  if (!menu) {
    menu = document.createElement('div');
    menu.className = 'prolo-sections-menu';
    menu.setAttribute('role', 'menu');
    menu.hidden = true;
    document.body.append(menu);
  }
  return menu;
}

function closeMenu() {
  if (menu) menu.hidden = true;
}

function showMenu(content: HTMLElement[], anchor: HTMLElement) {
  const menuElement = ensureMenu();
  menuElement.replaceChildren(...content);
  const style = getComputedStyle(anchor);
  for (const name of THEME_VARS) {
    const value = style.getPropertyValue(name).trim();
    if (value) menuElement.style.setProperty(name, value);
  }

  const rect = anchor.getBoundingClientRect();
  menuElement.hidden = false;
  const maxLeft = window.innerWidth - menuElement.offsetWidth - 8;
  menuElement.style.left = `${Math.round(Math.max(8, Math.min(rect.left, maxLeft)))}px`;
  menuElement.style.top = `${Math.round(rect.bottom + 4)}px`;
}

const THEME_VARS = [
  '--colorNeutralBackground1',
  '--colorNeutralBackground1Hover',
  '--colorNeutralForeground1',
  '--colorNeutralForeground3',
  '--colorNeutralStroke1',
  '--colorBrandForeground1',
  '--colorPaletteRedForeground1',
  '--shadow16',
];

function openSectionMenu(sectionId: string, anchor: HTMLElement) {
  const section = sections.find(candidate => candidate.id === sectionId);
  if (!section) return;

  const items: HTMLElement[] = [];
  const openChat = getOpenChat();
  if (openChat) {
    const inSection = section.chats.some(chat => chat.id === openChat.id);
    items.push(
      menuItem(inSection ? `Remove "${openChat.name}"` : `Add "${openChat.name}"`, () => {
        if (inSection) removeChat(section.id, openChat.id);
        else addChat(section.id, openChat);
        closeMenu();
      }),
    );
  }

  if (section.chats.length) {
    const list = document.createElement('div');
    list.className = 'prolo-sections-menu__chats';
    for (const chat of section.chats) {
      const line = document.createElement('div');
      line.className = 'prolo-sections-menu__chat';
      const name = document.createElement('span');
      name.textContent = chat.name;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'prolo-sections-menu__remove';
      remove.textContent = '✕';
      remove.title = `Remove "${chat.name}" from ${section.name}`;
      remove.addEventListener('click', () => {
        removeChat(section.id, chat.id);
        const chip = row?.querySelector<HTMLElement>(`[data-section-id="${section.id}"]`);
        if (chip) openSectionMenu(section.id, chip);
        else closeMenu();
      });
      line.append(name, remove);
      list.append(line);
    }
    items.push(list);
  } else {
    items.push(menuNote('No chats yet. Drag a chat onto the chip, or open a chat and use Add.'));
  }

  items.push(
    menuItem('Add chats…', () => openChatPicker(section.id, anchor)),
    menuItem('Rename…', () =>
      openNameMenu(anchor, section.name, name => updateSection(section.id, current => ({ ...current, name }))),
    ),
  );

  let armed = false;
  const remove = menuItem('Delete section', () => {
    if (!armed) {
      armed = true;
      remove.textContent = 'Click again to delete';
      setTimeout(() => {
        armed = false;
        remove.textContent = 'Delete section';
      }, DELETE_CONFIRM_MS);
      return;
    }
    deleteSection(section.id);
    closeMenu();
  });
  remove.classList.add('prolo-sections-menu__item--danger');
  items.push(remove);

  showMenu(items, anchor);
}

function openChatPicker(sectionId: string, anchor: HTMLElement, query = '') {
  const section = sections.find(candidate => candidate.id === sectionId);
  if (!section) return;

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'prolo-sections-menu__search';
  input.placeholder = 'Search chats';
  input.value = query;
  input.setAttribute('aria-label', 'Search chats');

  const list = document.createElement('div');
  list.className = 'prolo-sections-menu__chats';

  const candidates = getListedChats().filter(chat => !section.chats.some(existing => existing.id === chat.id));
  const renderList = () => {
    const needle = input.value.trim().toLowerCase();
    const matches = candidates.filter(chat => chat.name.toLowerCase().includes(needle));
    list.replaceChildren(
      ...(matches.length
        ? matches.map(chat =>
            menuItem(chat.name, () => {
              addChat(sectionId, chat);
              const chip = row?.querySelector<HTMLElement>(`[data-section-id="${sectionId}"]`);
              if (chip) openChatPicker(sectionId, chip, input.value);
            }),
          )
        : [menuNote(candidates.length ? 'No matching chats' : 'All listed chats are in this section')]),
    );
  };
  input.addEventListener('input', renderList);
  renderList();

  showMenu([input, list], anchor);
  input.focus();
}

function openNameMenu(anchor: HTMLElement, initial: string, onSave: (name: string) => void) {
  const form = document.createElement('form');
  form.className = 'prolo-sections-menu__form';
  const input = document.createElement('input');
  input.type = 'text';
  input.value = initial;
  input.placeholder = 'Section name';
  input.maxLength = 40;
  input.setAttribute('aria-label', 'Section name');
  const save = document.createElement('button');
  save.type = 'submit';
  save.textContent = 'Save';
  form.append(input, save);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    onSave(name);
    closeMenu();
  });

  showMenu([form], anchor);
  input.focus();
  input.select();
}

function menuItem(label: string, onClick: () => void): HTMLElement {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'prolo-sections-menu__item';
  item.setAttribute('role', 'menuitem');
  item.textContent = label;
  item.addEventListener('click', onClick);
  return item;
}

function menuNote(text: string): HTMLElement {
  const note = document.createElement('div');
  note.className = 'prolo-sections-menu__note';
  note.textContent = text;
  return note;
}
