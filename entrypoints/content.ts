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
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPageMetadata(): PageMetadata {
  const getMeta = (name: string) =>
    document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';

  const getOg = (prop: string) =>
    document.querySelector(`meta[property="og:${prop}"]`)?.getAttribute('content') || '';

  const pageTitle = document.title || '';
  const metaDescription = getMeta('description');
  const keywords = getMeta('keywords');
  const ogTitle = getOg('title');
  const ogDescription = getOg('description');

  let bodyText = '';
  const contentSelectors = ['article', 'main', '[role="main"]', '.content', '#content'];
  for (const selector of contentSelectors) {
    const el = document.querySelector(selector);
    if (el?.textContent) {
      bodyText = cleanText(el.textContent);
      break;
    }
  }
  if (!bodyText && document.body) {
    bodyText = cleanText(document.body.textContent || '');
  }

  let headerText = '';
  const header = document.querySelector('header') || document.querySelector('nav');
  if (header?.textContent) {
    headerText = cleanText(header.textContent);
  }

  let footerText = '';
  const footer = document.querySelector('footer');
  if (footer?.textContent) {
    footerText = cleanText(footer.textContent);
  }

  const description = metaDescription || ogDescription || bodyText.slice(0, 100);

  return {
    url: window.location.href,
    title: pageTitle,
    description,
    ogTitle: ogTitle || undefined,
    ogDescription: ogDescription || undefined,
    metaDescription: metaDescription || undefined,
    bodyText: bodyText.slice(0, 300) || undefined,
    headerText: headerText.slice(0, 200) || undefined,
    footerText: footerText.slice(0, 200) || undefined,
    keywords: keywords || undefined,
  };
}
