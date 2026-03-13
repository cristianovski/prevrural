import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  // Configured specifically to support the rich text commands and standard elements used in the document editor
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'span', 'div', 'u', 's', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'hr', 'font'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'align', 'dir', 'color', 'size', 'face']
  });
}
