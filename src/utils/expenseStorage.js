import { getActiveTenantId } from './saasStorage';

const getExpenseStorageKey = () => `respark_expenses_${getActiveTenantId()}`;
const getAccountsStorageKey = () => `respark_accounts_${getActiveTenantId()}`;

export const initialExpensesGlamour = [
  { id: 'EXP-001', amount: 5000, expenseType: 'Repair & Maintenance', notes: 'AC service and electrical wiring repair', paymode: 'Card', date: '26-Aug-2026' },
  { id: 'EXP-002', amount: 12000, expenseType: 'Rent Expense', notes: 'Monthly salon premise rent', paymode: 'Bank Transfer', date: '01-Aug-2026' },
  { id: 'EXP-003', amount: 2500, expenseType: 'Housekeeping Expense', notes: 'Cleaning and sanitization supplies', paymode: 'Cash', date: '15-Aug-2026' },
  { id: 'EXP-004', amount: 3500, expenseType: 'Salon Consumables', notes: 'Salon hair towels and cotton supplies', paymode: 'Card', date: '18-Aug-2026' },
];

export const initialExpensesNaturals = [
  { id: 'NAT-EXP-01', amount: 4500, expenseType: 'Salon Consumables', notes: 'Herbal extracts & oils supplies', paymode: 'Card', date: '15-Aug-2026' },
  { id: 'NAT-EXP-02', amount: 15000, expenseType: 'Rent Expense', notes: 'Hinjewadi salon premise rent', paymode: 'Bank Transfer', date: '01-Aug-2026' },
];

export const initialExpensesEnrich = [
  { id: 'ENR-EXP-01', amount: 28000, expenseType: 'Rent Expense', notes: 'Express Towers salon premise rent', paymode: 'Bank Transfer', date: '01-Aug-2026' },
  { id: 'ENR-EXP-02', amount: 8500, expenseType: 'Training Expense', notes: 'L\'Oreal Academy master training', paymode: 'Card', date: '12-Aug-2026' },
];

export const initialAccountsGlamour = [
  { id: 1, name: 'Current', type: 'Current Account', balance: 45200 },
  { id: 2, name: 'Vendor Payment Account', type: 'Escrow / Vendor', balance: 32000 },
  { id: 3, name: 'AXIS Bank Account', type: 'Savings', balance: 78500 },
  { id: 4, name: 'HDFC', type: 'Current', balance: 112000 },
  { id: 5, name: 'Canara Bank', type: 'Current', balance: 64500 },
  { id: 6, name: 'sbi', type: 'Savings', balance: 48900 },
];

export const initialAccountsNaturals = [
  { id: 1, name: 'Current', type: 'Current Account', balance: 62000 },
  { id: 2, name: 'ICICI Current', type: 'Current Account', balance: 145000 },
  { id: 3, name: 'Cash Register', type: 'Cash', balance: 15000 },
];

export const initialAccountsEnrich = [
  { id: 1, name: 'HDFC Corporate', type: 'Current Account', balance: 320000 },
  { id: 2, name: 'Axis Bank', type: 'Current Account', balance: 180000 },
  { id: 3, name: 'Petty Cash', type: 'Cash', balance: 25000 },
];

export const getExpenses = () => {
  const tenantId = getActiveTenantId();
  const key = getExpenseStorageKey();

  try {
    const data = localStorage.getItem(key);
    if (!data) {
      let initial = initialExpensesGlamour;
      if (tenantId === 'tenant_naturals') initial = initialExpensesNaturals;
      else if (tenantId === 'tenant_enrich') initial = initialExpensesEnrich;
      else if (tenantId !== 'tenant_glamour') initial = [];

      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

export const saveExpenses = (expenses) => {
  const key = getExpenseStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(expenses));
    window.dispatchEvent(new Event('expensesUpdated'));
  } catch (err) {
    console.error('Failed to save expenses:', err);
  }
};

export const getAccounts = () => {
  const tenantId = getActiveTenantId();
  const key = getAccountsStorageKey();

  try {
    const data = localStorage.getItem(key);
    if (!data) {
      let initial = initialAccountsGlamour;
      if (tenantId === 'tenant_naturals') initial = initialAccountsNaturals;
      else if (tenantId === 'tenant_enrich') initial = initialAccountsEnrich;
      else if (tenantId !== 'tenant_glamour') initial = [{ id: 1, name: 'Current Account', type: 'Current', balance: 0 }];

      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

export const saveAccounts = (accounts) => {
  const key = getAccountsStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(accounts));
    window.dispatchEvent(new Event('accountsUpdated'));
  } catch (err) {
    console.error('Failed to save accounts:', err);
  }
};
