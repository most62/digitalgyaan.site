import { Query } from 'mongoose';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}

const RESERVED_PARAMS = ['page', 'limit', 'sort', 'fields', 'search'];

export class ApiFeatures<T> {
  public query: Query<T[], T>;
  private readonly queryString: Record<string, unknown>;
  private page = 1;
  private limit = 12;

  constructor(query: Query<T[], T>, queryString: Record<string, unknown>) {
    this.query = query;
    this.queryString = queryString;
  }

  filter(): this {
    const queryObj: Record<string, unknown> = { ...this.queryString };
    RESERVED_PARAMS.forEach((param) => delete queryObj[param]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search(searchableFields: string[]): this {
    const term = this.queryString.search as string | undefined;
    if (term && term.trim()) {
      // Uses the model's text index when available (title/excerpt/content on Post),
      // falling back to a case-insensitive regex across the given fields otherwise.
      if (searchableFields.length === 0) {
        this.query = this.query.find({ $text: { $search: term } });
      } else {
        const regex = new RegExp(term.trim(), 'i');
        this.query = this.query.find({
          $or: searchableFields.map((field) => ({ [field]: regex })),
        });
      }
    }
    return this;
  }

  sort(defaultSort = '-createdAt'): this {
    const sortParam = this.queryString.sort as string | undefined;
    const sortMap: Record<string, string> = {
      newest: '-publishedAt',
      oldest: 'publishedAt',
      trending: '-viewsCount',
      'most-viewed': '-viewsCount',
      'most-liked': '-likesCount',
    };

    if (sortParam && sortMap[sortParam]) {
      this.query = this.query.sort(sortMap[sortParam]);
    } else if (sortParam) {
      this.query = this.query.sort(sortParam.split(',').join(' '));
    } else {
      this.query = this.query.sort(defaultSort);
    }
    return this;
  }

  limitFields(): this {
    const fields = this.queryString.fields as string | undefined;
    if (fields) {
      this.query = this.query.select(fields.split(',').join(' '));
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate(): this {
    this.page = Math.max(1, Number(this.queryString.page) || 1);
    this.limit = Math.min(50, Math.max(1, Number(this.queryString.limit) || 12));
    const skip = (this.page - 1) * this.limit;

    this.query = this.query.skip(skip).limit(this.limit);
    return this;
  }

  getPaginationState(): { page: number; limit: number } {
    return { page: this.page, limit: this.limit };
  }
}

export async function buildPaginationMeta(
  totalResults: number,
  page: number,
  limit: number
): Promise<PaginationMeta> {
  return {
    page,
    limit,
    totalResults,
    totalPages: Math.max(1, Math.ceil(totalResults / limit)),
  };
}
