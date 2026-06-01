import NewsletterLayout from './components/NewsletterLayout';
import styles from './App.module.scss';
import AvailableBanners from './components/AvailableBanners';

const demoBanners = [
  { order: 1, date: '2026.05.29' },
  { order: 2, date: '2026.05.28' },
  { order: 3, date: '2026.05.27' },
  { order: 4, date: '2026.05.26' },
  { order: 5, date: '2026.05.25' },
];

const NewsEmailApp = () => {
  return (
    <div className={styles.app}>
      <NewsletterLayout banners={demoBanners} />
      <AvailableBanners />
    </div>
  );
};

export default NewsEmailApp;
