import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import styles from './TitVersionSelect.module.scss';

type TitVersionSelectProps = {
  value: number;
  onChange: (version: number) => void;
  label?: string;
  className?: string;
};

const OPTIONS = [
  { value: 1, label: 'Version 1' },
  { value: 2, label: 'Version 2' },
  { value: 3, label: 'Version 3' },
  { value: 4, label: 'Version 4' },
  { value: 5, label: 'Version 5' },
  { value: 6, label: 'Version 6' },
];

export const TitVersionSelect = ({
  value,
  onChange,
  label = 'TIT Version:',
  className,
}: TitVersionSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = OPTIONS.find(opt => opt.value === value) ?? OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={clsx(styles.container, className)} ref={containerRef}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.dropdownWrapper}>
        <button
          type="button"
          className={clsx(styles.trigger, isOpen && styles.open)}
          onClick={() => setIsOpen(prev => !prev)}
        >
          <span className={styles.selectedText}>{selectedOption.label}</span>
          <Icon icon="tabler:chevron-down" className={styles.chevron} />
        </button>

        {isOpen && (
          <div className={styles.dropdownMenu}>
            {OPTIONS.map(option => (
              <div
                key={option.value}
                className={clsx(styles.option, option.value === value && styles.selected)}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span>{option.label}</span>
                {option.value === value && <Icon icon="tabler:check" className={styles.checkIcon} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TitVersionSelect;
