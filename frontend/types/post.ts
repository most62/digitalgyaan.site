export interface PostSummary {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  category: { name: string; slug: string };
  author: { name: string; slug: string; avatar?: string };
  readingTime: number;
  viewsCount: number;
  likesCount: number;
  publishedAt: string;
}

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface PostDetail extends PostSummary {
  content: string;
  gallery: string[];
  tags: { name: string; slug: string }[];
  tableOfContents: TocEntry[];
  faqs: FaqEntry[];
  commentsCount: number;
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl?: string;
    ogImage?: string;
  };
}
