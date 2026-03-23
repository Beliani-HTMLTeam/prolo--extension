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
  clear: () => void;
  focus: () => void;
  replaceMentionQuery: (query: string, replacement: string) => void;
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
      insertText(text: string, useTwemojiFlag = false) {
        const div = divRef.current;
        if (!div) return;
        div.focus();

        const sel = window.getSelection();
        const textNode = document.createTextNode(text);

        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.deleteContents();
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        } else {
          div.appendChild(textNode);
        }

        if (useTwemojiFlag) {
          applyTwemoji(div);
          const newRange = document.createRange();
          newRange.selectNodeContents(div);
          newRange.collapse(false);
          const newSel = window.getSelection();
          newSel?.removeAllRanges();
          newSel?.addRange(newRange);
        }

        onChange(extractPlainText(div));
      },

      getText() {
        return divRef.current ? extractPlainText(divRef.current) : '';
      },

      clear() {
        if (divRef.current) {
          divRef.current.innerHTML = '';
          onChange('');
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
