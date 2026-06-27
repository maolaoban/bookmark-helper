import type { PageMetadata } from '../types';

export default defineContentScript({
  matches: ['*://*/*'],
  main() {
    const metadata = extractPageMetadata();
    chrome.runtime.sendMessage({
      type: 'metadata-extracted',
      payload: metadata,
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'extract-metadata') {
        const freshMetadata = extractPageMetadata();
        sendResponse({ type: 'metadata-extracted', payload: freshMetadata });
        return true;
      }
    });
  },
});

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPageMetadata(): PageMetadata {
  const getMeta = (name: string) =>
    document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';

  const getOg = (prop: string) =>
    document.querySelector(`meta[property="og:${prop}"]`)?.getAttribute('content') || '';

  const pageTitle = cleanText(document.title || '');
  const description = cleanText(getMeta('description') || getOg('description'));
  const keywords = cleanText(getMeta('keywords'));

  let bodyText = '';
  const contentSelectors = ['article', 'main', '[role="main"]', '.content', '#content'];
  for (const selector of contentSelectors) {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (el?.innerText) {
      bodyText = cleanText(el.innerText);
      break;
    }
  }
  if (!bodyText && document.body) {
    bodyText = cleanText(document.body.innerText || '');
  }

  let headerText = '';
  const header = (document.querySelector('header') || document.querySelector('nav')) as HTMLElement | null;
  if (header?.innerText) {
    headerText = cleanText(header.innerText);
  }

  let footerText = '';
  const footer = document.querySelector('footer') as HTMLElement | null;
  if (footer?.innerText) {
    footerText = cleanText(footer.innerText);
  }

  return {
    url: window.location.href,
    title: pageTitle,
    description: description || bodyText.slice(0, 100),
    bodyText: bodyText.slice(0, 300) || undefined,
    headerText: headerText.slice(0, 200) || undefined,
    footerText: footerText.slice(0, 200) || undefined,
    keywords: keywords || undefined,
  };
}
