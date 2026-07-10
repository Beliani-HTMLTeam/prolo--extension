// god bless chatgpt

import { forwardRef, useImperativeHandle, useRef } from 'react';
import twemoji from 'twemoji';

const TWEMOJI_BASE_URL = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15/assets/';

export const extractPlainText = (el: HTMLElement): string => {
  let text = '';
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? '';
    } else if ((node as Element).tagName === 'IMG') {
      text += (node as HTMLImageElement).alt;
    } else if ((node as Element).tagName === 'BR') {
      text += '\n';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      text += extractPlainText(node as HTMLElement);
    }
  });
  return text;
};

export const applyTwemoji = (container: HTMLElement) => {
  twemoji.parse(container, {
    base: TWEMOJI_BASE_URL,
    folder: 'svg',
    ext: '.svg',
    attributes: () => ({ style: 'height:1.2em;width:1.2em;vertical-align:-0.2em;display:inline-block;' }),
  });
};

export interface RichTextareaHandle {
  insertText: (text: string, useTwemoji?: boolean) => void;
  getText: () => string;
  getHtml: () => string;
  clear: () => void;
  focus: () => void;
  replaceMentionQuery: (query: string, replacement: string) => void;
  wrapSelection: (openTag: string, closeTag: string) => void;
  getSelectedText: () => { text: string; hasSelection: boolean };
  saveSelection: () => void;
  restoreSelection: () => void;
}

