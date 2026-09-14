/**
 * Extracts a clean, coherent plaintext preview from rich HTML content.
 * Ensures block-level elements (headings, paragraphs, blockquotes, lists)
 * are separated with proper spacing rather than being run together.
 */
export function extractAnnouncementPreview(html: string, maxLength: number = 280): string {
    if (!html || !html.trim()) return '';

    // Step 1: Remove script, style, and comments
    let cleaned = html
        .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
        .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
        .replace(/<!--.*?-->/gis, ' ');

    // Step 2: Separate block tags with spaces and line breaks so headings don't run into paragraphs
    cleaned = cleaned
        .replace(/<\/(h[1-6]|p|div|blockquote|li|ul|ol|header|footer)>/gi, ' \n ')
        .replace(/<(br|hr)\s*\/?>/gi, ' \n ')
        .replace(/<li[^>]*>/gi, ' • ')
        .replace(/<[^>]*>/g, ' ');

    // Step 3: Decode HTML entities
    cleaned = cleaned
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'");

    // Step 4: Normalize whitespaces and trim
    cleaned = cleaned
        .split('\n')
        .map((line) => line.trim().replace(/\s+/g, ' '))
        .filter((line) => line.length > 0)
        .join('\n\n');

    if (cleaned.length <= maxLength) {
        return cleaned;
    }

    // Truncate at nearest word boundary
    const truncated = cleaned.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 100 ? truncated.slice(0, lastSpace) : truncated).trim() + '...';
}
