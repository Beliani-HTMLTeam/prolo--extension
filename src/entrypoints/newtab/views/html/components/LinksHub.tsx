import { useState } from 'react';
import styles from '@/entrypoints/newtab/views/html/styles/LinksHub.module.scss';
import { Icon } from '@iconify/react';
import linksData from '@/data/links.json';

const links = linksData.html;

export default function LinksHub() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  // @ts-ignore fu ts
  const lastCategoryName = links[Object.keys(links).at(-1) ?? '']?.name;

  const toggleCategory = (categoryName: string) => {
    setOpenCategory(openCategory === categoryName ? null : categoryName);
  };

  return (
    <div className={styles.linksHub}>
      {Object.entries(links).map(([_, category]) => {
        const isOpen = openCategory === category.name;
        const isHovered = hoveredCategory === category.name;
        const showLabel = isOpen || isHovered;
        const opensUpward = category.name === lastCategoryName;

        return (
          <div key={category.name} className={`${styles.category} ${opensUpward ? styles.categoryUpward : ''}`}>
            <button
              className={`${styles.categoryHeader} ${isOpen ? styles.open : ''}`}
              onClick={() => toggleCategory(category.name)}
              onMouseEnter={() => setHoveredCategory(category.name)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <Icon icon={category.icon} />
              <span className={`${styles.categoryLabel} ${showLabel ? styles.visible : ''}`}>{category.name}</span>
            </button>
            <div className={`${styles.dropdown} ${isOpen ? styles.open : ''}`}>
              <div className={styles.links}>
                {category.links.map((link: any) => {
                  if (!link.name || !link.url) {
                    return <div key={Math.random()} className={styles.separator} />;
                  }

                  return (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      {link.image ? (
                        <img src={`/icons/${link.image}.png`} alt={link.name} className={styles.linkImage} />
                      ) : (
                        <Icon icon={link.icon} />
                      )}
                      <span>{link.name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
