import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchExpenses,
  updateExpenseStatus,
  createExpense,
  Expense,
} from '@/services/api.mock';

export interface ExpensesState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  deletedBalance: number;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  filters: {
    status: Expense['status'] | 'all';
    category: string | 'all';
    employee: string | 'all';
  };
}

const initialState: ExpensesState = {
  expenses: [],
  isLoading: false,
  error: null,
  deletedBalance: 0,
  pagination: {
    pageIndex: 0,
    pageSize: 10,
  },
  filters: {
    status: 'all',
    category: 'all',
    employee: 'all',
  },
};

// Async thunks
export const fetchExpensesAsync = createAsyncThunk(
  'expenses/fetchExpenses',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchExpenses();
      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateExpenseStatusAsync = createAsyncThunk(
  'expenses/updateStatus',
  async (
    { id, status }: { id: string; status: Expense['status'] },
    { rejectWithValue }
  ) => {
    try {
      await updateExpenseStatus(id, status);
      return { id, status };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export interface NewExpenseInput {
  title: string;
  amount: number;
  category: string;
  employee: string;
}

export const createExpenseAsync = createAsyncThunk(
  'expenses/createExpense',
  async (data: NewExpenseInput, { rejectWithValue }) => {
    try {
      const result = await createExpense({
        ...data,
        status: 'pending' as const,
        date: new Date().toISOString(),
      });
      return result as Expense;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setPageIndex: (state, action: PayloadAction<number>) => {
      state.pagination.pageIndex = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
      state.pagination.pageIndex = 0;
    },
    setStatusFilter: (state, action: PayloadAction<Expense['status'] | 'all'>) => {
      state.filters.status = action.payload;
      state.pagination.pageIndex = 0;
    },
    setCategoryFilter: (state, action: PayloadAction<string | 'all'>) => {
      state.filters.category = action.payload;
      state.pagination.pageIndex = 0;
    },
    setEmployeeFilter: (state, action: PayloadAction<string | 'all'>) => {
      state.filters.employee = action.payload;
      state.pagination.pageIndex = 0;
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      const target = state.expenses.find((exp) => exp.id === action.payload);
      if (target) {
        state.deletedBalance += target.amount;
      }
      state.expenses = state.expenses.filter((exp) => exp.id !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    loadPersistedState: (_state, action: PayloadAction<ExpensesState>) => {
      return action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpensesAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExpensesAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.expenses = action.payload;
        state.error = null;
        state.deletedBalance = 0;
      })
      .addCase(fetchExpensesAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateExpenseStatusAsync.pending, (state) => {
        // Optionally add a loading state for individual updates
      })
      .addCase(updateExpenseStatusAsync.fulfilled, (state, action) => {
        const expense = state.expenses.find((exp) => exp.id === action.payload.id);
        if (expense) {
          expense.status = action.payload.status;
        }
      })
      .addCase(updateExpenseStatusAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(createExpenseAsync.pending, (state) => {
        state.isLoading = false; // don't block UI, modal handles its own loading
      })
      .addCase(createExpenseAsync.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
      })
      .addCase(createExpenseAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setPageIndex,
  setPageSize,
  setStatusFilter,
  setCategoryFilter,
  setEmployeeFilter,
  deleteExpense,
  clearError,
  loadPersistedState,
} = expensesSlice.actions;

export default expensesSlice.reducer;
