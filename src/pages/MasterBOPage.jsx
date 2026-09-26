import React, { useState, useEffect } from 'react';
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
  Eye 
} from 'lucide-react';
import { getMasterServices, saveMasterServices } from '../utils/serviceStorage';
import { getMasterProducts, saveMasterProducts } from '../utils/productStorage';
import { getPackages, createPackage, deletePackage } from '../utils/packageStorage';
import { getMemberships, createMembership, deleteMembership } from '../utils/membershipStorage';
import { getCurrentUser, getCashierPermissions } from '../utils/saasStorage';

export default function MasterBOPage() {
  const currentUser = getCurrentUser();
  const [permissions, setPermissions] = useState(() => getCashierPermissions());
  const [activeTab, setActiveTab] = useState('Services'); // Services, Products, Packages, Memberships

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

  // Notifications
  const [serviceNotification, setServiceNotification] = useState('');
  const [productNotification, setProductNotification] = useState('');
  const [packageNotification, setPackageNotification] = useState('');
  const [membershipNotification, setMembershipNotification] = useState('');

  // 1. Services State
  const [servicesList, setServicesList] = useState(() => getMasterServices());
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
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    validityDays: '180',
    renewalReminderDays: '15',
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

  // Real-time synchronization with localStorage & POS
  useEffect(() => {
    const handleSync = () => {
      setServicesList(getMasterServices());
      setProductsList(getMasterProducts());
      setPackagesList(getPackages());
      setMembershipsList(getMemberships());
    };

    window.addEventListener('servicesUpdated', handleSync);
    window.addEventListener('productsUpdated', handleSync);
    window.addEventListener('resparkPackagesUpdated', handleSync);
    window.addEventListener('resparkMembershipsUpdated', handleSync);
    window.addEventListener('tenantChanged', handleSync);

    return () => {
      window.removeEventListener('servicesUpdated', handleSync);
      window.removeEventListener('productsUpdated', handleSync);
      window.removeEventListener('resparkPackagesUpdated', handleSync);
      window.removeEventListener('resparkMembershipsUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
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

  const handleDeleteService = (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const updated = servicesList.filter(s => s.id !== serviceId);
      setServicesList(updated);
      saveMasterServices(updated);
      setServiceNotification('Service deleted successfully.');
      setTimeout(() => setServiceNotification(''), 3000);
    }
  };

  const handleSaveService = () => {
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

    let updated;
    const catName = (serviceForm.category || 'Services').trim();
    const formattedHeader = catName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

    if (editingService) {
      updated = servicesList.map(s =>
        s.id === editingService.id
          ? { ...s, ...serviceForm, header: formattedHeader, price: parseFloat(serviceForm.price) }
          : s
      );
      setServiceNotification(`Service "${serviceForm.name}" updated successfully.`);
    } else {
      const newService = {
        id: Date.now(),
        ...serviceForm,
        header: formattedHeader,
        price: parseFloat(serviceForm.price),
      };
      updated = [...servicesList, newService];
      setServiceNotification(`Service "${serviceForm.name}" created successfully.`);
    }

    setServicesList(updated);
    saveMasterServices(updated);
    setShowAddService(false);
    setEditingService(null);
    setTimeout(() => setServiceNotification(''), 3000);
  };

  // ==========================================
  // PRODUCTS HANDLERS
  // ==========================================
  const handleSaveProduct = () => {
    if (!productForm.name.trim()) {
      setProductForm(prev => ({ ...prev, error: 'Validation Error: Product Name is required.' }));
      return;
    }
    if (!productForm.category.trim()) {
      setProductForm(prev => ({ ...prev, error: 'Validation Error: Category is required.' }));
      return;
    }
    const cost = parseFloat(productForm.price) || 0;
    const sale = parseFloat(productForm.salePrice) || cost;
    const stockQty = parseInt(productForm.stock, 10) >= 0 ? parseInt(productForm.stock, 10) : 0;
    const userCategory = productForm.category.trim();

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
    setProductNotification(`Product "${newProd.name}" saved successfully! Synced to POS.`);
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
  };

  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const updated = productsList.filter(p => p.id !== productId);
      setProductsList(updated);
      saveMasterProducts(updated);
      setProductNotification('Product deleted successfully.');
      setTimeout(() => setProductNotification(''), 3000);
    }
  };

  // ==========================================
  // PACKAGES HANDLERS
  // ==========================================
  const handleAddPackage = (e) => {
    if (e) e.preventDefault();
    if (!packageForm.name.trim()) return alert('Package name is required');
    if (!packageForm.price || isNaN(parseFloat(packageForm.price))) return alert('Valid package price is required');

    const created = createPackage({
      name: packageForm.name,
      price: packageForm.price,
      validityDays: packageForm.validityDays,
      renewalReminderDays: packageForm.renewalReminderDays,
      services: packageForm.services,
      header: packageForm.header.trim() || 'Special Packages',
    });

    setPackagesList(getPackages());
    setShowAddPackage(false);
    setPackageForm({ name: '', price: '', validityDays: '180', renewalReminderDays: '15', services: '', header: '' });
    setPackageNotification(`Package "${created?.name || packageForm.name}" created successfully! Synced to POS.`);
    setTimeout(() => setPackageNotification(''), 3000);
  };

  const handleDeletePackage = (pkgId, pkgName) => {
    if (window.confirm(`Are you sure you want to delete the package "${pkgName}"?`)) {
      deletePackage(pkgId);
      setPackagesList(getPackages());
      setPackageNotification(`Package "${pkgName}" deleted successfully.`);
      setTimeout(() => setPackageNotification(''), 3000);
    }
  };

  // ==========================================
  // MEMBERSHIPS HANDLERS
  // ==========================================
  const handleAddMembership = (e) => {
    if (e) e.preventDefault();
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
    if (window.confirm(`Are you sure you want to delete the membership plan "${memName}"?`)) {
      deleteMembership(memId);
      setMembershipsList(getMemberships());
      setMembershipNotification(`Membership plan "${memName}" deleted successfully.`);
      setTimeout(() => setMembershipNotification(''), 3000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Master Backoffice (BO)</h1>
          <p className="text-xs text-slate-500 mt-1">Foundation catalog for Services, Products, Packages & Memberships synced with POS</p>
        </div>

        {/* Master BO Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl flex-wrap">
          {[
            { name: 'Services', icon: Scissors, count: servicesList.length, perm: permissions.masterBoServices },
            { name: 'Products', icon: Package, count: productsList.length, perm: permissions.masterBoProducts },
            { name: 'Packages', icon: Gift, count: packagesList.length, perm: permissions.masterBoPackages },
            { name: 'Memberships', icon: Crown, count: membershipsList.length, perm: permissions.masterBoMemberships },
          ]
            .filter(tab => currentUser?.role !== 'CASHIER' || tab.perm)
            .map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
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
              <p className="text-xs text-slate-500">Core service items booked via Appointments and billed via POS</p>
            </div>
            <button
              onClick={handleOpenCreateService}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Plus size={16} /> Create Service
            </button>
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
                  {servicesList.map(s => (
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
                  ))}
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
              <p className="text-xs text-slate-500">Physical inventory products tracked in stock and sold at POS</p>
            </div>
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
                  {productsList.map(p => (
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
                  ))}
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
              <p className="text-xs text-slate-500">Create, bundle, and manage salon service packages with validity duration and included services</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPackage(true)}
              className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
            >
              <Plus size={16} />
              <span>+ Create Package</span>
            </button>
          </div>

          {packagesList.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {packagesList.map(pkg => (
                <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all space-y-3 relative group">
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                          {pkg.header || 'Service Package'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Clock size={11} className="text-slate-400" />
                          <span>{pkg.validityDays || 180} Days Validity</span>
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
      {activeTab === 'Memberships' && (
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
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveService}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer transition-all active:scale-95"
              >
                {editingService ? 'Update Service' : 'Create Service'}
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
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer active:scale-95"
              >
                Save Product
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

              {/* Validity Duration */}
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
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Save & Add Package</span>
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

            <div className="grid grid-cols-3 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Price</span>
                <span className="text-base font-black text-indigo-600">₹{viewingPackage.price?.toLocaleString()}</span>
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
    </div>
  );
}
