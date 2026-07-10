export const trimLineBreaks = (str: string): string => {
  if (!str) return str;

  return str.replace(/^(<br\s*\/?>\s*)+|(\s*<br\s*\/?>)+$/gi, '')
}

export const trimAllLineBreaks = (str: string): string => {
  if (!str) return str;

    return str.replace(/^(<br\s*\/?>\s*)+|(\s*<br\s*\/?>)+$/gi, '');
}

export const encodeEmojiToHtmlEntities = (text: string): string => {
  if (!text) return text;
  
  // Convert emoji and special Unicode characters to HTML hex entities
  // This preserves the emoji when displayed in HTML
  return Array.from(text).map(char => {
    const codePoint = char.codePointAt(0);
    if (codePoint && codePoint > 127) {
      // For emoji and special characters, use HTML hex entities
      return `&#x${codePoint.toString(16)};`;
    }
    return char;
  }).join('');
};

export const normalizeUnicodeText = (text: string): string => {
  if (!text) return text;
  
  // Normalize the string to ensure consistent encoding
  // NFC = Normalization Form Canonical Composition
  return text.normalize('NFC');
};