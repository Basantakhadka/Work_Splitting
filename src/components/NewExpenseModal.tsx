'use client';

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createExpenseAsync, NewExpenseInput } from '@/store/slices/expensesSlice';
import { selectRemainingBalance } from '@/store/selectors';
import { toast } from 'sonner';

// Titles from api.mock.ts used as the category/title reference
const EXPENSE_TITLES = [
  'Dinner with Client',
  'Uber to Airport',
  'WeWork Pass',
  'Figma Subscription',
  'AWS Hosting',
  'Office Snacks',
] as const;

const EMPLOYEES = ['Jane Doe', 'John Smith', 'Alice Johnson'] as const;

const CATEGORIES = ['Travel', 'Software', 'Meals', 'Office Supplies'] as const;

const TITLE_TO_CATEGORY: Record<string, string> = {
  'Dinner with Client': 'Meals',
  'Uber to Airport': 'Travel',
  'WeWork Pass': 'Office Supplies',
  'Figma Subscription': 'Software',
  'AWS Hosting': 'Software',
  'Office Snacks': 'Meals',
};

// Zod schema for form validation
const createExpenseFormSchema = (remainingBalance: number) =>
  z.object({
    title: z
      .string()
      .min(1, 'Expense reference is required')
      .refine(
        (val) => EXPENSE_TITLES.includes(val as any),
        'Please select a valid expense reference'
      ),
    amount: z
      .number()
      .positive('Amount must be greater than 0')
      .finite('Amount must be a valid number')
      .refine(
        (val) => val <= remainingBalance,
        `Amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`
      ),
    employee: z
      .string()
      .min(1, 'Employee is required')
      .refine(
        (val) => EMPLOYEES.includes(val as any),
        'Please select a valid employee'
      ),
    category: z
      .string()
      .min(1, 'Category is required')
      .refine(
        (val) => CATEGORIES.includes(val as any),
        'Please select a valid category'
      ),
  });

interface NewExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  title: string;
  amount: string;
  employee: string;
  category: string;
}

interface FormErrors {
  title?: string;
  amount?: string;
  employee?: string;
  category?: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  amount: '',
  employee: '',
  category: '',
};

export function NewExpenseModal({ open, onOpenChange }: NewExpenseModalProps) {
  const dispatch = useAppDispatch();
  const remainingBalance = useAppSelector(selectRemainingBalance);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [open]);

  // Auto-fill category when title changes
  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      category: TITLE_TO_CATEGORY[title] ?? prev.category,
    }));
    // Clear title error when user changes it
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  // Clear employee error when selection is made
  const handleEmployeeChange = (employee: string) => {
    setForm((prev) => ({ ...prev, employee }));
    if (errors.employee) {
      setErrors((prev) => ({ ...prev, employee: undefined }));
    }
  };

  // Clear category error when selection is made
  const handleCategoryChange = (category: string) => {
    setForm((prev) => ({ ...prev, category }));
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: undefined }));
    }
  };

  // Real-time validation for amount as user types
  const handleAmountChange = (amountStr: string) => {
    setForm((prev) => ({ ...prev, amount: amountStr }));

    const parsedValue = parseFloat(amountStr) || 0;

    // Clear any previous amount errors
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }

    // Validate the amount in real-time
    if (amountStr.trim() === '') {
      return; // Allow empty input while typing
    }

    if (parsedValue <= 0) {
      setErrors((prev) => ({
        ...prev,
        amount: 'Amount must be greater than 0',
      }));
    } else if (parsedValue > remainingBalance) {
      setErrors((prev) => ({
        ...prev,
        amount: `Amount cannot exceed remaining balance of $${remainingBalance.toFixed(2)}`,
      }));
    }
  };

  const parsedAmount = parseFloat(form.amount) || 0;
  const noRemainingBalance = remainingBalance <= 0;
  const hasValidationErrors = Object.values(errors).some((err) => err);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate using Zod schema
    const schema = createExpenseFormSchema(remainingBalance);
    const result = schema.safeParse({
      title: form.title,
      amount: parsedAmount,
      employee: form.employee,
      category: form.category,
    });

    if (!result.success) {
      // Extract field-level errors
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field as keyof FormErrors] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Validation passed
    setErrors({});
    setIsSubmitting(true);

    try {
      const payload: NewExpenseInput = {
        title: form.title,
        amount: parsedAmount,
        employee: form.employee,
        category: form.category,
      };
      await dispatch(createExpenseAsync(payload)).unwrap();
      toast.success(`Expense "${form.title}" added successfully`);
      onOpenChange(false);
    } catch {
      toast.error('Failed to create expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal */}
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-lg bg-white rounded-xl shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
            <Dialog.Title className="text-lg font-bold text-slate-900">
              New Expense
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-500 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Balance Banner */}
          <div
            className={`mx-6 mt-5 px-4 py-3 rounded-lg flex items-start gap-3 ${
              noRemainingBalance
                ? 'bg-rose-50 border border-rose-200'
                : 'bg-indigo-50 border border-indigo-200'
            }`}
          >
            {noRemainingBalance && (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 flex items-center justify-between">
              <span
                className={`text-sm font-medium ${
                  noRemainingBalance ? 'text-rose-800' : 'text-indigo-800'
                }`}
              >
                {noRemainingBalance
                  ? 'No remaining balance — adding expenses is disabled'
                  : 'Remaining Balance'}
              </span>
              {!noRemainingBalance && (
                <span className="text-sm font-bold text-indigo-900">
                  ${remainingBalance.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Amount warning - from Zod validation */}
          {errors.amount && (
            <div className="mx-6 mt-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <p className="text-xs text-rose-800">{errors.amount}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Title / Reference */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Expense Reference <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={noRemainingBalance}
                className={`w-full px-3 py-2.5 border rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.title
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
              >
                <option value="">Select a reference...</option>
                {EXPENSE_TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.title && (
                <p className="mt-1 text-xs text-rose-600">{errors.title}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Amount ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                disabled={noRemainingBalance}
                placeholder={`Max $${remainingBalance.toFixed(2)}`}
                className={`w-full px-3 py-2.5 border rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                  errors.amount
                    ? 'border-rose-400 focus:ring-rose-400'
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
              />
              {errors.amount ? (
                <p className="mt-1 text-xs text-rose-600">{errors.amount}</p>
              ) : parsedAmount > 0 ? (
                <p className="mt-1 text-xs text-slate-500">
                  Balance after:{' '}
                  <span className="font-medium text-emerald-600">
                    ${(remainingBalance - parsedAmount).toFixed(2)}
                  </span>
                </p>
              ) : null}
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Employee */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.employee}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  disabled={noRemainingBalance}
                  className={`w-full px-3 py-2.5 border rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.employee
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">Select...</option>
                  {EMPLOYEES.map((emp) => (
                    <option key={emp} value={emp}>
                      {emp}
                    </option>
                  ))}
                </select>
                {errors.employee && (
                  <p className="mt-1 text-xs text-rose-600">{errors.employee}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  disabled={noRemainingBalance}
                  className={`w-full px-3 py-2.5 border rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    errors.category
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-300 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-rose-600">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-2 border-t border-slate-200">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting || noRemainingBalance || hasValidationErrors}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : noRemainingBalance ? (
                  'No Balance Available'
                ) : hasValidationErrors ? (
                  'Fix Errors Above'
                ) : (
                  'Add Expense'
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
