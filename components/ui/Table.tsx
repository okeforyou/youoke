import React, { ReactNode, ThHTMLAttributes, TdHTMLAttributes, HTMLAttributes } from 'react';

/**
 * Table Component - Reusable data table with DaisyUI styling
 *
 * Features:
 * - Responsive table (horizontal scroll on mobile)
 * - Zebra stripes option
 * - Compact/normal size
 * - Pinned header
 * - Hover effect
 * - Loading and empty states
 *
 * @example
 * ```tsx
 * <Table zebra compact>
 *   <Table.Header>
 *     <Table.Row>
 *       <Table.Head>ชื่อ</Table.Head>
 *       <Table.Head>อีเมล</Table.Head>
 *       <Table.Head align="right">สถานะ</Table.Head>
 *     </Table.Row>
 *   </Table.Header>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>John Doe</Table.Cell>
 *       <Table.Cell>john@example.com</Table.Cell>
 *       <Table.Cell align="right">
 *         <Badge variant="success">Active</Badge>
 *       </Table.Cell>
 *     </Table.Row>
 *   </Table.Body>
 * </Table>
 * ```
 */

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Table children (Table.Header, Table.Body, Table.Footer) */
  children: ReactNode;
  /** Zebra stripes for rows */
  zebra?: boolean;
  /** Compact size (smaller padding) */
  compact?: boolean;
  /** Pin table header */
  pinHeader?: boolean;
  /** Responsive horizontal scroll */
  responsive?: boolean;
  /** Hover effect on rows */
  hover?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function Table({
  children,
  zebra = false,
  compact = false,
  pinHeader = false,
  responsive = true,
  hover = false,
  className = '',
  ...props
}: TableProps) {
  const getTableClasses = () => {
    const classes = ['table', 'w-full'];

    if (zebra) classes.push('table-zebra');
    if (compact) classes.push('table-compact');
    if (pinHeader) classes.push('table-pin-rows');
    if (hover) classes.push('table-hover');

    if (className) classes.push(className);

    return classes.join(' ');
  };

  const tableElement = (
    <table className={getTableClasses()} {...props}>
      {children}
    </table>
  );

  // Wrap in responsive container if needed
  if (responsive) {
    return (
      <div className="overflow-x-auto">
        {tableElement}
      </div>
    );
  }

  return tableElement;
}

// Table.Header - Table header section
interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

Table.Header = function TableHeader({ children, className = '', ...props }: TableHeaderProps) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
};

// Table.Body - Table body section
interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

Table.Body = function TableBody({ children, className = '', ...props }: TableBodyProps) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
};

// Table.Footer - Table footer section
interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
  className?: string;
}

Table.Footer = function TableFooter({ children, className = '', ...props }: TableFooterProps) {
  return (
    <tfoot className={className} {...props}>
      {children}
    </tfoot>
  );
};

// Table.Row - Table row
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
  /** Highlight row (e.g., selected row) */
  active?: boolean;
  /** Clickable row */
  onClick?: () => void;
  className?: string;
}

Table.Row = function TableRow({
  children,
  active = false,
  onClick,
  className = '',
  ...props
}: TableRowProps) {
  const classes = [
    active ? 'active' : '',
    onClick ? 'cursor-pointer hover:bg-base-200' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <tr className={classes} onClick={onClick} {...props}>
      {children}
    </tr>
  );
};

// Table.Head - Table header cell
interface TableHeadProps extends ThHTMLAttributes<HTMLTableHeaderCellElement> {
  children: ReactNode;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Sortable column */
  sortable?: boolean;
  /** Sort direction (for sortable columns) */
  sortDirection?: 'asc' | 'desc' | null;
  /** Sort callback */
  onSort?: () => void;
  className?: string;
}

Table.Head = function TableHead({
  children,
  align = 'left',
  sortable = false,
  sortDirection = null,
  onSort,
  className = '',
  ...props
}: TableHeadProps) {
  const getAlignClass = () => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const handleClick = () => {
    if (sortable && onSort) {
      onSort();
    }
  };

  return (
    <th
      className={`${getAlignClass()} ${sortable ? 'cursor-pointer select-none hover:bg-base-200' : ''} ${className}`}
      onClick={handleClick}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {sortable && (
          <span className="flex flex-col">
            {sortDirection === 'asc' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            )}
            {sortDirection === 'desc' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            {sortDirection === null && (
              <svg className="w-4 h-4 opacity-40" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 12l5 5 5-5H5zm10-4L10 3 5 8h10z" />
              </svg>
            )}
          </span>
        )}
      </div>
    </th>
  );
};

// Table.Cell - Table data cell
interface TableCellProps extends TdHTMLAttributes<HTMLTableDataCellElement> {
  children: ReactNode;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  className?: string;
}

Table.Cell = function TableCell({
  children,
  align = 'left',
  className = '',
  ...props
}: TableCellProps) {
  const getAlignClass = () => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  return (
    <td className={`${getAlignClass()} ${className}`} {...props}>
      {children}
    </td>
  );
};

/**
 * Table.Loading - Loading state for table
 */
interface TableLoadingProps {
  /** Number of skeleton rows to show */
  rows?: number;
  /** Number of columns */
  columns?: number;
  className?: string;
}

Table.Loading = function TableLoading({
  rows = 5,
  columns = 3,
  className = '',
}: TableLoadingProps) {
  return (
    <Table.Body className={className}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Table.Row key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Table.Cell key={colIndex}>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </Table.Cell>
          ))}
        </Table.Row>
      ))}
    </Table.Body>
  );
};

/**
 * Table.Empty - Empty state for table
 */
interface TableEmptyProps {
  /** Empty state message */
  message?: string;
  /** Number of columns (for colspan) */
  columns?: number;
  /** Custom empty state content */
  children?: ReactNode;
  className?: string;
}

Table.Empty = function TableEmpty({
  message = 'ไม่มีข้อมูล',
  columns = 1,
  children,
  className = '',
}: TableEmptyProps) {
  return (
    <Table.Body>
      <Table.Row>
        <Table.Cell colSpan={columns} align="center" className={`py-12 ${className}`}>
          {children || (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <svg
                className="w-12 h-12 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-sm font-medium">{message}</p>
            </div>
          )}
        </Table.Cell>
      </Table.Row>
    </Table.Body>
  );
};

/**
 * Table.Pagination - Simple pagination for table
 *
 * @example
 * ```tsx
 * <Table.Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => setCurrentPage(page)}
 *   itemsPerPage={10}
 *   totalItems={95}
 * />
 * ```
 */
interface TablePaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Items per page (for display) */
  itemsPerPage?: number;
  /** Total items count (for display) */
  totalItems?: number;
  className?: string;
}

Table.Pagination = function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  className = '',
}: TablePaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const startItem = itemsPerPage && totalItems ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem = itemsPerPage && totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  return (
    <div className={`flex items-center justify-between py-4 ${className}`}>
      {/* Info */}
      {startItem && endItem && totalItems && (
        <div className="text-sm text-gray-600">
          แสดง {startItem}-{endItem} จากทั้งหมด {totalItems} รายการ
        </div>
      )}

      {/* Pagination Controls */}
      <div className="join">
        <button
          className="join-item btn btn-sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          «
        </button>
        <button className="join-item btn btn-sm">
          หน้า {currentPage} / {totalPages}
        </button>
        <button
          className="join-item btn btn-sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          »
        </button>
      </div>
    </div>
  );
};
