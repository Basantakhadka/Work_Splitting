'use client';

import React from 'react';
import { Expense } from '@/services/api.mock';
import { X, FileText, User, DollarSign, Calendar, Tag } from 'lucide-react';

interface DetailViewProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DetailView({ expense, isOpen, onClose }: DetailViewProps) {
  if (!isOpen || !expense) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-slate-200 bg-white">
            <h2 className="text-xl font-bold text-slate-900">Expense Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <FileText className="w-4 h-4" />
                TITLE
              </div>
              <p className="text-lg font-semibold text-slate-900">
                {expense.title}
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <DollarSign className="w-4 h-4" />
                AMOUNT
              </div>
              <p className="text-2xl font-bold text-indigo-600">
                ${expense.amount.toFixed(2)}
              </p>
            </div>

            {/* Employee */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <User className="w-4 h-4" />
                EMPLOYEE
              </div>
              <p className="font-medium text-slate-900">{expense.employee}</p>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Tag className="w-4 h-4" />
                CATEGORY
              </div>
              <p className="font-medium text-slate-900">{expense.category}</p>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Calendar className="w-4 h-4" />
                DATE
              </div>
              <p className="font-medium text-slate-900">
                {new Date(expense.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                STATUS
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    expense.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : expense.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : expense.status === 'rejected'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {expense.status}
                </span>
              </div>
            </div>

            {/* ID */}
            <div className="space-y-1 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-mono">{expense.id}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 border-t border-slate-200 p-4 bg-slate-50 flex gap-2">
            <button
              onClick={onClose}
              className="btn btn-outline flex-1 border-none"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
