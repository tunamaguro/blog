import removeMd from "remove-markdown";

export function getMarkdownExcerpt(markdown: string, maxExcerptLength = 70) {
  let parsedText = removeMd(markdown);
  // 空白を正規化
  const contentText = parsedText.trim().replace(/\s+/g, " ");
  const excerpt = contentText.slice(0, maxExcerptLength);

  if (contentText.length > maxExcerptLength) {
    return excerpt + "...";
  }

  return excerpt;
}
