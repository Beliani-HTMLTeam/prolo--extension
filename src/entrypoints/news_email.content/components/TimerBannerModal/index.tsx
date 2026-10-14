import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import Modal from '@/components/modal/Modal';
import styles from './TimerBannerModal.module.scss';
import { type FreebieItem, type TimerConfig, type TimerHeader } from '../../types';
import { SHOP_SLUGS } from '../../constants/shops';
import { fetchFreebieShops } from '../../utils/timer/products';
import { fetchRecentTabs, fetchTimerHeader } from '../../utils/timer/header';
import { DEFAULT_THEME_ID, TIMER_THEMES } from '../../utils/timer/themes';
import TimerPreview, { type PreviewDevice } from './TimerPreview';

export type TimerBannerModalProps = {
  isOpen: boolean;
  /** Pre-filled config when editing an existing timer */
  initialConfig?: TimerConfig;
  templates: Record<string, any> | null;
  onClose: () => void;
  onConfirm: (config: TimerConfig) => void;
  onRemove?: () => void;
};

type FreebiesKind = 'none' | 'image' | 'list';

type ItemStatus = { state: 'loading' } | { state: 'ok'; shops: number } | { state: 'error'; message: string };

const DEFAULT_ITEM_COUNT = 4;
const DEFAULT_TITLE_ROW = 15;
const DEFAULT_SUBTITLE_ROW = 16;

type HeaderStatus =
  { state: 'idle' } | { state: 'loading' } | { state: 'ok'; shops: number } | { state: 'error'; message: string };

const headerKey = (sheet: string, titleRow: number, subtitleRow: number) =>
  `${sheet.trim()}|${titleRow}|${subtitleRow}`;

const emptyItem = (): FreebieItem => ({ masterId: '', src: '' });
const SAMPLE_ITEMS: FreebieItem[] = [
  { masterId: '229265', src: '20261001_free01.png', titlePhrase: 'Candle Holders' },
  { masterId: '251828', src: '20261001_free02.png', titlePhrase: 'Wreath' },
  { masterId: '336136', src: '20261001_free03.png', titlePhrase: 'Garland' },
  { masterId: '571807', src: '20261001_free04.png', titlePhrase: 'Scatter Cushion' },
];
const defaultItems = (): FreebieItem[] =>
  Array.from({ length: DEFAULT_ITEM_COUNT }, (_, index) => ({ ...(SAMPLE_ITEMS[index] ?? emptyItem()) }));

