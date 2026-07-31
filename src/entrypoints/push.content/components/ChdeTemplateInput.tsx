import styles from '../push.module.scss';
import { isValidTemplateId, SLUG_ORDER } from '../helpers/slugMapper';

type ChdeTemplateInputProps = {
  chdeTemplateId: string;
  isGenerating?: boolean;
  isLoadingTranslations?: boolean;
  campaignName?: string;
  onSetChdeTemplateId: (id: string) => void;
  onGenerateAll: () => void;
  customTemplates?: Record<string, { value: string; isEditing: boolean }>;
  onToggleCustomTemplate?: (slug: string) => void;
  onUpdateCustomTemplateValue?: (slug: string, value: string) => void;
  onSaveCustomTemplate?: (slug: string) => void;
  onAddCustomTemplate?: (slug: string, value: string) => void;
  onRemoveCustomTemplate?: (slug: string) => void;
};

export const ChdeTemplateInput = ({
  chdeTemplateId,
  isGenerating,
  isLoadingTranslations,
  campaignName,
  onSetChdeTemplateId,
  onGenerateAll,
  customTemplates = {},
  onToggleCustomTemplate,
  onUpdateCustomTemplateValue,
  onSaveCustomTemplate,
  onAddCustomTemplate,
  onRemoveCustomTemplate,
}: ChdeTemplateInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [newTemplateSlug, setNewTemplateSlug] = useState('');
  const [newTemplateValue, setNewTemplateValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Log when customTemplates changes
  useEffect(() => {
    console.log('🔄 ChdeTemplateInput - customTemplates updated:', customTemplates);
  }, [customTemplates]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleToggleTemplate = useCallback((slug: string) => {
    if (onToggleCustomTemplate) {
      onToggleCustomTemplate(slug);
      setEditingSlug(slug);
    }
  }, [onToggleCustomTemplate]);

  const handleSaveTemplate = useCallback((slug: string) => {
    if (onSaveCustomTemplate) {
      onSaveCustomTemplate(slug);
      setEditingSlug(null);
    }
  }, [onSaveCustomTemplate]);

  const handleCancelEdit = useCallback(() => {
    setEditingSlug(null);
  }, []);

  const handleAddTemplate = useCallback(() => {
    if (newTemplateSlug && newTemplateValue && onAddCustomTemplate) {
      console.log('📝 Adding template:', newTemplateSlug, newTemplateValue);
      onAddCustomTemplate(newTemplateSlug, newTemplateValue);
      setNewTemplateSlug('');
      setNewTemplateValue('');
      setShowAddForm(false);
    }
  }, [newTemplateSlug, newTemplateValue, onAddCustomTemplate]);

  const handleRemoveTemplate = useCallback((slug: string) => {
    if (onRemoveCustomTemplate) {
      console.log('🗑️ Removing template:', slug);
      onRemoveCustomTemplate(slug);
    }
  }, [onRemoveCustomTemplate]);

  // Get all slugs that don't have overrides yet
  const availableSlugs = SLUG_ORDER.filter(slug => !customTemplates[slug]);

  // Check if there are any custom templates
  const hasCustomTemplates = Object.keys(customTemplates).length > 0;

  return (
    <div className={styles.chdeInputContainer}>
      <div className={styles.chdeRow}>
        <span className={styles.chdeLabel}>CHDE Template ID:</span>
        <input
          type="text"
          value={chdeTemplateId}
          onChange={e => onSetChdeTemplateId(e.target.value)}
          placeholder="Enter CHDE template ID"
          className={styles.input}
        />
        <button
          onClick={onGenerateAll}
          disabled={
            !campaignName ||
            !campaignName.trim() ||
            !isValidTemplateId(chdeTemplateId) ||
            isGenerating ||
            isLoadingTranslations
          }
          className={styles.btnGenerate}
        >
          {isGenerating ? 'Generating...' : isLoadingTranslations ? 'Loading...' : 'Generate All'}
        </button>
      </div>

      {/* Expandable section for slug template overrides */}
      <div className={styles.templateOverridesSection}>
        <div className={styles.overridesHeader}>
          <button
            onClick={toggleExpand}
            className={styles.toggleOverridesBtn}
            disabled={isGenerating || isLoadingTranslations}
          >
            {isExpanded ? '▼' : '▶'} Slug Template Overrides
            {hasCustomTemplates && (
              <span className={styles.overrideCount}>
                ({Object.keys(customTemplates).length})
              </span>
            )}
          </button>
          {isExpanded && (
            <button
              onClick={() => setShowAddForm(true)}
              className={styles.addOverrideBtn}
              disabled={availableSlugs.length === 0 || isGenerating || isLoadingTranslations}
            >
              + Add
            </button>
          )}
        </div>

        {isExpanded && (
          <div className={styles.templateOverridesList}>
            {/* Add new override form */}
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
                  placeholder="Template ID"
                  className={styles.inputSmall}
                />
                <button
                  onClick={handleAddTemplate}
                  disabled={!newTemplateSlug || !newTemplateValue}
                  className={styles.iconSave}
                  title="Add"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewTemplateSlug('');
                    setNewTemplateValue('');
                  }}
                  className={styles.iconCancel}
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            )}

            {Object.keys(customTemplates).length === 0 && !showAddForm && (
              <div className={styles.noOverrides}>
                No template overrides yet. Click "Add" to create one.
              </div>
            )}

            {Object.entries(customTemplates).map(([slug, template]) => (
              <div key={slug} className={styles.overrideItem}>
                <div className={styles.overrideSlug}>{slug.toUpperCase()}</div>
                {template.isEditing ? (
                  <div className={styles.overrideEdit}>
                    <input
                      type="text"
                      value={template.value}
                      onChange={e => onUpdateCustomTemplateValue?.(slug, e.target.value)}
                      className={styles.inputSmall}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveTemplate(slug)}
                      className={styles.iconSave}
                      disabled={!template.value.trim()}
                      title="Save"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        handleCancelEdit();
                        onToggleCustomTemplate?.(slug);
                      }}
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
                      onClick={() => handleToggleTemplate(slug)}
                      className={styles.iconEdit}
                      title="Edit template"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleRemoveTemplate(slug)}
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
};