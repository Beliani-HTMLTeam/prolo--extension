import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Icon } from '@iconify/react';
import styles from '../styles/TestRequestMenu.module.scss';
import { mentionToShopsMap, shopToMentionTagMap } from '../lib/shopMaps';
import { COLUMN_IDS } from '../api/checklistShared';
import { dispatchTestRequestChange } from '../lib/testRequest';
import type { ChecklistTableRow } from '../lib/types';

type TestRequestMenuProps = {
  rows: ChecklistTableRow[];
  disabled?: boolean;
};

type Group = { tag: string; label: string; shops: string[]; sent: boolean | null };

const tagLabel = (tag: string) => tag.replace(/\(\d+\)$/, '').replace('@', '').replace(' translation', '').trim();

const buildGroups = (rows: ChecklistTableRow[]): Group[] => {
  const byTag = new Map<string, Group>();

  rows.forEach(row => {
    const tag = shopToMentionTagMap[row.shop];
    if (!tag) return;

    const group = byTag.get(tag) ?? { tag, label: tagLabel(tag), shops: [], sent: null };
    group.shops.push(row.shop);
    if (row.columnCheckpointRefs?.[COLUMN_IDS.TEST_SENT]) {
      const sent = row.columnStatuses?.[COLUMN_IDS.TEST_SENT] === 1;
      group.sent = group.sent === null ? sent : group.sent && sent;
    }
    byTag.set(tag, group);
  });

  return Array.from(byTag.values());
};

export const TestRequestMenu = ({ rows, disabled }: TestRequestMenuProps) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [anchorStyle, setAnchorStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const groups = useMemo(() => buildGroups(rows), [rows]);

  useEffect(() => {
    dispatchTestRequestChange(selected);
  }, [selected]);

  useEffect(() => {
    const clear = () => setSelected([]);
    document.addEventListener('richchat:sent', clear);
    return () => document.removeEventListener('richchat:sent', clear);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-test-request-menu]')) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (groups.length === 0) return null;

  const toggle = (tag: string) =>
    setSelected(prev => (prev.includes(tag) ? prev.filter(selectedTag => selectedTag !== tag) : [...prev, tag]));

  const ordered = (tags: Set<string>) => groups.map(group => group.tag).filter(tag => tags.has(tag));
  const selectNotSent = () => setSelected(ordered(new Set(groups.filter(group => group.sent !== true).map(group => group.tag))));
  const selectAll = () => setSelected(groups.map(group => group.tag));

  return (
    <div className={styles.wrapper} data-test-request-menu>
      <button
        type="button"
        ref={triggerRef}
        className={clsx(styles.trigger, selected.length > 0 && styles.triggerActive)}
        disabled={disabled}
        title="Mention groups to test the newsletter / LP"
        onClick={() => {
          const rect = triggerRef.current?.getBoundingClientRect();
          if (rect) setAnchorStyle({ position: 'fixed', bottom: window.innerHeight - rect.top + 6, left: rect.left });
          setOpen(prev => !prev);
        }}
      >
        Test request
        {selected.length > 0 && <span className={styles.badge}>{selected.length}</span>}
        <Icon icon="mdi:chevron-up" width="14" height="14" />
      </button>
      {open &&
        createPortal(
        <div className={styles.popup} style={anchorStyle} data-test-request-menu data-picker-portal>
          <div className={styles.actions}>
            <button type="button" onClick={selectAll}>
              All
            </button>
            <button type="button" onClick={selectNotSent}>
              Not sent
            </button>
            <button type="button" onClick={() => setSelected([])}>
              Clear
            </button>
          </div>
          <div className={styles.list}>
            {groups.map(group => {
              const isOn = selected.includes(group.tag);
              return (
                <button
                  key={group.tag}
                  type="button"
                  className={clsx(styles.item, isOn && styles.itemOn)}
                  title={(mentionToShopsMap[group.tag] ?? group.shops).join(', ')}
                  onClick={() => toggle(group.tag)}
                >
                  {group.sent === true && <Icon icon="mdi:check-bold" width="10" height="10" />}
                  {group.shops.join(' ')}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
