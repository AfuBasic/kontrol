export default function usePathFromUrl(href: string): string {
    // Handle protocol-relative URLs like //app.kontrol.test/admin/residents
    if (href.startsWith('//')) {
        const pathStart = href.indexOf('/', 2);
        return pathStart !== -1 ? href.slice(pathStart) : '/';
    }
    // Handle full URLs
    if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
            return new URL(href).pathname;
        } catch {
            return href;
        }
    }
    return href;
}
