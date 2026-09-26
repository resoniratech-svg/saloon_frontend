import { getActiveTenantId, getTenants } from './saasStorage';

export const initialCashiers = {
  tenant_glamour: [
    {
      id: 'c_glamour_1',
      name: 'Pooja Sharma',
      email: 'pooja.cashier@saloon.com',
      username: 'cashier',
      password: 'password123',
      phone: '+91 9823412350',
      branchName: 'Main Counter',
      active: true,
      tenantId: 'tenant_glamour',
      createdAt: '15-Jan-2026'
    }
  ],
  tenant_naturals: [
    {
      id: 'c_naturals_1',
      name: 'Kavita Singh',
      email: 'kavita.cashier@naturalssalon.in',
      username: 'cashier',
      password: 'password123',
      phone: '+91 9845011223',
      branchName: 'Front Desk 1',
      active: true,
      tenantId: 'tenant_naturals',
      createdAt: '01-Feb-2026'
    }
  ],
  tenant_enrich: [
    {
      id: 'c_enrich_1',
      name: 'Priya Nair',
      email: 'priya.cashier@enrichstudio.com',
      username: 'cashier',
      password: 'password123',
      phone: '+91 9890188990',
      branchName: 'Billing Counter',
      active: true,
      tenantId: 'tenant_enrich',
      createdAt: '01-Mar-2026'
    }
  ]
};

export const getCashierStorageKey = () => {
  const tenantId = getActiveTenantId();
  return `respark_cashiers_${tenantId}`;
};

export const getCashiersForTenant = (tenantId) => {
  try {
    const key = `respark_cashiers_${tenantId}`;
    const data = localStorage.getItem(key);
    if (!data) {
      // Only predefined demo salons have initial mock cashiers. Custom salons start with 0 cashiers.
      const defaults = initialCashiers[tenantId] || [];
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      // Auto-clean: Remove auto-generated dummy cashier for custom salons
      if (!initialCashiers[tenantId]) {
        const cleaned = parsed.filter(c => !(
          (c.email && c.email.includes('cashier@tenant_')) ||
          (c.phone === '+91 9800000000' && c.name === 'Front Desk Cashier')
        ));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(key, JSON.stringify(cleaned));
          return cleaned;
        }
      }
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to get cashiers for tenant', err);
    return [];
  }
};

export const getMasterCashiers = () => {
  const tenantId = getActiveTenantId();
  return getCashiersForTenant(tenantId);
};

export const saveMasterCashiers = (cashiers) => {
  try {
    const key = getCashierStorageKey();
    localStorage.setItem(key, JSON.stringify(cashiers));
    window.dispatchEvent(new Event('cashiersUpdated'));
  } catch (err) {
    console.error('Failed to save cashiers', err);
  }
};

export const createCashier = (cashierData) => {
  const tenantId = getActiveTenantId();
  const current = getMasterCashiers();
  const newCashier = {
    id: 'c_' + Date.now(),
    name: cashierData.name.trim(),
    email: cashierData.email.trim(),
    username: cashierData.username.trim(),
    password: cashierData.password || 'password123',
    phone: cashierData.phone || '',
    branchName: cashierData.branchName || 'Main Counter',
    active: cashierData.active !== undefined ? cashierData.active : true,
    tenantId,
    createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  };
  const updated = [newCashier, ...current];
  saveMasterCashiers(updated);
  return newCashier;
};

export const updateCashier = (cashierId, updatedFields) => {
  const current = getMasterCashiers();
  const updated = current.map(c => {
    if (c.id === cashierId) {
      return { ...c, ...updatedFields };
    }
    return c;
  });
  saveMasterCashiers(updated);
  return updated;
};

export const deleteCashier = (cashierId) => {
  const current = getMasterCashiers();
  const updated = current.filter(c => c.id !== cashierId);
  saveMasterCashiers(updated);
  return updated;
};

// Check if credentials match any active cashier across all registered salons
export const findCashierByCredentials = (cleanUser, cleanPass) => {
  const tenants = getTenants();
  for (const tenant of tenants) {
    const cashiers = getCashiersForTenant(tenant.id);
    const matched = cashiers.find(c => {
      const uMatch = c.username && c.username.toLowerCase() === cleanUser.toLowerCase();
      const eMatch = c.email && c.email.toLowerCase() === cleanUser.toLowerCase();
      const pMatch = c.phone && c.phone.replace(/\D/g, '') === cleanUser.replace(/\D/g, '');
      const passMatch = c.password === cleanPass;
      return (uMatch || eMatch || pMatch) && passMatch;
    });

    if (matched) {
      return { tenant, cashier: matched };
    }
  }
  return null;
};
