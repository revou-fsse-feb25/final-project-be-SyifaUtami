export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface StudentsWithDataResult {
  students: any[];
  assignments: any[];
  progress: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}