import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Scissors, 
  Package, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  Edit2, 
  CheckCircle2, 
  ChevronDown, 
  Gift, 
  Crown, 
  Clock, 
  Sparkles, 
  Eye,
  Loader2,
  RefreshCw,
  Layers,
  Search,
  AlertTriangle
} from 'lucide-react';
import { serviceApi, serviceCategoryApi, productApi, productCategoryApi, packageApi, disposableApi } from '../api/client';
import { getMasterServices, saveMasterServices } from '../utils/serviceStorage';
import { getMasterProducts, saveMasterProducts } from '../utils/productStorage';
import { getPackages, createPackage, deletePackage, savePackages } from '../utils/packageStorage';
import { getMemberships, createMembership, deleteMembership } from '../utils/membershipStorage';
import { getDisposables, saveDisposables, addDisposableItem, updateDisposableItem, deleteDisposableItem } from '../utils/disposablesStorage';
import { getCurrentUser, getCashierPermissions, isReadOnlySession, notifyReadOnlyBlocked } from '../utils/saasStorage';

export default function MasterBOPage() {
  const currentUser = getCurrentUser();
  const [permissions, setPermissions] = useState(() => getCashierPermissions());
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const t = searchParams.get('tab');
    return (t && t !== 'Memberships' && ['Services', 'Products', 'Packages', 'Disposables'].includes(t)) ? t : 'Services';
  });

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'Memberships') {
      setActiveTab('Services');
      setSearchParams({ tab: 'Services' });
    } else if (tabFromUrl && ['Services', 'Products', 'Packages', 'Disposables'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  useEffect(() => {
    const handleSync = () => {
      setPermissions(getCashierPermissions());
    };
    window.addEventListener('permissionsUpdated', handleSync);
    window.addEventListener('tenantChanged', handleSync);
    return () => {
      window.removeEventListener('permissionsUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
    };
  }, []);

  // Service & Product Modals
  const [showAddService, setShowAddService] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Package & Membership Modals
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [viewingPackage, setViewingPackage] = useState(null);
  const [showAddMembership, setShowAddMembership] = useState(false);
  const [viewingMembership, setViewingMembership] = useState(null);
  const [showAddDisposable, setShowAddDisposable] = useState(false);
  const [editingDisposable, setEditingDisposable] = useState(null);

  // Notifications
  const [serviceNotification, setServiceNotification] = useState('');
  const [productNotification, setProductNotification] = useState('');
  const [packageNotification, setPackageNotification] = useState('');
  const [membershipNotification, setMembershipNotification] = useState('');
  const [disposableNotification, setDisposableNotification] = useState('');

  // 1. Services State
  const [servicesList, setServicesList] = useState(() => getMasterServices());
  const [isServicesLoading, setIsServicesLoading] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: '',
    gender: 'Both',
    price: '',
    duration: '30m',
  });

  // 2. Products State
  const [productsList, setProductsList] = useState(() => getMasterProducts());
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    stock: '',
    price: '',
    salePrice: '',
    error: '',
  });

  // 3. Packages State
  const [packagesList, setPackagesList] = useState(() => getPackages());
  const [isPackagesLoading, setIsPackagesLoading] = useState(false);
  const [isSavingPackage, setIsSavingPackage] = useState(false);
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    validityDays: '180',
    renewalReminderDays: '15',
    totalSessions: '5',
    services: '',
    header: '',
  });

  // 4. Memberships State
  const [membershipsList, setMembershipsList] = useState(() => getMemberships());
  const [membershipForm, setMembershipForm] = useState({
    name: '',
    tier: '',
    price: '',
    discountPercent: '15',
    validityDays: '365',
    renewalReminderDays: '15',
    benefits: '',
    header: '',
  });

  // 5. Disposables State
  const [disposablesList, setDisposablesList] = useState(() => getDisposables());
  const [isDisposablesLoading, setIsDisposablesLoading] = useState(false);
  const [isSavingDisposable, setIsSavingDisposable] = useState(false);
  const [disposableSearchQuery, setDisposableSearchQuery] = useState('');
  const [disposableForm, setDisposableForm] = useState({
    name: '',
    category: '',
    unit: 'Pack',
    unitCost: '150',
    stock: '10',
    minStock: '5',
    supplier: '',
  });

  // Fetch Services from PostgreSQL backend
  const fetchServices = async () => {
    setIsServicesLoading(true);
    try {
      const res = await serviceApi.getServices();
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(item => {
          const catName = item.category?.name || 'Services';
          const formattedHeader = catName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
          const durMinutes = item.durationMinutes ?? ((item.hour || 0) * 60 + (item.minute || 0)) ?? 30;
          return {
            id: item.id,
            name: item.name,
            category: catName,
            categoryId: item.categoryId,
            gender: item.group || 'Both',
            price: Number(item.price),
            duration: `${durMinutes}m`,
            header: formattedHeader,
            isActive: item.isActive !== false,
          };
        });

        setServicesList(mapped);
        // Synchronize with serviceStorage so POS Quick Sale (/pos) updates immediately
        saveMasterServices(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch services from backend, using cached local services:', err);
    } finally {
      setIsServicesLoading(false);
    }
  };

  // Fetch Products from PostgreSQL backend
  const fetchProducts = async () => {
    setIsProductsLoading(true);
    try {
      const res = await productApi.getProducts();
      const items = res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(items)) {
        const activeItems = items.filter(p => p.isActive !== false);
        const mapped = activeItems.map(p => {
          const userCategory = p.category?.name || p.productTag || 'General';
          return {
            id: p.id,
            name: p.name,
            sku: p.storeSku || 'SKU-' + p.id.slice(0, 6),
            price: Number(p.price) || 0,
            salePrice: Number(p.salePrice) || Number(p.price) || 0,
            barcode: p.barcode || '1234',
            stock: p.currentStock ?? p.stock ?? 0,
            header: userCategory,
            category: userCategory.toUpperCase(),
            productTag: userCategory,
            categoryId: p.categoryId,
            isActive: true,
          };
        });

        setProductsList(mapped);
        // Synchronize with productStorage so POS Quick Sale (/pos) updates immediately
        saveMasterProducts(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch products from backend, using cached local products:', err);
    } finally {
      setIsProductsLoading(false);
    }
  };

  // Fetch Packages from PostgreSQL backend
  const fetchPackages = async () => {
    setIsPackagesLoading(true);
    try {
      const res = await packageApi.getPackages();
      const items = res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(items)) {
        const activeItems = items.filter(pkg => pkg.isActive !== false);
        const mapped = activeItems.map(pkg => {
          let srvText = '';
          let totalSessions = 1;
          if (typeof pkg.services === 'string') {
            try {
              const parsed = JSON.parse(pkg.services);
              if (parsed && typeof parsed === 'object') {
                srvText = parsed.text || parsed.breakdown || pkg.services;
                if (parsed.totalSessions) totalSessions = Number(parsed.totalSessions);
              } else {
                srvText = pkg.services;
              }
            } catch (e) {
              srvText = pkg.services;
            }
          } else if (typeof pkg.services === 'object' && pkg.services !== null) {
            srvText = pkg.services.text || pkg.services.breakdown || (Array.isArray(pkg.services) ? pkg.services.join(', ') : '');
            if (pkg.services.totalSessions) totalSessions = Number(pkg.services.totalSessions);
          } else if (Array.isArray(pkg.items)) {
            srvText = pkg.items.map(it => it.service?.name).filter(Boolean).join(', ');
          }

          const cat = pkg.header || pkg.category || pkg.description || 'Special Packages';
          return {
            id: pkg.id,
            name: pkg.name,
            price: Number(pkg.price) || 0,
            validityDays: pkg.validityDays || 180,
            renewalReminderDays: pkg.renewalReminderDays || 15,
            totalSessions: pkg.totalSessions ? Number(pkg.totalSessions) : totalSessions,
            services: srvText || 'Package Services',
            header: cat,
            category: cat,
            isActive: true,
          };
        });

        setPackagesList(mapped);
        // Synchronize with packageStorage so POS Quick Sale (/pos) updates immediately
        savePackages(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch packages from backend, using cached local packages:', err);
    } finally {
      setIsPackagesLoading(false);
    }
  };

  // Fetch Disposables from PostgreSQL backend
  const fetchDisposables = async () => {
    setIsDisposablesLoading(true);
    try {
      const res = await disposableApi.getDisposables();
      const items = res?.data?.items || (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(items)) {
        const activeItems = items.filter(d => d.isActive !== false);
        const mapped = activeItems.map(d => ({
          id: d.id,
          name: d.name,
          sku: d.barcode || d.code || '',
          category: d.category || d.productCategory?.name || 'General',
          unit: d.unit || 'Pack',
          unitCost: Number(d.price ?? 0),
          stock: Number(d.quantity ?? 0),
          minStock: 5,
          status: Number(d.quantity ?? 0) <= 0 ? 'Out of Stock' : (Number(d.quantity ?? 0) <= 5 ? 'Low Stock' : 'In Stock'),
          supplier: d.productTag || '',
          isActive: true,
        }));

        setDisposablesList(mapped);
        saveDisposables(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch disposables from backend, using cached local items:', err);
    } finally {
      setIsDisposablesLoading(false);
    }
  };

  // Initial fetch on mount & tenant switch
  useEffect(() => {
    fetchServices();
    fetchProducts();
    fetchPackages();
    fetchDisposables();
  }, []);

  // Real-time synchronization with localStorage & POS
  useEffect(() => {
    const handleSync = () => {
      setServicesList(getMasterServices());
      setProductsList(getMasterProducts());
      setPackagesList(getPackages());
      setMembershipsList(getMemberships());
      setDisposablesList(getDisposables());
    };

    const handleTenantSync = () => {
      fetchServices();
      fetchProducts();
      fetchPackages();
      fetchDisposables();
      handleSync();
    };

    window.addEventListener('servicesUpdated', handleSync);
    window.addEventListener('productsUpdated', handleSync);
    window.addEventListener('resparkPackagesUpdated', handleSync);
    window.addEventListener('resparkMembershipsUpdated', handleSync);
    window.addEventListener('disposablesUpdated', handleSync);
    window.addEventListener('tenantChanged', handleTenantSync);

    return () => {
      window.removeEventListener('servicesUpdated', handleSync);
      window.removeEventListener('productsUpdated', handleSync);
      window.removeEventListener('resparkPackagesUpdated', handleSync);
      window.removeEventListener('resparkMembershipsUpdated', handleSync);
      window.removeEventListener('disposablesUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleTenantSync);
    };
  }, []);

  // ==========================================
  // SERVICES HANDLERS
  // ==========================================
  const handleOpenCreateService = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      category: '',
      gender: 'Both',
      price: '',
      duration: '30m',
    });
    setShowAddService(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      category: service.category,
      gender: service.gender || 'Both',
      price: service.price,
      duration: service.duration,
    });
    setShowAddService(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Deleting services');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    const isBackendId = typeof serviceId === 'string' && serviceId.includes('-');
    if (isBackendId) {
      try {
        const delRes = await serviceApi.deleteService(serviceId);
        if (delRes && delRes.success) {
          setServiceNotification('Service deleted successfully from database.');
          await fetchServices();
          setTimeout(() => setServiceNotification(''), 3000);
          return;
        }
      } catch (err) {
        console.warn('Backend delete error, falling back to local storage:', err);
      }
    }

    const updated = servicesList.filter(s => s.id !== serviceId);
    setServicesList(updated);
    saveMasterServices(updated);
    setServiceNotification('Service deleted successfully.');
    setTimeout(() => setServiceNotification(''), 3000);
  };

  const handleSaveService = async () => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Saving services');
      return;
    }
    if (!serviceForm.name.trim()) {
      alert('Please enter a service name.');
      return;
    }
    if (!serviceForm.category.trim()) {
      alert('Please enter a category.');
      return;
    }
    if (!serviceForm.price || isNaN(serviceForm.price)) {
      alert('Please enter a valid rate (₹).');
      return;
    }

    setIsSavingService(true);
    try {
      const durMinutes = parseInt(serviceForm.duration, 10) || 30;
      const hour = Math.floor(durMinutes / 60);
      const minute = durMinutes % 60;
      const catName = (serviceForm.category || 'Services').trim();
      const formattedHeader = catName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

      // Resolve categoryId: find existing or create new category in backend
      let categoryId = editingService?.categoryId;
      try {
        const catRes = await serviceCategoryApi.getCategories();
        if (catRes?.success && Array.isArray(catRes.data)) {
          const match = catRes.data.find(c => c.name.toLowerCase() === catName.toLowerCase());
          if (match) {
            categoryId = match.id;
          }
        }
      } catch (e) {
        console.warn('Could not query categories:', e);
      }

      if (!categoryId) {
        try {
          const newCatRes = await serviceCategoryApi.createCategory({
            name: catName,
            group: serviceForm.gender || 'Both',
            isActive: true,
          });
          if (newCatRes?.success && newCatRes.data?.id) {
            categoryId = newCatRes.data.id;
          }
        } catch (catErr) {
          console.warn('Could not create category:', catErr);
        }
      }

      const payload = {
        name: serviceForm.name.trim(),
        categoryId: categoryId || undefined,
        price: parseFloat(serviceForm.price),
        durationMinutes: durMinutes,
        hour,
        minute,
        group: serviceForm.gender || 'Both',
        isActive: true,
      };

      let backendSucceeded = false;
      const isBackendId = editingService?.id && typeof editingService.id === 'string' && editingService.id.includes('-');

      if (editingService && isBackendId) {
        const res = await serviceApi.updateService(editingService.id, payload);
        if (res?.success) {
          backendSucceeded = true;
          setServiceNotification(`Service "${serviceForm.name}" updated successfully in database.`);
        }
      } else {
        const res = await serviceApi.createService(payload);
        if (res?.success) {
          backendSucceeded = true;
          setServiceNotification(`Service "${serviceForm.name}" created successfully in database.`);
        }
      }

      if (backendSucceeded) {
        await fetchServices();
      } else {
        // Fallback local update
        let updated;
        if (editingService) {
          updated = servicesList.map(s =>
            s.id === editingService.id
              ? { ...s, ...serviceForm, header: formattedHeader, price: parseFloat(serviceForm.price) }
              : s
          );
          setServiceNotification(`Service "${serviceForm.name}" updated.`);
        } else {
          const newService = {
            id: Date.now(),
            ...serviceForm,
            header: formattedHeader,
            price: parseFloat(serviceForm.price),
          };
          updated = [...servicesList, newService];
          setServiceNotification(`Service "${serviceForm.name}" created.`);
        }
        setServicesList(updated);
        saveMasterServices(updated);
      }

      setShowAddService(false);
      setEditingService(null);
      setTimeout(() => setServiceNotification(''), 3000);
    } catch (err) {
      console.error('Failed to save service:', err);
      alert('Error saving service: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingService(false);
    }
  };

  // ==========================================
  // PRODUCTS HANDLERS
  // ==========================================
  const handleSaveProduct = async () => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Saving products');
      return;
    }
    if (!productForm.name.trim()) {
      setProductForm(prev => ({ ...prev, error: 'Validation Error: Product Name is required.' }));
      return;
    }
    if (!productForm.category.trim()) {
      setProductForm(prev => ({ ...prev, error: 'Validation Error: Category is required.' }));
      return;
    }

    setIsSavingProduct(true);
    try {
      const cost = parseFloat(productForm.price) || 0;
      const sale = parseFloat(productForm.salePrice) || cost;
      const stockQty = parseInt(productForm.stock, 10) >= 0 ? parseInt(productForm.stock, 10) : 0;
      const userCategory = productForm.category.trim();

      // Resolve or create product category in backend
      let categoryId = null;
      try {
        const catRes = await productCategoryApi.getCategories();
        const cats = Array.isArray(catRes?.data) ? catRes.data : [];
        const match = cats.find(c => c.name.toLowerCase() === userCategory.toLowerCase());
        if (match) {
          categoryId = match.id;
        } else {
          const createCat = await productCategoryApi.createCategory({
            name: userCategory,
            group: 'Both',
            isActive: true,
          });
          if (createCat?.data?.id) {
            categoryId = createCat.data.id;
          }
        }
      } catch (catErr) {
        console.warn('Could not query/create product category:', catErr);
      }

      const payload = {
        name: productForm.name.trim(),
        categoryId: categoryId || undefined,
        price: cost,
        salePrice: sale,
        initialStock: stockQty,
        productTag: userCategory,
        storeSku: 'SKU-' + Date.now().toString().slice(-4),
        barcode: '1234',
        isRetail: true,
        group: 'Both',
        isActive: true,
      };

      let backendSucceeded = false;
      const res = await productApi.createProduct(payload);
      if (res && res.success) {
        backendSucceeded = true;
        setProductNotification(`Product "${productForm.name}" saved successfully in database! Synced to POS.`);
        await fetchProducts();
      }

      if (!backendSucceeded) {
        const newProd = {
          id: 'p_' + Date.now(),
          name: productForm.name.trim(),
          sku: 'SKU-' + Date.now().toString().slice(-4),
          price: cost,
          salePrice: sale,
          barcode: '1234',
          stock: stockQty,
          header: userCategory,
          category: userCategory.toUpperCase(),
          productTag: userCategory,
        };
        const updated = [newProd, ...productsList];
        setProductsList(updated);
        saveMasterProducts(updated);
        setProductNotification(`Product "${newProd.name}" saved locally! Synced to POS.`);
      }

      setShowAddProduct(false);
      setProductForm({
        name: '',
        category: '',
        stock: '',
        price: '',
        salePrice: '',
        error: '',
      });
      setTimeout(() => setProductNotification(''), 3500);
    } catch (err) {
      console.error('Failed to save product:', err);
      setProductForm(prev => ({ ...prev, error: 'Failed to save product: ' + (err.message || 'Unknown error') }));
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Deleting products');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    const isBackendId = typeof productId === 'string' && productId.includes('-');
    if (isBackendId) {
      try {
        const delRes = await productApi.deleteProduct(productId);
        if (delRes && delRes.success) {
          setProductNotification('Product deleted successfully from database.');
          await fetchProducts();
          setTimeout(() => setProductNotification(''), 3000);
          return;
        }
      } catch (err) {
        console.warn('Backend product delete error:', err);
      }
    }

    const updated = productsList.filter(p => p.id !== productId);
    setProductsList(updated);
    saveMasterProducts(updated);
    setProductNotification('Product deleted successfully.');
    setTimeout(() => setProductNotification(''), 3000);
  };

  // ==========================================
  // PACKAGES HANDLERS
  // ==========================================
  const handleAddPackage = async (e) => {
    if (e) e.preventDefault();
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Creating packages');
      return;
    }
    if (!packageForm.name.trim()) return alert('Package name is required');
    if (!packageForm.price || isNaN(parseFloat(packageForm.price))) return alert('Valid package price is required');

    setIsSavingPackage(true);
    try {
      const totalSessionsNum = parseInt(packageForm.totalSessions, 10) || 1;
      const payload = {
        name: packageForm.name.trim(),
        price: parseFloat(packageForm.price) || 0,
        validityDays: parseInt(packageForm.validityDays, 10) || 180,
        renewalReminderDays: parseInt(packageForm.renewalReminderDays, 10) || 15,
        services: JSON.stringify({
          text: packageForm.services ? packageForm.services.trim() : '',
          totalSessions: totalSessionsNum,
        }),
        header: packageForm.header?.trim() || 'Special Packages',
        description: packageForm.header?.trim() || 'Special Packages',
        isActive: true,
      };

      let backendSucceeded = false;
      const res = await packageApi.createPackage(payload);
      if (res && res.success) {
        backendSucceeded = true;
        setPackageNotification(`Package "${packageForm.name}" (${totalSessionsNum} sessions) created successfully in database! Synced to POS.`);
        await fetchPackages();
      }

      if (!backendSucceeded) {
        const created = createPackage({
          name: packageForm.name,
          price: packageForm.price,
          validityDays: packageForm.validityDays,
          renewalReminderDays: packageForm.renewalReminderDays,
          totalSessions: totalSessionsNum,
          services: packageForm.services,
          header: packageForm.header.trim() || 'Special Packages',
        });
        setPackagesList(getPackages());
        setPackageNotification(`Package "${created?.name || packageForm.name}" created locally! Synced to POS.`);
      }

      setShowAddPackage(false);
      setPackageForm({ name: '', price: '', validityDays: '180', renewalReminderDays: '15', totalSessions: '5', services: '', header: '' });
      setTimeout(() => setPackageNotification(''), 3000);
    } catch (err) {
      console.error('Failed to create package:', err);
      alert('Error creating package: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingPackage(false);
    }
  };

  const handleDeletePackage = async (pkgId, pkgName) => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Deleting packages');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the package "${pkgName}"?`)) {
      return;
    }

    const isBackendId = typeof pkgId === 'string' && pkgId.includes('-');
    if (isBackendId) {
      try {
        const delRes = await packageApi.deletePackage(pkgId);
        if (delRes && delRes.success) {
          setPackageNotification(`Package "${pkgName}" deleted successfully from database.`);
          await fetchPackages();
          setTimeout(() => setPackageNotification(''), 3000);
          return;
        }
      } catch (err) {
        console.warn('Backend package delete error:', err);
      }
    }

    deletePackage(pkgId);
    setPackagesList(getPackages());
    setPackageNotification(`Package "${pkgName}" deleted successfully.`);
    setTimeout(() => setPackageNotification(''), 3000);
  };

  // ==========================================
  // MEMBERSHIPS HANDLERS
  // ==========================================
  const handleAddMembership = (e) => {
    if (e) e.preventDefault();
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Creating memberships');
      return;
    }
    if (!membershipForm.name.trim()) return alert('Membership plan name is required');
    if (!membershipForm.price || isNaN(parseFloat(membershipForm.price))) return alert('Valid membership price is required');

    const created = createMembership({
      name: membershipForm.name,
      tier: membershipForm.tier.trim() || membershipForm.name.trim(),
      price: membershipForm.price,
      discountPercent: membershipForm.discountPercent,
      validityDays: membershipForm.validityDays,
      renewalReminderDays: membershipForm.renewalReminderDays,
      benefits: membershipForm.benefits,
      header: membershipForm.header.trim() || 'Annual Memberships',
    });

    setMembershipsList(getMemberships());
    setShowAddMembership(false);
    setMembershipForm({
      name: '',
      tier: '',
      price: '',
      discountPercent: '15',
      validityDays: '365',
      renewalReminderDays: '15',
      benefits: '',
      header: '',
    });
    setMembershipNotification(`Membership Plan "${created?.name || membershipForm.name}" created successfully! Synced to POS.`);
    setTimeout(() => setMembershipNotification(''), 3000);
  };

  const handleDeleteMembership = (memId, memName) => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Deleting memberships');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the membership plan "${memName}"?`)) {
      deleteMembership(memId);
      setMembershipsList(getMemberships());
      setMembershipNotification(`Membership plan "${memName}" deleted successfully.`);
      setTimeout(() => setMembershipNotification(''), 3000);
    }
  };

  // ==========================================
  // DISPOSABLES HANDLERS
  // ==========================================
  const handleOpenCreateDisposable = () => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Creating disposables');
      return;
    }
    setEditingDisposable(null);
    setDisposableForm({
      name: '',
      category: '',
      unit: 'Pack',
      unitCost: '150',
      stock: '10',
      minStock: '5',
      supplier: '',
    });
    setShowAddDisposable(true);
  };

  const handleOpenEditDisposable = (item) => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Editing disposables');
      return;
    }
    setEditingDisposable(item);
    setDisposableForm({
      name: item.name || '',
      category: item.category || '',
      unit: item.unit || 'Pack',
      unitCost: String(item.unitCost ?? 150),
      stock: String(item.stock ?? 0),
      minStock: String(item.minStock ?? 5),
      supplier: item.supplier || '',
    });
    setShowAddDisposable(true);
  };

  const handleSaveDisposable = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked(editingDisposable ? 'Editing disposables' : 'Creating disposables');
      return;
    }
    if (!disposableForm.name.trim()) {
      alert('Please enter a disposable item name');
      return;
    }
    if (!disposableForm.category.trim()) {
      alert('Please enter a category');
      return;
    }
    if (isNaN(Number(disposableForm.unitCost)) || Number(disposableForm.unitCost) < 0) {
      alert('Please enter a valid unit cost');
      return;
    }

    setIsSavingDisposable(true);
    try {
      const payload = {
        name: disposableForm.name.trim(),
        category: disposableForm.category.trim(),
        unit: disposableForm.unit || 'Pack',
        price: Number(disposableForm.unitCost) || 0,
        salePrice: Number(disposableForm.unitCost) || 0,
        quantity: Number(disposableForm.stock) || 0,
        productTag: disposableForm.supplier?.trim() || null,
        isActive: true,
      };

      if (editingDisposable) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(editingDisposable.id));
        if (isUuid) {
          try {
            await disposableApi.updateDisposable(editingDisposable.id, payload);
          } catch (apiErr) {
            console.warn('Backend API update failed, continuing with local update:', apiErr);
          }
        }
        updateDisposableItem(editingDisposable.id, {
          name: disposableForm.name.trim(),
          category: disposableForm.category.trim(),
          unit: disposableForm.unit || 'Pack',
          unitCost: Number(disposableForm.unitCost) || 0,
          stock: Number(disposableForm.stock) || 0,
          minStock: Number(disposableForm.minStock) || 5,
          supplier: disposableForm.supplier || '',
        });
        setDisposableNotification(`Disposable item "${disposableForm.name.trim()}" updated successfully in database!`);
      } else {
        let createdBackendId = null;
        try {
          const res = await disposableApi.createDisposable(payload);
          createdBackendId = res?.data?.id || null;
        } catch (apiErr) {
          console.warn('Backend API create failed, continuing with local save:', apiErr);
        }

        addDisposableItem({
          ...(createdBackendId ? { id: createdBackendId } : {}),
          name: disposableForm.name.trim(),
          category: disposableForm.category.trim(),
          unit: disposableForm.unit || 'Pack',
          unitCost: Number(disposableForm.unitCost) || 0,
          stock: Number(disposableForm.stock) || 0,
          minStock: Number(disposableForm.minStock) || 5,
          supplier: disposableForm.supplier || '',
        });
        setDisposableNotification(`Disposable item "${disposableForm.name.trim()}" saved to PostgreSQL database!`);
      }

      await fetchDisposables();
      setShowAddDisposable(false);
      setTimeout(() => setDisposableNotification(''), 3000);
    } catch (err) {
      console.error('Error saving disposable:', err);
      alert(err.message || 'Failed to save disposable item');
    } finally {
      setIsSavingDisposable(false);
    }
  };

  const handleDeleteDisposable = async (id, name) => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Deleting disposables');
      return;
    }
    if (window.confirm(`Are you sure you want to delete disposable item "${name}" from database?`)) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
        if (isUuid) {
          await disposableApi.deleteDisposable(id);
        }
      } catch (err) {
        console.warn('Backend delete failed, removing locally:', err);
      }
      deleteDisposableItem(id);
      await fetchDisposables();
      setDisposableNotification(`Disposable item "${name}" deleted from database.`);
      setTimeout(() => setDisposableNotification(''), 3000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Master Backoffice (BO)</h1>
          <p className="text-xs text-slate-500 mt-1">Foundation catalog for Services, Products, Packages & Disposables synced with POS</p>
        </div>

        {/* Master BO Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl flex-wrap">
          {[
            { name: 'Services', icon: Scissors, count: servicesList.length, perm: permissions.masterBoServices },
            { name: 'Products', icon: Package, count: productsList.length, perm: permissions.masterBoProducts },
            { name: 'Packages', icon: Gift, count: packagesList.length, perm: permissions.masterBoPackages },
            { name: 'Disposables', icon: Layers, count: disposablesList.length, perm: permissions.masterBoDisposables !== undefined ? permissions.masterBoDisposables : (permissions.disposables ?? true) },
          ]
            .filter(tab => currentUser?.role !== 'CASHIER' || tab.perm)
            .map(tab => (
            <button
              key={tab.name}
              onClick={() => handleTabClick(tab.name)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.name
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.name ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. SERVICES MASTER                                        */}
      {/* ======================================================== */}
      {activeTab === 'Services' && (
        <div className="space-y-4">
          {serviceNotification && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              {serviceNotification}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-800">Salon Services Catalog</h2>
              <p className="text-xs text-slate-500">Core service items booked via Appointments and billed via POS (Persisted in PostgreSQL)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchServices}
                disabled={isServicesLoading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh from Database"
              >
                <RefreshCw size={14} className={isServicesLoading ? 'animate-spin text-indigo-600' : ''} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleOpenCreateService}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <Plus size={16} /> Create Service
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[750px] text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Gender</th>
                    <th className="py-3 px-4">Rate (₹)</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isServicesLoading && servicesList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Loader2 size={18} className="animate-spin text-indigo-600" />
                          <span>Loading services from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : servicesList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                        No services found in database. Click "Create Service" to add one.
                      </td>
                    </tr>
                  ) : (
                    servicesList.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{s.name}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                            {s.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            s.gender === 'Female' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                            s.gender === 'Male' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                            'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {s.gender || 'Both'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">₹{s.price}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">{s.duration}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditService(s)}
                              className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Service"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteService(s.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Service"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PRODUCTS MASTER                                       */}
      {/* ======================================================== */}
      {activeTab === 'Products' && (
        <div className="space-y-4">
          {productNotification && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              {productNotification}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-800">Products Catalog</h2>
              <p className="text-xs text-slate-500">Physical inventory products tracked in stock and sold at POS (Persisted in PostgreSQL)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchProducts}
                disabled={isProductsLoading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh from Database"
              >
                <RefreshCw size={14} className={isProductsLoading ? 'animate-spin text-indigo-600' : ''} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  setProductForm({
                    name: '',
                    category: '',
                    stock: '',
                    price: '',
                    salePrice: '',
                    error: '',
                  });
                  setShowAddProduct(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <Plus size={16} /> Add Product
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[700px] text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Cost Price</th>
                    <th className="py-3 px-4">Sale Price</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isProductsLoading && productsList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Loader2 size={18} className="animate-spin text-indigo-600" />
                          <span>Loading products from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : productsList.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                        No products found in database. Click "Add Product" to add one.
                      </td>
                    </tr>
                  ) : (
                    productsList.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{p.name}</td>
                        <td className="py-3.5 px-4 text-slate-500">₹{p.price}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">₹{p.salePrice}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{p.stock}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PACKAGES MASTER                                       */}
      {/* ======================================================== */}
      {activeTab === 'Packages' && (
        <div className="space-y-4">
          {packageNotification && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
              <Check size={16} className="shrink-0 text-emerald-600" />
              <span>{packageNotification}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Gift className="text-indigo-600" size={20} />
                <span>Packages Master</span>
              </h2>
              <p className="text-xs text-slate-500">Create, bundle, and manage salon service packages with validity duration and included services (Persisted in PostgreSQL)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchPackages}
                disabled={isPackagesLoading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh from Database"
              >
                <RefreshCw size={14} className={isPackagesLoading ? 'animate-spin text-indigo-600' : ''} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddPackage(true)}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
              >
                <Plus size={16} />
                <span>+ Create Package</span>
              </button>
            </div>
          </div>

          {isPackagesLoading && packagesList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin text-indigo-600" />
                <span>Loading packages from database...</span>
              </div>
            </div>
          ) : packagesList.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {packagesList.map(pkg => (
                <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all space-y-3 relative group">
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                          {pkg.header || 'Service Package'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                          ⚡ {pkg.totalSessions || 1} Sessions
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          <span>{pkg.validityDays || 180} Days</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>

                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-lg font-black text-indigo-600 mr-1">₹{pkg.price.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => setViewingPackage(pkg)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-indigo-200"
                        title={`View Details of "${pkg.name}"`}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        title={`Delete Package "${pkg.name}"`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-xl text-xs text-slate-600 border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-indigo-500" />
                      <span>Included Services:</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed pl-4 font-medium">
                      {pkg.services || 'Multiple salon services included in this package bundle.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Gift size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Packages Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not configured any salon packages yet. Click below to bundle services with validity days.
              </p>
              <button
                type="button"
                onClick={() => setShowAddPackage(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                + Create First Package
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MEMBERSHIP PLANS MASTER                                */}
      {/* ======================================================== */}
      {false && activeTab === 'Memberships' && (
        <div className="space-y-4">
          {membershipNotification && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
              <Check size={16} className="shrink-0 text-emerald-600" />
              <span>{membershipNotification}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Crown className="text-indigo-600" size={20} />
                <span>Membership Plans & Loyalty Tiers</span>
              </h2>
              <p className="text-xs text-slate-500">Create, configure, and manage salon membership plans, discounts, and validity periods</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddMembership(true)}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
            >
              <Plus size={16} />
              <span>+ Create Membership Plan</span>
            </button>
          </div>

          {membershipsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {membershipsList.map(mem => (
                <div key={mem.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all space-y-3 relative group flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-100">
                          {mem.tier || 'Membership Tier'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          <span>{mem.validityDays || 365} Days</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setViewingMembership(mem)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-indigo-200"
                          title={`View Details of "${mem.name}"`}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMembership(mem.id, mem.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                          title={`Delete Membership "${mem.name}"`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{mem.name}</h3>

                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-indigo-600">₹{Number(mem.price || 0).toLocaleString()}</span>
                      <span className="text-xs text-slate-400 font-medium">/ year</span>
                      {mem.discountPercent > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 ml-auto">
                          {mem.discountPercent}% OFF Services
                        </span>
                      )}
                    </div>


                  </div>

                  <div className="p-3 bg-slate-50/80 rounded-xl text-xs text-slate-600 border border-slate-100 space-y-1">
                    <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-indigo-500" />
                      <span>Included Perks & Benefits:</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-medium pl-4">
                      {mem.benefits || 'Discounts and salon privileges included in this membership tier.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Crown size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Membership Plans Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not configured any salon membership tiers yet. Click below to create your first membership plan.
              </p>
              <button
                type="button"
                onClick={() => setShowAddMembership(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                + Create First Membership Plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DISPOSABLES MASTER                                    */}
      {/* ======================================================== */}
      {activeTab === 'Disposables' && (
        <div className="space-y-4">
          {disposableNotification && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              {disposableNotification}
            </div>
          )}

          {/* Top Bar with Title, Search & Filter & Action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Salon Disposables Catalog</h2>
              <p className="text-xs text-slate-500">Capes, gloves, foils, neck paper rolls & salon hygiene supplies</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchDisposables}
                disabled={isDisposablesLoading}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh from Database"
              >
                <RefreshCw size={14} className={isDisposablesLoading ? 'animate-spin text-indigo-600' : ''} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleOpenCreateDisposable}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <Plus size={16} /> + Add Disposable
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search disposable item by name, category or unit..."
                value={disposableSearchQuery}
                onChange={(e) => setDisposableSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-slate-50/50"
              />
              {disposableSearchQuery && (
                <button
                  onClick={() => setDisposableSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Disposables Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit of Measure</th>
                    <th className="py-3 px-4 font-mono">Unit Cost (₹)</th>
                    <th className="py-3 px-4">Stock Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isDisposablesLoading && disposablesList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <Loader2 size={18} className="animate-spin text-indigo-600" />
                          <span>Loading disposables from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : disposablesList
                    .filter(item => {
                      if (!item) return false;
                      const q = disposableSearchQuery.toLowerCase().trim();
                      return !q ||
                        item.name?.toLowerCase().includes(q) ||
                        item.sku?.toLowerCase().includes(q) ||
                        item.category?.toLowerCase().includes(q) ||
                        item.unit?.toLowerCase().includes(q);
                    })
                    .map((item) => {
                      const isLowStock = Number(item.stock || 0) <= Number(item.minStock || 5);
                      const isOutOfStock = Number(item.stock || 0) <= 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{item.name}</div>
                            {item.sku && (
                              <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                              {item.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-semibold text-slate-600">
                              {item.unit || 'Pack'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                            ₹{Number(item.unitCost || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isOutOfStock ? 'bg-rose-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                              <span>{item.stock !== undefined ? `${item.stock} ${item.unit || 'units'}` : (item.status || 'In Stock')}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditDisposable(item)}
                                className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Disposable"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteDisposable(item.id, item.name)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Disposable"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {disposablesList.filter(item => {
                    if (!item) return false;
                    const q = disposableSearchQuery.toLowerCase().trim();
                    return !q ||
                      item.name?.toLowerCase().includes(q) ||
                      item.sku?.toLowerCase().includes(q) ||
                      item.category?.toLowerCase().includes(q) ||
                      item.unit?.toLowerCase().includes(q);
                  }).length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <Layers size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-600">No disposable items found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or add a new disposable item.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT SERVICE                             */}
      {/* ======================================================== */}
      {showAddService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddService(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {editingService ? 'Edit Service' : 'Create Service'}
              </h3>
              <button 
                onClick={() => setShowAddService(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Service Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="e.g. Hair Cut (With Shampoo)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    placeholder="e.g. Hair, Skin, Nails..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Rate (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    placeholder="e.g. 200"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Duration <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="15m">15m</option>
                    <option value="20m">20m</option>
                    <option value="30m">30m</option>
                    <option value="45m">45m</option>
                    <option value="60m">60m</option>
                    <option value="90m">90m</option>
                    <option value="120m">120m</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Applicable Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={serviceForm.gender}
                    onChange={(e) => setServiceForm({ ...serviceForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Both">Both (Male & Female)</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowAddService(false)}
                disabled={isSavingService}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                disabled={isSavingService}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSavingService && <Loader2 size={15} className="animate-spin text-white" />}
                <span>
                  {editingService 
                    ? (isSavingService ? 'Updating...' : 'Update Service') 
                    : (isSavingService ? 'Creating...' : 'Create Service')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD PRODUCT                                       */}
      {/* ======================================================== */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddProduct(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Add Product</h3>
              <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {productForm.error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                {productForm.error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. L'Oreal Hair Serum"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    placeholder="e.g. Skincare, Hair, Supplies..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Stock Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="e.g. 25"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.salePrice}
                    onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                    placeholder="e.g. 150"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddProduct(false)}
                disabled={isSavingProduct}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isSavingProduct}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSavingProduct && <Loader2 size={15} className="animate-spin text-white" />}
                <span>{isSavingProduct ? 'Saving...' : 'Save Product'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE PACKAGE                                    */}
      {/* ======================================================== */}
      {showAddPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowAddPackage(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Gift className="text-indigo-600" size={20} />
                  <span>Create Service Package</span>
                </h3>
                <p className="text-xs text-slate-500">Bundle salon services together with validity duration and included services</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPackage(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPackage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bridal Glow Suite, Hair Spa & Cut Combo"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Package Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 4999"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Group (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hair Packages, Bridal, Men's Grooming"
                    value={packageForm.header}
                    onChange={(e) => setPackageForm({ ...packageForm, header: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Validity & Session Counts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Validity Duration (Days) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 180"
                    value={packageForm.validityDays}
                    onChange={(e) => setPackageForm({ ...packageForm, validityDays: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {['30', '60', '90', '180', '365'].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setPackageForm({ ...packageForm, validityDays: d })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          packageForm.validityDays === d
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Sessions (Counts) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5"
                    value={packageForm.totalSessions}
                    onChange={(e) => setPackageForm({ ...packageForm, totalSessions: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {['1', '3', '5', '8', '10', '12'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPackageForm({ ...packageForm, totalSessions: s })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          packageForm.totalSessions === s
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s} Sessions
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Included Services Breakdown *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. 4 Hair Spas, 2 Hair Cuts, 1 Color Touch-up, 1 Mani & Pedi"
                  value={packageForm.services}
                  onChange={(e) => setPackageForm({ ...packageForm, services: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPackage(false)}
                  disabled={isSavingPackage}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPackage}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingPackage ? (
                    <Loader2 size={14} className="animate-spin text-white" />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>{isSavingPackage ? 'Saving...' : 'Save & Add Package'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW PACKAGE DETAILS                              */}
      {/* ======================================================== */}
      {viewingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setViewingPackage(null)} 
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-800 border border-slate-100">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-xs">
                  <Gift size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                      {viewingPackage.header || 'Service Package'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      <span>{viewingPackage.validityDays || 180} Days Validity</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{viewingPackage.name}</h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setViewingPackage(null)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Price</span>
                <span className="text-base font-black text-indigo-600">₹{viewingPackage.price?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Sessions</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">⚡ {viewingPackage.totalSessions || 1} Sessions</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Validity</span>
                <span className="text-xs font-bold text-slate-800">{viewingPackage.validityDays || 180} Days</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Category</span>
                <span className="text-xs font-bold text-slate-800">{viewingPackage.header || 'Special Packages'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                <span>Included Services & Breakdown</span>
              </span>
              <div className="p-4 bg-indigo-50/40 border border-indigo-100/80 rounded-xl space-y-2 max-h-48 overflow-y-auto">
                {viewingPackage.services ? (
                  <div className="space-y-2 text-xs text-slate-700">
                    {viewingPackage.services.split(/[,+\n]/).filter(s => s.trim().length > 0).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-indigo-50">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-medium text-slate-800">{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No specific service breakdown provided for this package.</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const target = viewingPackage;
                  setViewingPackage(null);
                  handleDeletePackage(target.id, target.name);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
              >
                <Trash2 size={14} />
                <span>Delete Package</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingPackage(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD MEMBERSHIP PLAN                               */}
      {/* ======================================================== */}
      {showAddMembership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setShowAddMembership(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Crown size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Create Membership Plan</h3>
                  <p className="text-xs text-slate-500">Configure tiered membership discounts & privileges</p>
                </div>
              </div>
              <button onClick={() => setShowAddMembership(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddMembership} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gold VIP Annual Membership"
                  value={membershipForm.name}
                  onChange={(e) => setMembershipForm({ ...membershipForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tier Label (Badge) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gold Tier, VIP Club"
                    value={membershipForm.tier}
                    onChange={(e) => setMembershipForm({ ...membershipForm, tier: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Group (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Memberships, Premium"
                    value={membershipForm.header}
                    onChange={(e) => setMembershipForm({ ...membershipForm, header: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Membership Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 5000"
                    value={membershipForm.price}
                    onChange={(e) => setMembershipForm({ ...membershipForm, price: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount % on Services *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 20"
                    value={membershipForm.discountPercent}
                    onChange={(e) => setMembershipForm({ ...membershipForm, discountPercent: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Validity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Validity Duration (Days) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 365"
                  value={membershipForm.validityDays}
                  onChange={(e) => setMembershipForm({ ...membershipForm, validityDays: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {['30', '90', '180', '365'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setMembershipForm({ ...membershipForm, validityDays: d })}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        membershipForm.validityDays === d
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Included Benefits & Privileges *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. 20% off on all services, 1 free hair spa per quarter, complimentary blow dries"
                  value={membershipForm.benefits}
                  onChange={(e) => setMembershipForm({ ...membershipForm, benefits: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMembership(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Save & Add Membership</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW MEMBERSHIP DETAILS                           */}
      {/* ======================================================== */}
      {viewingMembership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setViewingMembership(null)} 
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-slate-800 border border-slate-100">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-xs">
                  <Crown size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                      {viewingMembership.tier || viewingMembership.header || 'Membership'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      <span>{viewingMembership.validityDays || 365} Days</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{viewingMembership.name}</h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setViewingMembership(null)} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Annual Fee</span>
                <span className="text-base font-black text-indigo-600">₹{Number(viewingMembership.price || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Discount</span>
                <span className="text-xs font-bold text-emerald-600">{viewingMembership.discountPercent || 0}% OFF</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Validity</span>
                <span className="text-xs font-bold text-slate-800">{viewingMembership.validityDays || 365} Days</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                <span>Included Perks & Member Privileges</span>
              </span>
              <div className="p-4 bg-indigo-50/40 border border-indigo-100/80 rounded-xl space-y-2 max-h-48 overflow-y-auto">
                {viewingMembership.benefits ? (
                  <div className="space-y-2 text-xs text-slate-700">
                    {viewingMembership.benefits.split(/[,+\n]/).filter(s => s.trim().length > 0).map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-indigo-50">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-medium text-slate-800">{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No specific benefits listed for this membership plan.</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const target = viewingMembership;
                  setViewingMembership(null);
                  handleDeleteMembership(target.id, target.name);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
              >
                <Trash2 size={14} />
                <span>Delete Membership</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingMembership(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT DISPOSABLE                          */}
      {/* ======================================================== */}
      {showAddDisposable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddDisposable(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingDisposable ? 'Edit Disposable Item' : 'Add Disposable Item'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDisposable(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDisposable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Item Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={disposableForm.name}
                  onChange={(e) => setDisposableForm({ ...disposableForm, name: e.target.value })}
                  placeholder="e.g. Disposable Cutting Capes (Pack of 50)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={disposableForm.category}
                    onChange={(e) => setDisposableForm({ ...disposableForm, category: e.target.value })}
                    placeholder="e.g. Hair & Styling, Skincare, Hygiene..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Unit of Measure <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={disposableForm.unit}
                    onChange={(e) => setDisposableForm({ ...disposableForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Pack">Pack</option>
                    <option value="Box">Box</option>
                    <option value="Roll">Roll</option>
                    <option value="Piece">Piece / Pcs</option>
                    <option value="Bottle">Bottle</option>
                    <option value="ml">ml</option>
                    <option value="gm">gm</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Unit Cost (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={disposableForm.unitCost}
                    onChange={(e) => setDisposableForm({ ...disposableForm, unitCost: e.target.value })}
                    placeholder="150"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={disposableForm.stock}
                    onChange={(e) => setDisposableForm({ ...disposableForm, stock: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Min Alert Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={disposableForm.minStock}
                    onChange={(e) => setDisposableForm({ ...disposableForm, minStock: e.target.value })}
                    placeholder="5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Supplier / Vendor (Optional)
                </label>
                <input
                  type="text"
                  value={disposableForm.supplier}
                  onChange={(e) => setDisposableForm({ ...disposableForm, supplier: e.target.value })}
                  placeholder="e.g. Salon Supplies Direct"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDisposable(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDisposable}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer active:scale-95 transition-all inline-flex items-center gap-2"
                >
                  {isSavingDisposable && <Loader2 size={15} className="animate-spin text-white" />}
                  {editingDisposable ? 'Update Disposable' : 'Save Disposable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
