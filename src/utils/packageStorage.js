import { getActiveTenantId } from './saasStorage';
import { packageApi } from '../api/client';

/**
 * PURE DATABASE-ONLY PACKAGE STORAGE
 * Packages are loaded from PostgreSQL via packageApi.
 * Zero package records are stored in browser localStorage.
 */

let inMemoryPackages = [];
let hasFetchedPackages = false;

export const purgeLocalPackages = () => {
  try {
    const keysToRemove = [];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('respark_packages_')) {
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

purgeLocalPackages();

export const mapBackendPackageToFrontend = (pkg) => {
  let totalSessions = 1;
  if (pkg.totalSessions && !isNaN(Number(pkg.totalSessions))) {
    totalSessions = Number(pkg.totalSessions);
  } else if (typeof pkg.services === 'object' && pkg.services !== null && pkg.services.totalSessions) {
    totalSessions = Number(pkg.services.totalSessions);
  } else if (typeof pkg.services === 'string') {
    try {
      const parsed = JSON.parse(pkg.services);
      if (parsed?.totalSessions) totalSessions = Number(parsed.totalSessions);
    } catch (e) {}
  }

  let servicesText = 'Package Services';
  if (typeof pkg.services === 'string') {
    try {
      const parsed = JSON.parse(pkg.services);
      if (parsed && typeof parsed === 'object') {
        servicesText = parsed.text || parsed.breakdown || pkg.services;
      } else {
        servicesText = pkg.services;
      }
    } catch (e) {
      servicesText = pkg.services;
    }
  } else if (typeof pkg.services === 'object' && pkg.services !== null) {
    servicesText = pkg.services.text || pkg.services.breakdown || (Array.isArray(pkg.services) ? pkg.services.join(', ') : 'Package Services');
  } else if (Array.isArray(pkg.items)) {
    servicesText = pkg.items.map(it => it.service?.name).filter(Boolean).join(', ');
  } else if (pkg.description) {
    servicesText = pkg.description;
  }

  const cat = pkg.header || pkg.category || pkg.description || 'Special Packages';

  return {
    id: pkg.id,
    name: pkg.name,
    price: Number(pkg.price || 0),
    validityDays: Number(pkg.validityDays || 180),
    renewalReminderDays: Number(pkg.renewalReminderDays || 15),
    totalSessions: totalSessions || 1,
    services: servicesText || 'Package Services',
    header: cat,
    category: cat,
    description: pkg.description || cat,
    isActive: pkg.isActive !== false,
  };
};

export const fetchPackagesFromBackend = async () => {
  try {
    const res = await packageApi.getPackages({ limit: 100 });
    const items = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : []);
    if (items.length > 0) {
      inMemoryPackages = items.filter(pkg => pkg.isActive !== false).map(mapBackendPackageToFrontend);
      hasFetchedPackages = true;
      window.dispatchEvent(new Event('resparkPackagesUpdated'));
      return inMemoryPackages;
    }
  } catch (err) {
    console.warn('Backend packages fetch failed:', err);
  }
  return inMemoryPackages;
};

export const getPackages = () => {
  if (!hasFetchedPackages) {
    fetchPackagesFromBackend();
  }
  return [...inMemoryPackages];
};

export const savePackages = (packages) => {
  inMemoryPackages = Array.isArray(packages) ? packages : [];
  window.dispatchEvent(new Event('resparkPackagesUpdated'));
};

export const createPackage = (pkgData) => {
  const newPkg = {
    id: 'pkg_' + Date.now(),
    name: pkgData.name.trim(),
    price: parseFloat(pkgData.price) || 0,
    validityDays: parseInt(pkgData.validityDays, 10) || 180,
    renewalReminderDays: parseInt(pkgData.renewalReminderDays, 10) || 15,
    totalSessions: parseInt(pkgData.totalSessions, 10) || 1,
    services: pkgData.services ? pkgData.services.trim() : '',
    header: pkgData.header ? pkgData.header.trim() : 'Special Packages',
    isActive: true,
  };

  inMemoryPackages = [...inMemoryPackages, newPkg];
  window.dispatchEvent(new Event('resparkPackagesUpdated'));
  return newPkg;
};

export const deletePackage = (packageId) => {
  inMemoryPackages = inMemoryPackages.filter(p => p.id !== packageId);
  window.dispatchEvent(new Event('resparkPackagesUpdated'));
  return inMemoryPackages;
};
