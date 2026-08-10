import { useState, useEffect } from 'react';
import styles from '../push.module.scss';

type BigImagePreviewProps = {
  src: string | null;
  alt: string;
  onClose: () => void;
};

export const BigImagePreview = ({ src, alt, onClose }: BigImagePreviewProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [src]);

  if (!src) return null;

  return (
    <div className={styles.bigImageContainer}>
      <div className={styles.header}>
        <span className={styles.title}>🖼️ Image Preview: {alt}</span>
        <button onClick={onClose} className={styles.btnClose}>
          ✕ Close
        </button>
      </div>
      <div className={styles.imageWrapper}>
        {loading && (
          <div className={styles.bigImageLoading}>
            <div className={styles.spinner} />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          style={{ display: loading ? 'none' : 'block' }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
        />
        {error && (
          <div className={styles.bigImageError}>
            <span>Failed to load image</span>
            <span className={styles.bigImageUrl}>{src}</span>
          </div>
        )}
      </div>
      {!error && <div className={styles.urlText}>📍 {src}</div>}
    </div>
  );
};