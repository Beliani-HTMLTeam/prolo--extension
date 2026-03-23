import axios from 'axios';
import type { MentionUser } from '../lib/types';

const isValidMentionUser = (user: MentionUser) => user.id !== '0' && user.value.toUpperCase() !== 'NONE';

let mentionUsersCache: MentionUser[] | null = null;
let mentionUsersFetchPromise: Promise<MentionUser[]> | null = null;

export const fetchMentionableUsers = (): Promise<MentionUser[]> => {
  if (mentionUsersCache !== null) return Promise.resolve(mentionUsersCache);
  if (mentionUsersFetchPromise !== null) return mentionUsersFetchPromise;

  const baseUrl = window.location.origin;
  const apiUrl = `${baseUrl}/api/filtersOptions/?type[]=users_ext&with_inactive_users=0`;

  mentionUsersFetchPromise = axios
    .get(apiUrl)
    .then(({ data }) => {
      const usersExt: Record<string, MentionUser> = data?.options?.users_ext ?? data?.users_ext ?? {};
      const filtered = Object.entries(usersExt)
        .map(([key, user]) => ({ ...user, key }))
        .filter(isValidMentionUser);
      mentionUsersCache = filtered;
      return filtered;
    })
    .catch(err => {
      console.error('Failed to fetch mentionable users:', err);
      mentionUsersFetchPromise = null;
      return [];
    });

  return mentionUsersFetchPromise;
};
