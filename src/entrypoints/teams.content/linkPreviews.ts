import { isPreviewableUrl } from '@/config/linkPreview';
import type { LinkPreviewResult } from '@/background/linkPreview';
import './linkPreview.scss';

const MESSAGE_SELECTOR = '[data-tid="chat-pane-message"]';
const NATIVE_PREVIEW_SELECTOR = '[data-tid="url-preview"]';
const PROCESSED_ATTR = 'data-prolo-preview';
const DEBOUNCE_MS = 300;
const SHOW_DELAY_MS = 300;
const HIDE_DELAY_MS = 200;
const ANCHOR_GAP_PX = 6;
const VIEWPORT_MARGIN_PX = 8;
const THEME_VARS = [
  '--colorNeutralBackground3',
  '--colorNeutralBackground4',
  '--colorNeutralBackground4Hover',
  '--colorNeutralBackground5',
  '--colorNeutralForeground1',
  '--colorNeutralForeground3',
  '--shadow16',
];

type Preview = Extract<LinkPreviewResult, { ok: true }>;

const cache = new Map<string, Promise<Preview | null>>();

let popover: HTMLElement | null = null;
let pendingAnchor: HTMLAnchorElement | null = null;
let activeAnchor: HTMLAnchorElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

export function setupLinkPreviews() {
  let scheduled = false;

  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      scanMessages();
    }, DEBOUNCE_MS);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('mouseover', onMouseOver);
  document.addEventListener('mouseout', onMouseOut);
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hidePopover();
  });
  document.addEventListener('scroll', () => hidePopover(), true);

  scanMessages();
}

function scanMessages() {
  document.querySelectorAll<HTMLAnchorElement>(`${MESSAGE_SELECTOR} a[href]`).forEach(anchor => {
    if (anchor.hasAttribute(PROCESSED_ATTR)) return;
    if (!isPreviewableUrl(anchor.href)) return;
    if (hasNativePreview(anchor)) return;

    anchor.setAttribute(PROCESSED_ATTR, 'pending');
    void getPreview(anchor.href).then(preview => {
      anchor.setAttribute(PROCESSED_ATTR, preview ? 'ready' : 'error');
      if (preview?.image) new Image().src = preview.image;
    });
  });
}

function hasNativePreview(link: Element): boolean {
  return !!link.closest(MESSAGE_SELECTOR)?.querySelector(NATIVE_PREVIEW_SELECTOR);
}

function getPreview(url: string): Promise<Preview | null> {
  let pending = cache.get(url);
  if (!pending) {
    pending = browser.runtime
      .sendMessage({ action: 'teams:fetchLinkPreview', url })
      .then((res: LinkPreviewResult | undefined) => {
        if (res?.ok) return res;
        console.warn('[prolo teams] link preview failed', url, res ? res.error : 'empty response');
        return null;
      })
      .catch(err => {
        console.warn('[prolo teams] link preview message failed', url, err);
        return null;
      });
    cache.set(url, pending);
  }
  return pending;
}

function findPreviewAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest<HTMLAnchorElement>(`a[${PROCESSED_ATTR}]`);
  return anchor?.closest(MESSAGE_SELECTOR) ? anchor : null;
}

function isInsidePopover(node: EventTarget | null): boolean {
  return !!popover && node instanceof Node && popover.contains(node);
}

function onMouseOver(event: MouseEvent) {
  const anchor = findPreviewAnchor(event.target);
  if (anchor) scheduleShow(anchor);
  else if (isInsidePopover(event.target)) clearTimeout(hideTimer);
}

function onMouseOut(event: MouseEvent) {
  const anchor = findPreviewAnchor(event.target);
  const from = anchor ?? (isInsidePopover(event.target) ? popover : null);
  if (!from) return;

  const nextTarget = event.relatedTarget;
  if (
    nextTarget instanceof Node &&
    (from.contains(nextTarget) || isInsidePopover(nextTarget) || activeAnchor?.contains(nextTarget))
  )
    return;
  scheduleHide();
}

function onFocusIn(event: FocusEvent) {
  const anchor = findPreviewAnchor(event.target);
  if (anchor) scheduleShow(anchor);
}

