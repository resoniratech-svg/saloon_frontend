import { getActiveTenantId } from './saasStorage';

/**
 * PURE IN-MEMORY MEMBERSHIP STORAGE
 * Zero memberships are stored in browser localStorage.
 */

let inMemoryMemberships = [];

export const purgeLocalMemberships = () => {
  try {
    const keysToRemove = [];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('respark_memberships_')) {
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

purgeLocalMemberships();

export const getMemberships = () => {
  return [...inMemoryMemberships];
};

export const saveMemberships = (memberships) => {
  inMemoryMemberships = Array.isArray(memberships) ? memberships : [];
  window.dispatchEvent(new Event('resparkMembershipsUpdated'));
};

export const createMembership = (memData) => {
  const newMem = {
    id: 'mem_' + Date.now(),
    name: memData.name.trim(),
    tier: memData.tier ? memData.tier.trim() : memData.name.trim(),
    price: parseFloat(memData.price) || 0,
    validityDays: parseInt(memData.validityDays) || 365,
    renewalReminderDays: parseInt(memData.renewalReminderDays) || 15,
    discountPercent: parseFloat(memData.discountPercent) || 0,
    benefits: memData.benefits ? memData.benefits.trim() : '',
    header: memData.header ? memData.header.trim() : 'Annual Memberships'
  };

  inMemoryMemberships = [...inMemoryMemberships, newMem];
  window.dispatchEvent(new Event('resparkMembershipsUpdated'));
  return newMem;
};

export const deleteMembership = (membershipId) => {
  inMemoryMemberships = inMemoryMemberships.filter(m => String(m.id) !== String(membershipId));
  window.dispatchEvent(new Event('resparkMembershipsUpdated'));
  return inMemoryMemberships;
};
