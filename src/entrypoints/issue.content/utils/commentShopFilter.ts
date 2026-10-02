import { extractMentionIds, type Comment } from '../api/comments';
import { SHOP_TRANSLATORS, type TranslatorGroup } from '../lib/translators';

export const commentMatchesGroup = (comment: Comment, group: TranslatorGroup): boolean => {
  const authorIds = new Set(group.shops.flatMap(shop => SHOP_TRANSLATORS[shop] ?? []));
  if (authorIds.has(String(comment.user_id))) return true;

  const mentionIds = new Set(authorIds);
  if (group.mentionId) mentionIds.add(group.mentionId);
  return extractMentionIds(comment.comment).some(id => mentionIds.has(id));
};

export const filterCommentsByGroup = (comments: Comment[], group: TranslatorGroup | null): Comment[] =>
  group ? comments.filter(comment => commentMatchesGroup(comment, group)) : comments;
