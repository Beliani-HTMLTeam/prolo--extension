import { Banner } from '../../utils/banner';

import styles from './AvailableBanners.module.scss';

let formatDate = (date: Date) => {
  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString().padStart(2, '0');
  let day = date.getDate().toString().padStart(2, '0');

  return `${year}.${month}.${day}`;
};

let getDaysBetweenInclusive = (start: Date, end: Date) => {
  if (end.getTime() < start.getTime()) return [] as string[];

  // Use midday to avoid DST edge cases when stepping by date.
  const current = new Date(start);
  current.setHours(12, 0, 0, 0);

  const endDate = new Date(end);
  endDate.setHours(12, 0, 0, 0);

  const days: string[] = [];
  while (current.getTime() <= endDate.getTime()) {
    days.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
};

const AvailableBanners = () => {
  let today = new Date();

  let startDate = new Date(today);
  startDate.setDate(today.getDate() - 14);

  let endDate = new Date(today);
  endDate.setDate(today.getDate() + 14);

  let startFormatted = formatDate(startDate);
  let endFormatted = formatDate(endDate);

  let days = getDaysBetweenInclusive(startDate, endDate);

  const handleAddBanner = () => {
    // Implement banner addition logic here
    console.log('Add banner');
  };

  return (
    <div className={styles.availableBanners}>
      <p>
        Available Banners (from {startFormatted} to {endFormatted})
      </p>

      {days.map(date => (
        <div key={date} className={styles.bannerItem}>
          {date}
          <Banner date={date} type="desktop" />

          <button onClick={handleAddBanner}>Add Banner</button>
        </div>
      ))}
    </div>
  );
};

export default AvailableBanners;
