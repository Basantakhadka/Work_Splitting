import { RootState } from './store';


export const selectAllExpenses = (state: RootState) => state.expenses.expenses;

export const selectPagination = (state: RootState) => state.expenses.pagination;

export const selectFilters = (state: RootState) => state.expenses.filters;

export const selectIsLoading = (state: RootState) => state.expenses.isLoading;

export const selectError = (state: RootState) => state.expenses.error;

// Filtered expenses based on current filters
export const selectFilteredExpenses = (state: RootState) => {
  const { expenses, filters } = state.expenses;
  return expenses.filter((expense) => {
    if (filters.status !== 'all' && expense.status !== filters.status) return false;
    if (filters.category !== 'all' && expense.category !== filters.category) return false;
    if (filters.employee !== 'all' && expense.employee !== filters.employee) return false;
    return true;
  });
};

// Paginated expenses
export const selectPaginatedExpenses = (state: RootState) => {
  const filtered = selectFilteredExpenses(state);
  const { pageIndex, pageSize } = state.expenses.pagination;
  const start = pageIndex * pageSize;
  return filtered.slice(start, start + pageSize);
};

// Total count for pagination
export const selectTotalCount = (state: RootState) => {
  return selectFilteredExpenses(state).length;
};

// Balance calculations
export const selectTotalBalance = (state: RootState) => {
  return selectAllExpenses(state).reduce((sum, exp) => sum + exp.amount, 0);
};

export const selectTotalPending = (state: RootState) => {
  return selectAllExpenses(state)
    .filter((exp) => exp.status === 'pending')
    .reduce((sum, exp) => sum + exp.amount, 0);
};

export const selectTotalApproved = (state: RootState) => {
  return selectAllExpenses(state)
    .filter((exp) => exp.status === 'approved')
    .reduce((sum, exp) => sum + exp.amount, 0);
};

export const selectRemainingBalance = (state: RootState) => {
  return selectTotalBalance(state) - selectTotalApproved(state);
};

export const selectAvailableBalance = (state: RootState) => {
  return selectTotalBalance(state) - selectTotalPending(state);
};

export const selectDeletedBalance = (state: RootState) => state.expenses.deletedBalance;

export const selectTotalRejected = (state: RootState) => {
  return selectAllExpenses(state)
    .filter((exp) => exp.status === 'rejected')
    .reduce((sum, exp) => sum + exp.amount, 0);
};

// Split data by title
export const selectSplitByTitle = (state: RootState) => {
  const expenses = selectAllExpenses(state);
  const splitMap = new Map<string, number>();

  expenses.forEach((exp) => {
    const current = splitMap.get(exp.title) || 0;
    splitMap.set(exp.title, current + exp.amount);
  });

  return Array.from(splitMap.entries())
    .map(([title, amount]) => ({
      title,
      amount,
      percentage: (amount / selectTotalBalance(state)) * 100,
      count: expenses.filter((exp) => exp.title === title).length,
    }))
    .sort((a, b) => b.amount - a.amount);
};

// Split data by employee
export const selectSplitByEmployee = (state: RootState) => {
  const expenses = selectAllExpenses(state);
  const splitMap = new Map<string, number>();

  expenses.forEach((exp) => {
    const current = splitMap.get(exp.employee) || 0;
    splitMap.set(exp.employee, current + exp.amount);
  });

  return Array.from(splitMap.entries())
    .map(([employee, amount]) => ({
      employee,
      amount,
      percentage: (amount / selectTotalBalance(state)) * 100,
      count: expenses.filter((exp) => exp.employee === employee).length,
    }))
    .sort((a, b) => b.amount - a.amount);
};

// Split data by category
export const selectSplitByCategory = (state: RootState) => {
  const expenses = selectAllExpenses(state);
  const splitMap = new Map<string, number>();

  expenses.forEach((exp) => {
    const current = splitMap.get(exp.category) || 0;
    splitMap.set(exp.category, current + exp.amount);
  });

  return Array.from(splitMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / selectTotalBalance(state)) * 100,
      count: expenses.filter((exp) => exp.category === category).length,
    }))
    .sort((a, b) => b.amount - a.amount);
};

// Pending expenses only
export const selectPendingExpenses = (state: RootState) => {
  return selectAllExpenses(state).filter((exp) => exp.status === 'pending');
};

// Total pending amount
export const selectTotalPendingAmount = (state: RootState) => {
  return selectPendingExpenses(state).reduce((sum, exp) => sum + exp.amount, 0);
};

// Split data by title for pending expenses only
export const selectSplitByTitlePending = (state: RootState) => {
  const expenses = selectPendingExpenses(state);
  const totalPending = selectTotalPendingAmount(state);

  if (totalPending === 0) {
    return [];
  }

  const splitMap = new Map<string, number>();

  expenses.forEach((exp) => {
    const current = splitMap.get(exp.title) || 0;
    splitMap.set(exp.title, current + exp.amount);
  });

  return Array.from(splitMap.entries())
    .map(([title, amount]) => ({
      title,
      amount,
      percentage: (amount / totalPending) * 100,
      count: expenses.filter((exp) => exp.title === title).length,
      status: 'pending',
    }))
    .sort((a, b) => b.amount - a.amount);
};

// Split data by title for approved expenses only
export const selectSplitByTitleApproved = (state: RootState) => {
  const expenses = selectAllExpenses(state).filter((exp) => exp.status === 'approved');
  const totalApproved = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (totalApproved === 0) {
    return [];
  }

  const splitMap = new Map<string, number>();

  expenses.forEach((exp) => {
    const current = splitMap.get(exp.title) || 0;
    splitMap.set(exp.title, current + exp.amount);
  });

  return Array.from(splitMap.entries())
    .map(([title, amount]) => ({
      title,
      amount,
      percentage: (amount / totalApproved) * 100,
      count: expenses.filter((exp) => exp.title === title).length,
      status: 'approved',
    }))
    .sort((a, b) => b.amount - a.amount);
};
