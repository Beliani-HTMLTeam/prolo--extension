import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion, type Transition } from 'motion/react';
import styles from '@/entrypoints/newtab/Home.module.scss';
import logo_light from '@/entrypoints/newtab/img/Beliani_Icon_Brown_RGB.svg';
import logo_dark from '@/entrypoints/newtab/img/Beliani_Icon_Color_RGB.svg';
import LinksHub from '@/entrypoints/newtab/views/html/components/LinksHub.tsx';
import SearchBar from '@/entrypoints/newtab/views/html/components/SearchBar.tsx';
import Projects from '@/entrypoints/newtab/views/html/components/Projects.tsx';
import RecentComments from './RecentComments';
import { useIssuesWithComments } from './hooks/useIssueWithComments';
import { useCommentsVisibility } from './hooks/useCommentsVisibility';

interface HtmlDashboardProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const POP_SPRING: Transition = { type: 'spring', stiffness: 500, damping: 26 };
const TAP_SPRING: Transition = { type: 'spring', stiffness: 600, damping: 30 };
const popIn = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  transition: POP_SPRING,
};

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export default function HtmlDashboard({ theme, setTheme }: HtmlDashboardProps) {
  const [sbModalState, setSbModalState] = useState(false);
  const [showOtherIssues, setShowOtherIssues] = useState(false);
  const { issues, loading, refreshing, error } = useIssuesWithComments();
  const { showComments, setShowComments, defaultHidden, toggleDefaultHidden, lastSeen, highlightNewerThan, markSeen } =
    useCommentsVisibility();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSbModalState(false);
        return;
      }

      if (e.key === '/') {
        setSbModalState(true);
        return;
      }

      if (
        e.key.toLowerCase() === 'c' &&
        !e.repeat &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isTypingTarget(e.target)
      ) {
        setShowComments(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const visibilityLoaded = lastSeen !== undefined;

  useEffect(() => {
    if (showComments && visibilityLoaded) {
      markSeen(true);
    }
  }, [showComments, visibilityLoaded]);

  useEffect(() => {
    if (showComments && !refreshing) {
      markSeen(false);
    }
  }, [refreshing]);

  const displayIssues = showOtherIssues ? issues : issues.filter(issue => !issue.isOther);

  const newCommentsCount =
    lastSeen === undefined
      ? 0
      : displayIssues.reduce(
          (sum, issue) =>
            sum +
            issue.comments.filter(
              comment =>
                comment.comment_type && (lastSeen === null || new Date(comment.create_date).getTime() > lastSeen),
            ).length,
          0,
        );

  const panelError = issues.length === 0 ? error : null;

  return (
    <div className={styles.home}>
      <div className={styles.floating}>
        <img className={styles.logo} width={48} src={theme === 'light' ? logo_light : logo_dark} alt="Logo" />

        <div className={styles.toggleTheme}>
          <button
            title={'Switch theme to ' + (theme === 'light' ? 'dark' : 'light')}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Icon icon="si:sun-fill" /> : <Icon icon="si:moon-fill" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showComments && (
          <motion.div
            key="recent-comments"
            className={styles.commentsPanel}
            initial={{ height: 0, opacity: 0, y: -24 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -24 }}
            transition={{
              height: { type: 'spring', stiffness: 260, damping: 32 },
              y: { type: 'spring', stiffness: 260, damping: 26 },
              opacity: { duration: 0.2 },
            }}
          >
            <RecentComments
              issues={displayIssues}
              loading={loading}
              error={panelError}
              highlightNewerThan={highlightNewerThan}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={styles.filterContainer}>
        <motion.button
          onClick={() => setShowComments(!showComments)}
          className={styles.filterButton}
          title="Toggle comments (C)"
          whileTap={{ scale: 0.95 }}
          transition={TAP_SPRING}
        >
          <Icon icon={showComments ? 'lucide:message-square-off' : 'lucide:message-square'} />
          {showComments ? 'Hide Comments' : 'Show Comments'}
          <AnimatePresence>
            {refreshing && (
              <motion.span key="spinner" className={styles.spinner} title="Loading comments..." {...popIn}>
                <Icon icon="lucide:loader-circle" />
              </motion.span>
            )}
            {!refreshing && error && (
              <motion.span
                key="error"
                className={styles.errorDot}
                title={`Failed to load comments: ${error}`}
                {...popIn}
              />
            )}
            {!showComments && newCommentsCount > 0 && (
              <motion.span
                key="badge"
                className={styles.newBadge}
                title={`${newCommentsCount} new comment${newCommentsCount !== 1 ? 's' : ''}`}
                {...popIn}
              >
                <span className={styles.newDot} />
                {newCommentsCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          role="switch"
          aria-checked={defaultHidden}
          onClick={toggleDefaultHidden}
          className={styles.defaultToggle}
          title="Hide comments by default when opening a new tab"
          whileTap={{ scale: 0.95 }}
          transition={TAP_SPRING}
        >
          <span className={`${styles.switch} ${defaultHidden ? styles.switchOn : ''}`.trim()}>
            <motion.span
              className={styles.switchKnob}
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </span>
          Default hidden
        </motion.button>

        <motion.button
          onClick={() => setShowOtherIssues(!showOtherIssues)}
          className={styles.filterButton}
          whileTap={{ scale: 0.95 }}
          transition={TAP_SPRING}
        >
          <Icon icon={showOtherIssues ? 'lucide:filter-x' : 'lucide:filter'} />
          {showOtherIssues ? 'Hide Other Issues' : 'Show Other Issues'}
        </motion.button>
      </div>

      <LinksHub />

      <SearchBar shown={sbModalState} />

      <Projects />
    </div>
  );
}
