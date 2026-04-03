import { useState } from 'react';
import SearchBar from './SearchBar';
import styles from './styles/linksHub.module.scss';
import { Icon } from '@iconify/react';

const links = {
  0: {
    name: 'Prologistics',
    icon: 'mingcute:heart-fill',
    links: [
      { name: 'Start.php', url: 'https://www.prologistics.info/start.php', icon: 'mingcute:heart-fill' },
      { name: 'Mailing Templates', url: 'https://www.prologistics.info/news_emails.php', icon: 'mingcute:heart-fill' },
      { name: 'Newsletter Sending', url: 'https://www.prologistics.info/spam_plan.php', icon: 'mingcute:heart-fill' },
      { name: 'Issue Logs', url: 'https://www.prologistics.info/react/logs/issue_logs/', icon: 'mingcute:heart-fill' },
      { name: 'Employees', url: 'https://www.prologistics.info/employees.php', icon: 'mingcute:heart-fill' },
      { name: 'CGB', url: 'https://www.prologistics.info/shop_banners.php?shop_id=1', icon: 'mingcute:heart-fill' },
      {
        name: 'Push Notifications',
        url: 'https://www.prologistics.info/push_notifications.php',
        icon: 'mingcute:heart-fill',
      },
      { name: 'Purge', url: 'https://www.prologistics.info/purge.php', icon: 'mingcute:heart-fill' },
    ],
  },
  1: {
    name: 'Development',
    icon: 'solar:code-circle-bold',
    links: [
      {
        name: 'Projects Board',
        url: 'https://www.figma.com/design/PF7tZr72XquHOSrWwQXtSd/Projects?node-id=1-2&t=fUoMeTQTw1Wpz9Yz-1',
        icon: 'ri:figma-fill'

      },
      {},
      { name: 'HTML Repositories', url: 'https://github.com/orgs/Beliani-HTMLTeam/repositories', icon: 'simple-icons:github' },
      {},
      {
        name: 'WXT.dev',
        url: 'https://wxt.dev/guide/essentials/entrypoints.html',
        icon: 'oui:documentation',
      },
      {
        name: 'Can I email...',
        url: 'https://www.caniemail.com/',
        icon: 'fontisto:if-question-circle',
      },
      {
        name: 'JSON Editor',
        url: 'https://jsoneditoronline.org/',
        icon: 'tabler:json',
      },
      {
        name: 'Charcodes',
        url: 'https://www.web2generators.com/html-based-tools/online-html-entities-encoder-and-decoder',
        icon: 'carbon:character-sentence-case',
      },
      {
        name: 'Emoji to HTML',
        url: 'https://emojiguide.org/',
        icon: 'streamline:desktop-emoji-remix',
      },
      {
        name: 'NSLT preview - testi.at',
        url: 'https://testi.at/firstproj',
        icon: 'material-symbols:preview',
      },
    ],
  },
  2: {
    name: 'Graphics',
    icon: 'streamline-plump:paint-palette-solid',
    links: [
      {
        name: 'Brand Guide',
        url: 'https://www.figma.com/design/cXq0y5RJspsLyIOKXvQ0Qe/',
        icon: 'ri:figma-fill',
      },
      {
        name: 'HTML SOP/Guide',
        url: 'https://www.figma.com/board/P1cobx2XzyYPV2wb9iuHpV',
        icon: 'ri:figma-fill',
      },
      {
        name: 'Brand Book',
        url: 'https://docs.google.com/presentation/d/1-Er3GqWKAzAhZ2nrJdBXOnDQr10LoMm5_vqX33a3MFs',
        icon: 'simple-icons:googleslides',
      },
      {
        name: 'Brand Assets',
        url: 'https://drive.google.com/drive/folders/1K3QwQ4NjQvjSUnnQryLw-XWeA9UQZRdT',
        icon: 'simple-icons:googledrive',
      },
      {
        name: 'Graphic Guide',
        url: 'https://www.figma.com/design/hQhDnri4p9mNvGC4ta9NJP',
        icon: 'ri:figma-fill',
      },
      {
        name: 'NSLT Templates',
        url: 'https://www.figma.com/design/3oNaYfuXymWDKS2kYtY2Hi',
        icon: 'ri:figma-fill',
      },
    ],
  },
  3: {
    name: 'Google Sheets',
    icon: 'simple-icons:googlesheets',
    links: [
      {
        name: 'Global Translations',
        url: 'https://docs.google.com/spreadsheets/d/1Y9blxN4paEV05s6AvdWmH5fBELTUvDz3ax5skmgVrsQ/',
        icon: 'simple-icons:googlesheets',
      },
      {
        name: 'For Extensnion',
        url: 'https://docs.google.com/spreadsheets/d/1-PuU7XVrwNJhbHmaAFML9n2XwWgpLLb3FKfXdnaoHc0',
        icon: 'simple-icons:googlesheets',
      },
      {},
      {
        name: 'NSLT Timeline (updated)',
        url: 'https://docs.google.com/spreadsheets/d/1zoZOh1pWgguM5--8hbU3uslv06zzdoTc8Z0nBXewrLQ/',
        icon: 'simple-icons:googlesheets',
      },
      {
        name: 'NSLT Translations',
        url: 'https://docs.google.com/spreadsheets/d/1djnjfhsFX4-Fghv5cQU_UNYaEhVL9Ban4VUqIfHsWdc/',
        icon: 'simple-icons:googlesheets',
      },
      {
        name: 'NSLT List',
        url: 'https://docs.google.com/spreadsheets/d/1mXRItWs-dAk4bssBIUb4pr1QtSmg15DiMGQWDoYojZQ',
        icon: 'simple-icons:googlesheets',
      },
      {
        name: 'NSLT QA',
        url: 'https://docs.google.com/spreadsheets/d/1prLX1zu8-5NPN49gcdcRSSNluiYELaAYC7YjLTfXYC0',
        icon: 'simple-icons:googlesheets',
      },
      {},
      {
        name: 'Days off',
        url: 'https://docs.google.com/spreadsheets/d/1Kywf_gL4kCOw1kiTbKM7H2DW1qpWCm0yabjmH8wX5iw/',
        icon: 'simple-icons:googlesheets',
      },
      {
        name: 'Handover Checklist',
        url: 'https://docs.google.com/spreadsheets/d/1ntXgDzV_JiYyl2kkEwM4bmIRccPnhD8PpaaSwtl1QnE',
        icon: 'simple-icons:googlesheets',
      },
      {
        name: 'Weekly Minutes',
        url: 'https://docs.google.com/spreadsheets/d/1MqUl-WFCZVZGCoA6z9cuSTQVbQvD6O6JobpDrschGpg',
        icon: 'simple-icons:googlesheets',
      },
    ],
  },
};

export default function LinksHub() {
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const toggleCategory = (categoryName: string) => {
    setOpenCategory(openCategory === categoryName ? null : categoryName);
  };

  return (
    <div className={styles.linksHub}>
      {Object.entries(links).map(([_, category]) => {
        const isOpen = openCategory === category.name;
        const isHovered = hoveredCategory === category.name;
        const showLabel = isOpen || isHovered;

        return (
          <div key={category.name} className={styles.category}>
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
                {category.links.map(link => {
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
                      <Icon icon={link.icon} />
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
