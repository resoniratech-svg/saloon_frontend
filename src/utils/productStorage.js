import { getActiveTenantId } from './saasStorage';

export const initialMasterProducts = [
  { id: 'p_lovely', name: 'lovely', price: 100, salePrice: 200, barcode: '1234', sku: 'SKU-FL-102', stock: 25, header: 'Skin & Face Products', category: 'SKIN', productTag: 'Skincare' },
  { id: 'p1', name: 'fair and lovely', price: 10, salePrice: 20, barcode: '123', sku: 'SKU-FL-101', stock: 45, header: 'Skin & Face Products', category: 'SKIN', productTag: 'Skincare' },
  { id: 'p4', name: 'Loreal Hair Serum 100ml', price: 450, salePrice: 650, barcode: '8901234', sku: 'SKU-LS-202', stock: 18, header: 'Hair Styling & Shampoos', category: 'HAIR', productTag: 'Hair' },
  { id: 'p2', name: 'Wella Boost Bounce 200ml', price: 550, salePrice: 750, barcode: '8905678', sku: 'SKU-W-01', stock: 12, header: 'Hair Styling & Shampoos', category: 'HAIR', productTag: 'Hair' },
  { id: 'p3', name: 'Kinessence Mask 500gm', price: 1200, salePrice: 1800, barcode: '8901235', sku: 'SKU-KM-303', stock: 15, header: 'Hair Treatments', category: 'HAIR', productTag: 'Hair' },
  { id: 'p5', name: 'Nourishing Shampoo 250ml', price: 650, salePrice: 950, barcode: '8901236', sku: 'SKU-NS-404', stock: 20, header: 'Hair Styling & Shampoos', category: 'HAIR', productTag: 'Hair' },
  { id: 'p6', name: 'Oil Reflections Shampoo 180ml', price: 950, salePrice: 1400, barcode: '8901237', sku: 'SKU-OR-505', stock: 14, header: 'Hair Styling & Shampoos', category: 'HAIR', productTag: 'Hair' },
  { id: 'p7', name: 'Large Gloves (Box of 50)', price: 90, salePrice: 150, barcode: '8901238', sku: 'SKU-LG-606', stock: 30, header: 'Disposables & Salon Supplies', category: 'SUPPLIES', productTag: 'Disposables' },
  { id: 'p8', name: 'Disposable Hair Cape', price: 15, salePrice: 25, barcode: '8901239', sku: 'SKU-DHC-707', stock: 50, header: 'Disposables & Salon Supplies', category: 'SUPPLIES', productTag: 'Disposables' },
];

export const naturalsMasterProducts = [
  { id: 'nat_p1', name: 'Naturals Herbal Shampoo 300ml', price: 320, salePrice: 480, barcode: '770123', sku: 'NAT-HS-01', stock: 28, header: 'Hair Styling & Shampoos', category: 'HAIR', productTag: 'Hair' },
  { id: 'nat_p2', name: 'Organic Argan Hair Oil 100ml', price: 450, salePrice: 650, barcode: '770124', sku: 'NAT-AO-02', stock: 16, header: 'Hair Treatments', category: 'HAIR', productTag: 'Hair' },
  { id: 'nat_p3', name: 'Aloe Vera Face Hydration Gel', price: 180, salePrice: 320, barcode: '770125', sku: 'NAT-AV-03', stock: 35, header: 'Skin & Face Products', category: 'SKIN', productTag: 'Skincare' },
];

export const enrichMasterProducts = [
  { id: 'enr_p1', name: 'Enrich Pro Keratin Serum 100ml', price: 550, salePrice: 850, barcode: '660123', sku: 'ENR-KS-01', stock: 22, header: 'Hair Treatments', category: 'HAIR', productTag: 'Hair' },
  { id: 'enr_p2', name: 'Enrich Matte Hair Clay 100gm', price: 300, salePrice: 450, barcode: '660124', sku: 'ENR-MC-02', stock: 19, header: 'Hair Styling & Shampoos', category: 'HAIR', productTag: 'Hair' },
  { id: 'enr_p3', name: 'Vitamin C Radiance Glow Cream', price: 600, salePrice: 950, barcode: '660125', sku: 'ENR-VC-03', stock: 14, header: 'Skin & Face Products', category: 'SKIN', productTag: 'Skincare' },
];

export const getProductStorageKey = () => {
  const tenantId = getActiveTenantId();
  return `respark_products_${tenantId}`;
};

export const getInitialProductsForTenant = (tenantId) => {
  if (tenantId === 'tenant_naturals') return naturalsMasterProducts;
  if (tenantId === 'tenant_enrich') return enrichMasterProducts;
  if (tenantId === 'tenant_glamour') return initialMasterProducts;
  // All other / custom salons (like resonira): start fresh with empty catalog
  return [];
};

export const getMasterProducts = () => {
  try {
    const tenantId = getActiveTenantId();
    const storageKey = getProductStorageKey();
    let data = localStorage.getItem(storageKey);

    // Auto-migrate previous un-scoped key for Glamour so no data is lost
    if (!data && tenantId === 'tenant_glamour') {
      const legacy = localStorage.getItem('respark_master_products');
      if (legacy) {
        localStorage.setItem(storageKey, legacy);
        data = legacy;
      }
    }

    if (data === null || data === undefined) {
      const initial = getInitialProductsForTenant(tenantId);
      localStorage.setItem(storageKey, JSON.stringify(initial));
      return initial;
    }

    let parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // For custom salons: automatically filter out legacy mock items
    if (tenantId !== 'tenant_glamour' && tenantId !== 'tenant_naturals' && tenantId !== 'tenant_enrich') {
      const mockIds = new Set([
        ...initialMasterProducts.map(p => String(p.id)),
        ...naturalsMasterProducts.map(p => String(p.id)),
        ...enrichMasterProducts.map(p => String(p.id)),
      ]);
      const customOnly = parsed.filter(p => {
        const pid = String(p.id);
        // User created products have timestamp IDs (e.g. 'p_1727267...', 'prod_1727267...' or numeric timestamps)
        const isUserCreated = /^p_\d{10,}$/.test(pid) || /^prod_\d{10,}$/.test(pid) || /^\d{10,}$/.test(pid);
        if (isUserCreated) return true;
        const isMock = mockIds.has(pid) || /^p\d{1,2}$/i.test(pid) || pid.startsWith('nat_p') || pid.startsWith('enr_p');
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

export const saveMasterProducts = (products) => {
  try {
    const storageKey = getProductStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(products));
    window.dispatchEvent(new Event('productsUpdated'));
  } catch (err) {
    console.error(err);
  }
};
