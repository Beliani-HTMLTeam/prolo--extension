export const trimLineBreaks = (str: string): string => {
  if (!str) return str;

  return str.replace(/^(<br\s*\/?>\s*)+|(\s*<br\s*\/?>)+$/gi, '')
}

export const trimAllLineBreaks = (str: string): string => {
  if (!str) return str;

    return str.replace(/^(<br\s*\/?>\s*)+|(\s*<br\s*\/?>)+$/gi, '');
}