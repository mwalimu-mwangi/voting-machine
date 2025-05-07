import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column {
  header: string;
  accessorKey: string;
  cell?: (props: any) => React.ReactNode;
}

interface PaginationProps {
  page: number;
  pageCount: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  pagination?: PaginationProps;
}

export default function DataTable({ data, columns, pagination }: DataTableProps) {
  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                {columns.map((column, idx) => (
                  <th 
                    key={idx} 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {data.length > 0 ? (
                data.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {columns.map((column, colIdx) => (
                      <td key={colIdx} className="whitespace-nowrap px-6 py-4 text-sm text-neutral-500">
                        {column.cell ? (
                          column.cell({ row, rowIdx, column })
                        ) : (
                          column.accessorKey.includes('.') ? 
                            (function() {
                              try {
                                return column.accessorKey.split('.').reduce((obj, key) => obj ? obj[key] : undefined, row.original) || '-';
                              } catch (e) {
                                return '-';
                              }
                            })() : 
                            (row.original[column.accessorKey] || '-')
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={columns.length} 
                    className="whitespace-nowrap px-6 py-4 text-center text-sm text-neutral-500"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="mt-6 flex items-center justify-between border-t border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pageCount}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-neutral-700">
                Showing <span className="font-medium">{data.length > 0 ? ((pagination.page - 1) * 10) + 1 : 0}</span> to{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * 10, pagination.totalItems)}
                </span>{" "}
                of <span className="font-medium">{pagination.totalItems}</span> results
              </p>
            </div>
            {pagination.pageCount > 1 && (
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-l-md"
                    onClick={() => pagination.onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.pageCount) }).map((_, idx) => {
                    let pageNum: number;
                    
                    // Logic to show page numbers around the current page
                    if (pagination.pageCount <= 5) {
                      pageNum = idx + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = idx + 1;
                    } else if (pagination.page >= pagination.pageCount - 2) {
                      pageNum = pagination.pageCount - 4 + idx;
                    } else {
                      pageNum = pagination.page - 2 + idx;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? "default" : "outline"}
                        size="sm"
                        className={`${pagination.page === pageNum ? 'bg-primary text-white' : ''}`}
                        onClick={() => pagination.onPageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-r-md"
                    onClick={() => pagination.onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pageCount}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
