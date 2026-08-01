export function ArticleContent({ html }: { html: string }) {
  // Content originates from our own TipTap-authored admin editor (trusted,
  // not user-submitted), and is processed server-side (heading anchors +
  // syntax highlighting) before reaching this component.
  return <div className="article-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
