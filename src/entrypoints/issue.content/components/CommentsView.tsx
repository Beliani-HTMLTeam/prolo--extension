import { useEffect, useRef, useState, useCallback, useMemo, memo, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import { useCookies } from 'react-cookie';
import styles from '../styles/chat.module.scss';
import formStyles from '../styles/forms.module.scss';
import { extractMentionIds, fetchComments, notifyMentionedUsers, sendComment, type Comment } from '../api/comments';
import { fetchMentionableUsers } from '../api/issueData';
import { EmojiPicker } from './pickers/EmojiPicker';
import { GifPicker } from './pickers/GifPicker';
import { MentionPicker } from './pickers/MentionPicker';
import { RichTextarea, type RichTextareaHandle, applyTwemoji } from './RichTextarea';

const TwemojiContent = memo(({ html, className }: { html: string; className: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) applyTwemoji(ref.current);
  });
  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

TwemojiContent.displayName = 'TwemojiContent';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const parseCommentHtml = (html: string): string => {
  // convert plain URLs to <a> tags if they're not already in <a> tags
  let processed = html.replace(
    /(?<!href=['"])(?<!href=)(https?:\/\/[^\s<]+)/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="comment-link">$1</a>',
  );

  // shorten long urls
  processed = processed.replace(/<a ([^>]*?)>([^<]{50,})<\/a>/gi, (match, attrs, text) => {
    if (text.startsWith('http')) {
      const shortened = text.substring(0, 47) + '...';
      return `<a ${attrs}>${shortened}</a>`;
    }
    return match;
  });

  return processed;
};

type CommentsViewProps = {
  issueId: number;
};

export const CommentsView = ({ issueId }: CommentsViewProps) => {
  const [cookies] = useCookies(['ebas_username']);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewestFirst, setIsNewestFirst] = useState(true);
  const [lastSeenCount, setLastSeenCount] = useState<number | null>(null);
  const [newCommentsCount, setNewCommentsCount] = useState(0);
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emojiAnchorStyle, setEmojiAnchorStyle] = useState<CSSProperties>({});
  const [mentionAnchorStyle, setMentionAnchorStyle] = useState<CSSProperties>({});
  const [gifAnchorStyle, setGifAnchorStyle] = useState<CSSProperties>({});
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const buttonContainerRef = useRef<HTMLElement | null>(null);
  const richInputRef = useRef<RichTextareaHandle>(null);
  const lastSeenCountRef = useRef<number | null>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const mentionBtnRef = useRef<HTMLButtonElement>(null);
  const gifBtnRef = useRef<HTMLButtonElement>(null);
  const currentUsername = cookies.ebas_username;

  // button anchor for emoji, gif, mention
  const getAnchorStyle = (btnRef: React.RefObject<HTMLButtonElement | null>): CSSProperties => {
    if (!btnRef.current) return {};
    const rect = btnRef.current.getBoundingClientRect();
    return {
      position: 'fixed',
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left + rect.width / 2,
      transform: 'translateX(-50%)',
      zIndex: 2137420,
    };
  };

  // inline mention above input
  const getInputAreaAnchorStyle = (): CSSProperties => {
    if (!inputAreaRef.current) return {};
    const rect = inputAreaRef.current.getBoundingClientRect();
    return {
      position: 'fixed',
      bottom: window.innerHeight - rect.top + 8,
      left: rect.left + rect.width / 2,
      transform: 'translateX(-50%)',
      zIndex: 2137420,
    };
  };

  useEffect(() => {
    lastSeenCountRef.current = lastSeenCount;
  }, [lastSeenCount]);

  // warm the mentionable users cache as soon as chat loads
  useEffect(() => {
    void fetchMentionableUsers();
  }, []);

  // test request / mention translators buttons
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail?.text;
      if (!text || !richInputRef.current) return;
      richInputRef.current.clear();
      richInputRef.current.insertText(text);
      richInputRef.current.focus();
    };
    document.addEventListener('richchat:set', handler);
    return () => document.removeEventListener('richchat:set', handler);
  }, []);

  useEffect(() => {
    const container = document.getElementById(`chat-buttons-${issueId}`);
    if (container) {
      buttonContainerRef.current = container;
    }
  }, [issueId]);

  const loadComments = useCallback(async () => {
    try {
      const data = await fetchComments(issueId);
      // rest doesnt matter
      const filtered = data.filter(c => c.comment_type === 'issuelog' || c.comment_type === 'issuelog_corrective');

      const currentLastSeen = lastSeenCountRef.current;

      // check for new comments
      if (currentLastSeen !== null && filtered.length > currentLastSeen) {
        const newCount = filtered.length - currentLastSeen;
        setNewCommentsCount(newCount);
      } else if (currentLastSeen === null) {
        setLastSeenCount(filtered.length);
      }

      setComments(filtered);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    loadComments();
  }, [issueId, loadComments]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadComments();
    }, 10000);

    return () => clearInterval(interval);
  }, [issueId, loadComments]);

  // Close pickers when clicking outside the input area or the portalled picker
  useEffect(() => {
    if (!showEmojiPicker && !showGifPicker && !showMentionPicker && mentionQuery === null) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // Check input area
      if (inputAreaRef.current?.contains(target)) return;
      // Check if click is inside a portalled picker popup (class on direct child of body)
      const pickerRoots = document.querySelectorAll('[data-picker-portal]');
      for (const root of pickerRoots) {
        if (root.contains(target)) return;
      }
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      setShowMentionPicker(false);
      setMentionQuery(null);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showEmojiPicker, showGifPicker, showMentionPicker, mentionQuery]);

  const scrollToNewest = () => {
    if (messagesAreaRef.current) {
      if (isNewestFirst) {
        messagesAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        messagesAreaRef.current.scrollTo({ top: messagesAreaRef.current.scrollHeight, behavior: 'smooth' });
      }
      // Dismiss badge when manually scrolling to newest
      markAsRead();
    }
  };

  const scrollToOldest = () => {
    if (messagesAreaRef.current) {
      if (isNewestFirst) {
        messagesAreaRef.current.scrollTo({ top: messagesAreaRef.current.scrollHeight, behavior: 'smooth' });
      } else {
        messagesAreaRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const markAsRead = () => {
    setLastSeenCount(comments.length);
    setNewCommentsCount(0);
  };

  // Insert text at cursor position
  const insertAtCursor = (text: string, hasTwemoji = false) => {
    richInputRef.current?.insertText(text, hasTwemoji);
  };

  const handleEmojiSelect = (emoji: string) => {
    insertAtCursor(emoji, true); // true = apply twemoji image
    setShowEmojiPicker(false);
  };

  const handleGifSelect = (gifUrl: string) => {
    // Klipy returns a direct GIF URL - embed as img with encoded slashes
    const encodedUrl = gifUrl.replace(/\//g, '&#x2F;');
    const imgCode = `<img src=${encodedUrl}>`;
    insertAtCursor(imgCode, false);
    setShowGifPicker(false);
  };

  const handleSend = async () => {
    const trimmed = (richInputRef.current?.getText() ?? messageText).trim();
    if (!trimmed || isSending) return;
    const mentionIds = extractMentionIds(trimmed);

    // needed to work with non ascii chars
    const mentionPattern = /@[^@(]+\(\d+\)/g;
    const mentions: string[] = [];

    let textWithPlaceholders = trimmed.replace(mentionPattern, match => {
      const index = mentions.length;
      mentions.push(match);
      return `___MENTION_${index}___`;
    });

    // encode the rest
    const encoded = [...textWithPlaceholders]
      .map(char => {
        const cp = char.codePointAt(0) ?? 0;
        return cp > 127 ? `&#${cp};` : char;
      })
      .join('');

    // Restore mentions
    const finalText = encoded.replace(/___MENTION_(\d+)___/g, (_, index) => {
      return mentions[parseInt(index)];
    });

    setIsSending(true);
    const ok = await sendComment(issueId, finalText);
    if (ok) {
      if (mentionIds.length > 0) {
        const allUsers = await fetchMentionableUsers();
        const respPersons = mentionIds.map(id => allUsers.find(u => u.id === id)?.key).filter((k): k is string => !!k);
        await notifyMentionedUsers(issueId, respPersons);
      }
      setMessageText('');
      richInputRef.current?.clear();
      await loadComments();
    } else {
      console.warn('[comments] Failed to send message');
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      if (mentionQuery !== null) {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleMentionSelect = (userId: string, value: string) => {
    const mention = `@${value}(${userId}) `;
    insertAtCursor(mention, false);
    setShowMentionPicker(false);
  };

  /** Called when user selects a mention from the inline (while-typing) picker. */
  const handleInlineMentionSelect = (userId: string, value: string) => {
    const q = mentionQuery ?? '';
    const mention = `@${value}(${userId}) `;
    richInputRef.current?.replaceMentionQuery(q, mention);
    setMentionQuery(null);
    richInputRef.current?.focus();
  };

  /** Called by RichTextarea when @word pattern at cursor changes. */
  const handleMentionSearch = (q: string | null) => {
    setMentionQuery(q);
    // If inline mention takes over, close button-triggered mention picker
    if (q !== null) setShowMentionPicker(false);
  };

  // Users from already-loaded comments - available immediately
  const commentUsers = useMemo(
    () =>
      Array.from(new Map(comments.map(c => [c.user_id, { id: c.user_id, value: c.full_username, key: '' }])).values()),
    [comments],
  );

  // Detect when user scrolls to newest messages
  const handleScroll = () => {
    if (!messagesAreaRef.current || newCommentsCount === 0) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesAreaRef.current;
    const threshold = 50; // pixels

    if (isNewestFirst) {
      // Newest at top - check if scrolled to top
      if (scrollTop <= threshold) {
        markAsRead();
      }
    } else {
      // Newest at bottom - check if scrolled to bottom
      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        markAsRead();
      }
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.create_date).getTime();
    const dateB = new Date(b.create_date).getTime();
    return isNewestFirst ? dateB - dateA : dateA - dateB;
  });

  if (loading && comments.length === 0) {
    return <div className={styles.commentLoading}>Loading chat...</div>;
  }

  if (comments.length === 0) {
    return <div className={styles.commentEmpty}>No messages yet</div>;
  }

  const renderHeaderButtons = () => (
    <>
      <button
        className={styles.chatHeaderButton}
        title={isNewestFirst ? 'Sort oldest first' : 'Sort newest first'}
        onClick={() => setIsNewestFirst(!isNewestFirst)}
      >
        <Icon icon={isNewestFirst ? 'mdi:sort-descending' : 'mdi:sort-ascending'} width="18" height="18" />
      </button>
      <button className={styles.chatHeaderButton} title="Scroll to newest" onClick={scrollToNewest}>
        <Icon icon={isNewestFirst ? 'mdi:chevron-up' : 'mdi:chevron-down'} width="18" height="18" />
      </button>
    </>
  );

  return (
    <>
      {buttonContainerRef.current && createPortal(renderHeaderButtons(), buttonContainerRef.current)}
      <div className={styles.messengerContainer}>
        {newCommentsCount > 0 && (
          <div className={styles.newCommentsBanner} onClick={scrollToNewest}>
            <div className={styles.blinkingDot} />
            <span>
              {newCommentsCount} new {newCommentsCount === 1 ? 'comment' : 'comments'}
            </span>
          </div>
        )}
        <div className={styles.messagesArea} ref={messagesAreaRef} onScroll={handleScroll}>
          {sortedComments.map(comment => {
            const isOwnMessage = comment.username === currentUsername;
            return (
              <div
                key={comment.id}
                className={clsx(styles.messageBubble, {
                  [styles.corrective]: comment.comment_type === 'issuelog_corrective',
                  [styles.ownMessage]: isOwnMessage,
                })}
              >
                <div className={styles.messageContent}>
                  <div className={styles.messageAuthor}>{comment.full_username}</div>
                  <div className={styles.messageText}>
                    <TwemojiContent html={parseCommentHtml(comment.comment)} className={styles.commentHtmlContent} />
                  </div>
                </div>
                <div className={styles.messageTime}>{formatDate(comment.create_date)}</div>
              </div>
            );
          })}
        </div>

        <div className={formStyles.messageInputArea} ref={inputAreaRef}>
          <div className={formStyles.inputButtonsTop}>
            <button
              ref={emojiBtnRef}
              className={clsx(formStyles.toolButton, showEmojiPicker && formStyles.toolButtonActive)}
              title="Emoji"
              onClick={() => {
                const next = !showEmojiPicker;
                setShowEmojiPicker(next);
                setShowGifPicker(false);
                setShowMentionPicker(false);
                if (next) setEmojiAnchorStyle(getAnchorStyle(emojiBtnRef));
              }}
            >
              <Icon icon="mdi:emoticon-outline" width="18" height="18" />
            </button>
            <button
              ref={mentionBtnRef}
              className={clsx(
                formStyles.toolButton,
                (showMentionPicker || mentionQuery !== null) && formStyles.toolButtonActive,
              )}
              title="Mention (@)"
              onClick={() => {
                const next = !showMentionPicker;
                setShowMentionPicker(next);
                setShowEmojiPicker(false);
                setShowGifPicker(false);
                setMentionQuery(null); // clear inline query when switching to button mode
                if (next) setMentionAnchorStyle(getAnchorStyle(mentionBtnRef));
              }}
            >
              <Icon icon="mdi:at" width="18" height="18" />
            </button>
            <button
              ref={gifBtnRef}
              className={clsx(formStyles.toolButton, showGifPicker && formStyles.toolButtonActive)}
              title="GIF"
              onClick={() => {
                const next = !showGifPicker;
                setShowGifPicker(next);
                setShowEmojiPicker(false);
                setShowMentionPicker(false);
                if (next) setGifAnchorStyle(getAnchorStyle(gifBtnRef));
              }}
            >
              <Icon icon="mdi:image-multiple-outline" width="18" height="18" />
            </button>
          </div>
          {/* Picker portals - rendered at document.body to escape overflow:hidden */}
          {showEmojiPicker &&
            createPortal(
              <div data-picker-portal style={emojiAnchorStyle} className={formStyles.pickerPopupPortal}>
                <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
              </div>,
              document.body,
            )}
          {showMentionPicker &&
            createPortal(
              <div data-picker-portal style={mentionAnchorStyle} className={formStyles.pickerPopupPortal}>
                <MentionPicker
                  commentUsers={commentUsers}
                  onSelect={handleMentionSelect}
                  onClose={() => setShowMentionPicker(false)}
                />
              </div>,
              document.body,
            )}
          {/* Inline mention picker - shown when user types @word in the chat input */}
          {mentionQuery !== null &&
            createPortal(
              <div data-picker-portal style={getInputAreaAnchorStyle()} className={formStyles.pickerPopupPortal}>
                <MentionPicker
                  commentUsers={commentUsers}
                  externalQuery={mentionQuery}
                  onSelect={handleInlineMentionSelect}
                  onClose={() => setMentionQuery(null)}
                />
              </div>,
              document.body,
            )}
          {showGifPicker &&
            createPortal(
              <div data-picker-portal style={gifAnchorStyle} className={formStyles.pickerPopupPortal}>
                <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
              </div>,
              document.body,
            )}
          <div className={formStyles.inputRow}>
            <RichTextarea
              ref={richInputRef}
              className={formStyles.messageInput}
              placeholder="Write a message... (Ctrl+Enter to send)"
              onChange={setMessageText}
              onKeyDown={handleKeyDown}
              onMentionSearch={handleMentionSearch}
              disabled={isSending}
            />
            <button
              className={formStyles.sendButton}
              title="Send (Ctrl+Enter)"
              onClick={() => void handleSend()}
              disabled={isSending || !messageText.trim()}
            >
              <Icon
                icon={isSending ? 'mdi:loading' : 'mdi:send'}
                width="18"
                height="18"
                className={isSending ? formStyles.spinning : undefined}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
