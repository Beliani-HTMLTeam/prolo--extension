import { Icon } from '@iconify/react';
import styles from '../styles/PillLink.module.scss';

interface PillLinkProps {
  item: {
    name: string;
    url: string;
    icon?: string;
    image?: string;
  };
}

export default function PillLink({ item }: PillLinkProps) {
  const currentDay = new Date().getDate();
  let style = {};
  if (item.image === 'calendar')
    style = { objectFit: 'cover', objectPosition: `0px -${Math.floor(19.1667 * (currentDay - 1))}px` };

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={styles.pillLink}>
      {item.image ? (
        <img src={`/icons/${item.image}.png`} alt={item.name} className={styles.pillImage} style={style} />
      ) : item.icon ? (
        <Icon icon={item.icon} style={{ fontSize: '1.4rem' }} />
      ) : null}
      <span>{item.name}</span>
    </a>
  );
}
