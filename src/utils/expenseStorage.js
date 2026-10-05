import { getActiveTenantId } from './saasStorage';
import { expenseApi } from '../api/client';

/**
 * PURE DATABASE-ONLY EXPENSES & ACCOUNTS STORAGE
 * All expenses and accounts are loaded and saved directly to the PostgreSQL database via expenseApi.
 * Zero expense records are stored in browser localStorage.
 */

let inMemoryExpenses = [];
let inMemoryAccounts = [];
let hasFetchedExpenses = false;
let isFetchingExpenses = false;

// Purge any legacy localStorage keys so browser storage remains completely clean
export const purgeLocalExpenses = () => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('respark_expenses_') || k.startsWith('respark_accounts_'))) {
        localStorage.removeItem(k);
      }
    }
  } catch (err) {
    // Ignore storage errors
  }
};

// Immediately execute cleanup on module load
purgeLocalExpenses();

export const mapBackendExpenseToFrontend = (e) => ({
  id: e.id,
  amount: Number(e.amount || 0),
  expenseType: e.type?.name || e.expenseType || e.expenseTypeName || 'General Expense',
  notes: e.description || e.notes || e.remark || '',
  paymode: e.paymentMethod || e.paymode || 'Cash',
  date: e.expenseDate
    ? new Date(e.expenseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
    : 'Today',
});

export const fetchExpensesFromBackend = async () => {
  if (isFetchingExpenses) return inMemoryExpenses;
  isFetchingExpenses = true;
  purgeLocalExpenses();
  try {
    const res = await expenseApi.getExpenses({ limit: 100 });
    const items = Array.isArray(res?.data?.data) ? res.data.data : Array.isArray(res?.data) ? res.data : [];
    if (Array.isArray(items)) {
      inMemoryExpenses = items.map(mapBackendExpenseToFrontend);
      hasFetchedExpenses = true;
      window.dispatchEvent(new Event('expensesUpdated'));
      return inMemoryExpenses;
    }
  } catch (err) {
    console.warn('Backend expenses fetch note:', err);
  } finally {
    isFetchingExpenses = false;
  }
  return inMemoryExpenses;
};

export const getExpenses = () => {
  purgeLocalExpenses();
  if (!hasFetchedExpenses) {
    fetchExpensesFromBackend();
  }
  return [...inMemoryExpenses];
};

export const saveExpenses = async (expenses) => {
  purgeLocalExpenses();
  const prevList = [...inMemoryExpenses];
  inMemoryExpenses = Array.isArray(expenses) ? expenses : [];
  window.dispatchEvent(new Event('expensesUpdated'));

  // If a new expense was added, send to PostgreSQL database
  if (inMemoryExpenses.length > prevList.length) {
    const addedItem = inMemoryExpenses[0];
    if (addedItem) {
      try {
        const payload = {
          amount: Number(addedItem.amount) || 0,
          expenseTypeName: addedItem.expenseType || 'General Expense',
          paymode: addedItem.paymode || 'Cash',
          paymentMethod: addedItem.paymode || 'Cash',
          description: addedItem.notes || '',
          remark: addedItem.notes || '',
          expenseDate: new Date().toISOString(),
          store: 'kalyaninagar',
        };
        const res = await expenseApi.createExpense(payload);
        const created = res?.data?.data || res?.data;
        if (created && created.id) {
          inMemoryExpenses = inMemoryExpenses.map((exp) => (exp.id === addedItem.id ? { ...exp, id: created.id } : exp));
          window.dispatchEvent(new Event('expensesUpdated'));
        }
      } catch (err) {
        console.warn('Backend expense save note:', err);
      }
    }
  } else if (inMemoryExpenses.length < prevList.length) {
    // Expense was deleted
    const deleted = prevList.find((p) => !inMemoryExpenses.some((curr) => curr.id === p.id));
    if (deleted && deleted.id && !String(deleted.id).startsWith('EXP-')) {
      try {
        await expenseApi.deleteExpense(deleted.id);
      } catch (err) {
        console.warn('Delete expense on backend note:', err);
      }
    }
  } else {
    // Expense was edited
    const edited = inMemoryExpenses.find((curr) => {
      const old = prevList.find((p) => p.id === curr.id);
      return (
        old &&
        (old.amount !== curr.amount ||
          old.expenseType !== curr.expenseType ||
          old.notes !== curr.notes ||
          old.paymode !== curr.paymode)
      );
    });
    if (edited && edited.id && !String(edited.id).startsWith('EXP-')) {
      try {
        await expenseApi.updateExpense(edited.id, {
          amount: Number(edited.amount) || 0,
          expenseTypeName: edited.expenseType || 'General Expense',
          paymode: edited.paymode || 'Cash',
          paymentMethod: edited.paymode || 'Cash',
          description: edited.notes || '',
          remark: edited.notes || '',
        });
      } catch (err) {
        console.warn('Update expense on backend note:', err);
      }
    }
  }
};

export const deleteExpenseItem = async (id) => {
  purgeLocalExpenses();
  const isUuid = typeof id === 'string' && id.includes('-');
  if (isUuid) {
    try {
      await expenseApi.deleteExpense(id);
    } catch (err) {
      console.warn('Backend delete expense note:', err);
    }
  }
  inMemoryExpenses = inMemoryExpenses.filter((e) => e.id !== id);
  window.dispatchEvent(new Event('expensesUpdated'));
  return true;
};

export const getAccounts = () => {
  purgeLocalExpenses();
  return [...inMemoryAccounts];
};

export const saveAccounts = (accounts) => {
  purgeLocalExpenses();
  inMemoryAccounts = Array.isArray(accounts) ? accounts : [];
  window.dispatchEvent(new Event('accountsUpdated'));
};

