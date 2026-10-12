import { memo, useCallback, useState } from 'react';
import styles from '../push.module.scss';
import { type ImagePreviewProps } from '../types/push';

type LoadStatus = 'loading' | 'loaded' | 'error';

/**
 * Status is stored together with the src it belongs to and derived on render.
 * No reset effect (no extra render, no race where a cached image finishes
 * before the reset and leaves the spinner stuck) and no duplicate `new Image()` request.
 */
export const ImagePreview = memo(({ src, alt, size = 'small', onClick }: ImagePreviewProps) => {
  const [state, setState] = useState<{ src: string; status: LoadStatus }>({ src, status: 'loading' });
  const status: LoadStatus = state.src === src ? state.status : 'loading';

  const handleLoad = useCallback(() => setState({ src, status: 'loaded' }), [src]);
  const handleError = useCallback(() => setState({ src, status: 'error' }), [src]);

  // Safety net for images already decoded from cache.
  const imgRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth > 0) setState({ src, status: 'loaded' });
    },
    [src],
  );

  const sizeClass = size === 'large' ? styles.sizeLarge : size === 'medium' ? styles.sizeMedium : styles.sizeSmall;

  if (!src || status === 'error') {
    return (
      <div className={styles.imagePreviewWrapper} onClick={onClick}>
        <div className={`${styles.noImage} ${sizeClass}`}>No Image</div>
      </div>
    );
  }

  const isLoading = status === 'loading';

  return (
    <div className={styles.imagePreviewWrapper} onClick={onClick}>
      {isLoading && (
        <div className={`${styles.loadingPlaceholder} ${sizeClass}`}>
          <div className={styles.spinner} />
        </div>
      )}
      <img
        key={src}
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${styles.thumbnail} ${sizeClass}`}
        style={{
          display: isLoading ? 'none' : 'block',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out',
        }}
        onLoad={handleLoad}
        onError={handleError}
        loading="eager"
        decoding="async"
      />
    </div>
  );
});

ImagePreview.displayName = 'ImagePreview';
