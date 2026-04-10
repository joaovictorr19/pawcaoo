export function createPageUrl(pageName: string) {
    if (!pageName) return '/';
    const key = pageName.trim();
    if (key.toLowerCase() === 'home') return '/';
    // Keep original casing (matches App routes) and remove spaces
    return '/' + key.replace(/\s+/g, '');
}