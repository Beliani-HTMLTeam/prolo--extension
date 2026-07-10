import { useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import styles from './FormatToolbar.module.scss';

const PRESET_TEXT_COLORS = ['#ff2f00', '#c41e3a', '#fd9000', '#4caf50', '#0052cc', '#5e40ba', '#332524', '#ffffff'];

const PRESET_BG_COLORS = ['#fff3cd', '#d4edda', '#cce5ff', '#f8d7da', '#e2d9f3', '#fd9000', '#ffccb7', '#332524'];

interface ColorPickerPopupProps {
  colors: string[];
  onSelect: (color: string) => void;
  onClose: () => void;
  allowCustom?: boolean;
}

const ColorPickerPopup = ({ colors, onSelect, onClose, allowCustom = true }: ColorPickerPopupProps) => {
  const customInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.colorPopup} onMouseDown={e => e.preventDefault()}>
      <div className={styles.colorGrid}>
        {colors.map(color => (
          <button
            key={color}
            className={styles.colorSwatch}
            style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #ccc' : 'none' }}
            title={color}
            onClick={() => {
              onSelect(color);
              onClose();
            }}
          />
        ))}
      </div>
      {allowCustom && (
        <div className={styles.customColorRow}>
          <input
            ref={customInputRef}
            type="color"
            className={styles.customColorInput}
            defaultValue="#000000"
            title="Custom color"
          />
          <button
            className={styles.customColorApply}
            onClick={() => {
              if (customInputRef.current) {
                onSelect(customInputRef.current.value);
                onClose();
              }
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

interface FormatToolbarProps {
  onInsert: (html: string) => void;
  getSelectedText: () => { text: string; hasSelection: boolean };
  wrapSelection: (openTag: string, closeTag: string) => void;
  disabled?: boolean;
}

export const FormatToolbar = ({ onInsert, getSelectedText, wrapSelection, disabled }: FormatToolbarProps) => {
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  const handleFormat = (openTag: string, closeTag: string) => {
    wrapSelection(openTag, closeTag);
  };

  const closeAll = () => {
    setShowTextColorPicker(false);
    setShowBgColorPicker(false);
  };

  return (
    <div className={styles.toolbar}>
      {/* Bold */}
      <button
        className={styles.formatBtn}
        title="Bold (Ctrl+B)"
        disabled={disabled}
        onMouseDown={e => {
          e.preventDefault();
          handleFormat('<b>', '</b>');
        }}
      >
        <Icon icon="mdi:format-bold" width="16" height="16" />
      </button>

      {/* Italic */}
      <button
        className={styles.formatBtn}
        title="Italic (Ctrl+I)"
        disabled={disabled}
        onMouseDown={e => {
          e.preventDefault();
          handleFormat('<i>', '</i>');
        }}
      >
        <Icon icon="mdi:format-italic" width="16" height="16" />
      </button>

      {/* Underline */}
      <button
        className={styles.formatBtn}
        title="Underline (Ctrl+U)"
        disabled={disabled}
        onMouseDown={e => {
          e.preventDefault();
          handleFormat('<u>', '</u>');
        }}
      >
        <Icon icon="mdi:format-underline" width="16" height="16" />
      </button>

      <div className={styles.separator} />

      {/* Text Color */}
      <div className={styles.colorBtnWrapper}>
        <button
          className={clsx(styles.formatBtn, showTextColorPicker && styles.formatBtnActive)}
          title="Text color"
          disabled={disabled}
          onMouseDown={e => {
            e.preventDefault();
            setShowTextColorPicker(v => !v);
            setShowBgColorPicker(false);
          }}
        >
          <Icon icon="mdi:format-color-text" width="16" height="16" />
        </button>
        {showTextColorPicker && (
          <ColorPickerPopup
            colors={PRESET_TEXT_COLORS}
            onSelect={color => {
              wrapSelection(`<span style="color:${color}">`, '</span>');
            }}
            onClose={closeAll}
          />
        )}
      </div>

      {/* Background Color */}
      <div className={styles.colorBtnWrapper}>
        <button
          className={clsx(styles.formatBtn, showBgColorPicker && styles.formatBtnActive)}
          title="Highlight / background color"
          disabled={disabled}
          onMouseDown={e => {
            e.preventDefault();
            setShowBgColorPicker(v => !v);
            setShowTextColorPicker(false);
          }}
        >
          <Icon icon="mdi:format-color-highlight" width="16" height="16" />
        </button>

        {showBgColorPicker && (
          <ColorPickerPopup
            colors={PRESET_BG_COLORS}
            onSelect={color => {
              wrapSelection(`<span style="background:${color};padding:1px 3px;border-radius:2px">`, '</span>');
            }}
            onClose={closeAll}
          />
        )}
      </div>
    </div>
  );
};
