export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  postCount: number;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

export interface Tag {
  _id: string;
  name: string;
  slug: string;
}
