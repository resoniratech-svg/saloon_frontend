import { getActiveTenantId } from './saasStorage';

/**
 * PURE IN-MEMORY VENDOR STORAGE
 * Zero vendors are stored in browser localStorage.
 */

let inMemoryVendors = [];

export const purgeLocalVendors = () => {
  try {
    const keysToRemove = ['respark_master_vendors'];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('respark_vendors_')) {
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

purgeLocalVendors();

export const getMasterVendors = () => {
  return [...inMemoryVendors];
};

export const saveMasterVendors = (vendors) => {
  inMemoryVendors = Array.isArray(vendors) ? vendors : [];
  window.dispatchEvent(new Event('vendorsUpdated'));
};
