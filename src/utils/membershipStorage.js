import { getActiveTenantId } from './saasStorage';

export const initialMemberships = [
  {
    id: 'mem1',
    name: 'Silver Tier Membership',
    tier: 'Silver Tier',
    price: 2000,
    validityDays: 365,
    renewalReminderDays: 15,
    discountPercent: 10,
    benefits: '10% off on all hair cuts, trims, and basic styling',
    header: 'Annual Memberships'
  },
  {
    id: 'mem2',
    name: 'Gold Tier Membership',
    tier: 'Gold Tier',
    price: 5000,
    validityDays: 365,
    renewalReminderDays: 15,
    discountPercent: 20,
    benefits: '20% off on all services + 1 complimentary hair spa per quarter',
    header: 'Annual Memberships'
  },
  {
    id: 'mem3',
    name: 'Platinum VIP Membership',
    tier: 'Platinum Tier',
    price: 10000,
    validityDays: 365,
    renewalReminderDays: 30,
    discountPercent: 30,
    benefits: '30% off on all services + priority appointment booking & free blow dries',
    header: 'VIP Memberships'
  },
];

export const getMembershipStorageKey = () => {
  const tenantId = getActiveTenantId();
  return `respark_memberships_${tenantId}`;
};

export const getMemberships = () => {
  try {
    const tenantId = getActiveTenantId();
    const storageKey = getMembershipStorageKey();
    let data = localStorage.getItem(storageKey);

    if (data === null || data === undefined) {
      const initial = tenantId === 'tenant_glamour' ? initialMemberships : [];
      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }

    let parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // For custom salons: filter out default mock memberships
    if (tenantId !== 'tenant_glamour') {
      const mockIds = new Set(initialMemberships.map(mem => String(mem.id)));
      const customOnly = parsed.filter(mem => {
        const mid = String(mem.id);
        const isUserCreated = /^mem_\d{10,}$/.test(mid) || /^\d{10,}$/.test(mid);
        if (isUserCreated) return true;
        const isMock = mockIds.has(mid) || /^mem_?\d{1,2}$/i.test(mid);
        return !isMock;
      });
      if (customOnly.length !== parsed.length) {
        localStorage.setItem(storageKey, JSON.stringify(customOnly));
        parsed = customOnly;
      }
    }

    return parsed;
  } catch (err) {
    return [];
  }
};

export const saveMemberships = (memberships) => {
  try {
    const storageKey = getMembershipStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(memberships));
    window.dispatchEvent(new Event('resparkMembershipsUpdated'));
  } catch (err) {
    console.error('Failed to save memberships:', err);
  }
};

export const createMembership = (memData) => {
  try {
    const current = getMemberships();
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

    const updated = [...current, newMem];
    saveMemberships(updated);
    return newMem;
  } catch (err) {
    console.error('Failed to create membership:', err);
    return null;
  }
};

export const deleteMembership = (membershipId) => {
  try {
    const current = getMemberships();
    const updated = current.filter(m => String(m.id) !== String(membershipId));
    saveMemberships(updated);
    return updated;
  } catch (err) {
    console.error('Failed to delete membership:', err);
    return [];
  }
};