interface RichTextareaProps {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange: (text: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onMentionSearch?: (query: string | null) => void;
}

export const RichTextarea = forwardRef<RichTextareaHandle, RichTextareaProps>(
  ({ placeholder, disabled, className, onChange, onKeyDown, onMentionSearch }, ref) => {
    const divRef = useRef<HTMLDivElement>(null);
    const lastMentionQueryRef = useRef<string | null>(null);
    const savedRangeRef = useRef<Range | null>(null);

    const getTextBeforeCursor = (): string => {
      const div = divRef.current;
      const sel = window.getSelection();
      if (!div || !sel || sel.rangeCount === 0) return '';
      try {
        const range = sel.getRangeAt(0).cloneRange();
        range.setStart(div, 0);
        return range.toString();
      } catch {
        return '';
      }
    };

    useImperativeHandle(ref, () => ({
      saveSelection() {
        const sel = window.getSelection();
        const div = divRef.current;

        if (!sel || sel.rangeCount === 0 || !div) return;

        const range = sel.getRangeAt(0);

        if (div.contains(range.commonAncestorContainer)) {
          savedRangeRef.current = range.cloneRange();
        }
      },

      restoreSelection() {
        const div = divRef.current;

        if (!div) return;

        div.focus();

        const saved = savedRangeRef.current;

        if (saved) {
          const sel = window.getSelection();

          if (sel) {
            sel.removeAllRanges();
            sel.addRange(saved);
          }

          savedRangeRef.current = null;
        }
      },

      insertText(text: string, useTwemojiFlag = false) {
        const div = divRef.current;
        if (!div) return;
        div.focus();

        if (savedRangeRef.current) {
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(savedRangeRef.current);
          }
          savedRangeRef.current = null;
        }

        const sel = window.getSelection();
        const textNode = document.createTextNode(text);

        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(textNode);

          const afterRange = document.createRange();

          afterRange.setStartAfter(textNode);
          afterRange.collapse(true);

          sel.removeAllRanges();
          sel.addRange(afterRange);
        } else {
          div.appendChild(textNode);
        }

        if (useTwemojiFlag) {
          const countBefore = div.querySelectorAll('img.emoji').length;

          applyTwemoji(div);

          const emojiImgs = div.querySelectorAll('img.emoji');
          const newEmoji = emojiImgs[countBefore];
          const cursorRange = document.createRange();

          if (newEmoji) {
            cursorRange.setStartAfter(newEmoji);
          } else {
            cursorRange.selectNodeContents(div);
            cursorRange.collapse(false);
          }

          cursorRange.collapse(true);

          const newSel = window.getSelection();
          newSel?.removeAllRanges();
          newSel?.addRange(cursorRange);
        }

        onChange(extractPlainText(div));
      },

      getText() {
        return divRef.current ? extractPlainText(divRef.current) : '';
      },

      getHtml() {
        return divRef.current ? divRef.current.innerHTML : '';
      },

      clear() {
        if (divRef.current) {
          divRef.current.innerHTML = '';
          onChange('');
          savedRangeRef.current = null;
          // clear any active mention query
          if (lastMentionQueryRef.current !== null) {
            lastMentionQueryRef.current = null;
            onMentionSearch?.(null);
          }
        }
      },

      focus() {
        divRef.current?.focus();
      },

      replaceMentionQuery(query: string, replacement: string) {
        const div = divRef.current;
        if (!div) return;
        const searchStr = '@' + query;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const cRange = sel.getRangeAt(0).cloneRange();
        const container = cRange.startContainer;
        const offset = cRange.startOffset;

        // @mention should be in the same text node as the cursor
        if (container.nodeType === Node.TEXT_NODE) {
          const text = (container.textContent ?? '').substring(0, offset);
          const atIdx = text.lastIndexOf(searchStr);
          if (atIdx !== -1) {
            const replaceRange = document.createRange();
            replaceRange.setStart(container, atIdx);
            replaceRange.setEnd(container, atIdx + searchStr.length);
            sel.removeAllRanges();
            sel.addRange(replaceRange);
            replaceRange.deleteContents();
            const repNode = document.createTextNode(replacement);
            replaceRange.insertNode(repNode);
            replaceRange.setStartAfter(repNode);
            replaceRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(replaceRange);
            lastMentionQueryRef.current = null;
            onMentionSearch?.(null);
            onChange(extractPlainText(div));
          }
        }
      },

      getSelectedText() {
        const sel = window.getSelection();

        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return { text: '', hasSelection: false };

        const range = sel.getRangeAt(0);
        const div = divRef.current;

        if (!div || !div.contains(range.commonAncestorContainer)) return { text: '', hasSelection: false };

        return { text: sel.toString(), hasSelection: !sel.isCollapsed };
      },

      wrapSelection(openTag: string, closeTag: string) {
        const div = divRef.current;

        if (!div) return;

        div.focus();

        const sel = window.getSelection();

        if (!sel || sel.rangeCount === 0) {
          const textNode = document.createTextNode(openTag + closeTag);
          const range = document.createRange();

          range.selectNodeContents(div);
          range.collapse(false);
          range.insertNode(textNode);
          
          const newRange = document.createRange();

          newRange.setStart(textNode, openTag.length);
          newRange.collapse(true);

          sel?.removeAllRanges();
          sel?.addRange(newRange);

          onChange(extractPlainText(div));

          return;
        }

        const range = sel.getRangeAt(0);
        if (!div.contains(range.commonAncestorContainer)) return;

        if (sel.isCollapsed) {
          const textNode = document.createTextNode(openTag + closeTag);
          range.insertNode(textNode);

          const newRange = document.createRange();

          newRange.setStart(textNode, openTag.length);
          newRange.collapse(true);

          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          const selectedText = sel.toString();

          range.deleteContents();

          const wrapped = document.createTextNode(openTag + selectedText + closeTag);
          
          range.insertNode(wrapped);

          const newRange = document.createRange();

          newRange.setStartAfter(wrapped);
          newRange.collapse(true);
          
          sel.removeAllRanges();
          sel.addRange(newRange);
        }

        onChange(extractPlainText(div));
      },
    }));

    const handleInput = () => {
      if (!divRef.current) return;
      onChange(extractPlainText(divRef.current));

      // detect @mention pattern before cursor
      if (onMentionSearch) {
        const textBefore = getTextBeforeCursor();
        const match = textBefore.match(/@(\w*)$/);
        const newQuery = match ? match[1] : null;
        if (newQuery !== lastMentionQueryRef.current) {
          lastMentionQueryRef.current = newQuery;
          onMentionSearch(newQuery);
        }
      }
    };

    return (
      <div
        ref={divRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={onKeyDown}
        data-placeholder={placeholder}
        className={className}
      />
    );
  },
);

RichTextarea.displayName = 'RichTextarea';