function onFocusOut(event: FocusEvent) {
  if (!findPreviewAnchor(event.target) && !isInsidePopover(event.target)) return;
  if (isInsidePopover(event.relatedTarget)) return;
  scheduleHide();
}

function scheduleShow(anchor: HTMLAnchorElement) {
  clearTimeout(hideTimer);
  if (anchor === activeAnchor || anchor === pendingAnchor) return;

  clearTimeout(showTimer);
  pendingAnchor = anchor;
  showTimer = setTimeout(() => void showPopover(anchor), SHOW_DELAY_MS);
}

function scheduleHide() {
  clearTimeout(showTimer);
  pendingAnchor = null;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hidePopover, HIDE_DELAY_MS);
}

async function showPopover(anchor: HTMLAnchorElement) {
  const preview = await getPreview(anchor.href);
  if (pendingAnchor !== anchor || !preview || !anchor.isConnected || hasNativePreview(anchor)) return;

  pendingAnchor = null;
  activeAnchor = anchor;

  if (!popover) {
    popover = document.createElement('div');
    popover.className = 'prolo-link-popover';
    popover.setAttribute('role', 'tooltip');
    document.body.append(popover);
  }
  copyThemeVars(anchor, popover);
  popover.replaceChildren(renderCard(preview));
  positionPopover(popover, anchor);
}

function copyThemeVars(from: Element, to: HTMLElement) {
  const style = getComputedStyle(from);
  for (const name of THEME_VARS) {
    const value = style.getPropertyValue(name).trim();
    if (value) to.style.setProperty(name, value);
    else to.style.removeProperty(name);
  }
}

function hidePopover() {
  clearTimeout(showTimer);
  clearTimeout(hideTimer);
  pendingAnchor = null;
  activeAnchor = null;
  if (popover) popover.hidden = true;
}

function positionPopover(popoverElement: HTMLElement, anchor: HTMLAnchorElement) {
  const rect = anchor.getClientRects()[0] ?? anchor.getBoundingClientRect();

  popoverElement.hidden = false;
  popoverElement.style.left = '0px';
  popoverElement.style.top = '0px';
  const { offsetWidth: width, offsetHeight: height } = popoverElement;

  const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN_PX;
  const left = Math.max(VIEWPORT_MARGIN_PX, Math.min(rect.left, maxLeft));
  const above = rect.top - ANCHOR_GAP_PX - height;
  const below = rect.bottom + ANCHOR_GAP_PX;
  const top = above >= VIEWPORT_MARGIN_PX ? above : Math.min(below, window.innerHeight - height - VIEWPORT_MARGIN_PX);

  popoverElement.style.left = `${Math.round(left)}px`;
  popoverElement.style.top = `${Math.round(top)}px`;
}

function renderCard(preview: Preview): HTMLElement {
  const card = document.createElement('a');
  card.className = 'prolo-link-preview';
  card.href = preview.url;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  if (preview.accent) {
    card.classList.add('prolo-link-preview--accent');
    card.style.setProperty('--prolo-link-preview-accent', preview.accent);
  }

  if (preview.image) {
    const image = document.createElement('img');
    image.className = 'prolo-link-preview__image';
    image.src = preview.image;
    image.alt = '';
    card.append(image);
  } else {
    card.classList.add('prolo-link-preview--text');
  }

  const body = document.createElement('div');
  body.className = 'prolo-link-preview__body';
  body.append(
    createText('prolo-link-preview__title', preview.title),
    createText('prolo-link-preview__description', preview.description),
  );

  if (preview.details?.length) {
    const details = document.createElement('div');
    details.className = 'prolo-link-preview__details';
    details.append(...preview.details.map(detail => createText('prolo-link-preview__chip', detail)));
    body.append(details);
  }

  body.append(createText('prolo-link-preview__site', preview.siteName));
  card.append(body);

  return card;
}

function createText(className: string, text: string | undefined): HTMLElement {
  const textElement = document.createElement('div');
  textElement.className = className;
  textElement.textContent = text ?? '';
  if (!text) textElement.hidden = true;
  return textElement;
}
