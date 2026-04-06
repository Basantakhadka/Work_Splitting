import { configureStore } from '@reduxjs/toolkit';
import expensesReducer from './slices/expensesSlice';

// Middleware to persist store to localStorage
const persistMiddleware = (store: any) => (next: any) => (action: any) => {
  const result = next(action);
  // Persist expenses state after every action
  const state = store.getState();
  if (typeof window !== 'undefined') {
    localStorage.setItem('expensesState', JSON.stringify(state.expenses));
  }
  return result;
};

export const store = configureStore({
  reducer: {
    expenses: expensesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(persistMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
