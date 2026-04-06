'use client';

import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectPaginatedExpenses,
  selectPagination,
  selectTotalCount,
  selectTotalBalance,
  selectTotalApproved,
  selectRemainingBalance,
  selectAvailableBalance,
} from '@/store/selectors';
import {
  setPageIndex,
  setPageSize,
  deleteExpense,
  updateExpenseStatusAsync,
} from '@/store/slices/expensesSlice';
import { Expense } from '@/services/api.mock';
import {
  Check,
  X,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

const columnHelper = createColumnHelper<Expense>();

interface ExpenseTableProps {
  onViewDetail?: (expense: Expense) => void;
}

export function ExpenseTable({ onViewDetail }: ExpenseTableProps) {
  const dispatch = useAppDispatch();
  const expenses = useAppSelector(selectPaginatedExpenses);
  const pagination = useAppSelector(selectPagination);
  const totalCount = useAppSelector(selectTotalCount);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size !== expenses.length) {
      setSelectedIds(new Set(expenses.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleApprove = async (id: string) => {
    setIsUpdating((prev) => new Set([...prev, id]));
    try {
      await dispatch(
        updateExpenseStatusAsync({ id, status: 'approved' })
      ).unwrap();
      toast.success('Expense approved successfully');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      toast.error('Failed to approve expense');
    } finally {
      setIsUpdating((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReject = async (id: string) => {
    setIsUpdating((prev) => new Set([...prev, id]));
    try {
      await dispatch(
        updateExpenseStatusAsync({ id, status: 'rejected' })
      ).unwrap();
      toast.success('Expense rejected');
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      toast.error('Failed to reject expense');
    } finally {
      setIsUpdating((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = (id: string) => {
    dispatch(deleteExpense(id));
    toast.success('Expense deleted');
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    setIsUpdating((prev) => new Set([...prev, ...ids]));

    for (const id of ids) {
      try {
        await dispatch(
          updateExpenseStatusAsync({ id, status: 'approved' })
        ).unwrap();
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsUpdating(new Set());
    setSelectedIds(new Set());

    if (failCount === 0) {
      toast.success(`Approved ${successCount} expenses`);
    } else {
      toast.error(`${successCount} approved, ${failCount} failed`);
    }
  };

  const columns = [
    columnHelper.accessor('id', {
      id: 'select',
      header: () => (
        <input
          type="checkbox"
          checked={selectedIds.size === expenses.length && expenses.length > 0}
          onChange={toggleSelectAll}
          className="rounded border-slate-300 transform scale-110 accent-indigo-600"
        />
      ),
      cell: (info) => (
        <input
          type="checkbox"
          checked={selectedIds.has(info.row.original.id)}
          onChange={() => toggleSelect(info.row.original.id)}
          className="rounded border-slate-300 transform scale-110 accent-indigo-600"
        />
      ),
      size: 50,
    }),
    columnHelper.accessor('title', {
      header: 'EXPENSE',
      cell: (info) => (
        <div>
          <p className="font-semibold text-slate-900">{info.getValue()}</p>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-0.5">
            {info.row.original.category}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor('employee', {
      header: 'EMPLOYEE',
      cell: (info) => <span className="text-slate-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor('amount', {
      header: 'AMOUNT',
      cell: (info) => (
        <span className="font-mono font-medium text-slate-900 underline decoration-slate-200 underline-offset-4 decoration-1">
          ${info.getValue().toFixed(2)}
        </span>
      ),
      meta: { align: 'right' },
    }),
    columnHelper.accessor('date', {
      header: 'DATE',
      cell: (info) => (
        <span className="text-slate-600 text-sm">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'STATUS',
      cell: (info) => {
        const status = info.getValue();
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : status === 'approved'
                  ? 'bg-emerald-100 text-emerald-700'
                  : status === 'rejected'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-500'
            }`}
          >
            {status}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'ACTIONS',
      cell: (info) => {
        const expense = info.row.original;
        const isLoading = isUpdating.has(expense.id);

        return (
          <div className="flex gap-2 justify-end">
            {expense.status === 'pending' && (
              <>
                <button
                  onClick={() => handleApprove(expense.id)}
                  disabled={isLoading}
                  className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Approve"
                >
                  {isLoading ? (
                    <Zap className="w-5 h-5 animate-pulse" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleReject(expense.id)}
                  disabled={isLoading}
                  className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Reject"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={() => onViewDetail?.(expense)}
              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"
              title="View Details"
            >
              <Eye className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDelete(expense.id)}
              className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-md hover:text-slate-600 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        );
      },
      size: 160,
      meta: { sticky: 'right' },
    }),
  ];

  const table = useReactTable({
    data: expenses,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const pageCount = Math.ceil(totalCount / pagination.pageSize);
  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = pagination.pageIndex < pageCount - 1;

  return (
    <div className="space-y-4">
      {/* Selected Actions */}
      {selectedIds.size > 0 && (
        <div className="card bg-indigo-50 border border-indigo-200 flex items-center justify-between p-4 animate-in fade-in slide-in-from-top-2">
          <span className="text-indigo-900 font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkApprove}
              className="btn bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Approve Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn btn-outline border-indigo-200 text-indigo-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-slate-50 border-b border-slate-100"
              >
                {headerGroup.headers.map((header) => {
                  const sticky = (header.column.columnDef.meta as any)?.sticky;
                  return (
                    <th
                      key={header.id}
                      className={[
                        'py-4 font-semibold text-slate-600 text-sm bg-slate-50',
                        sticky === 'right' && 'sticky right-0 z-20 pl-6 pr-0',
                        !sticky && 'px-6',
                      ].filter(Boolean).join(' ')}
                      style={{
                        width: header.getSize(),
                        ...(sticky === 'right' ? { boxShadow: '-6px 0 12px -2px rgba(0,0,0,0.15)' } : {}),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-slate-400"
                >
                  No expenses found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const isSelected = selectedIds.has(row.original.id);
                const rowBg = isSelected ? '#eef2ff' : '#ffffff';
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const sticky = (cell.column.columnDef.meta as any)?.sticky;
                      return (
                        <td
                          key={cell.id}
                          className={[
                            'py-4',
                            sticky === 'right' && 'sticky right-0 z-10 pl-6 pr-0',
                            !sticky && 'px-6',
                          ].filter(Boolean).join(' ')}
                          style={{
                            ...(sticky ? { backgroundColor: rowBg } : {}),
                            ...(sticky === 'right' ? { boxShadow: '-6px 0 12px -2px rgba(0,0,0,0.12)' } : {}),
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="card flex items-center justify-between p-4">
        <div className="text-sm text-slate-600">
          Page {pagination.pageIndex + 1} of {Math.max(1, pageCount)} (
          {totalCount} total)
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => dispatch(setPageIndex(0))}
            disabled={!canPreviousPage}
            className="p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => dispatch(setPageIndex(pagination.pageIndex - 1))}
            disabled={!canPreviousPage}
            className="p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <select
            value={`page-${pagination.pageIndex}`}
            onChange={(e) => {
              const pageIndex = parseInt(e.target.value.split('-')[1], 10);
              dispatch(setPageIndex(pageIndex));
            }}
            className="px-3 py-1 border border-slate-200 rounded-md text-sm bg-white"
          >
            {Array.from({ length: pageCount }).map((_, i) => (
              <option key={i} value={`page-${i}`}>
                Page {i + 1}
              </option>
            ))}
          </select>

          <button
            onClick={() => dispatch(setPageIndex(pagination.pageIndex + 1))}
            disabled={!canNextPage}
            className="p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => dispatch(setPageIndex(pageCount - 1))}
            disabled={!canNextPage}
            className="p-2 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

          <div className="border-l border-slate-200 pl-4 ml-2 flex items-center gap-2">
            <label className="text-sm text-slate-600">Per Page:</label>
            <select
              value={pagination.pageSize}
              onChange={(e) => dispatch(setPageSize(Number(e.target.value)))}
              className="px-2 py-1 border border-slate-200 rounded-md text-sm bg-white"
            >
              {[5, 10, 15, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