const nextSunday = () => {
  const date = new Date();
  date.setDate(date.getDate() + (7 - date.getDay()));

  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const TimerBannerModal = ({
  isOpen,
  initialConfig,
  templates,
  onClose,
  onConfirm,
  onRemove,
}: TimerBannerModalProps) => {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [deadline, setDeadline] = useState('');
  const [kind, setKind] = useState<FreebiesKind>('list');
  const [imageSrc, setImageSrc] = useState('');
  const [insertSlug, setInsertSlug] = useState(false);
  const [columns, setColumns] = useState<1 | 2>(1);
  const [items, setItems] = useState<FreebieItem[]>(defaultItems);
  const [statuses, setStatuses] = useState<Record<string, ItemStatus>>({});
  const [previewSlug, setPreviewSlug] = useState('uk');
  const [headerSheet, setHeaderSheet] = useState('');
  const [titleRow, setTitleRow] = useState(DEFAULT_TITLE_ROW);
  const [subtitleRow, setSubtitleRow] = useState(DEFAULT_SUBTITLE_ROW);
  const [headerTexts, setHeaderTexts] = useState<TimerHeader['texts']>();
  const [headerLoadedKey, setHeaderLoadedKey] = useState('');
  const [headerStatus, setHeaderStatus] = useState<HeaderStatus>({ state: 'idle' });
  const [recentTabs, setRecentTabs] = useState<string[]>([]);
  const [customSheet, setCustomSheet] = useState(false);
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const inflight = useRef(new Set<string>());
  const statusesRef = useRef(statuses);
  statusesRef.current = statuses;

  const phraseKeys = useMemo(() => Object.keys(templates ?? {}).filter(key => key !== 'slug'), [templates]);

  useEffect(() => {
    if (!isOpen) return;

    setThemeId(initialConfig?.themeId ?? DEFAULT_THEME_ID);
    setDeadline(initialConfig?.deadline ?? nextSunday());
    setKind(initialConfig?.freebies.kind ?? 'list');
    setStatuses({});

    const header = initialConfig?.header;
    setHeaderSheet(header?.sheet ?? '');
    setCustomSheet(false);
    setTitleRow(header?.titleRow ?? DEFAULT_TITLE_ROW);
    setSubtitleRow(header?.subtitleRow ?? DEFAULT_SUBTITLE_ROW);
    setHeaderTexts(header?.texts);
    setHeaderLoadedKey(header?.texts ? headerKey(header.sheet, header.titleRow, header.subtitleRow) : '');
    setHeaderStatus(header?.texts ? { state: 'ok', shops: Object.keys(header.texts).length } : { state: 'idle' });

    const freebies = initialConfig?.freebies;
    setImageSrc(freebies?.kind === 'image' ? freebies.src : '');
    setInsertSlug(freebies?.kind === 'image' ? (freebies.insertSlug ?? false) : false);
    setColumns(freebies?.kind === 'list' ? freebies.columns : 1);
    setItems(freebies?.kind === 'list' && freebies.items.length > 0 ? freebies.items : defaultItems());
  }, [isOpen, initialConfig]);

  // product data (names, prices of all shops) is fetched from Prolo by master id; one request per id at a time
  const loadProducts = useCallback((list: FreebieItem[]) => {
    for (const item of list) {
      const masterId = item.masterId.trim();
      if (inflight.current.has(masterId)) continue;
      inflight.current.add(masterId);
      setStatuses(prev => ({ ...prev, [masterId]: { state: 'loading' } }));

      fetchFreebieShops(masterId)
        .then(shops => {
          const count = Object.keys(shops).length;
          setItems(prev => prev.map(entry => (entry.masterId.trim() === masterId ? { ...entry, shops } : entry)));
          setStatuses(prev => ({
            ...prev,
            [masterId]: count > 0 ? { state: 'ok', shops: count } : { state: 'error', message: 'No shop prices found' },
          }));
        })
        .catch(error => {
          setStatuses(prev => ({ ...prev, [masterId]: { state: 'error', message: String(error?.message ?? error) } }));
        })
        .finally(() => inflight.current.delete(masterId));
    }
  }, []);

  const needsLoading = (item: FreebieItem) => /^\d+$/.test(item.masterId.trim()) && !item.shops;

  // auto-load shortly after the user stops typing; failed ids wait for the "Load products" button
  useEffect(() => {
    if (!isOpen || kind !== 'list') return;

    const pending = items.filter(
      item => needsLoading(item) && statusesRef.current[item.masterId.trim()]?.state !== 'error',
    );
    if (pending.length === 0) return;

    const timeout = window.setTimeout(() => loadProducts(pending), 400);
    return () => window.clearTimeout(timeout);
  }, [isOpen, kind, items, loadProducts]);

  const loadNow = () => {
    const pending = items.filter(needsLoading);
    setStatuses(prev => {
      const next = { ...prev };
      for (const item of pending) delete next[item.masterId.trim()];
      return next;
    });
    loadProducts(pending);
  };

  // the tab list does not change while the modal is used, ask for it once
  useEffect(() => {
    if (!isOpen || recentTabs.length > 0) return;
    fetchRecentTabs()
      .then(setRecentTabs)
      .catch(() => setRecentTabs([]));
  }, [isOpen, recentTabs.length]);

  const currentHeaderKey = headerKey(headerSheet, titleRow, subtitleRow);
  const headerPending = headerSheet.trim() !== '' && headerLoadedKey !== currentHeaderKey;

  const loadHeader = useCallback(async (sheet: string, title: number, subtitle: number) => {
    const key = headerKey(sheet, title, subtitle);
    setHeaderStatus({ state: 'loading' });
    try {
      const texts = await fetchTimerHeader(sheet, title, subtitle);
      const shops = Object.keys(texts).length;
      setHeaderTexts(texts);
      setHeaderLoadedKey(key);
      setHeaderStatus(shops > 0 ? { state: 'ok', shops } : { state: 'error', message: 'No text in these rows' });
    } catch (error) {
      setHeaderStatus({ state: 'error', message: String((error as Error)?.message ?? error) });
    }
  }, []);

  // load the header texts shortly after the sheet or the rows stop changing
  useEffect(() => {
    if (!isOpen || !headerPending || !Number.isInteger(titleRow) || !Number.isInteger(subtitleRow)) return;
    if (headerStatus.state === 'error') return;

    const timeout = window.setTimeout(() => loadHeader(headerSheet, titleRow, subtitleRow), 600);
    return () => window.clearTimeout(timeout);
  }, [isOpen, headerPending, headerSheet, titleRow, subtitleRow, headerStatus.state, loadHeader]);

  const updateItem = (index: number, patch: Partial<FreebieItem>) => {
    setItems(prev =>
      prev.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, ...patch };
        // other master id means other product data
        if (patch.masterId !== undefined && patch.masterId.trim() !== item.masterId.trim()) delete next.shops;
        return next;
      }),
    );
  };

  const cleanedItems = items
    .map(item => ({
      ...item,
      masterId: item.masterId.trim(),
      src: item.src.trim(),
      titlePhrase: item.titlePhrase?.trim() || undefined,
    }))
    .filter(item => item.masterId || item.src);

  const config: TimerConfig = useMemo(
    () => ({
      themeId,
      deadline,
      header:
        headerSheet.trim() !== ''
          ? {
              sheet: headerSheet.trim(),
              titleRow,
              subtitleRow,
              texts: headerLoadedKey === currentHeaderKey ? headerTexts : undefined,
            }
          : undefined,
      freebies:
        kind === 'image'
          ? { kind: 'image', src: imageSrc.trim(), insertSlug }
          : kind === 'list'
            ? { kind: 'list', columns, items: cleanedItems }
            : { kind: 'none' },
    }),
    // cleanedItems is derived from items
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      themeId,
      deadline,
      headerSheet,
      titleRow,
      subtitleRow,
      headerTexts,
      headerLoadedKey,
      kind,
      imageSrc,
      insertSlug,
      columns,
      items,
    ],
  );

  const itemsReady = cleanedItems.length > 0 && cleanedItems.every(item => item.masterId && item.src && item.shops);
  const isConfirmDisabled =
    !deadline ||
    (headerSheet.trim() !== '' && !config.header?.texts) ||
    (kind === 'list' && !itemsReady) ||
    (kind === 'image' && !imageSrc.trim());

  const listItems = cleanedItems.filter(item => item.masterId);
  const loadedCount = listItems.filter(item => item.shops).length;
  const loadingCount = listItems.filter(
    item => needsLoading(item) && statuses[item.masterId]?.state !== 'error',
  ).length;
  const failedCount = listItems.filter(item => needsLoading(item) && statuses[item.masterId]?.state === 'error').length;
  const hasUnloaded = listItems.some(needsLoading);

  const title = initialConfig ? 'Edit timer' : 'Add timer';

  const headerActions = (
    <div className={styles.actions}>
      {onRemove && (
        <button className={styles.removeBtn} onClick={onRemove}>
          Remove timer
        </button>
      )}
      <button className={styles.cancelBtn} onClick={onClose}>
        Cancel
      </button>
      <button className={styles.confirmBtn} onClick={() => onConfirm(config)} disabled={isConfirmDisabled}>
        {initialConfig ? 'Update timer' : 'Add timer'}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} width="1400px" height="92vh" headerActions={headerActions}>
      <div className={styles.body}>
        <div className={styles.layout}>
          <div className={styles.settings}>
            <div className={styles.formGroup}>
              <label htmlFor="timer-deadline">Deadline</label>
              <input id="timer-deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              <span className={styles.hint}>Timer counts down to 23:59 in each shop&apos;s time zone</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="timer-header-sheet">Header above the timer</label>
              <select
                id="timer-header-sheet"
                value={
                  customSheet || (headerSheet !== '' && !recentTabs.includes(headerSheet)) ? '__custom' : headerSheet
                }
                onChange={e => {
                  const value = e.target.value;
                  setCustomSheet(value === '__custom');
                  setHeaderSheet(value === '__custom' ? '' : value);
                  setHeaderStatus({ state: 'idle' });
                }}
              >
                <option value="">No header</option>
                {recentTabs.map(tab => (
                  <option key={tab} value={tab}>
                    {tab}
                  </option>
                ))}
                <option value="__custom">Other (sheet link or 2026::Tab name)…</option>
              </select>
              {(customSheet || (headerSheet !== '' && !recentTabs.includes(headerSheet))) && (
                <input
                  type="text"
                  placeholder="Sheet link with gid or 2026::Tab name"
                  value={headerSheet}
                  onChange={e => {
                    setHeaderSheet(e.target.value);
                    setHeaderStatus({ state: 'idle' });
                  }}
                />
              )}
              <div className={styles.headerRows}>
                <label htmlFor="timer-title-row">Title row (T-1)</label>
                <input
                  id="timer-title-row"
                  type="number"
                  min={2}
                  value={titleRow}
                  onChange={e => {
                    setTitleRow(Number(e.target.value));
                    setHeaderStatus({ state: 'idle' });
                  }}
                />
                <label htmlFor="timer-subtitle-row">Subtitle row (T-2)</label>
                <input
                  id="timer-subtitle-row"
                  type="number"
                  min={2}
                  value={subtitleRow}
                  onChange={e => {
                    setSubtitleRow(Number(e.target.value));
                    setHeaderStatus({ state: 'idle' });
                  }}
                />
              </div>
              {headerSheet.trim() !== '' && (
                <span
                  className={clsx(
                    styles.hint,
                    headerStatus.state === 'ok' && styles.itemStatusOk,
                    headerStatus.state === 'error' && styles.itemStatusError,
                  )}
                >
                  {headerStatus.state === 'ok'
                    ? `✓ ${headerStatus.shops} shops`
                    : headerStatus.state === 'error'
                      ? headerStatus.message
                      : 'Loading header texts…'}
                </span>
              )}
              {headerStatus.state === 'error' && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => loadHeader(headerSheet, titleRow, subtitleRow)}
                >
                  Load header
                </button>
              )}
              <span className={styles.hint}>
                Two lines above the timer, like the timer query of the constructor: row N of the sheet is row N - 2 of
                the shop column, row 2 is the first one.
              </span>
            </div>

            <div className={styles.formGroup}>
              <label>Freebies</label>
              <div className={styles.segmented}>
                {(
                  [
                    ['none', 'None'],
                    ['image', 'Image'],
                    ['list', 'Product list'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={clsx(styles.segment, kind === value && styles.segmentActive)}
                    onClick={() => setKind(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {kind === 'image' && (
              <div className={styles.formGroup}>
                <label htmlFor="freebie-src">Freebie src date</label>
                <input
                  id="freebie-src"
                  type="text"
                  placeholder="20260626"
                  value={imageSrc}
                  onChange={e => setImageSrc(e.target.value)}
                />
                <div className={styles.checkboxGroup}>
                  <label>
                    <input type="checkbox" checked={insertSlug} onChange={e => setInsertSlug(e.target.checked)} />
                    Insert slug before date
                  </label>
                </div>
                <span className={styles.hint}>
                  pictureserver.net/static/2026/{insertSlug ? 'chde' : ''}20260626free.png
                </span>
              </div>
            )}

            {kind === 'list' && (
              <div className={styles.formGroup}>
                <label>Layout</label>
                <div className={styles.segmented}>
                  {([1, 2] as const).map(value => (
                    <button
                      key={value}
                      type="button"
                      className={clsx(styles.segment, columns === value && styles.segmentActive)}
                      onClick={() => setColumns(value)}
                    >
                      {value} column{value === 2 ? 's' : ''}
                    </button>
                  ))}
                </div>

                <label>Products</label>
                <div className={styles.items}>
                  {items.map((item, index) => {
                    const masterId = item.masterId.trim();
                    const status = statuses[masterId];
                    return (
                      <div key={index} className={styles.item}>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Master ID"
                          value={item.masterId}
                          onChange={e => updateItem(index, { masterId: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="20261001_free01.png"
                          value={item.src}
                          onChange={e => updateItem(index, { src: e.target.value })}
                        />
                        <button
                          type="button"
                          className={styles.itemRemove}
                          aria-label="Remove product"
                          onClick={() =>
                            setItems(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [emptyItem()]))
                          }
                        >
                          ×
                        </button>
                        <input
                          className={styles.itemPhrase}
                          type="text"
                          list="timer-phrases"
                          placeholder="Phrase before name (optional)"
                          value={item.titlePhrase ?? ''}
                          onChange={e => updateItem(index, { titlePhrase: e.target.value })}
                        />
                        {masterId && (
                          <span
                            className={clsx(
                              styles.itemStatus,
                              status?.state === 'ok' && styles.itemStatusOk,
                              status?.state === 'error' && styles.itemStatusError,
                            )}
                          >
                            {!/^\d+$/.test(masterId)
                              ? 'Master ID must be a number'
                              : !status || status.state === 'loading'
                                ? 'Loading product…'
                                : status.state === 'ok'
                                  ? `✓ ${item.shops?.uk?.name ?? ''} - ${status.shops} shops`
                                  : status.message}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <datalist id="timer-phrases">
                  {phraseKeys.map(key => (
                    <option key={key} value={key} />
                  ))}
                </datalist>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setItems(prev => [...prev, emptyItem()])}
                >
                  + Add product
                </button>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={loadNow}
                  disabled={!hasUnloaded || loadingCount > 0}
                >
                  {loadingCount > 0 ? `Loading products… (${loadingCount})` : 'Load products'}
                </button>
                <span className={styles.hint}>
                  Name and price come from Prolo per shop. Title phrase (key from the Templates sheet) is put before the
                  product name; without it the shop product title is used.
                </span>
              </div>
            )}
          </div>

          <div className={styles.themeColumn}>
            <div className={styles.themePicker}>
              <label>Theme</label>
              <div className={styles.themeGrid}>
                {TIMER_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    className={clsx(styles.themeCard, theme.id === themeId && styles.themeCardActive)}
                    onClick={() => setThemeId(theme.id)}
                    title={theme.label}
                  >
                    <span className={styles.themeTimer} style={{ background: theme.background }}>
                      {['02', '14', '37', '09'].map(value => (
                        <span key={value} style={{ background: theme.unitBackground, color: theme.color }}>
                          {value}
                        </span>
                      ))}
                    </span>
                    <span
                      className={styles.themeFreebies}
                      style={{ background: theme.freebiesBackground, color: theme.freebiesTextColor }}
                    >
                      <span style={{ borderBottom: `1px solid ${theme.freebiesLineColor}` }}>
                        Product <b style={{ color: theme.freebiesFreeColor }}>FREE</b>
                      </span>
                    </span>
                    <span className={styles.themeLabel}>{theme.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.previewColumn}>
            <div className={styles.previewHeader}>
              <label htmlFor="timer-preview-shop">Preview</label>
              <div className={styles.segmented}>
                {(['desktop', 'mobile'] as const).map(value => (
                  <button
                    key={value}
                    type="button"
                    className={clsx(styles.segment, device === value && styles.segmentActive)}
                    onClick={() => setDevice(value)}
                  >
                    {value === 'desktop' ? 'Desktop' : 'Mobile'}
                  </button>
                ))}
              </div>
              <select id="timer-preview-shop" value={previewSlug} onChange={e => setPreviewSlug(e.target.value)}>
                {SHOP_SLUGS.map(slug => (
                  <option key={slug} value={slug}>
                    {slug.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            {kind === 'list' && listItems.length > 0 && (loadingCount > 0 || failedCount > 0) && (
              <div
                className={clsx(
                  styles.previewNotice,
                  failedCount > 0 && loadingCount === 0 && styles.previewNoticeError,
                )}
              >
                {loadingCount > 0
                  ? `Loading products from Prolo… ${loadedCount}/${listItems.length} ready. Preview updates when all are loaded.`
                  : `${failedCount} product(s) failed to load - check the master ids and use "Load products" to retry.`}
              </div>
            )}
            <TimerPreview config={config} slug={previewSlug} templates={templates} device={device} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TimerBannerModal;
