import { getActiveTenantId } from './saasStorage';
import { customers as mockGlamourCustomers } from '../data/mockData';

const getCustomerStorageKey = () => `crm_customers_${getActiveTenantId()}`;

export const initialCustomersNaturals = [
  {
    id: 'nat_c1',
    mobile: '+91 9876500001',
    name: 'Kavita Patel',
    gender: 'Female',
    lastVisited: '18-Sep-2026',
    totalOrders: 2,
    totalPurchaseAmount: 2400,
    averagePurchaseAmount: 1200,
    onlineVisits: 1,
    loyalty: 'Silver',
    referralCode: 'NAT01',
    advance: 0,
    balance: 0,
    membershipCount: '-',
    email: 'kavita@naturals.in',
    birthDate: '14-Apr-1994',
    anniversary: '-',
  },
  {
    id: 'nat_c2',
    mobile: '+91 9876500002',
    name: 'Sneha Rao',
    gender: 'Female',
    lastVisited: '12-Sep-2026',
    totalOrders: 4,
    totalPurchaseAmount: 5800,
    averagePurchaseAmount: 1450,
    onlineVisits: 2,
    loyalty: 'Gold',
    referralCode: 'NAT02',
    advance: 0,
    balance: 0,
    membershipCount: 'Ayurveda Club',
    email: 'sneha.rao@gmail.com',
    birthDate: '09-Dec-1990',
    anniversary: '15-Feb-2018',
  }
];

export const initialCustomersEnrich = [
  {
    id: 'enr_c1',
    mobile: '+91 9811122233',
    name: 'Radhika Kapoor',
    gender: 'Female',
    lastVisited: '18-Sep-2026',
    totalOrders: 6,
    totalPurchaseAmount: 19500,
    averagePurchaseAmount: 3250,
    onlineVisits: 3,
    loyalty: 'Platinum VIP',
    referralCode: 'ENR99',
    advance: 0,
    balance: 0,
    membershipCount: 'Platinum Tier',
    email: 'radhika@enrich.in',
    birthDate: '22-Jun-1988',
    anniversary: '10-Dec-2015',
  },
  {
    id: 'enr_c2',
    mobile: '+91 9811122234',
    name: 'Arjun Mehra',
    gender: 'Male',
    lastVisited: '16-Sep-2026',
    totalOrders: 3,
    totalPurchaseAmount: 7800,
    averagePurchaseAmount: 2600,
    onlineVisits: 1,
    loyalty: 'Gold',
    referralCode: 'ENR12',
    advance: 0,
    balance: 0,
    membershipCount: '-',
    email: 'arjun.mehra@gmail.com',
    birthDate: '11-Aug-1992',
    anniversary: '-',
  }
];

export const getCustomers = () => {
  const tenantId = getActiveTenantId();
  const storageKey = getCustomerStorageKey();

  try {
    let data = localStorage.getItem(storageKey);

    // Auto-migrate legacy un-scoped key for Glamour
    if (!data && tenantId === 'tenant_glamour') {
      const legacy = localStorage.getItem('crm_customers');
      if (legacy) {
        localStorage.setItem(storageKey, legacy);
        data = legacy;
      }
    }

    if (!data) {
      let initial = mockGlamourCustomers;
      if (tenantId === 'tenant_naturals') initial = initialCustomersNaturals;
      else if (tenantId === 'tenant_enrich') initial = initialCustomersEnrich;
      else if (tenantId !== 'tenant_glamour') initial = [];

      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return mockGlamourCustomers;
    
    let needsSave = false;
    const sanitized = parsed.map((c, i) => {
      if (!c.id) {
        needsSave = true;
        return {
          ...c,
          id: c.mobile ? `cust_${c.mobile.replace(/\D/g, '')}` : `cust_${Date.now()}_${i}`
        };
      }
      return c;
    });
    if (needsSave) {
      localStorage.setItem(storageKey, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (err) {
    console.error('Failed to load customers from storage:', err);
    return mockGlamourCustomers;
  }
};

export const saveCustomers = (customersList) => {
  const storageKey = getCustomerStorageKey();
  try {
    localStorage.setItem(storageKey, JSON.stringify(customersList));
    window.dispatchEvent(new Event('customersUpdated'));
  } catch (err) {
    console.error('Failed to save customers to storage:', err);
  }
};

export const addCustomer = (customer) => {
  try {
    const list = getCustomers();
    const newCust = {
      id: customer.id || (customer.mobile ? `cust_${customer.mobile.replace(/\D/g, '')}` : `cust_${Date.now()}`),
      ...customer
    };
    if (!newCust.id) {
      newCust.id = 'cust_' + Date.now();
    }
    const updated = [newCust, ...list];
    saveCustomers(updated);
    return updated;
  } catch (err) {
    console.error('Failed to add customer:', err);
    return [];
  }
};

export const updateCustomer = (updatedCustomer) => {
  try {
    const list = getCustomers();
    const updated = list.map(c => (String(c.id) === String(updatedCustomer.id) ? { ...c, ...updatedCustomer } : c));
    saveCustomers(updated);
    return updated;
  } catch (err) {
    console.error('Failed to update customer:', err);
    return [];
  }
};

export const deleteCustomer = (customerId) => {
  try {
    const list = getCustomers();
    const updated = list.filter(c => String(c.id) !== String(customerId));
    saveCustomers(updated);
    return updated;
  } catch (err) {
    console.error('Failed to delete customer:', err);
    return [];
  }
};

