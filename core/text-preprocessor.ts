/**
 * 文本预处理模块
 * 将书签的 title + url 转换为干净的嵌入文本
 */

function parseUrl(url: string): { hostname: string; pathKeywords: string } {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '');

    const pathKeywords = parsed.pathname
      .split('/')
      .filter((seg) => seg.length > 0 && seg.length < 64)
      .filter((seg) => !/^\d+$/.test(seg))
      .map((seg) => seg.replace(/[-_.]/g, ' '))
      .join(' ');

    return { hostname, pathKeywords };
  } catch {
    return { hostname: '', pathKeywords: '' };
  }
}

/**
 * 构建用于向量嵌入的文本
 *
 * 例如:
 *   title="How to Cook Pasta"
 *   url="https://www.example.com/recipes/italian/pasta-guide.html?ref=home"
 *   => "how to cook pasta example.com recipes italian pasta guide"
 */
export function buildEmbeddingText(title: string, url: string): string {
  const { hostname, pathKeywords } = parseUrl(url);

  const parts = [
    title.trim(),
    hostname,
    pathKeywords,
  ].filter((p) => p.length > 0);

  return parts.join(' ').toLowerCase().slice(0, 512);
}

/**
 * 智能截断：在单词边界截断
 */
function truncateIntelligently(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > maxLength * 0.8 ? truncated.slice(0, lastSpace) : truncated;
}

/**
 * 构建增强文本（包含页面元数据），用于 enrichDocument
 */
export function buildEnrichedText(
  title: string,
  url: string,
  description: string,
  bodyText: string,
  headerText?: string,
  footerText?: string,
  keywords?: string,
): string {
  const base = buildEmbeddingText(title, url);
  const parts: string[] = [];

  if (keywords) parts.push(keywords);
  if (description) parts.push(description);
  if (headerText) parts.push(headerText.slice(0, 150));
  if (bodyText) parts.push(bodyText.slice(0, 200));
  if (footerText) parts.push(footerText.slice(0, 100));

  const enriched = [base, ...parts].join(' ');
  return truncateIntelligently(enriched, 512);
}
