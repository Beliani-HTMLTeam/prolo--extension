import { useEffect, useState } from 'react';
import styles from '../push.module.scss';
import { ImagePreviewProps } from '../types/push';

export const ImagePreview = ({ src, alt, size = 'small', onClick }: ImagePreviewProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setError(false);
    setLoading(true);

    const img = new Image();
    img.src = src;
    if (img.complete) {
      setLoading(false);
      setError(false);
    }
  }, [src]);

  const sizeClass = size === 'large' ? styles.sizeLarge : size === 'medium' ? styles.sizeMedium : styles.sizeSmall;

  if (error || !src) {
    return (
      <div className={`${styles.imagePreviewWrapper}`} onClick={onClick}>
        <div className={`${styles.noImage} ${sizeClass}`}>No Image</div>
      </div>
    );
  }

  return (
    <div className={styles.imagePreviewWrapper} onClick={onClick}>
      {loading && (
        <div className={`${styles.loadingPlaceholder} ${sizeClass}`}>
          <div className={styles.spinner} />
        </div>
      )}
      <img
        key={src}
        src={src}
        alt={alt}
        className={`${styles.thumbnail} ${sizeClass}`}
        style={{
          display: loading ? 'none' : 'block',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
        onLoad={() => {
          setLoading(false);
          setError(false);
        }}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        loading="eager"
        decoding="async"
      />
    </div>
  );
};
