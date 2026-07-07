import styles from '../styles/SidebarSection.module.scss';

interface SidebarSectionProps {
  category: string;
  links: { name: string; url: string; isSop?: boolean }[];
}

export default function SidebarSection({ category, links }: SidebarSectionProps) {
  const categoryClass = category.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={`${styles.section} ${styles[categoryClass] || ''}`}>
      <h3 className={styles.sectionTitle}>{category}</h3>
      <div className={styles.linkList}>
        {links.map(link => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.linkItem} ${link.isSop ? styles.sopLink : ''}`}
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}
