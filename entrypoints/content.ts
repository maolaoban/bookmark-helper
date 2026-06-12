import type { PageMetadata } from '../types';

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      console.log(message);
      // if (message.type === 'extract-metadata') {
      //   const metadata = extractPageMetadata();
      //   sendResponse({ type: 'metadata-extracted', payload: metadata });
      //   return true;
      // }
    });
  },
});

function extractPageMetadata(): PageMetadata {
  const getMeta = (name: string) =>
    document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';

  const getOg = (prop: string) =>
    document.querySelector(`meta[property="og:${prop}"]`)?.getAttribute('content') || '';

  const pageTitle = document.title || '';
  const metaDescription = getMeta('description');
  const ogTitle = getOg('title');
  const ogDescription = getOg('description');

  // 提取正文前 200 字符
  let bodyText = '';
  const article = document.querySelector('article') || document.querySelector('main') || document.body;
  if (article?.textContent) {
    bodyText = article.textContent.replace(/\s+/g, ' ').trim().slice(0, 200);
  }

  const description = metaDescription || ogDescription || bodyText.slice(0, 100);

  return {
    url: window.location.href,
    title: pageTitle,
    description,
    ogTitle: ogTitle || undefined,
    ogDescription: ogDescription || undefined,
    metaDescription: metaDescription || undefined,
    bodyText: bodyText || undefined,
  };
}
