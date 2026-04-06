'use client';

import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from '@/store/store';
import { AppDispatch } from '@/store/store';
import { loadPersistedState, ExpensesState } from '@/store/slices/expensesSlice';

function PersistenceLoader() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('expensesState');
      if (saved) {
        dispatch(loadPersistedState(JSON.parse(saved) as ExpensesState));
      }
    } catch (e) {
      console.warn('Failed to restore expenses state from localStorage', e);
    }
  }, [dispatch]);

  return null;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistenceLoader />
      {children}
    </Provider>
  );
}
