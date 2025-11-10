export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginate<T>(
  items: T[],
  total: number,
  { page = 1, limit = 10 }: PaginationOptions,
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data: items,
    total,
    page,
    limit,
    totalPages,
  };
}
