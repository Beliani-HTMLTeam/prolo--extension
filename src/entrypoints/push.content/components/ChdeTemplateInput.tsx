import { type KeyboardEvent, memo, useMemo, useState } from 'react';
import styles from '../push.module.scss';
import { isValidTemplateId, SLUG_ORDER } from '../helpers/slugMapper';
import { type ChdeTemplateInputProps, type CustomTemplate } from '../types/push';

const EMPTY_TEMPLATES: Record<string, CustomTemplate> = {};

export const ChdeTemplateInput = memo(
  ({
    chdeTemplateId,
    isGenerating,
    isLoadingTranslations,
    campaignName,
    onSetChdeTemplateId,
    onGenerateAll,
    customTemplates = EMPTY_TEMPLATES,
    onToggleCustomTemplate,
    onUpdateCustomTemplateValue,
    onSaveCustomTemplate,
    onAddCustomTemplate,
    onRemoveCustomTemplate,
  }: ChdeTemplateInputProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTemplateSlug, setNewTemplateSlug] = useState('');
    const [newTemplateValue, setNewTemplateValue] = useState('');

    const isBusy = isGenerating || isLoadingTranslations;
    const canGenerate = !!campaignName?.trim() && isValidTemplateId(chdeTemplateId) && !isBusy;

    const overrides = useMemo(() => Object.entries(customTemplates), [customTemplates]);
    const availableSlugs = useMemo(() => SLUG_ORDER.filter(slug => !customTemplates[slug]), [customTemplates]);

    const resetAddForm = () => {
      setShowAddForm(false);
      setNewTemplateSlug('');
      setNewTemplateValue('');
    };

    const handleAdd = () => {
      if (newTemplateSlug && newTemplateValue && onAddCustomTemplate) {
        onAddCustomTemplate(newTemplateSlug, newTemplateValue);
        resetAddForm();
      }
    };

    const handleChdeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && canGenerate) onGenerateAll();
    };

    const handleAddKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleAdd();
      else if (e.key === 'Escape') resetAddForm();
    };

    const handleOverrideKeyDown = (e: KeyboardEvent<HTMLInputElement>, slug: string, value: string) => {
      if (e.key === 'Enter' && value.trim()) onSaveCustomTemplate?.(slug);
      else if (e.key === 'Escape') onToggleCustomTemplate?.(slug);
    };

    return (
      <div className={styles.chdeInputContainer}>
        <div className={styles.chdeRow}>
          <span className={styles.chdeLabel}>CHDE Template ID:</span>
          <input
            type="text"
            value={chdeTemplateId}
            onChange={e => onSetChdeTemplateId(e.target.value)}
            onKeyDown={handleChdeKeyDown}
            placeholder="Enter CHDE template ID"
            className={styles.input}
          />
          <button type="button" onClick={onGenerateAll} disabled={!canGenerate} className={styles.btnGenerate}>
            {isGenerating ? 'Generating...' : isLoadingTranslations ? 'Loading...' : 'Generate All'}
          </button>
        </div>

        <div className={styles.templateOverridesSection}>
          <div className={styles.overridesHeader}>
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className={styles.toggleOverridesBtn}
              disabled={isBusy}
            >
              {isExpanded ? '▼' : '▶'} Slug Template Overrides
              {overrides.length > 0 && <span className={styles.overrideCount}>({overrides.length})</span>}
            </button>
            {isExpanded && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className={styles.addOverrideBtn}
                disabled={availableSlugs.length === 0 || isBusy}
              >
                + Add
              </button>
            )}
          </div>

          {isExpanded && (
            <div className={styles.templateOverridesList}>
              {showAddForm && (
                <div className={styles.addOverrideForm}>
                  <select
                    value={newTemplateSlug}
                    onChange={e => setNewTemplateSlug(e.target.value)}
                    className={styles.selectSmall}
                  >
                    <option value="">Select slug</option>
                    {availableSlugs.map(slug => (
                      <option key={slug} value={slug}>
                        {slug}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newTemplateValue}
                    onChange={e => setNewTemplateValue(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    placeholder="Template ID"
                    className={styles.inputSmall}
                  />
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!newTemplateSlug || !newTemplateValue}
                    className={styles.iconSave}
                    title="Add"
                  >
                    ✓
                  </button>
                  <button type="button" onClick={resetAddForm} className={styles.iconCancel} title="Cancel">
                    ✕
                  </button>
                </div>
              )}

              {overrides.length === 0 && !showAddForm && (
                <div className={styles.noOverrides}>No template overrides yet. Click "Add" to create one.</div>
              )}

              {overrides.map(([slug, template]) => (
                <div key={slug} className={styles.overrideItem}>
                  <div className={styles.overrideSlug}>{slug.toUpperCase()}</div>
                  {template.isEditing ? (
                    <div className={styles.overrideEdit}>
                      <input
                        type="text"
                        value={template.value}
                        onChange={e => onUpdateCustomTemplateValue?.(slug, e.target.value)}
                        onKeyDown={e => handleOverrideKeyDown(e, slug, template.value)}
                        className={styles.inputSmall}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => onSaveCustomTemplate?.(slug)}
                        className={styles.iconSave}
                        disabled={!template.value.trim()}
                        title="Save"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleCustomTemplate?.(slug)}
                        className={styles.iconCancel}
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className={styles.overrideDisplay}>
                      <span className={styles.overrideValue}>{template.value}</span>
                      <button
                        type="button"
                        onClick={() => onToggleCustomTemplate?.(slug)}
                        className={styles.iconEdit}
                        title="Edit template"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveCustomTemplate?.(slug)}
                        className={styles.iconRemove}
                        title="Remove override"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ChdeTemplateInput.displayName = 'ChdeTemplateInput';
