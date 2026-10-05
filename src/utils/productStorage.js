import { getActiveTenantId } from './saasStorage';
import { productApi } from '../api/client';

/**
 * DATABASE-ONLY PRODUCT STORAGE
 * Products are loaded directly from PostgreSQL via productApi.
 * Zero products are stored in browser localStorage.
 */

let inMemoryProducts = [];
let hasFetchedFromBackend = false;

export const purgeLocalProducts = () => {
  try {
    const keysToRemove = ['respark_master_products'];
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('respark_products_')) {
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

purgeLocalProducts();

export const mapBackendProductToFrontend = (p) => ({
  id: p.id,
  name: p.name,
  price: Number(p.costPrice || p.price || 0),
  salePrice: Number(p.salePrice || p.price || 0),
  barcode: p.barcode || '',
  sku: p.sku || '',
  stock: Number(p.stock || p.stockQuantity || 0),
  header: p.header || (p.category?.name || 'Salon Products'),
  category: (p.category?.name || p.category || 'SKIN').toUpperCase(),
  productTag: p.productTag || 'Retail'
});

export const fetchProductsFromBackend = async () => {
  try {
    const res = await productApi.getProducts({ limit: 100 });
    const items = Array.isArray(res?.data?.items) ? res.data.items : (Array.isArray(res?.data) ? res.data : []);
    if (items.length > 0) {
      inMemoryProducts = items.filter(p => p.isActive !== false).map(mapBackendProductToFrontend);
      hasFetchedFromBackend = true;
      window.dispatchEvent(new Event('productsUpdated'));
      return inMemoryProducts;
    }
  } catch (err) {
    console.warn('Could not fetch products from backend:', err);
  }
  return inMemoryProducts;
};

export const getMasterProducts = () => {
  if (!hasFetchedFromBackend) {
    fetchProductsFromBackend();
  }
  return [...inMemoryProducts];
};

export const saveMasterProducts = (products) => {
  inMemoryProducts = Array.isArray(products) ? products : [];
  window.dispatchEvent(new Event('productsUpdated'));
};
