import { getActiveTenantId } from './saasStorage';
import { cashierApi } from '../api/client';

/**
 * PURE DATABASE-ONLY CASHIER STORAGE
 * Cashiers are retrieved from PostgreSQL via cashierApi.
 * Zero cashiers are stored in browser localStorage.
 */

let inMemoryCashiers = [];
let hasFetchedCashiers = false;

export const purgeLocalCashiers = () => {
  try {
    const keysToRemove = [];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('respark_cashiers_') || k.startsWith('respark_cashier_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    });
  } catch (err) {}
};

purgeLocalCashiers();

export const mapBackendCashierToFrontend = (c) => ({
  id: c.id,
  name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Cashier',
  email: c.email || '',
  username: c.username || '',
  phone: c.phone || c.mobile || '',
  branchName: c.branchName || 'Main Counter',
  active: c.active !== undefined ? c.active : (c.status === 'ACTIVE'),
  tenantId: c.tenantId,
  createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'
});

export const fetchCashiersFromBackend = async () => {
  try {
    const res = await cashierApi.getCashiers();
    const items = Array.isArray(res?.data?.cashiers) ? res.data.cashiers : (Array.isArray(res?.data) ? res.data : []);
    if (items.length > 0) {
      inMemoryCashiers = items.map(mapBackendCashierToFrontend);
      hasFetchedCashiers = true;
      window.dispatchEvent(new Event('cashiersUpdated'));
      return inMemoryCashiers;
    }
  } catch (err) {
    console.warn('Backend cashiers fetch failed:', err);
  }
  return inMemoryCashiers;
};

export const getMasterCashiers = () => {
  if (!hasFetchedCashiers) {
    fetchCashiersFromBackend();
  }
  return [...inMemoryCashiers];
};

export const getCashiersForTenant = () => {
  return getMasterCashiers();
};

export const saveMasterCashiers = (cashiers) => {
  inMemoryCashiers = Array.isArray(cashiers) ? cashiers : [];
  window.dispatchEvent(new Event('cashiersUpdated'));
};

export const createCashier = (cashierData) => {
  const newCashier = {
    id: 'c_' + Date.now(),
    name: cashierData.name.trim(),
    email: cashierData.email.trim(),
    username: cashierData.username.trim(),
    password: cashierData.password || 'password123',
    phone: cashierData.phone || '',
    branchName: cashierData.branchName || 'Main Counter',
    active: cashierData.active !== undefined ? cashierData.active : true,
    createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  };
  inMemoryCashiers = [newCashier, ...inMemoryCashiers];
  window.dispatchEvent(new Event('cashiersUpdated'));
  return newCashier;
};

export const updateCashier = (cashierId, updatedFields) => {
  inMemoryCashiers = inMemoryCashiers.map(c => c.id === cashierId ? { ...c, ...updatedFields } : c);
  window.dispatchEvent(new Event('cashiersUpdated'));
  return inMemoryCashiers;
};

export const deleteCashier = (cashierId) => {
  inMemoryCashiers = inMemoryCashiers.filter(c => c.id !== cashierId);
  window.dispatchEvent(new Event('cashiersUpdated'));
  return inMemoryCashiers;
};
