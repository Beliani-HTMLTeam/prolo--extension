import { Icon } from '@iconify/react';
import styles from '../styles/layout.module.scss';
import type { IssueExtraField } from '../lib/types';
import ChipPopover from './ChipPopover';

const VALUE_LIMIT = 160;

const shorten = (value: string) => {
  const flat = value.replace(/\s+/g, ' ').trim();
  return flat.length > VALUE_LIMIT ? `${flat.slice(0, VALUE_LIMIT - 3)}...` : flat;
};

// "Objective (What is the goal of this project?...)" -> "Objective"
const shortName = (name: string) => name.replace(/\s*\([^)]*\)/g, '').trim() || name;

// brief/notes fields of issues without a standard dashboard (graphics, campaigns), long values are cut, full text on hover
const ExtraFieldsMenu = ({ fields }: { fields: IssueExtraField[] }) => {
  if (fields.length === 0) return null;

  return (
    <ChipPopover
      wide
      trigger={
        <>
          <Icon icon="mdi:text-box-outline" width="14" height="14" />
          <span className={styles.linkChipLabel}>Details</span>
          <span className={styles.linkChipCount}>{fields.length}</span>
        </>
      }
    >
      <div className={styles.popoverList}>
        {fields.map(field => (
          <div key={`${field.name}-${field.value}`} className={styles.extraFieldRow} title={`${field.name}\n\n${field.value}`}>
            <span className={styles.extraFieldName}>{shortName(field.name)}</span>
            <span className={styles.extraFieldValue}>{shorten(field.value)}</span>
          </div>
        ))}
      </div>
    </ChipPopover>
  );
};

export default ExtraFieldsMenu;
