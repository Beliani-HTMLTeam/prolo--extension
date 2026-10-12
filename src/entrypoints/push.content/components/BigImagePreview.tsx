import { memo, useState } from 'react';
import styles from '../push.module.scss';
import { type BigImagePreviewProps } from '../types/push';

type LoadStatus = 'loading' | 'loaded' | 'error';

export const BigImagePreview = memo(({ src, alt, onClose }: BigImagePreviewProps) => {
  // Status is tied to the src it belongs to — a new src is automatically "loading", no reset effect needed.
  const [state, setState] = useState<{ src: string | null; status: LoadStatus }>({ src, status: 'loading' });
  const status: LoadStatus = state.src === src ? state.status : 'loading';

  if (!src) return null;

  const isLoading = status === 'loading';
  const isError = status === 'error';

  return (
    <div className={styles.bigImageContainer}>
      <div className={styles.header}>
        <span className={styles.title}>Image Preview: {alt}</span>
        <button type="button" onClick={onClose} className={styles.btnClose}>
          ✕ Close
        </button>
      </div>
      <div className={styles.imageWrapper}>
        {isLoading && (
          <div className={styles.bigImageLoading}>
            <div className={styles.spinner} />
          </div>
        )}
        <img
          key={src}
          src={src}
          alt={alt}
          style={{ display: status === 'loaded' ? 'block' : 'none' }}
          onLoad={() => setState({ src, status: 'loaded' })}
          onError={() => setState({ src, status: 'error' })}
        />
        {isError && (
          <div className={styles.bigImageError}>
            <span>Failed to load image</span>
            <span className={styles.bigImageUrl}>{src}</span>
          </div>
        )}
      </div>
      {!isError && <div className={styles.urlText}>{src}</div>}
    </div>
  );
});

BigImagePreview.displayName = 'BigImagePreview';
