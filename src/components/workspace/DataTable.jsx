import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox, Filter } from 'lucide-react';

export const DataTable = ({
  columns,
  data = [],
  searchKey = '',
  searchPlaceholder = 'Search records...',
  filterOptions = [],
  filterKey = 'status',
  onRowClick,
  itemsPerPage = 8,
  actions,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered & Searched Data
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Status/Category filter
      if (activeFilter !== 'ALL' && filterKey) {
        const itemVal = String(item[filterKey] || '').toUpperCase();
        if (itemVal !== activeFilter.toUpperCase()) return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (searchKey && item[searchKey]) {
          return String(item[searchKey]).toLowerCase().includes(term);
        }
        // General object search
        return Object.values(item).some((val) =>
          typeof val === 'string' || typeof val === 'number'
            ? String(val).toLowerCase().includes(term)
            : false
        );
      }
      return true;
    });
  }, [data, searchTerm, activeFilter, filterKey, searchKey]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return (
    <div className="bg-surface-pure rounded-2xl border border-brandBorder-subtle shadow-card overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-brandBorder-subtle bg-surface-pure flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-brandText-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-xs bg-surface-warm border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-medium"
          />
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {filterOptions.length > 0 && (
            <div className="flex items-center gap-1 bg-surface-warm p-1 rounded-xl border border-brandBorder-subtle">
              <button
                type="button"
                onClick={() => {
                  setActiveFilter('ALL');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                  activeFilter === 'ALL'
                    ? 'bg-forest-700 text-white shadow-sm'
                    : 'text-brandText-secondary hover:text-forest-800'
                }`}
              >
                All ({isLoading ? '...' : data.length})
              </button>
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setActiveFilter(opt.value);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors whitespace-nowrap ${
                    activeFilter === opt.value
                      ? 'bg-forest-700 text-white shadow-sm'
                      : 'text-brandText-secondary hover:text-forest-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {actions}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-brandBorder-subtle bg-surface-warm/60">
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`py-3 px-4 text-[11px] font-bold text-forest-900 uppercase tracking-wider ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brandBorder-subtle/70">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rIdx) => (
                <tr key={`skeleton-row-${rIdx}`} className="animate-pulse">
                  {columns.map((col, colIdx) => (
                    <td
                      key={`skeleton-td-${colIdx}`}
                      className={`py-3.5 px-4 text-xs ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {colIdx === 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-forest-100/80 shrink-0" />
                          <div className="space-y-1.5 flex-1 min-w-[120px]">
                            <div className="h-3.5 bg-forest-100/90 rounded w-28" />
                            <div className="h-2.5 bg-forest-50 rounded w-40" />
                          </div>
                        </div>
                      ) : colIdx === columns.length - 1 ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-7 w-16 bg-forest-100/70 rounded-lg" />
                          <div className="h-7 w-7 bg-forest-100/60 rounded-lg" />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="h-3 bg-forest-100/70 rounded w-20" />
                          <div className="h-2 bg-forest-50 rounded w-14" />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-forest-50/40 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      className={`py-3.5 px-4 text-xs text-brandText-main ${
                        col.align === 'right' ? 'text-right' : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-brandText-muted">
                    <div className="w-12 h-12 rounded-full bg-forest-50 flex items-center justify-center text-forest-600 mb-2">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-forest-800">No records found</p>
                    <p className="text-[11px] text-brandText-secondary mt-0.5">
                      Try adjusting your search criteria or active filters.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && filteredData.length > itemsPerPage && (
        <div className="p-3 border-t border-brandBorder-subtle bg-surface-warm/40 flex items-center justify-between text-xs text-brandText-secondary">
          <p className="text-[11px]">
            Showing <strong className="text-forest-900">{(currentPage - 1) * itemsPerPage + 1}</strong>{' '}
            to{' '}
            <strong className="text-forest-900">
              {Math.min(currentPage * itemsPerPage, filteredData.length)}
            </strong>{' '}
            of <strong className="text-forest-900">{filteredData.length}</strong> items
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-brandBorder-subtle hover:bg-forest-50 disabled:opacity-40 disabled:hover:bg-transparent"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 text-forest-800" />
            </button>
            <span className="px-2 font-bold text-[11px] text-forest-900">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-brandBorder-subtle hover:bg-forest-50 disabled:opacity-40 disabled:hover:bg-transparent"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4 text-forest-800" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
