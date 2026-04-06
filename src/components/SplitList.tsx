'use client';

import React, { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  selectSplitByTitlePending,
  selectSplitByTitleApproved,
  selectTotalPendingAmount,
  selectTotalApproved,
} from '@/store/selectors';
import { TrendingDown } from 'lucide-react';

type SplitTab = 'pending' | 'approved';

export function SplitList() {
  const [activeTab, setActiveTab] = useState<SplitTab>('pending');
  const splitDataPending = useAppSelector(selectSplitByTitlePending);
  const splitDataApproved = useAppSelector(selectSplitByTitleApproved);
  const totalPending = useAppSelector(selectTotalPendingAmount);
  const totalApproved = useAppSelector(selectTotalApproved);

  const splitData = activeTab === 'pending' ? splitDataPending : splitDataApproved;
  const total = activeTab === 'pending' ? totalPending : totalApproved;
  const isEmpty = splitData.length === 0;

  if (isEmpty && totalPending === 0 && totalApproved === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5" />
          Expense Split by Reference
        </h3>
        <div className="text-center py-8 text-slate-400">
          No expenses to split
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-6 card p-0 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)]">
      {/* Fixed Header */}
      <div className="px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Expense Split by Reference
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending
            {totalPending > 0 && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                ${totalPending.toFixed(2)}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'approved'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved
            {totalApproved > 0 && (
              <span className="ml-2 textx-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                ${totalApproved.toFixed(2)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
        {isEmpty ? (
          <div className="text-center py-8 text-slate-400">
            No {activeTab} expenses
          </div>
        ) : (
          <div className="space-y-4">
            {splitData.map((item, index) => {
              const colors = [
                'bg-indigo-500',
                'bg-emerald-500',
                'bg-amber-500',
                'bg-rose-500',
                'bg-cyan-500',
                'bg-violet-500',
              ];
              const borderColors = [
                'border-indigo-100 bg-indigo-50',
                'border-emerald-100 bg-emerald-50',
                'border-amber-100 bg-amber-50',
                'border-rose-100 bg-rose-50',
                'border-cyan-100 bg-cyan-50',
                'border-violet-100 bg-violet-50',
              ];

              const colorClass = colors[index % colors.length];
              const borderClass = borderColors[index % borderColors.length];

              return (
                <div
                  key={item.title}
                  className={`p-4 rounded-lg border ${borderClass} transition-all`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.count} expense{item.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">
                        ${item.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Footer Summary */}
      {!isEmpty && (
        <div className="px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">
              Total {activeTab === 'pending' ? 'Pending' : 'Approved'}
            </span>
            <span className="text-lg font-bold text-slate-900">
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
