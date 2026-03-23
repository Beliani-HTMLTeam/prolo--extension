export type CommentType = 'issuelog' | 'issuelog_corrective' | 'issuelog_comment_ping' | 'issuelog_comment';

export type Comment = {
  id: string;
  username: string;
  user_id: string;
  full_username: string;
  create_date: string;
  comment: string;
  comment_type: CommentType;
};

export type CommentsResponse = {
  comments: Comment[];
  alarm: null | string;
  comments_wrap: string;
  comments_highlight_reassign: number;
  email_log: any[];
  comment_notified: boolean;
  _exec_time: number;
};

/** Extract the numeric user IDs from all @Name(ID) mentions in a message. */
export const extractMentionIds = (message: string): string[] => {
  const ids = new Set<string>();
  const regex = /@[^@()]+\((\d+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(message)) !== null) {
    ids.add(match[1]);
  }
  return Array.from(ids);
};

export const sendComment = async (issueId: number, message: string): Promise<boolean> => {
  const domain = window.location.origin;
  const url = `${domain}/api/comments/save/`;

  const body = new URLSearchParams({
    page_id: String(issueId),
    comment_type: 'issuelog',
    comment: message,
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      console.warn('[comments] Send failed:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('[comments] Failed to send comment:', error);
    return false;
  }
};

const notifyMention = async (issueId: number, respPerson: string): Promise<boolean> => {
  const domain = window.location.origin;
  const params = new URLSearchParams({
    comment_type: 'issuelog',
    page_id: String(issueId),
    resp_person: respPerson,
  });
  const url = `${domain}/api/issueLog/changeResponsible/?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[comments] Mention notify failed:', response.status, respPerson);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('[comments] Mention notify request failed:', error, respPerson);
    return false;
  }
};

export const notifyMentionedUsers = async (issueId: number, respPersons: string[]): Promise<void> => {
  if (respPersons.length === 0) return;
  await Promise.all(respPersons.map(respPerson => notifyMention(issueId, respPerson)));
};

export const fetchComments = async (issueId: number): Promise<Comment[]> => {
  const domain = window.location.origin;
  const url = `${domain}/api/issueLog/comments/?comment_type=issuelog&page_id=${issueId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('[comments] API response not ok:', response.status);
      return [];
    }

    const data: CommentsResponse = await response.json();
    return data.comments || [];
  } catch (error) {
    console.warn('[comments] Failed to fetch comments:', error);
    return [];
  }
};
