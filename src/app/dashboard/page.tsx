"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchExpensesAsync } from "@/store/slices/expensesSlice";
import {
  selectAllExpenses,
  selectIsLoading,
  selectTotalApproved,
  selectTotalPending,
  selectTotalRejected,
  selectDeletedBalance,
} from "@/store/selectors";
import { Expense } from "@/services/api.mock";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft } from "lucide-react";

interface StatusDataPoint {
  name: string;
  value: number;
  color: string;
}

interface MonthStatusDataPoint {
  label: string;
  approved: number;
  pending: number;
  rejected: number;
  deleted: number;
}

function buildStatusData(
  approved: number,
  pending: number,
  rejected: number,
  deleted: number
): StatusDataPoint[] {
  const total = approved + pending + rejected + deleted;
  if (total === 0)
    return [{ name: "No Data", value: 1, color: "#e2e8f0" }];

  const data: StatusDataPoint[] = [];
  if (approved > 0) data.push({ name: "Approved", value: approved, color: "#10b981" });
  if (pending > 0) data.push({ name: "Pending", value: pending, color: "#f59e0b" });
  if (rejected > 0) data.push({ name: "Rejected", value: rejected, color: "#ef4444" });
  if (deleted > 0) data.push({ name: "Deleted", value: deleted, color: "#6b7280" });

  return data;
}

function buildMonthlyStatusData(expenses: Expense[]): MonthStatusDataPoint[] {
  const now = new Date();
  const monthMap = new Map<
    string,
    { approved: number; pending: number; rejected: number }
  >();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, { approved: 0, pending: 0, rejected: 0 });
  }

  expenses.forEach((exp) => {
    const d = new Date(exp.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = monthMap.get(key);
    if (!entry) return;

    if (exp.status === "approved") entry.approved += exp.amount;
    else if (exp.status === "pending") entry.pending += exp.amount;
    else if (exp.status === "rejected") entry.rejected += exp.amount;
  });

  return Array.from(monthMap.entries()).map(([key, vals]) => {
    const [year, month] = key.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    const label =
      date.toLocaleString("default", { month: "short" }) +
      " '" +
      String(year).slice(2);
    return {
      label,
      ...vals,
      deleted: 0,
    };
  });
}

function StatusTooltip({ active, payload }: { active?: boolean; payload?: { payload: StatusDataPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-slate-900 text-sm">{d.name}</p>
      <p className="text-slate-600 font-medium text-sm mt-1">${d.value.toFixed(0)}</p>
    </div>
  );
}

function MonthlyStatusTooltip({ active, payload }: { active?: boolean; payload?: { payload: MonthStatusDataPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const total = d.approved + d.pending + d.rejected;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-semibold text-slate-900 text-sm mb-2">{d.label}</p>
      {d.approved > 0 && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-emerald-600">Approved</span>
          <span className="font-semibold text-emerald-700">${d.approved.toFixed(0)}</span>
        </div>
      )}
      {d.pending > 0 && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-amber-600">Pending</span>
          <span className="font-semibold text-amber-700">${d.pending.toFixed(0)}</span>
        </div>
      )}
      {d.rejected > 0 && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-red-600">Rejected</span>
          <span className="font-semibold text-red-700">${d.rejected.toFixed(0)}</span>
        </div>
      )}
      {total > 0 && (
        <div className="border-t border-slate-100 pt-1 mt-2">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-slate-600">Total</span>
            <span className="font-semibold text-slate-900">${total.toFixed(0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InsightsDashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const expenses = useAppSelector(selectAllExpenses);
  const isLoading = useAppSelector(selectIsLoading);
  const totalApproved = useAppSelector(selectTotalApproved);
  const totalPending = useAppSelector(selectTotalPending);
  const totalRejected = useAppSelector(selectTotalRejected);
  const deletedBalance = useAppSelector(selectDeletedBalance);

  useEffect(() => {
    if (expenses.length === 0) dispatch(fetchExpensesAsync());
  }, [dispatch, expenses.length]);

  const statusData = buildStatusData(
    totalApproved,
    totalPending,
    totalRejected,
    deletedBalance
  );
  const monthlyData = buildMonthlyStatusData(expenses);

  const overallTotal = totalApproved + totalPending + totalRejected + deletedBalance;
  const approvedPct =
    overallTotal > 0 ? ((totalApproved / overallTotal) * 100).toFixed(1) : "0.0";
  const pendingPct =
    overallTotal > 0 ? ((totalPending / overallTotal) * 100).toFixed(1) : "0.0";
  const rejectedPct =
    overallTotal > 0 ? ((totalRejected / overallTotal) * 100).toFixed(1) : "0.0";
  const deletedPct =
    overallTotal > 0 ? ((deletedBalance / overallTotal) * 100).toFixed(1) : "0.0";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-slate-50">
      <div className="shrink-0 bg-white border-b border-slate-200 shadow-sm px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="btn btn-outline flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Expense Insights
            </h1>
            <p className="text-sm text-slate-500">
              Real-time status breakdown &amp; Monthly trends
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-500 text-sm">Loading insights…</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1 tracking-wider">
                    Approved
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${totalApproved.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{approvedPct}% of total</p>
                </div>

                <div className="card">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1 tracking-wider">
                    Pending
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    ${totalPending.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{pendingPct}% of total</p>
                </div>

                <div className="card">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1 tracking-wider">
                    Rejected
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    ${totalRejected.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{rejectedPct}% of total</p>
                </div>

                <div className="card">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-1 tracking-wider">
                    Deleted
                  </p>
                  <p className="text-2xl font-bold text-gray-600">
                    ${deletedBalance.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{deletedPct}% of total</p>
                </div>
              </div>

              <div className="card">
                <h2 className="text-base font-semibold text-slate-900 mb-5">
                  Status Distribution
                </h2>
                {statusData.length > 0 && statusData[0].name !== "No Data" ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={(entry) => `${entry.name}`}
                      >
                        {statusData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<StatusTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    No expense data to display
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="text-base font-semibold text-slate-900 mb-5">
                  Monthly Expenses by Status (12 Months)
                </h2>
                {monthlyData.some((m) => m.approved + m.pending + m.rejected > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => `$${v}`}
                        width={58}
                      />
                      <Tooltip
                        content={<MonthlyStatusTooltip />}
                        cursor={{ fill: "#f8fafc" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
                      <Bar dataKey="approved" stackId="a" fill="#10b981" name="Approved" />
                      <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
                      <Bar dataKey="rejected" stackId="a" fill="#ef4444" name="Rejected" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    No monthly expense data to display
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
