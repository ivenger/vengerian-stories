
export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/[&<>"']/g, (match) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[match] || match);
};
