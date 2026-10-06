import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, MoreVertical, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, SlidersHorizontal, Eye, Edit3, Trash2, ShoppingCart, Phone, Award, History, Package, CreditCard, Calendar, Clock, Receipt, CheckCircle2 } from 'lucide-react';
import { getCustomers, saveCustomers, addCustomer, updateCustomer, deleteCustomer, fetchCustomersFromBackend } from '../utils/customerStorage';
import { getOrders, updateOrder } from '../utils/orderStorage';
import { getAppointments } from '../utils/appointmentStorage';
import { isReadOnlySession, notifyReadOnlyBlocked } from '../utils/saasStorage';
import { getPackages } from '../utils/packageStorage';
import InvoiceBillModal from '../components/common/InvoiceBillModal';

// ==========================================
// FILTERS MODAL COMPONENT
// ==========================================
const FiltersModal = ({ isOpen, onClose, filters, onApply, onClear }) => {
  const [activeFilter, setActiveFilter] = useState('Gender');
  const [selectedGender, setSelectedGender] = useState(filters?.gender || 'Both');
  const [lastVisitedFrom, setLastVisitedFrom] = useState(filters?.lastVisitedFrom || '');
  const [lastVisitedTo, setLastVisitedTo] = useState(filters?.lastVisitedTo || '');
  const [selectedPackages, setSelectedPackages] = useState(filters?.packages || 'all');
  const [minBalance, setMinBalance] = useState(filters?.minBalance || '');

  useEffect(() => {
    if (isOpen && filters) {
      setSelectedGender(filters.gender || 'Both');
      setLastVisitedFrom(filters.lastVisitedFrom || '');
      setLastVisitedTo(filters.lastVisitedTo || '');
      setSelectedPackages(filters.packages || 'all');
      setMinBalance(filters.minBalance || '');
    }
  }, [isOpen, filters]);

  const filterCategories = [
    'Gender',
    'Last Visited',
    'Packages',
    'Balance',
  ];

  const handleApply = () => {
    if (onApply) {
      onApply({
        gender: selectedGender,
        lastVisitedFrom,
        lastVisitedTo,
        packages: selectedPackages,
        minBalance,
      });
    }
    onClose();
  };

  const handleClear = () => {
    const defaultFilters = {
      gender: 'Both',
      lastVisitedFrom: '',
      lastVisitedTo: '',
      packages: 'all',
      minBalance: '',
    };
    setSelectedGender('Both');
    setLastVisitedFrom('');
    setLastVisitedTo('');
    setSelectedPackages('all');
    setMinBalance('');
    if (onClear) {
      onClear(defaultFilters);
    }
    onClose();
  };

  const renderFilterContent = () => {
    switch (activeFilter) {
      case 'Gender':
        return (
          <div className="space-y-4">
            {['Both', 'Female', 'Male'].map(option => (
              <label 
                key={option} 
                onClick={() => setSelectedGender(option)}
                className="flex items-center gap-3 cursor-pointer group select-none"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedGender === option ? 'border-indigo-600' : 'border-slate-300 group-hover:border-slate-400'
                }`}>
                  {selectedGender === option && (
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  )}
                </div>
                <span className={`text-sm ${selectedGender === option ? 'text-indigo-900 font-semibold' : 'text-slate-700'}`}>{option}</span>
              </label>
            ))}
          </div>
        );
      case 'Last Visited':
        return (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">From Date</label>
              <input 
                type="date" 
                value={lastVisitedFrom}
                onChange={(e) => setLastVisitedFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">To Date</label>
              <input 
                type="date" 
                value={lastVisitedTo}
                onChange={(e) => setLastVisitedTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" 
              />
            </div>
          </div>
        );
      case 'Packages':
        return (
          <div className="space-y-3">
            <label className="text-xs text-slate-500 mb-1 block">Package Subscription</label>
            <select 
              value={selectedPackages}
              onChange={(e) => setSelectedPackages(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="all">All Customers</option>
              <option value="has_package">Customers with Active Package</option>
              <option value="no_package">No Active Package</option>
            </select>
            <p className="text-xs text-slate-400">Filter customers holding salon service packages</p>
          </div>
        );
      case 'Balance':
        return (
          <div className="space-y-3">
            <label className="text-xs text-slate-500 mb-1 block">Minimum Balance Due</label>
            <input 
              type="number" 
              value={minBalance}
              onChange={(e) => setMinBalance(e.target.value)}
              placeholder="Enter min balance due (₹)" 
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500" 
            />
            <p className="text-xs text-slate-400">Filter customers with outstanding balance due</p>
          </div>
        );

      default:
        return (
          <p className="text-sm text-slate-400 italic">No filter options available for {activeFilter}</p>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">Filters</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — filter categories */}
          <div className="w-2/5 border-r border-slate-200 overflow-y-auto">
            {filterCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-colors cursor-pointer ${
                  activeFilter === cat
                    ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Right — filter options */}
          <div className="w-3/5 p-5 overflow-y-auto">
            {renderFilterContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={handleClear}
            className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Clear
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ADD GUEST MODAL COMPONENT
// ==========================================
const AddGuestModal = ({ isOpen, onClose, onAddGuest }) => {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    alternateNumber: '',
    name: '',
    email: '',
    dob: '',
    gender: 'Female',
    loyaltyTier: 'Standard',
    loyaltyPoints: '0',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTierChange = (nextTier) => {
    let nextPts = formData.loyaltyPoints;
    if (!nextPts || nextPts === '0') {
      if (nextTier === 'Silver') nextPts = '100';
      else if (nextTier === 'Gold') nextPts = '250';
      else if (nextTier === 'Platinum VIP') nextPts = '500';
      else nextPts = '0';
    }
    setFormData(prev => ({ ...prev, loyaltyTier: nextTier, loyaltyPoints: nextPts }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.mobileNumber.trim()) {
      alert('Please enter Name and Mobile Number');
      return;
    }
    const tier = formData.loyaltyTier || 'Standard';
    const pts = parseInt(formData.loyaltyPoints, 10) || 0;
    const loyaltyStr = tier === 'Standard' && pts === 0 ? '-' : (pts > 0 ? `${tier} (${pts} pts)` : tier);

    if (onAddGuest) {
      onAddGuest({
        id: Date.now(),
        mobile: formData.mobileNumber.trim(),
        name: formData.name.trim(),
        gender: formData.gender || 'Female',
        lastVisited: '18-Sep-2026',
        totalOrders: 0,
        totalPurchaseAmount: 0,
        averagePurchaseAmount: 0,
        loyalty: loyaltyStr,
        loyaltyPoints: pts,
        loyaltyTier: tier,
        referralCode: '-',
        advance: 0,
        balance: 0,
        membershipCount: '-',
        email: formData.email.trim() ? formData.email.trim() : '',
        birthDate: formData.dob || '',
      });
    }
    setFormData({
      mobileNumber: '',
      alternateNumber: '',
      name: '',
      email: '',
      dob: '',
      gender: 'Female',
      loyaltyTier: 'Standard',
      loyaltyPoints: '0',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Add Customer</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Row 1: Mobile Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Mobile Number<span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => handleChange('mobileNumber', e.target.value)}
                placeholder="Enter Mobile Number"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Alternate Number</label>
              <input
                type="tel"
                value={formData.alternateNumber}
                onChange={(e) => handleChange('alternateNumber', e.target.value)}
                placeholder="Enter Alternate Number"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 2: Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Name<span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter Name"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter Email"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 3: DOB + Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">DOB</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => handleChange('dob', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
              <div className="flex items-center gap-6 pt-2">
                {['Female', 'Male'].map(g => (
                  <label 
                    key={g} 
                    onClick={() => handleChange('gender', g)}
                    className="flex items-center gap-2 cursor-pointer group select-none"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      formData.gender === g ? 'border-indigo-600' : 'border-slate-300 group-hover:border-slate-400'
                    }`}>
                      {formData.gender === g && (
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <span className={`text-sm ${formData.gender === g ? 'text-indigo-900 font-semibold' : 'text-slate-700'}`}>{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>


        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// VIEW CUSTOMER MODAL COMPONENT
// ==========================================
const ViewCustomerModal = ({ isOpen, onClose, customer, onEdit, onGoToPos, onViewHistory }) => {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg">
              {customer.name?.charAt(0)?.toUpperCase() || 'G'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">{customer.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {customer.gender || 'Female'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Phone size={12} className="text-slate-400" />
                <span>{customer.mobile || '-'}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Orders</span>
              <span className="text-base font-black text-slate-800">{customer.totalOrders ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Spend</span>
              <span className="text-base font-black text-indigo-600">₹{Number(customer.totalPurchaseAmount || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Avg Order</span>
              <span className="text-base font-bold text-slate-700">₹{Number(customer.averagePurchaseAmount || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Detailed Info */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Email Address:</span>
              <span className="font-semibold text-slate-800">{customer.email || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Date of Birth:</span>
              <span className="font-semibold text-slate-800">{customer.birthDate || customer.dob || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Last Visit:</span>
              <span className="font-semibold text-slate-800">{customer.lastVisited || '-'}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Outstanding Balance:</span>
              <span className="font-semibold text-rose-600">₹{customer.balance ?? 0}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500 font-medium">Package:</span>
              <span className="font-semibold text-violet-600">{customer.packageDisplay || customer.package || (customer.packageCount && customer.packageCount !== '-' ? `${customer.packageCount} Active` : 'None')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(customer);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 size={14} className="text-slate-500" />
              <span>Edit Profile</span>
            </button>
            {onViewHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewHistory(customer);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <History size={14} />
                <span>Order History</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToPos(customer);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <ShoppingCart size={14} />
              <span>Create POS Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ORDER HISTORY DATA HELPER
// ==========================================
const getCustomerFullHistory = (customer, allOrders = [], allAppointments = []) => {
  if (!customer) return { orders: [], packages: [], memberships: [] };

  const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
  const custMobile = cleanPhone(customer.mobile);
  const custName = (customer.name || '').trim().toLowerCase();
  const custId = customer.id ? String(customer.id) : null;

  // 1. Find all matching real orders from orderStorage and sync with appointments
  const matchedOrders = (allOrders || []).filter(o => {
    if (!o) return false;
    const g = o.guest || {};
    const gMobile = cleanPhone(g.mobile || g.phone);
    const gName = (g.name || '').trim().toLowerCase();
    const gId = g.id ? String(g.id) : null;

    if (custId && gId && custId === gId) return true;
    if (custMobile && gMobile && (custMobile.endsWith(gMobile) || gMobile.endsWith(custMobile))) return true;
    if (custName && gName && custName === gName) return true;
    return false;
  }).map(o => {
    // If appointment has recorded payment (e.g. Card, Cash) or updated status, synchronize with order
    const linkedAppt = (allAppointments || []).find(a => 
      String(a.orderId) === String(o.id) || 
      String(a.invoiceId) === String(o.invoiceNo || o.id) ||
      (a.guest && o.guest?.name && a.guest.trim().toLowerCase() === o.guest.name.trim().toLowerCase() && 
        (String(a.invoiceId) === String(o.id) || String(a.orderId) === String(o.id) || String(a.invoiceNo) === String(o.invoiceNo)))
    );
    if (linkedAppt) {
      const isApptPaid = linkedAppt.paymentStatus === 'Paid';
      return {
        ...o,
        paymentStatus: isApptPaid ? 'Paid' : (o.paymentStatus || linkedAppt.paymentStatus),
        paymentMethod: (isApptPaid && linkedAppt.paymentMethod && linkedAppt.paymentMethod !== 'Pay at Salon')
          ? linkedAppt.paymentMethod
          : (o.paymentMethod || linkedAppt.paymentMethod),
        status: linkedAppt.status || o.status
      };
    }
    return o;
  });

  // Sort orders newest first
  matchedOrders.sort((a, b) => new Date(b.date || b.dateDisplay || 0) - new Date(a.date || a.dateDisplay || 0));

  // 1b. Tally all redeemed package sessions across matched orders
  const redeemedCountByPkg = {};
  matchedOrders.forEach(o => {
    (o.items || []).forEach(item => {
      const isRedeem = item.itemType === 'package_redemption' ||
                       item.category === 'PACKAGE_REDEMPTION' ||
                       (item.header && String(item.header).toUpperCase() === 'PACKAGE_REDEMPTION') ||
                       (item.name && String(item.name).toLowerCase().startsWith('redemption:'));
      if (isRedeem) {
        const cleanName = String(item.name || '').replace(/^redemption:\s*/i, '').trim().toLowerCase();
        const qty = Number(item.qty) || 1;
        if (cleanName) {
          redeemedCountByPkg[cleanName] = (redeemedCountByPkg[cleanName] || 0) + qty;
        }
      }
    });
    (o.packageRedemptions || []).forEach(pr => {
      const cleanName = String(pr.packageName || pr.name || '').replace(/^redemption:\s*/i, '').trim().toLowerCase();
      const used = Number(pr.sessionsUsed || 1);
      if (cleanName) {
        redeemedCountByPkg[cleanName] = Math.max(redeemedCountByPkg[cleanName] || 0, used);
      }
    });
  });

  const masterPackages = getPackages();
  const findMasterPkg = (name) => {
    if (!name) return null;
    const n = String(name).trim().toLowerCase();
    return masterPackages.find(mp => (mp.name || '').trim().toLowerCase() === n) ||
           masterPackages.find(mp => {
             const mpName = (mp.name || '').trim().toLowerCase();
             return mpName.includes(n) || n.includes(mpName);
           }) || null;
  };

  // 2. Extract Packages
  const packagesList = [];
  const seenPackageKeys = new Set();
  const seenPackageNames = new Set();

  // A. From customer.packages / customer.guestPackages (direct database records)
  const dbPackages = Array.isArray(customer.packages)
    ? customer.packages
    : (Array.isArray(customer.guestPackages) ? customer.guestPackages : []);

  dbPackages.forEach((pkg, idx) => {
    const rawName = (pkg.name || '').trim();
    // Exclude any accidental redemption entries
    if (rawName.toLowerCase().startsWith('redemption:') || pkg.itemType === 'package_redemption' || pkg.category === 'PACKAGE_REDEMPTION') {
      return;
    }

    const normName = rawName.toLowerCase();
    seenPackageNames.add(normName);
    if (pkg.id) seenPackageKeys.add(String(pkg.id));

    const pDate = pkg.purchaseDate ? new Date(pkg.purchaseDate) : null;
    const purchaseDateStr = pDate && !isNaN(pDate.getTime())
      ? pDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : (customer.lastVisited || 'Recent');

    const expDate = pkg.expiryDate ? new Date(pkg.expiryDate) : null;
    const expiryDateStr = expDate && !isNaN(expDate.getTime())
      ? expDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : `${pkg.validityDays || 180} Days`;

    const masterMatch = findMasterPkg(pkg.name);
    const totalSessions = (pkg.totalSessions !== undefined && pkg.totalSessions !== null && !isNaN(Number(pkg.totalSessions)))
      ? Number(pkg.totalSessions)
      : (masterMatch?.totalSessions ? Number(masterMatch.totalSessions) : null);

    const redeemed = (pkg.redeemedSessions !== undefined && pkg.redeemedSessions !== null)
      ? Number(pkg.redeemedSessions)
      : (redeemedCountByPkg[normName] || 0);

    let remainingSessions = pkg.remainingSessions !== undefined && pkg.remainingSessions !== null
      ? Number(pkg.remainingSessions)
      : (totalSessions !== null ? Math.max(0, totalSessions - redeemed) : null);

    if (totalSessions !== null && (remainingSessions === null || remainingSessions > (totalSessions - redeemed))) {
      remainingSessions = Math.max(0, totalSessions - redeemed);
    }

    let statusFormatted = 'Active';
    if (remainingSessions === 0) {
      statusFormatted = 'Completed';
    } else if (pkg.status) {
      const rawStatus = String(pkg.status).toLowerCase();
      statusFormatted = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
    }

    packagesList.push({
      id: pkg.id || `pkg_db_${idx}`,
      name: pkg.name || 'Service Package',
      category: typeof pkg.services === 'string'
        ? pkg.services
        : (Array.isArray(pkg.services) ? pkg.services.map(s => s.name || s).join(', ') : (masterMatch?.services || 'Package Subscription')),
      purchaseDate: purchaseDateStr,
      validityDays: pkg.validityDays || masterMatch?.validityDays || 180,
      expiryDate: expiryDateStr,
      amount: pkg.price || pkg.amount || masterMatch?.price || 0,
      orderId: pkg.invoiceNumber || pkg.orderId || 'PKG-DB',
      status: statusFormatted,
      totalSessions: totalSessions,
      redeemedSessions: redeemed,
      remainingSessions: remainingSessions,
    });
  });

  // B. From matched POS orders
  matchedOrders.forEach(o => {
    const oDate = o.dateDisplay || o.date || 'Today';
    (o.items || []).forEach(item => {
      // Exclude redemptions!
      const isRedeem = item.itemType === 'package_redemption' || 
                       item.category === 'PACKAGE_REDEMPTION' || 
                       (item.header && String(item.header).toUpperCase() === 'PACKAGE_REDEMPTION') ||
                       (item.name && String(item.name).toLowerCase().startsWith('redemption:'));
      if (isRedeem) return;

      const isPkg = item.itemType === 'package' || 
                    item.category === 'PACKAGE' || 
                    (item.header && item.header.toLowerCase().includes('package')) ||
                    (item.name && item.name.toLowerCase().includes('package'));
      if (isPkg) {
        const normName = (item.name || '').trim().toLowerCase();
        const existing = packagesList.find(p => (p.name || '').trim().toLowerCase() === normName);
        if (existing) {
          if (!existing.orderId || existing.orderId === 'PKG-DB') {
            existing.orderId = o.invoiceNo || o.id;
          }
          if (oDate && (!existing.purchaseDate || existing.purchaseDate === 'Recent')) {
            existing.purchaseDate = oDate;
          }
          // If existing had no session tracking, enrich it now
          if (existing.totalSessions === null || existing.totalSessions === undefined) {
            const masterMatch = findMasterPkg(existing.name);
            const total = (item.totalSessions !== undefined && item.totalSessions !== null && !isNaN(Number(item.totalSessions)))
              ? Number(item.totalSessions)
              : (masterMatch?.totalSessions ? Number(masterMatch.totalSessions) : null);
            if (total !== null) {
              const redeemed = redeemedCountByPkg[normName] || 0;
              existing.totalSessions = total;
              existing.redeemedSessions = redeemed;
              existing.remainingSessions = Math.max(0, total - redeemed);
              if (existing.remainingSessions === 0) existing.status = 'Completed';
            }
          }
        } else {
          const pkgKey = `${normName}_${o.invoiceNo || o.id || oDate}`;
          if (!seenPackageKeys.has(pkgKey)) {
            seenPackageKeys.add(pkgKey);
            seenPackageNames.add(normName);

            const masterMatch = findMasterPkg(item.name);
            const validityDays = item.validityDays || masterMatch?.validityDays || 180;
            const pDate = new Date(o.date || Date.now());
            const expDate = new Date(pDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

            const totalSessions = (item.totalSessions !== undefined && item.totalSessions !== null && !isNaN(Number(item.totalSessions)))
              ? Number(item.totalSessions)
              : (masterMatch?.totalSessions ? Number(masterMatch.totalSessions) : null);

            const redeemed = redeemedCountByPkg[normName] || 0;
            const remainingSessions = totalSessions !== null ? Math.max(0, totalSessions - redeemed) : null;
            const status = remainingSessions === 0 ? 'Completed' : 'Active';

            packagesList.push({
              id: item.id || `pkg_${Math.random()}`,
              name: item.name || 'Service Package',
              category: item.category && item.category !== 'PACKAGE' ? item.category : (masterMatch?.services || 'Package Subscription'),
              purchaseDate: oDate,
              validityDays: validityDays,
              expiryDate: isNaN(expDate.getTime()) ? `${validityDays} Days from visit` : expDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              amount: item.total || item.price || masterMatch?.price || 0,
              orderId: o.invoiceNo || o.invoiceId || o.id,
              status: status,
              totalSessions: totalSessions,
              redeemedSessions: redeemed,
              remainingSessions: remainingSessions,
            });
          }
        }
      }
    });
  });

  // C. From customer profile package attribute (only if not already extracted)
  const profilePkgName = (customer.package || '').trim().toLowerCase();
  if (customer.package && customer.package !== '-' && !seenPackageNames.has(profilePkgName) && !profilePkgName.startsWith('redemption:')) {
    seenPackageNames.add(profilePkgName);
    const masterMatch = findMasterPkg(customer.package);
    const totalSessions = masterMatch?.totalSessions || null;
    const redeemed = redeemedCountByPkg[profilePkgName] || 0;
    const remainingSessions = totalSessions !== null ? Math.max(0, totalSessions - redeemed) : null;
    const status = remainingSessions === 0 ? 'Completed' : 'Active';

    packagesList.push({
      id: 'pkg_profile',
      name: customer.package,
      category: masterMatch?.services || 'Package Subscription',
      purchaseDate: customer.lastVisited || 'Recent',
      validityDays: masterMatch?.validityDays || 180,
      expiryDate: '180 Days',
      amount: masterMatch?.price || (customer.totalPurchaseAmount ? Math.min(Number(customer.totalPurchaseAmount), 5000) : 5000),
      orderId: 'PKG-SUB',
      status: status,
      totalSessions: totalSessions,
      redeemedSessions: redeemed,
      remainingSessions: remainingSessions,
    });
  }

  // 3. Extract Memberships
  const membershipsList = [];
  const seenMembershipKeys = new Set();
  const seenMembershipNames = new Set();

  matchedOrders.forEach(o => {
    const oDate = o.dateDisplay || o.date || 'Today';
    (o.items || []).forEach(item => {
      const isMem = item.itemType === 'membership' || 
                    (item.header && item.header.toLowerCase().includes('membership')) ||
                    (item.name && item.name.toLowerCase().includes('membership'));
      if (isMem) {
        const normName = (item.name || '').trim().toLowerCase();
        const memKey = `${normName}_${o.invoiceNo || o.id || oDate}`;
        if (!seenMembershipKeys.has(memKey)) {
          seenMembershipKeys.add(memKey);
          seenMembershipNames.add(normName);
          membershipsList.push({
            id: item.id || `mem_${Math.random()}`,
            name: item.name || 'Membership Plan',
            tier: item.category || 'VIP Tier',
            purchaseDate: oDate,
            validityDays: item.validityDays || 365,
            expiryDate: '18-Sep-2027',
            amount: item.total || item.price || 0,
            status: 'Active'
          });
        }
      }
    });
  });

  const profileMemName = (customer.membershipCount || '').trim().toLowerCase();
  if (customer.membershipCount && customer.membershipCount !== '-' && !seenMembershipNames.has(profileMemName)) {
    membershipsList.push({
      id: 'mem_profile',
      name: customer.membershipCount,
      tier: customer.loyalty && customer.loyalty !== '-' ? customer.loyalty : 'Premium VIP',
      purchaseDate: customer.lastVisited || '25-Sep-2026',
      validityDays: 365,
      expiryDate: '25-Sep-2027',
      amount: 2500,
      status: 'Active'
    });
  }

  // 4. Synthesize prior historical visits if customer.totalOrders > matchedOrders.length
  let fullOrdersList = [...matchedOrders];
  const targetCount = Number(customer.totalOrders) || matchedOrders.length;
  
  if (fullOrdersList.length < targetCount) {
    const missingCount = targetCount - fullOrdersList.length;
    const baseAmount = Number(customer.totalPurchaseAmount) || (targetCount * 1200);
    const existingAmount = fullOrdersList.reduce((sum, o) => sum + (Number(o.grandTotal) || Number(o.subTotal) || 0), 0);
    const remAmount = Math.max(0, baseAmount - existingAmount);
    const avgPerRem = Math.round(remAmount / missingCount) || 1200;

    for (let i = 0; i < missingCount; i++) {
      const dayOffset = (i + 1) * 7;
      const d = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
      const isPkgVisit = i === 0 && customer.package && customer.package !== '-';
      
      fullOrdersList.push({
        id: `hist_ord_${customer.id || 'c'}_${i + 1}`,
        invoiceNo: `INV-${100 + i + (customer.name ? customer.name.charCodeAt(0) % 50 : 10)}`,
        date: dateStr,
        dateDisplay: dateStr,
        time: `${10 + (i % 6)}:${(i * 15) % 60 === 0 ? '00' : (i * 15) % 60} ${i % 2 === 0 ? 'AM' : 'PM'}`,
        status: 'Completed',
        paymentMethod: i % 2 === 0 ? 'Card' : 'Cash',
        grandTotal: avgPerRem,
        subTotal: avgPerRem,
        items: [
          {
            name: isPkgVisit ? customer.package : (i % 2 === 0 ? 'Hair Styling & Spa' : 'Hair Cut & Finish'),
            itemType: isPkgVisit ? 'package' : 'service',
            qty: 1,
            price: avgPerRem,
            total: avgPerRem
          }
        ]
      });
    }
  }

  return {
    orders: fullOrdersList,
    packages: packagesList,
    memberships: membershipsList
  };
};

// ==========================================
// CUSTOMER ORDER HISTORY MODAL COMPONENT
// ==========================================
const CustomerOrderHistoryModal = ({ isOpen, onClose, customer, allOrders, allAppointments, onGoToPos }) => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'packages' | 'memberships'
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null);
  const [collectPaymentTarget, setCollectPaymentTarget] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash');

  const history = useMemo(() => {
    return getCustomerFullHistory(customer, allOrders, allAppointments);
  }, [customer, allOrders, allAppointments]);

  const balanceDue = useMemo(() => {
    return (history.orders || []).reduce((sum, o) => {
      const isDue = (o.paymentStatus === 'Unpaid' || o.paymentMethod === 'Pay at Salon');
      return sum + (isDue ? (parseFloat(o.grandTotal) || parseFloat(o.subTotal) || 0) : 0);
    }, 0);
  }, [history.orders]);

  const handleConfirmCollectPayment = () => {
    if (!collectPaymentTarget) return;
    const finalAmount = collectPaymentTarget.grandTotal ?? collectPaymentTarget.subTotal ?? 0;
    updateOrder(collectPaymentTarget.id, {
      paymentStatus: 'Paid',
      paymentMethod: selectedPaymentMethod,
      payments: [{ method: selectedPaymentMethod, amount: finalAmount }],
      status: 'Completed'
    });
    setCollectPaymentTarget(null);
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-sm">
              {customer.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-slate-800">{customer.name}</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {customer.gender || 'Female'}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1">
                  <History size={11} /> Order History
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1"><Phone size={12} className="text-slate-400" /> {customer.mobile || '-'}</span>
                {customer.email && <span className="hidden sm:inline text-slate-400">•</span>}
                {customer.email && <span className="hidden sm:inline">{customer.email}</span>}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-700 p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6 py-3.5 bg-slate-50/50 border-b border-slate-100 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Orders</span>
            <span className="text-base font-black text-slate-800">{history.orders.length}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Spend</span>
            <span className="text-base font-black text-indigo-600">₹{Number(customer.totalPurchaseAmount || 0).toLocaleString()}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Balance Due</span>
            <span className={`text-base font-black ${balanceDue > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              ₹{Number(balanceDue).toLocaleString()}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Packages</span>
            <span className="text-base font-black text-purple-600">
              {history.packages.filter(p => (p.status || '').toLowerCase() === 'active').length}
              {history.packages.length > history.packages.filter(p => (p.status || '').toLowerCase() === 'active').length && (
                <span className="text-xs text-slate-400 font-normal ml-1">/ {history.packages.length}</span>
              )}
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 gap-2 bg-white pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt size={14} />
            <span>Orders & Invoices</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'orders' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {history.orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('packages')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'packages'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package size={14} />
            <span>Subscribed Packages</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'packages' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {history.packages.length}
            </span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[50vh] bg-slate-50/30">
          {/* TAB 1: ALL ORDERS */}
          {activeTab === 'orders' && (
            history.orders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Receipt size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">No orders found for this customer</p>
                <p className="text-xs text-slate-400 mt-1">Orders billed through POS will automatically appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.orders.map((order, oIdx) => (
                  <div key={order.id || oIdx} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          #{order.invoiceNo || order.invoiceId || (oIdx + 1)}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar size={13} className="text-slate-400" />
                          <span className="font-semibold text-slate-700">{order.dateDisplay || order.date || 'Recent'}</span>
                          {order.time && (
                            <>
                              <Clock size={12} className="text-slate-400 ml-1" />
                              <span>{order.time}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          (order.status || 'Completed') === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.status === 'In Progress'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : order.status === 'Waiting'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : order.status === 'Unpaid'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {order.status || 'Completed'}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {order.paymentMethod || 'Paid'}
                        </span>
                        <span className="text-sm font-black text-slate-900 ml-1">
                          ₹{Number(order.grandTotal ?? order.subTotal ?? 0).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderForInvoice({
                              ...order,
                              guest: order.guest || customer
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs hover:shadow-xs ml-1"
                          title="View and Print Bill Invoice Receipt"
                        >
                          <Receipt size={13} className="text-indigo-600" />
                          <span>View Invoice</span>
                        </button>

                        {Boolean(order.paymentStatus === 'Unpaid' || order.paymentMethod === 'Pay at Salon') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollectPaymentTarget(order);
                              setSelectedPaymentMethod('Cash');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-300 rounded-lg transition-all cursor-pointer shadow-2xs hover:shadow-xs ml-1"
                            title="Collect Payment from Customer"
                          >
                            <CreditCard size={13} />
                            <span>Collect Payment</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Billed Items inside Order */}
                    <div className="pt-2.5">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Billed Items</p>
                      <div className="space-y-1.5">
                        {(order.items && order.items.length > 0 ? order.items : [{ name: 'Salon Service Visit', qty: 1, price: order.grandTotal }]).map((item, iIdx) => {
                          const isRedeem = item.itemType === 'package_redemption' || 
                                           item.category === 'PACKAGE_REDEMPTION' || 
                                           (item.header && String(item.header).toUpperCase() === 'PACKAGE_REDEMPTION') ||
                                           (item.name && String(item.name).toLowerCase().startsWith('redemption:'));
                          const isPkg = !isRedeem && (item.itemType === 'package' || (item.name && item.name.toLowerCase().includes('package')));
                          const isMem = item.itemType === 'membership' || (item.name && item.name.toLowerCase().includes('membership'));
                          const isProd = item.itemType === 'product';

                          return (
                            <div key={iIdx} className="flex items-center justify-between text-xs bg-slate-50/70 px-3 py-1.5 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  isRedeem
                                    ? 'bg-teal-100 text-teal-800 border border-teal-200'
                                    : isPkg
                                    ? 'bg-purple-100 text-purple-700'
                                    : isMem
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isProd
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                  {isRedeem ? 'Redemption' : isPkg ? 'Package' : isMem ? 'Membership' : isProd ? 'Product' : 'Service'}
                                </span>
                                <span className="font-semibold text-slate-800">{item.name}</span>
                                {item.staff && <span className="text-[11px] text-slate-400">({item.staff})</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                {isProd && (item.qty || 1) > 1 && (
                                  <span className="text-slate-500 font-medium">{item.qty} x ₹{item.price || 0}</span>
                                )}
                                <span className="font-bold text-slate-800">₹{Number(item.total || ((item.qty || 1) * (item.price || 0))).toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* TAB 2: PACKAGES */}
          {activeTab === 'packages' && (
            history.packages.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Package size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">No packages subscribed</p>
                <p className="text-xs text-slate-400 mt-1">Packages purchased in POS will be catalogued here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.packages.map((pkg, pIdx) => (
                  <div key={pkg.id || pIdx} className="bg-white rounded-xl border border-purple-100 p-4 shadow-2xs hover:border-purple-200 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                          <Package size={16} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{pkg.name}</h4>
                          <span className="text-[11px] text-purple-600 font-medium capitalize">{pkg.category || 'Package'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                          ₹{Number(pkg.amount || 0).toLocaleString()}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          (pkg.status || '').toLowerCase() === 'completed'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : (pkg.status || '').toLowerCase() === 'expired'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {pkg.status || 'Active'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Purchase Date</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} className="text-slate-400" /> {pkg.purchaseDate || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Validity Period</span>
                        <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                          <Clock size={12} className="text-purple-500" /> {pkg.validityDays} Days
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Valid Until</span>
                        <span className="font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={12} className="text-emerald-500" /> {pkg.expiryDate || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Sessions</span>
                        <div className="mt-0.5">
                          {pkg.totalSessions !== undefined && pkg.totalSessions !== null ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={pkg.remainingSessions > 0 ? "font-bold text-slate-800" : "font-semibold text-slate-400"}>
                                {pkg.remainingSessions ?? 0} of {pkg.totalSessions} left
                              </span>
                              {Boolean(pkg.redeemedSessions > 0) && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                  {pkg.redeemedSessions} redeemed
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-700">Unlimited</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Invoice Bill Receipt Modal */}
        <InvoiceBillModal
          isOpen={Boolean(selectedOrderForInvoice)}
          order={selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70">
          <p className="text-xs text-slate-500">
            Showing records for <span className="font-bold text-slate-700">{customer.name}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToPos(customer);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <ShoppingCart size={14} />
              <span>New POS Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Collect Payment Modal Dialog */}
      {collectPaymentTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setCollectPaymentTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Collect Payment</h3>
                  <p className="text-xs text-slate-500">
                    Order #{collectPaymentTarget.invoiceNo || collectPaymentTarget.invoiceId || collectPaymentTarget.id} • <strong className="text-indigo-600 font-semibold">{customer.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCollectPaymentTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Amount to Collect
                  </span>
                  <span className="text-2xl font-black text-emerald-900 font-mono">
                    ₹{Number(collectPaymentTarget.grandTotal ?? collectPaymentTarget.subTotal ?? 0).toLocaleString()}
                  </span>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {(collectPaymentTarget.items || []).map(i => i.name).join(', ') || 'Retail Items'}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/80 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <CreditCard size={24} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'Card', 'GPay', 'PhonePe', 'HDFC', 'PayTM'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        selectedPaymentMethod === method
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 ring-2 ring-indigo-600/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectPaymentTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCollectPayment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Confirm Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// EDIT CUSTOMER MODAL COMPONENT
// ==========================================
const EditCustomerModal = ({ isOpen, onClose, customer, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    dob: '',
    gender: 'Female',
    loyaltyTier: 'Standard',
    loyaltyPoints: '0',
  });

  useEffect(() => {
    if (customer) {
      let initialTier = customer.loyaltyTier || 'Standard';
      let initialPoints = customer.loyaltyPoints !== undefined ? String(customer.loyaltyPoints) : '';

      if (!customer.loyaltyTier && customer.loyalty && customer.loyalty !== '-') {
        const lower = customer.loyalty.toLowerCase();
        if (lower.includes('platinum')) initialTier = 'Platinum VIP';
        else if (lower.includes('gold')) initialTier = 'Gold';
        else if (lower.includes('silver')) initialTier = 'Silver';
        else initialTier = 'Standard';

        const match = customer.loyalty.match(/\d+/);
        if (match) initialPoints = match[0];
        else if (initialTier === 'Silver') initialPoints = '100';
        else if (initialTier === 'Gold') initialPoints = '250';
        else if (initialTier === 'Platinum VIP') initialPoints = '500';
        else initialPoints = '0';
      } else if (!initialPoints) {
        initialPoints = '0';
      }

      setFormData({
        name: customer.name || '',
        mobile: customer.mobile || '',
        email: customer.email === '-' ? '' : (customer.email || ''),
        dob: (customer.birthDate === '-' || customer.dob === '-') ? '' : (customer.birthDate || customer.dob || ''),
        gender: customer.gender || 'Female',
        loyaltyTier: initialTier,
        loyaltyPoints: initialPoints,
      });
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleTierChange = (nextTier) => {
    let nextPts = formData.loyaltyPoints;
    if (!nextPts || nextPts === '0') {
      if (nextTier === 'Silver') nextPts = '100';
      else if (nextTier === 'Gold') nextPts = '250';
      else if (nextTier === 'Platinum VIP') nextPts = '500';
      else nextPts = '0';
    }
    setFormData(prev => ({ ...prev, loyaltyTier: nextTier, loyaltyPoints: nextPts }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      alert('Please provide customer name and mobile number.');
      return;
    }

    const tier = formData.loyaltyTier || 'Standard';
    const pts = parseInt(formData.loyaltyPoints, 10) || 0;
    const loyaltyStr = tier === 'Standard' && pts === 0 ? '-' : (pts > 0 ? `${tier} (${pts} pts)` : tier);

    onUpdate({
      ...customer,
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
      email: formData.email.trim() ? formData.email.trim() : '',
      birthDate: formData.dob || '',
      dob: formData.dob || '',
      gender: formData.gender,
      loyalty: loyaltyStr,
      loyaltyPoints: pts,
      loyaltyTier: tier,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Edit3 size={18} className="text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Edit Customer Profile</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@email.com"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Gender
              </label>
              <div className="flex items-center gap-5 pt-2">
                {['Female', 'Male'].map(g => (
                  <label 
                    key={g} 
                    onClick={() => setFormData({ ...formData, gender: g })}
                    className="flex items-center gap-2 cursor-pointer select-none"
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                      formData.gender === g ? 'border-indigo-600' : 'border-slate-300'
                    }`}>
                      {formData.gender === g && (
                        <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${formData.gender === g ? 'text-indigo-900' : 'text-slate-600'}`}>{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>



          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// MAIN CRM PAGE
// ==========================================
const CRMPage = () => {
  const navigate = useNavigate();
  const [customerList, setCustomerList] = useState(getCustomers);
  const [orders, setOrders] = useState(() => getOrders());
  const [appointments, setAppointments] = useState(() => getAppointments());
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);

  const initialFilterState = {
    gender: 'Both',
    lastVisitedFrom: '',
    lastVisitedTo: '',
    packages: 'all',
    minBalance: '',
  };

  const [appliedFilters, setAppliedFilters] = useState(initialFilterState);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.gender && appliedFilters.gender !== 'Both') count++;
    if (appliedFilters.lastVisitedFrom || appliedFilters.lastVisitedTo) count++;
    if (appliedFilters.packages && appliedFilters.packages !== 'all') count++;
    if (appliedFilters.minBalance) count++;
    return count;
  }, [appliedFilters]);

  useEffect(() => {
    fetchCustomersFromBackend();

    const handleUpdate = () => {
      setCustomerList(getCustomers());
      setOrders(getOrders());
      setAppointments(getAppointments());
    };

    const handleTenant = () => {
      handleUpdate();
      fetchCustomersFromBackend();
    };

    window.addEventListener('customersUpdated', handleUpdate);
    window.addEventListener('ordersUpdated', handleUpdate);
    window.addEventListener('appointmentsUpdated', handleUpdate);
    window.addEventListener('tenantChanged', handleTenant);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('customersUpdated', handleUpdate);
      window.removeEventListener('ordersUpdated', handleUpdate);
      window.removeEventListener('appointmentsUpdated', handleUpdate);
      window.removeEventListener('tenantChanged', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const getCustomerMetrics = (customer) => {
    const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
    const custMobile = cleanPhone(customer.mobile);
    const custName = (customer.name || '').trim().toLowerCase();
    const custId = customer.id ? String(customer.id) : null;

    const matchedOrders = (orders || []).filter(o => {
      if (!o) return false;
      const g = o.guest || {};
      const gMobile = cleanPhone(g.mobile);
      const gName = (g.name || '').trim().toLowerCase();
      const gId = g.id ? String(g.id) : null;

      if (custId && gId && custId === gId) return true;
      if (custMobile && gMobile && (custMobile.endsWith(gMobile) || gMobile.endsWith(custMobile))) return true;
      if (custName && gName && custName === gName) return true;
      return false;
    });

    const matchedAppts = (appointments || []).filter(a => {
      if (!a) return false;
      const aMobile = cleanPhone(a.mobile);
      const aName = (a.guest || a.name || '').trim().toLowerCase();

      if (custMobile && aMobile && (custMobile.endsWith(aMobile) || aMobile.endsWith(custMobile))) return true;
      if (custName && aName && custName === aName) return true;
      return false;
    });

    let totalSpend = 0;
    if (matchedOrders.length > 0) {
      totalSpend = matchedOrders.reduce((sum, o) => sum + (parseFloat(o.grandTotal) || parseFloat(o.subTotal) || 0), 0);
    } else if (matchedAppts.length > 0) {
      totalSpend = matchedAppts.reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);
    } else {
      totalSpend = parseFloat(customer.totalPurchaseAmount) || 0;
    }

    const totalOrders = Math.max(matchedOrders.length, matchedAppts.length, customer.totalOrders || 0);

    let lastVisited = customer.lastVisited || '-';
    if (matchedOrders.length > 0) {
      lastVisited = matchedOrders[0].dateDisplay || matchedOrders[0].date || lastVisited;
    } else if (matchedAppts.length > 0) {
      lastVisited = matchedAppts[0].date || matchedAppts[0].dateDisplay || lastVisited;
    }

    // Detect packages from orders or customer profile
    let orderPackageNames = [];
    let orderPackagesCount = 0;
    (matchedOrders || []).forEach(o => {
      (o.items || []).forEach(item => {
        const isRedeem = item.itemType === 'package_redemption' || 
                         item.category === 'PACKAGE_REDEMPTION' || 
                         (item.header && String(item.header).toUpperCase() === 'PACKAGE_REDEMPTION') ||
                         (item.name && String(item.name).toLowerCase().startsWith('redemption:'));
        if (
          !isRedeem &&
          (item.itemType === 'package' || 
           item.category === 'PACKAGE' || 
           (item.header && item.header.toLowerCase().includes('package')))
        ) {
          orderPackagesCount += (item.qty || 1);
          if (item.name) orderPackageNames.push(item.name);
        }
      });
    });

    const validCustomerPackages = (Array.isArray(customer.packages) ? customer.packages : []).filter(p => {
      const pName = typeof p === 'string' ? p : (p?.name || '');
      return !pName.toLowerCase().startsWith('redemption:') && p?.itemType !== 'package_redemption' && p?.category !== 'PACKAGE_REDEMPTION';
    });

    let packageDisplay = '-';
    let packageCount = 0;
    if (customer.package && customer.package !== '-' && !customer.package.toLowerCase().startsWith('redemption:')) {
      packageDisplay = customer.package;
      packageCount = 1;
    } else if (customer.packageCount && customer.packageCount !== '-' && customer.packageCount !== 0 && customer.packageCount !== '0') {
      packageDisplay = String(customer.packageCount);
      packageCount = Number(customer.packageCount) || 1;
    } else if (validCustomerPackages.length > 0) {
      packageCount = validCustomerPackages.length;
      packageDisplay = validCustomerPackages.length === 1 ? (validCustomerPackages[0].name || validCustomerPackages[0]) : `${validCustomerPackages.length} Packages`;
    } else if (orderPackagesCount > 0) {
      packageCount = orderPackagesCount;
      packageDisplay = orderPackagesCount === 1 ? orderPackageNames[0] : `${orderPackagesCount} Packages`;
    }

    // Outstanding balance calculation:
    // Any service, product, or package booked with "Pay at Salon" or unpaid
    let outstandingBalance = 0;
    if (matchedOrders.length > 0) {
      matchedOrders.forEach(o => {
        const linkedAppt = (appointments || []).find(a => 
          String(a.orderId) === String(o.id) || 
          String(a.invoiceId) === String(o.invoiceNo || o.id) ||
          (a.guest && o.guest?.name && a.guest.trim().toLowerCase() === o.guest.name.trim().toLowerCase() && 
            (String(a.invoiceId) === String(o.id) || String(a.orderId) === String(o.id) || String(a.invoiceNo) === String(o.invoiceNo)))
        );

        const isApptPaid = linkedAppt && linkedAppt.paymentStatus === 'Paid';
        const isOrderPaid = o.paymentStatus === 'Paid' && o.paymentMethod && o.paymentMethod !== 'Pay at Salon';

        if (!isApptPaid && !isOrderPaid) {
          const isDue = o.paymentStatus === 'Unpaid' || 
                        o.paymentMethod === 'Pay at Salon' ||
                        (linkedAppt && (linkedAppt.paymentStatus === 'Unpaid' || linkedAppt.paymentMethod === 'Pay at Salon'));
          if (isDue) {
            outstandingBalance += (parseFloat(o.grandTotal) || parseFloat(o.subTotal) || 0);
          }
        }
      });
    } else if (matchedAppts.length > 0) {
      matchedAppts.forEach(a => {
        if (a.paymentStatus === 'Unpaid' || a.paymentMethod === 'Pay at Salon') {
          outstandingBalance += (parseFloat(a.price) || 0);
        }
      });
    } else {
      outstandingBalance = parseFloat(customer.balance) || 0;
    }

    return {
      totalOrders,
      totalPurchaseAmount: totalSpend,
      lastVisited,
      packageDisplay,
      packageCount,
      balance: outstandingBalance
    };
  };

  const handleAddGuest = (newGuest) => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Adding new customer records');
      return;
    }
    const updated = addCustomer(newGuest);
    setCustomerList(updated);
  };

  const handleUpdateCustomer = async (updatedGuest) => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Updating customer records');
      return;
    }
    try {
      await updateCustomer(updatedGuest);
      const refreshed = await fetchCustomersFromBackend();
      if (refreshed) setCustomerList(refreshed);
    } catch (err) {
      alert(`Failed to update customer: ${err?.message || 'Please check values and try again'}`);
    }
  };

  const handleDeleteCustomer = async (customerId, customerName) => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Deleting customer records');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete customer "${customerName || 'this customer'}" from the database?`)) {
      try {
        await deleteCustomer(customerId);
        const refreshed = await fetchCustomersFromBackend();
        if (refreshed) setCustomerList(refreshed);
      } catch (err) {
        alert(`Failed to delete customer: ${err?.message || 'Database error occurred'}`);
      }
    }
  };

  const filteredCustomers = customerList.filter(c => {
    const metrics = getCustomerMetrics(c);

    // 1. Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const match = (
        (c.name && c.name.toLowerCase().includes(term)) ||
        (c.mobile && c.mobile.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (metrics.packageDisplay && metrics.packageDisplay.toLowerCase().includes(term))
      );
      if (!match) return false;
    }

    // 2. Gender filter
    if (appliedFilters.gender && appliedFilters.gender !== 'Both') {
      const custGender = (c.gender || '').trim().toLowerCase();
      const targetGender = appliedFilters.gender.toLowerCase();
      if (custGender !== targetGender) {
        return false;
      }
    }

    // 3. Last Visited Date Range
    if (appliedFilters.lastVisitedFrom || appliedFilters.lastVisitedTo) {
      const visitStr = metrics.lastVisited || c.lastVisited;
      if (!visitStr || visitStr === '-') return false;
      const visitDate = new Date(visitStr);
      if (!isNaN(visitDate.getTime())) {
        if (appliedFilters.lastVisitedFrom) {
          const fromDate = new Date(appliedFilters.lastVisitedFrom);
          if (visitDate < fromDate) return false;
        }
        if (appliedFilters.lastVisitedTo) {
          const toDate = new Date(appliedFilters.lastVisitedTo);
          toDate.setHours(23, 59, 59, 999);
          if (visitDate > toDate) return false;
        }
      }
    }

    // 4. Packages (Accurately checks packages purchased in POS orders & customer profile)
    if (appliedFilters.packages && appliedFilters.packages !== 'all') {
      const hasPkg = (metrics.packageCount > 0) ||
                     (metrics.packageDisplay && metrics.packageDisplay !== '-') ||
                     (Array.isArray(c.packages) && c.packages.length > 0) || 
                     (c.packageCount && c.packageCount !== '-' && c.packageCount !== 0 && c.packageCount !== '0') ||
                     Boolean(c.package && c.package !== '-') ||
                     Boolean(c.hasPackage);
      if (appliedFilters.packages === 'has_package' && !hasPkg) return false;
      if (appliedFilters.packages === 'no_package' && hasPkg) return false;
    }

    // 5. Balance (Accurately checks outstanding order balance & due balance)
    if (appliedFilters.minBalance) {
      const minB = parseFloat(appliedFilters.minBalance);
      if (!isNaN(minB)) {
        const custBal = Math.max(parseFloat(metrics.balance) || 0, parseFloat(c.balance) || 0);
        if (custBal < minB) return false;
      }
    }



    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 space-y-4">
      {/* Toolbar row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name Or Number" 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <button
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeFilterCount > 0
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-sm'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              <SlidersHorizontal size={16} /> Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''} <ChevronDown size={16} />
            </button>
            <button
              onClick={() => setShowAddGuest(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              + Add Customer
            </button>
          </div>
        </div>

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500 font-semibold">Active Filters:</span>
            {appliedFilters.gender !== 'Both' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Gender: {appliedFilters.gender}
                <button
                  onClick={() => setAppliedFilters(prev => ({ ...prev, gender: 'Both' }))}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {(appliedFilters.lastVisitedFrom || appliedFilters.lastVisitedTo) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Visited: {appliedFilters.lastVisitedFrom || 'Any'} to {appliedFilters.lastVisitedTo || 'Any'}
                <button
                  onClick={() => setAppliedFilters(prev => ({ ...prev, lastVisitedFrom: '', lastVisitedTo: '' }))}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {appliedFilters.packages !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Package: {appliedFilters.packages === 'has_package' ? 'Active Package' : 'No Active Package'}
                <button
                  onClick={() => setAppliedFilters(prev => ({ ...prev, packages: 'all' }))}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {appliedFilters.minBalance && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Min Balance: ₹{appliedFilters.minBalance}
                <button
                  onClick={() => setAppliedFilters(prev => ({ ...prev, minBalance: '' }))}
                  className="hover:text-indigo-900 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            )}

            <button
              onClick={() => setAppliedFilters(initialFilterState)}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer underline ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Data table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto min-h-[350px] pb-28">
          <table className="w-full min-w-[1850px] text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 border-b border-slate-200 w-12 text-center">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile No.</th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group transition-colors">
                  <div className="flex items-center gap-1">
                    Last Visited <ArrowDown size={14} className="text-slate-400 group-hover:text-slate-600" />
                  </div>
                </th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Purchase Amount</th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Package</th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">Birth Date</th>
                <th className="px-4 py-3 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[130px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers?.map((customer, idx) => {
                const customerUniqueId = customer.id || customer.mobile || `guest_row_${idx}`;
                const metrics = getCustomerMetrics(customer);
                return (
                  <tr key={customerUniqueId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{customer.mobile}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{customer.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{customer.gender}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{metrics.lastVisited}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistoryCustomer({ ...customer, ...metrics });
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 hover:text-indigo-800 transition-colors cursor-pointer group"
                        title="Click to view full Order History, Packages & Memberships"
                      >
                        <span>{metrics.totalOrders}</span>
                        <span className="text-[10px] font-semibold text-indigo-400 group-hover:text-indigo-600 group-hover:underline">Orders</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-bold">{metrics.totalPurchaseAmount}</td>

                    <td className="px-4 py-3 text-sm">
                      {metrics.balance > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          ₹{Number(metrics.balance).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {metrics.packageDisplay && metrics.packageDisplay !== '-' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                          {metrics.packageDisplay}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{customer.email || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{customer.birthDate || customer.dob || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHistoryCustomer({ ...customer, ...metrics });
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title="View Customer Order & Package History"
                        >
                          <History size={13} className="text-purple-600" />
                          <span>History</span>
                        </button>

                        <div className="relative inline-block text-left">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setActiveActionMenuId(prev => prev === customerUniqueId ? null : customerUniqueId);
                            }}
                            className="text-slate-400 hover:text-indigo-600 rounded-lg p-1.5 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="More Actions"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Action Dropdown Menu */}
                          {activeActionMenuId === customerUniqueId && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(null);
                                }} 
                              />
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 py-1.5 text-left">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenuId(null);
                                    setHistoryCustomer({ ...customer, ...metrics });
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <History size={14} className="text-purple-600" />
                                  <span>Order History</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveActionMenuId(null);
                                    setViewingCustomer({ ...customer, ...metrics });
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                                >
                                  <Eye size={14} className="text-indigo-600" />
                                  <span>View Profile</span>
                                </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(null);
                                  setEditingCustomer(customer);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                              >
                                <Edit3 size={14} className="text-amber-600" />
                                <span>Edit Customer</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(null);
                                  navigate('/pos');
                                }}
                                className="w-full px-3.5 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                              >
                                <ShoppingCart size={14} className="text-emerald-600" />
                                <span>Create POS Bill</span>
                              </button>

                              <div className="my-1 border-t border-slate-100" />

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenuId(null);
                                  handleDeleteCustomer(customer.id || customerUniqueId, customer.name);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                                <span>Delete Customer</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!filteredCustomers || filteredCustomers.length === 0) && (
                <tr>
                  <td colSpan="13" className="px-4 py-8 text-center text-slate-500 bg-slate-50">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between border-t border-slate-200 py-3 px-4 bg-white shrink-0">
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50 transition-colors">
              <ChevronsLeft size={16} />
            </button>
            <button className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50 transition-colors">
              <ChevronRight size={16} />
            </button>
            <button className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50 transition-colors">
              <ChevronsRight size={16} />
            </button>
            <span className="text-sm text-slate-500 ml-2">
              1-{filteredCustomers?.length || 0} of {filteredCustomers?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <FiltersModal 
        isOpen={showFilters} 
        onClose={() => setShowFilters(false)} 
        filters={appliedFilters}
        onApply={(newFilters) => setAppliedFilters(newFilters)}
        onClear={(defaultFilters) => setAppliedFilters(defaultFilters)}
      />
      <AddGuestModal isOpen={showAddGuest} onClose={() => setShowAddGuest(false)} onAddGuest={handleAddGuest} />
      <ViewCustomerModal
        isOpen={Boolean(viewingCustomer)}
        customer={viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        onEdit={(cust) => {
          setViewingCustomer(null);
          setEditingCustomer(cust);
        }}
        onGoToPos={() => {
          setViewingCustomer(null);
          navigate('/pos');
        }}
        onViewHistory={(cust) => {
          setViewingCustomer(null);
          setHistoryCustomer(cust);
        }}
      />
      <CustomerOrderHistoryModal
        isOpen={Boolean(historyCustomer)}
        customer={historyCustomer}
        allOrders={orders}
        allAppointments={appointments}
        onClose={() => setHistoryCustomer(null)}
        onGoToPos={() => {
          setHistoryCustomer(null);
          navigate('/pos');
        }}
      />
      <EditCustomerModal
        isOpen={Boolean(editingCustomer)}
        customer={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onUpdate={handleUpdateCustomer}
      />
    </div>
  );
};

export default CRMPage;
