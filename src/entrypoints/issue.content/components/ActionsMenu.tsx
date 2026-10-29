import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import styles from '../styles/actionsMenu.module.scss';
import chatStyles from '../styles/chat.module.scss';

export type ActionsMenuItem = {
  key: string;
  label: string;
  icon?: string;
  onClick?: () => void;
  children?: ActionsMenuItem[];
  disabled?: boolean;
  primary?: boolean;
  done?: boolean;
  keepOpen?: boolean;
};

type ActionsMenuProps = {
  items: ActionsMenuItem[];
};

const ActionsMenu = ({ items }: ActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [anchorStyle, setAnchorStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-actions-menu]')) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setOpenSubmenu(null);
  }, [open]);

  if (items.length === 0) return null;

  const toggle = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setAnchorStyle({ position: 'fixed', top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(prev => !prev);
  };

  const run = (item: ActionsMenuItem) => {
    if (item.disabled || !item.onClick) return;
    item.onClick();
    if (!item.keepOpen) setOpen(false);
  };

  const renderItem = (item: ActionsMenuItem, depth = 0) => {
    const hasChildren = !!item.children?.length;
    const isSubmenuOpen = hasChildren && openSubmenu === item.key;

    return (
      <div
        key={item.key}
        className={styles.itemWrapper}
        onMouseEnter={depth === 0 ? () => setOpenSubmenu(hasChildren ? item.key : null) : undefined}
      >
        <button
          type="button"
          className={clsx(styles.item, item.primary && styles.itemPrimary, isSubmenuOpen && styles.itemActive)}
          disabled={item.disabled}
          onClick={() => (hasChildren ? setOpenSubmenu(isSubmenuOpen ? null : item.key) : run(item))}
        >
          {hasChildren && <Icon icon="mdi:chevron-left" width="16" height="16" className={styles.chevron} />}
          {item.icon && <Icon icon={item.done ? 'mdi:check' : item.icon} width="16" height="16" className={styles.icon} />}
          <span className={styles.label}>{item.done ? 'Copied!' : item.label}</span>
        </button>
        {isSubmenuOpen && <div className={styles.submenu}>{item.children!.map(child => renderItem(child, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div data-actions-menu>
      <button
        ref={triggerRef}
        type="button"
        className={clsx(chatStyles.chatHeaderButton, open && styles.triggerActive)}
        title="Tools"
        onClick={toggle}
      >
        <Icon icon="mdi:menu" width="18" height="18" />
      </button>
      {open &&
        createPortal(
          <div className={styles.menu} style={anchorStyle} data-actions-menu data-picker-portal>
            {items.map(item => renderItem(item))}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ActionsMenu;
