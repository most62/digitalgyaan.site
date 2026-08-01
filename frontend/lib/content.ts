import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Element, Root } from 'hast';
import type { TocEntry } from '@/types/post';

const HEADING_TAGS = new Set(['h2', 'h3', 'h4']);

function extractHeadings(toc: TocEntry[]) {
  return () => (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (!HEADING_TAGS.has(node.tagName)) return;

      const id = typeof node.properties?.id === 'string' ? node.properties.id : undefined;
      if (!id) return;

      const text = collectText(node);
      if (!text) return;

      toc.push({
        id,
        text,
        level: Number(node.tagName.replace('h', '')),
      });
    });
  };
}

function collectText(node: Element): string {
  let text = '';
  visit(node, 'text', (textNode: { value: string }) => {
    text += textNode.value;
  });
  return text.trim();
}

export interface ProcessedContent {
  html: string;
  toc: TocEntry[];
}

export async function processArticleContent(rawHtml: string): Promise<ProcessedContent> {
  const toc: TocEntry[] = [];

  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSlug)
    .use(extractHeadings(toc))
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify)
    .process(rawHtml);

  return { html: String(file), toc };
}
