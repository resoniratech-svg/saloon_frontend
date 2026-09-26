import { getActiveTenantId } from './saasStorage';

export const initialPackages = [
  { 
    id: 'pkg1', 
    name: 'Hair Care Package (180 Days)', 
    price: 4999, 
    validityDays: 180, 
    renewalReminderDays: 15, 
    services: '4 Hair Spas, 2 Hair Cuts, 1 Color Touch-up', 
    header: 'Hair Packages' 
  },
  { 
    id: 'pkg2', 
    name: 'Bridal Glow Package', 
    price: 14999, 
    validityDays: 90, 
    renewalReminderDays: 7, 
    services: 'Pre-bridal cleanup, 2 Facials, Mani & Pedi, Makeup', 
    header: 'Bridal Packages' 
  },
  { 
    id: 'pkg3', 
    name: 'Pre-Bridal Glow Treatment', 
    price: 7999, 
    validityDays: 60, 
    renewalReminderDays: 7, 
    services: 'Body polishing, Fruit cleanup, Hair spa', 
    header: 'Bridal Packages' 
  },
];

export const getPackageStorageKey = () => {
  const tenantId = getActiveTenantId();
  return `respark_packages_${tenantId}`;
};

export const getPackages = () => {
  try {
    const tenantId = getActiveTenantId();
    const storageKey = getPackageStorageKey();
    let data = localStorage.getItem(storageKey);

    if (data === null || data === undefined) {
      const initial = tenantId === 'tenant_glamour' ? initialPackages : [];
      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }

    let parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // For custom salons: filter out default mock packages
    if (tenantId !== 'tenant_glamour') {
      const mockIds = new Set(initialPackages.map(pkg => String(pkg.id)));
      const customOnly = parsed.filter(pkg => {
        const pid = String(pkg.id);
        const isUserCreated = /^pkg_\d{10,}$/.test(pid) || /^\d{10,}$/.test(pid);
        if (isUserCreated) return true;
        const isMock = mockIds.has(pid) || /^pkg_?\d{1,2}$/i.test(pid);
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

export const savePackages = (packages) => {
  try {
    const storageKey = getPackageStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(packages));
    window.dispatchEvent(new Event('resparkPackagesUpdated'));
  } catch (err) {
    console.error('Failed to save packages:', err);
  }
};

export const createPackage = (pkgData) => {
  try {
    const current = getPackages();
    const newPkg = {
      id: 'pkg_' + Date.now(),
      name: pkgData.name.trim(),
      price: parseFloat(pkgData.price) || 0,
      validityDays: parseInt(pkgData.validityDays) || 180,
      renewalReminderDays: parseInt(pkgData.renewalReminderDays) || 15,
      services: pkgData.services ? pkgData.services.trim() : '',
      header: pkgData.header ? pkgData.header.trim() : 'Special Packages'
    };

    const updated = [...current, newPkg];
    savePackages(updated);
    return newPkg;
  } catch (err) {
    console.error('Failed to create package:', err);
    return null;
  }
};

export const deletePackage = (packageId) => {
  try {
    const current = getPackages();
    const updated = current.filter(p => p.id !== packageId);
    savePackages(updated);
    return updated;
  } catch (err) {
    console.error('Failed to delete package:', err);
    return [];
  }
};
