export type SearchFilterValue =
  | string
  | boolean
  | number
  | { min?: number; max?: number }
  | Array<string | boolean | number>;

export type SearchRequest = {
  categoryId: string;
  q?: string;
  filters?: Record<string, SearchFilterValue>; // keyed by attribute key
  page?: number;
  pageSize?: number;
};

