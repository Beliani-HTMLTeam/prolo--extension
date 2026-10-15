import { useMemo } from 'react';
import type { TimerConfig } from '../../types';
import { getTranslationVal } from '../../utils/banner';
import { renderTimerRows, TIMER_CSS } from '../../utils/timer/render';
import styles from './TimerBannerModal.module.scss';

const BASE_CSS = `
  body { margin: 0; background: #ffffff; font-family: 'Open Sans', sans-serif; }
  img { border: 0; }
  .newsletterContainer { padding-left: 20px; padding-right: 20px; }
  .newsletterContainer60px { padding-left: 60px; padding-right: 60px; }
  .newsletterBottom10px { padding-bottom: 10px; }
  .newsletterBottom20px { padding-bottom: 20px; }
  @media screen and (max-width: 768px) {
    .newsletterBottom20px { padding-bottom: 10px; }
  }
`;

const MOBILE_WIDTH = 375;

export type PreviewDevice = 'desktop' | 'mobile';

type TimerPreviewProps = {
  config: TimerConfig;
  slug: string;
  templates: Record<string, any> | null;
  device?: PreviewDevice;
};

const TimerPreview = ({ config, slug, templates, device = 'desktop' }: TimerPreviewProps) => {
  const srcDoc = useMemo(() => {
    const rows = renderTimerRows({
      config,
      slug,
      href: '#',
      phrase: key => (templates ? getTranslationVal(templates, key, slug) : null),
    });

    const css = `${BASE_CSS}${TIMER_CSS}`;
    const deviceCss = device === 'desktop' ? css.replace(/max-width:\s*\d+px\)/g, 'max-width: 0px)') : css;

    return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>${deviceCss}</style></head><body>
<table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 650px; background-color: #fbf5f5;">
  <tbody>${rows}</tbody>
</table></body></html>`;
  }, [config, slug, templates, device]);

  return (
    <iframe
      className={styles.previewFrame}
      title="Timer preview"
      srcDoc={srcDoc}
      style={{ width: device === 'mobile' ? MOBILE_WIDTH : '100%' }}
    />
  );
};

export default TimerPreview;
