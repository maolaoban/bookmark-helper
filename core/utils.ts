export function getBookmarkPath(id: string): Promise<string> {
    return new Promise((resolve) => {
        const walk = (currentId: string, path: string[] = []): void => {
            chrome.bookmarks.get(currentId, (results) => {
                if (results && results.length > 0) {
                    const item = results[0]!;
                    path.unshift(item.title);
                    if (item.parentId && item.parentId !== '0') {
                        walk(item.parentId, path);
                    } else {
                        const filtered = path.filter(
                            (name) =>
                                !['书签栏', 'Bookmarks bar', '其他书签', 'Other bookmarks'].includes(name)
                        );
                        resolve(filtered.join(' > '));
                    }
                } else {
                    resolve('');
                }
            });
        };
        walk(id);
    });
}