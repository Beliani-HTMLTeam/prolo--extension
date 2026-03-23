// Type shim for gif-picker-react-klipy
// The package's "types" field incorrectly points to types.ts which omits the
// component export. This file re-exports everything correctly.
declare module 'gif-picker-react-klipy' {
  import type { FC } from 'react';

  export interface GifImage {
    id: string;
    url: string;
    previewUrl: string;
    width: number;
    height: number;
    title: string;
    description?: string;
    tags: string[];
    itemUrl?: string;
    createdAt: Date;
  }

  export type Theme = 'light' | 'dark' | 'auto';
  export type ContentFilter = 'off' | 'low' | 'medium' | 'high';

  export interface GifPickerLabels {
    searchPlaceholder?: string;
    trendingTitle?: string;
    categoriesTitle?: string;
    loadingText?: string;
    noResultsText?: string;
    poweredByText?: string;
  }

  export interface GifPickerProps {
    klipyApiKey: string;
    onGifClick?: (gif: GifImage) => void;
    theme?: Theme;
    width?: number | string;
    height?: number | string;
    columns?: number;
    autoFocusSearch?: boolean;
    initialSearchTerm?: string;
    contentFilter?: ContentFilter;
    locale?: string;
    country?: string;
    clientKey?: string;
    categoryHeight?: number | string;
    className?: string;
    labels?: GifPickerLabels;
  }

  export const GifPicker: FC<GifPickerProps>;
}
