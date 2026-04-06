"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchExpensesAsync,
} from "@/store/slices/expensesSlice";
import {
  selectIsLoading,
  selectError,
  selectTotalBalance,
  selectTotalApproved,
  selectRemainingBalance,
  selectAvailableBalance,
  selectAllExpenses,
  selectDeletedBalance,
} from "@/store/selectors";
import { ExpenseTable } from "@/components/ExpenseTable";
import { SplitList } from "@/components/SplitList";
import { DetailView } from "@/components/DetailView";
import { NewExpenseModal } from "@/components/NewExpenseModal";
import { Expense } from "@/services/api.mock";
import {
  BarChart3,
  ReceiptText,
  AlertCircle,
} from "lucide-react";
import { toast, Toaster } from "sonner";

export default function ExpensesDashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  const totalBalance = useAppSelector(selectTotalBalance);
  const totalApproved = useAppSelector(selectTotalApproved);
  const remainingBalance = useAppSelector(selectRemainingBalance);
  const availableBalance = useAppSelector(selectAvailableBalance);
  const allExpenses = useAppSelector(selectAllExpenses);
  const deletedBalance = useAppSelector(selectDeletedBalance);

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);

  useEffect(() => {
    if (allExpenses.length === 0) {
      dispatch(fetchExpensesAsync());
    }
  }, [dispatch, allExpenses.length]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleViewDetail = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowDetailView(true);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toaster richColors position="bottom-right" />

      <div className="shrink-0 bg-slate-50 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 pt-8 pb-6">

      {/* Header */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2 font-sans">
            Expense Operations
          </h1>
          <p className="text-slate-500 text-lg">
            Manage your company's spending and approvals at scale.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-outline flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" /> View Insights
          </button>
          <button
            onClick={() => setShowNewExpense(true)}
            className="btn btn-primary flex items-center gap-2 shadow-indigo-100"
          >
            <ReceiptText className="w-4 h-4" /> New Expense
          </button>
        </div>
      </header>

      {/* Error Alert */}
      {error && !isLoading && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-rose-900">Error</h3>
            <p className="text-sm text-rose-800 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="rounded-xl shadow-sm border border-indigo-700/20 p-6 bg-indigo-600 text-white">
          <h3 className="font-medium opacity-80 mb-1">Total Balance</h3>
          <p className="text-3xl font-bold">${totalBalance.toFixed(2)}</p>
          <p className="text-xs opacity-75 mt-1">{allExpenses.length} expenses</p>
        </div>

        <div className="rounded-xl shadow-sm border border-rose-700/20 p-6 bg-rose-600 text-white">
          <h3 className="font-medium opacity-80 mb-1">Deleted Balance</h3>
          <p className="text-3xl font-bold">${deletedBalance.toFixed(2)}</p>
          <p className="text-xs opacity-75 mt-1">Removed from ledger</p>
        </div>

        <div className="card">
          <h3 className="text-slate-500 font-medium mb-1">Remaining</h3>
          <p className="text-2xl font-bold text-amber-600">
            ${remainingBalance.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pending approval</p>
        </div>

        <div className="card">
          <h3 className="text-slate-500 font-medium mb-1">Available</h3>
          <p className="text-2xl font-bold text-emerald-600">
            ${availableBalance.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Non-pending amount</p>
        </div>

        <div className="card">
          <h3 className="text-slate-500 font-medium mb-1">Approved</h3>
          <p className="text-2xl font-bold text-green-600">
            ${totalApproved.toFixed(2)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {totalBalance > 0 ? ((totalApproved / totalBalance) * 100).toFixed(1) : '0.0'}% of total
          </p>
        </div>
        </div>{/* end inner padding */}
        </div>{/* end fixed top zone */}
      </div>

      {/* ── Scrollable content below fixed header ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-6">

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Split List */}
        <div className="col-span-12 lg:col-span-4">
          <SplitList />
        </div>

        {/* Expense Table */}
        <div className="col-span-12 lg:col-span-8">
          {isLoading ? (
            <div className="card flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500">Loading expenses...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Expense List</h2>
              <ExpenseTable onViewDetail={handleViewDetail} />
            </div>
          )}
        </div>
        </div>

        </div>
      </div>

      {/* New Expense Modal */}
      <NewExpenseModal
        open={showNewExpense}
        onOpenChange={setShowNewExpense}
      />

      {/* Detail View Modal */}
      <DetailView
        expense={selectedExpense}
        isOpen={showDetailView}
        onClose={() => {
          setShowDetailView(false);
          setTimeout(() => setSelectedExpense(null), 300);
        }}
      />
    </div>
  );
}
