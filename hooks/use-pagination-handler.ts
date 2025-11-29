import { useCallback } from "react";

export interface PaginationState {
 pageIndex: number;
 pageSize: number;
}

/**
 * Page-level pagination hook - converts DataTable's 0-based pagination to backend's 1-based
 * Use this in page components that need server-side pagination
 * 
 * @example
 * const handlePaginationChange = usePaginationHandler(
 *   pagination.setPage,
 *   pagination.setLimit,
 *   isMountedRef
 * );
 */
export function usePaginationHandler(
 setPage: (page: number) => void,
 setLimit: (limit: number) => void,
 isMountedRef: React.RefObject<boolean>
) {
 return useCallback(
  (newPagination: PaginationState) => {
   if (isMountedRef.current) {
    setPage(newPagination.pageIndex + 1); // Convert 0-based to 1-based
    setLimit(newPagination.pageSize);
   }
  },
  [setPage, setLimit, isMountedRef]
 );
}
