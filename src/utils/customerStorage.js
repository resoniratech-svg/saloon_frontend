import { getActiveTenantId } from './saasStorage';
import { guestApi } from '../api/client';

/**
 * PURE DATABASE-ONLY CUSTOMER STORAGE
 * All customers are loaded and saved directly to the PostgreSQL database via guestApi.
 * Zero customer records are stored in browser localStorage.
 */

let inMemoryCustomers = [];
let hasFetchedFromBackend = false;

// Purge any legacy localStorage keys so browser storage remains completely clean
export const purgeLocalCustomers = () => {
  try {
    const keysToRemove = [
      'crm_customers',
      'respark_customers_tenant_glamour',
      'respark_customers_tenant_naturals',
      'respark_customers_tenant_enrich',
    ];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('crm_customers_') || k.startsWith('respark_customers_'))) {
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

purgeLocalCustomers();

const toBackendDate = (dateStr) => {
  if (!dateStr || dateStr === '-') return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = String(dateStr).trim().split('-');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return undefined;
};

export const mapBackendGuestToCustomer = (item) => ({
  id: item.id,
  name: item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim(),
  mobile: item.mobile,
  alternateMobile: item.alternateMobile || '',
  email: item.email || '',
  gender: item.gender === 'MALE' ? 'Male' : (item.gender === 'FEMALE' ? 'Female' : 'Other'),
  birthDate: item.dateOfBirth ? new Date(item.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
  dob: item.dateOfBirth ? new Date(item.dateOfBirth).toISOString().split('T')[0] : '',
  loyalty: item.loyaltyTier ? (item.loyaltyPoints > 0 ? `${item.loyaltyTier} (${item.loyaltyPoints} pts)` : item.loyaltyTier) : '-',
  loyaltyTier: item.loyaltyTier || 'Standard',
  loyaltyPoints: item.loyaltyPoints || 0,
  totalOrders: item.totalVisits || 0,
  totalPurchaseAmount: parseFloat(item.totalSpend || 0),
  averagePurchaseAmount: item.totalVisits > 0 ? Math.round(parseFloat(item.totalSpend || 0) / item.totalVisits) : 0,
  lastVisited: item.lastVisitDate ? new Date(item.lastVisitDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
  balance: parseFloat(item.dueBalance || 0),
  advance: parseFloat(item.advanceBalance || 0),
  membershipCount: item.membershipCount || '-',
  packages: Array.isArray(item.packages) ? item.packages : (Array.isArray(item.guestPackages) ? item.guestPackages : (item.packages || [])),
  package: item.package || (Array.isArray(item.packages) ? item.packages.map(p => p.name).join(', ') : ''),
  packageCount: item.packageCount || (Array.isArray(item.packages) ? item.packages.length : 0),
  referralCode: item.referralCode || '-',
  hairType: item.hairType || 'Straight',
  notes: item.notes || '',
});

export const fetchCustomersFromBackend = async () => {
  try {
    const res = await guestApi.getGuests({ limit: 100, isActive: true });
    if (res?.success && Array.isArray(res?.data?.items)) {
      const liveList = res.data.items
        .filter(item => item.isActive !== false)
        .map(mapBackendGuestToCustomer);
      inMemoryCustomers = liveList;
      hasFetchedFromBackend = true;
      window.dispatchEvent(new Event('customersUpdated'));
      return liveList;
    }
  } catch (err) {
    console.warn('Could not fetch guests from backend:', err);
  }
  return inMemoryCustomers;
};

export const getCustomers = () => {
  if (!hasFetchedFromBackend) {
    fetchCustomersFromBackend();
  }
  return [...inMemoryCustomers];
};

export const saveCustomers = (customersList) => {
  inMemoryCustomers = Array.isArray(customersList) ? customersList : [];
  window.dispatchEvent(new Event('customersUpdated'));
};

export const addCustomer = (customer) => {
  try {
    const tempId = customer.id || (customer.mobile ? `cust_${customer.mobile.replace(/\D/g, '')}` : `cust_${Date.now()}`);
    const newCust = {
      ...customer,
      id: tempId
    };
    
    inMemoryCustomers = [newCust, ...inMemoryCustomers.filter(c => c.id !== tempId && (!customer.mobile || c.mobile !== customer.mobile))];
    window.dispatchEvent(new Event('customersUpdated'));

    // Persist to PostgreSQL database asynchronously
    (async () => {
      try {
        const cleanEmail = (customer.email && customer.email.trim() !== '-' && customer.email.trim() !== '')
          ? customer.email.trim()
          : undefined;

        const payload = {
          name: customer.name?.trim(),
          mobile: (customer.mobile || customer.mobileNumber || '').trim(),
          alternateMobile: (customer.alternateMobile || customer.alternateNumber || '').trim() || undefined,
          email: cleanEmail,
          gender: customer.gender ? customer.gender.toUpperCase() : 'OTHER',
          dateOfBirth: toBackendDate(customer.dob || customer.dateOfBirth || customer.birthDate),
          loyaltyPoints: parseInt(customer.loyaltyPoints, 10) || 0,
          customerType: 'REGULAR',
          notes: customer.notes || undefined,
          hairType: customer.hairType || undefined,
        };

        const res = await guestApi.createGuest(payload);
        if (res?.success && res?.data?.id) {
          const persistedCust = mapBackendGuestToCustomer(res.data);
          inMemoryCustomers = inMemoryCustomers.map(c => (c.id === tempId || c.mobile === persistedCust.mobile) ? persistedCust : c);
          window.dispatchEvent(new Event('customersUpdated'));
        }
      } catch (backendErr) {
        console.warn('Backend customer save failed:', backendErr);
      }
    })();

    return inMemoryCustomers;
  } catch (err) {
    console.error('Failed to add customer:', err);
    return [];
  }
};

export const updateCustomer = async (updatedCustomer) => {
  try {
    inMemoryCustomers = inMemoryCustomers.map(c => (String(c.id) === String(updatedCustomer.id) ? { ...c, ...updatedCustomer } : c));
    window.dispatchEvent(new Event('customersUpdated'));

    const cleanEmail = (updatedCustomer.email && updatedCustomer.email.trim() !== '-' && updatedCustomer.email.trim() !== '')
      ? updatedCustomer.email.trim()
      : null;

    const cleanPoints = (updatedCustomer.loyaltyPoints !== undefined && updatedCustomer.loyaltyPoints !== null && !isNaN(parseInt(updatedCustomer.loyaltyPoints, 10)))
      ? parseInt(updatedCustomer.loyaltyPoints, 10)
      : undefined;

    // Persist to PostgreSQL if it has a real UUID
    if (updatedCustomer.id && !String(updatedCustomer.id).startsWith('cust_') && !String(updatedCustomer.id).startsWith('nat_') && !String(updatedCustomer.id).startsWith('enr_')) {
      const payload = {
        name: updatedCustomer.name?.trim(),
        mobile: (updatedCustomer.mobile || updatedCustomer.mobileNumber || '').trim(),
        alternateMobile: (updatedCustomer.alternateMobile || updatedCustomer.alternateNumber || '').trim() || undefined,
        email: cleanEmail,
        gender: updatedCustomer.gender ? updatedCustomer.gender.toUpperCase() : undefined,
        dateOfBirth: toBackendDate(updatedCustomer.dob || updatedCustomer.dateOfBirth || updatedCustomer.birthDate),
        loyaltyPoints: cleanPoints,
        notes: updatedCustomer.notes || undefined,
        hairType: updatedCustomer.hairType || undefined,
      };

      const res = await guestApi.updateGuest(updatedCustomer.id, payload);
      if (res?.success && res?.data) {
        const persisted = mapBackendGuestToCustomer(res.data);
        const merged = {
          ...persisted,
          packages: (updatedCustomer.packages && updatedCustomer.packages.length > 0) ? updatedCustomer.packages : (persisted.packages || []),
          package: updatedCustomer.package || persisted.package || '',
          packageCount: updatedCustomer.packageCount !== undefined ? updatedCustomer.packageCount : persisted.packageCount,
        };
        inMemoryCustomers = inMemoryCustomers.map(c => String(c.id) === String(merged.id) ? merged : c);
        window.dispatchEvent(new Event('customersUpdated'));
      }
    }
    return inMemoryCustomers;
  } catch (err) {
    console.error('Failed to update customer:', err);
    throw err;
  }
};

export const deleteCustomer = async (customerId) => {
  try {
    inMemoryCustomers = inMemoryCustomers.filter(c => String(c.id) !== String(customerId));
    window.dispatchEvent(new Event('customersUpdated'));

    if (customerId && !String(customerId).startsWith('cust_') && !String(customerId).startsWith('nat_') && !String(customerId).startsWith('enr_')) {
      await guestApi.deleteGuest(customerId);
    }
    return inMemoryCustomers;
  } catch (err) {
    console.error('Failed to delete customer:', err);
    throw err;
  }
};
