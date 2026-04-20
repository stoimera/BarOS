/**
 * API Pagination Utilities
 * 
 * Standardized pagination for API responses
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(req: URL): PaginationParams {
  const page = Math.max(1, parseInt(req.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.searchParams.get('limit') || '10', 10)));
  
  return { page, limit };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginatedResponse<any>['pagination'] {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: calculatePagination(page, limit, total),
  };
}

/**
 * Get offset for database queries
 */
export function getOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

