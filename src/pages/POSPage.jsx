import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Calendar, Plus, CreditCard, Banknote, Smartphone, X, ChevronDown, Check, User, Printer, Download, MessageCircle, CheckCircle2, GitFork, Clock, Gift, Sparkles, Edit2, Wallet, Award } from 'lucide-react';
import { services as servicesDataImport, serviceCategories, paymentMethods, customers, staffMembers, timeSlots } from '../data/mockData';
import { saveOrder, cancelOrderInStore, getNextInvoiceId } from '../utils/orderStorage';
import { saveAppointment, updateAppointment } from '../utils/appointmentStorage';
import { getMasterServices, normalizeCategory, getServiceHeader } from '../utils/serviceStorage';
import { getMasterProducts } from '../utils/productStorage';
import { getMasterStaff } from '../utils/staffStorage';
import { getCustomers, addCustomer, updateCustomer } from '../utils/customerStorage';
import { getPackages } from '../utils/packageStorage';
import { getMemberships } from '../utils/membershipStorage';
import { getActiveTenant, isReadOnlySession, notifyReadOnlyBlocked } from '../utils/saasStorage';
import { getDisposables, recordConsumption, getDisposablePriceForUnit } from '../utils/disposablesStorage';
import { getPackageBreakdown } from '../components/common/InvoiceBillModal';

const sampleProducts = [
  { id: 'p1', name: 'fair and lovely', price: 20, header: 'Skin & Face Products', category: 'SKIN' },
  { id: 'p2', name: 'Wella Boost Bounce 200ml', price: 750, header: 'Hair Styling & Shampoos', category: 'HAIR' },
  { id: 'p3', name: 'Kinessence Mask 500gm', price: 1800, header: 'Hair Treatments', category: 'HAIR' },
  { id: 'p4', name: 'Loreal Hair Serum 100ml', price: 650, header: 'Hair Styling & Shampoos', category: 'HAIR' },
  { id: 'p5', name: 'Nourishing Shampoo 250ml', price: 950, header: 'Hair Styling & Shampoos', category: 'HAIR' },
  { id: 'p6', name: 'Oil Reflections Shampoo 180ml', price: 1400, header: 'Hair Styling & Shampoos', category: 'HAIR' },
  { id: 'p7', name: 'Large Gloves (Box of 50)', price: 150, header: 'Disposables & Salon Supplies', category: 'SUPPLIES' },
  { id: 'p8', name: 'Disposable Hair Cape', price: 25, header: 'Disposables & Salon Supplies', category: 'SUPPLIES' },
];

const samplePackages = [
  { id: 'pkg1', name: 'Bridal Glow Combo', price: 3499, header: 'Special Combos', category: 'PACKAGE' },
  { id: 'pkg2', name: 'Hair Revival Ritual', price: 1999, header: 'Hair Packages', category: 'PACKAGE' },
  { id: 'pkg3', name: 'Executive Grooming Pack', price: 1299, header: 'Men Combos', category: 'PACKAGE' },
];

const sampleMemberships = [
  { id: 'mem1', name: 'Silver Tier Membership', price: 2000, header: 'Annual Memberships' },
  { id: 'mem2', name: 'Gold Tier Membership', price: 5000, header: 'Annual Memberships' },
  { id: 'mem3', name: 'Platinum VIP Membership', price: 10000, header: 'Annual Memberships' },
];

// ==========================================
// POS ADD GUEST MODAL (SRS Section 4 & 18)
// ==========================================
const POSAddGuestModal = ({ isOpen, onClose, onGuestAdded }) => {
  const [formData, setFormData] = useState({
    mobileNumber: '',
    alternateNumber: '',
    name: '',
    email: '',
    dob: '',
    gender: 'Female',
    hairType: 'Straight',
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
    if (!formData.name.trim()) {
      alert('Please enter customer name');
      return;
    }
    const tier = formData.loyaltyTier || 'Standard';
    const pts = parseInt(formData.loyaltyPoints, 10) || 0;
    const loyaltyStr = tier === 'Standard' && pts === 0 ? '-' : (pts > 0 ? `${tier} (${pts} pts)` : tier);

    const guestObj = {
      id: 'cust_' + Date.now(),
      name: formData.name.trim(),
      mobile: formData.mobileNumber.trim(),
      email: formData.email,
      gender: formData.gender,
      loyalty: loyaltyStr,
      loyaltyPoints: pts,
      loyaltyTier: tier,
      totalOrders: 0,
      totalPurchaseAmount: 0,
      lastVisited: '18-Sep-2026',
      balance: 0,
      advance: 0,
    };
    onGuestAdded(guestObj);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Add Customer</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Mobile Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Mobile Number<span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => handleChange('mobileNumber', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                placeholder="Enter Mobile Number"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Alternate Number</label>
              <input
                type="tel"
                value={formData.alternateNumber}
                onChange={(e) => handleChange('alternateNumber', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                placeholder="Enter Alternate Number"
              />
            </div>
          </div>

          {/* Row 2: Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Name<span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter Name"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter Email"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Row 3: DOB + Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">DOB</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">Gender</label>
              <div className="flex items-center gap-6 pt-2">
                {['Female', 'Male'].map(g => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group text-sm text-slate-700">
                    <input
                      type="radio"
                      name="posGuestGender"
                      checked={formData.gender === g}
                      onChange={() => handleChange('gender', g)}
                      className="text-indigo-600 accent-indigo-600"
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Loyalty Tier + Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5 flex items-center gap-1.5">
                <Award size={14} className="text-amber-500" />
                <span>Loyalty Tier</span>
              </label>
              <select
                value={formData.loyaltyTier}
                onChange={(e) => handleTierChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
              >
                <option value="Standard">Standard (0 pts)</option>
                <option value="Silver">Silver (100 pts)</option>
                <option value="Gold">Gold (250 pts)</option>
                <option value="Platinum VIP">Platinum VIP (500 pts)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Loyalty Points
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.loyaltyPoints}
                  onChange={(e) => handleChange('loyaltyPoints', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                  pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// INSTRUCTION MODAL
// ==========================================
const POSInstructionModal = ({ isOpen, onClose, currentInstruction, onSave }) => {
  const [text, setText] = useState(currentInstruction || '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-800">Add Order Instruction / Note</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Guest prefers gentle scalp massage, sensitive skin, allergic to ammonia..."
          rows={4}
          className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
        />
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(text);
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Save Instruction
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// BILL INVOICE MODAL (Matches Screenshot 3)
// ==========================================
const POSInvoiceBillModal = ({ isOpen, onClose, order }) => {
  const [whatsAppSent, setWhatsAppSent] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const allItems = order.items || [];
  const isDisposableItem = (i) => {
    if (!i) return false;
    if (i.itemType === 'service' || i.itemType === 'product') return false;
    if (i.itemType === 'disposable') return true;
    if (i.sku && String(i.sku).startsWith('DSP-')) return true;
    if (i.id && String(i.id).startsWith('disp_')) return true;
    if (i.header === 'Salon Disposables' || i.category === 'Salon Disposables') return true;
    if (i.packPrice !== undefined && i.piecesPerUnit !== undefined) return true;
    return false;
  };

  const isProductItem = (i) => {
    if (!i || isDisposableItem(i)) return false;
    if (i.itemType === 'product') return true;
    if (i.itemType === 'service') return false;
    if (i.sku && (String(i.sku).startsWith('SKU-') || String(i.sku).startsWith('NAT-') || String(i.sku).startsWith('ENR-'))) return true;
    if (i.id && (String(i.id).startsWith('p_') || String(i.id).startsWith('nat_p') || String(i.id).startsWith('enr_p'))) return true;
    if (i.barcode !== undefined || i.salePrice !== undefined || i.productTag !== undefined) return true;
    if (i.category === 'Product' || i.category === 'Products' || (i.header && String(i.header).toLowerCase().includes('product'))) return true;
    return false;
  };

  const isPackageItem = (i) => {
    if (!i) return false;
    return i.itemType === 'package' || i.category === 'PACKAGE' || (i.header && String(i.header).toLowerCase().includes('package'));
  };

  const isMembershipItem = (i) => {
    if (!i) return false;
    return i.itemType === 'membership' || i.category === 'MEMBERSHIP' || (i.header && String(i.header).toLowerCase().includes('membership'));
  };

  const isServiceItem = (i) => {
    if (!i) return false;
    return !isDisposableItem(i) && !isProductItem(i) && !isPackageItem(i) && !isMembershipItem(i);
  };

  const serviceItems = allItems.filter(isServiceItem);
  const productItems = allItems.filter(isProductItem);
  const disposableItems = allItems.filter(isDisposableItem);
  const packageItems = allItems.filter(isPackageItem);
  const membershipItems = allItems.filter(isMembershipItem);

  const servicesSubTotal = serviceItems.reduce((sum, it) => sum + (it.price * (it.qty || 1) - (parseFloat(it.discAmount) || 0)), 0);
  const productsSubTotal = productItems.reduce((sum, it) => sum + (it.price * (it.qty || 1) - (parseFloat(it.discAmount) || 0)), 0);
  const disposablesSubTotal = disposableItems.reduce((sum, it) => sum + (it.price * (it.qty || 1) - (parseFloat(it.discAmount) || 0)), 0);
  const packagesSubTotal = packageItems.reduce((sum, it) => sum + (it.price * (it.qty || 1) - (parseFloat(it.discAmount) || 0)), 0);
  const membershipsSubTotal = membershipItems.reduce((sum, it) => sum + (it.price * (it.qty || 1) - (parseFloat(it.discAmount) || 0)), 0);

  const hasServiceDiscount = serviceItems.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);
  const hasProductDiscount = productItems.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);
  const hasDisposableDiscount = disposableItems.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);
  const hasPackageDiscount = packageItems.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);
  const hasMembershipDiscount = membershipItems.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);

  const totalDiscount = serviceItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0) +
                        productItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0) +
                        disposableItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0) +
                        packageItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0) +
                        membershipItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0);

  const tenant = getActiveTenant();
  const primaryBranch = tenant?.branches?.find(b => b.isPrimary) || tenant?.branches?.[0];

  const brandPrefix = tenant?.logoTextPrefix || '';
  const brandSuffix = tenant?.logoTextSuffix || '';
  const companyName = tenant?.companyName || tenant?.brandName || (brandPrefix ? `${brandPrefix}${brandSuffix}` : 'ABCD');

  const branchName = primaryBranch?.name?.trim() || '';
  const cityName = primaryBranch?.city?.trim() || tenant?.city?.trim() || '';

  // Format clean location without duplicate words
  let companyLocation = tenant?.location?.trim() || '';
  if (!companyLocation) {
    if (branchName && cityName) {
      companyLocation = branchName.toLowerCase().includes(cityName.toLowerCase())
        ? branchName
        : `${branchName}, ${cityName}`;
    } else {
      companyLocation = branchName || cityName || 'Pune';
    }
  }

  // Address: only if a specific street address exists that isn't already identical to companyLocation
  const explicitAddress = (tenant?.address || primaryBranch?.address || '').trim();
  const displayAddress = (explicitAddress && explicitAddress.toLowerCase() !== companyLocation.toLowerCase())
    ? explicitAddress
    : '';

  const companyPhone = tenant?.phone || tenant?.mobile || primaryBranch?.phone || '';
  const companyEmail = tenant?.email || '';
  const companyGstin = tenant?.gstin || tenant?.gstNumber || '';
  const guestGstin = order.guest?.gstNumber || '';

  const handleWhatsApp = () => {
    setWhatsAppSent(true);
    setTimeout(() => setWhatsAppSent(false), 4000);
  };

  const handleDownload = () => {
    let textData = `
================================================
              ${companyName.toUpperCase()}
   ${companyLocation}
   ${displayAddress ? displayAddress + '\n   ' : ''}${companyPhone ? `Phone: ${companyPhone} | ` : ''}${companyEmail || ''}
   ${companyGstin ? `GSTIN: ${companyGstin}` : ''}
================================================
Bill To : ${order.guest?.name || 'bhanu'}
Phone : ${order.guest?.mobile || '+91 987554321'}, ${order.guest?.email || 'nj@gmail.com'}
Invoice ID : ${order.invoiceId || order.invoiceNo || '2'}
${guestGstin ? `GSTIN : ${guestGstin}\n` : ''}Date : ${order.date || '18-Sep-2026'}
------------------------------------------------`;

    if (serviceItems.length > 0) {
      textData += `
BOOKED SERVICES:
${serviceItems.map((it, idx) => {
  const discPart = hasServiceDiscount ? ` | Dis: ₹${it.discAmount || 0}` : '';
  return `${idx + 1} | ${it.name} | Rate: ₹${it.price}${discPart} | Amt: ₹${(it.price * (it.qty || 1)) - (parseFloat(it.discAmount) || 0)}`;
}).join('\n')}
Services Subtotal: ₹${servicesSubTotal}
------------------------------------------------`;
    }

    if (productItems.length > 0) {
      textData += `
RETAIL PRODUCTS SOLD:
${productItems.map((it, idx) => {
  const discPart = hasProductDiscount ? ` | Dis: ₹${it.discAmount || 0}` : '';
  return `${idx + 1} | ${it.name} | Rate: ₹${it.price}${discPart} | Qty: ${it.qty || 1} | Amt: ₹${(it.price * (it.qty || 1)) - (parseFloat(it.discAmount) || 0)}`;
}).join('\n')}
Products Subtotal: ₹${productsSubTotal}
------------------------------------------------`;
    }

    if (disposableItems.length > 0) {
      textData += `
DISPOSABLES & SINGLE-USE SUPPLIES:
${disposableItems.map((it, idx) => {
  const unitLabel = it.selectedUnit || it.unit || 'Pack';
  const discPart = hasDisposableDiscount ? ` | Dis: ₹${it.discAmount || 0}` : '';
  return `${idx + 1} | ${it.name} (${unitLabel}) | Rate: ₹${it.price}${discPart} | Qty: ${it.qty || 1} | Amt: ₹${(it.price * (it.qty || 1)) - (parseFloat(it.discAmount) || 0)}`;
}).join('\n')}
Disposables Subtotal: ₹${disposablesSubTotal}
------------------------------------------------`;
    }

    if (totalDiscount > 0) {
      textData += `
Discount: -₹${totalDiscount}`;
    }

    textData += `
SubTotal: ₹ ${order.subTotal || order.grandTotal}
Grand Total: ₹ ${order.grandTotal}
================================================
`;
    const element = document.createElement("a");
    const file = new Blob([textData], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Bill-Invoice-${order.invoiceId || '2'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="flex justify-between items-center px-6 py-3.5 border-b border-slate-200 bg-white sticky top-0 z-20">
          <h2 className="text-base font-bold text-slate-800">Bill Invoice</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Invoice Content (Exact replica of Screenshot 3) */}
        <div className="p-8 text-xs text-slate-700 font-sans" id="printable-invoice">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            {/* Logo */}
            <div>
              <div className="flex items-center space-x-1.5">
                {tenant?.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={companyName}
                    className="h-10 max-w-[160px] object-contain"
                  />
                ) : (
                  <span className="text-2xl font-black tracking-tight text-slate-900">
                    {brandPrefix ? (
                      <>
                        <span className="text-indigo-600">{brandPrefix}</span>
                        <span className="text-rose-500">{brandSuffix}</span>
                      </>
                    ) : (
                      <span className="text-indigo-600">{companyName}</span>
                    )}
                  </span>
                )}
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 ml-2 uppercase">
                  {tenant?.planName || 'RESPARK'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 tracking-wide mt-0.5">
                {tenant?.tagline || 'Manage Smarter, Grow Faster'}
              </p>
            </div>

            {/* Branch Details */}
            <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5">
              <p className="font-bold text-slate-800 text-xs">{companyLocation}</p>
              {displayAddress && <p>{displayAddress}</p>}
              {companyPhone && <p>{companyPhone}</p>}
              {companyEmail && <p>{companyEmail}</p>}
              {companyGstin && <p className="font-medium text-slate-700">GSTIN {companyGstin}</p>}
            </div>
          </div>

          {/* Bill To & Invoice Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div className="space-y-1">
              <p><span className="font-semibold text-slate-800">Bill To :</span> {order.guest?.name || 'bhanu'}</p>
              <p><span className="font-semibold text-slate-800">Phone :</span> {order.guest?.mobile || '+91 987554321'}, {order.guest?.email || 'nj@gmail.com'}</p>
              <p><span className="font-semibold text-slate-800">Invoice ID :</span> {order.invoiceId || order.invoiceNo || '2'}</p>
              {guestGstin && <p><span className="font-semibold text-slate-800">GSTIN :</span> {guestGstin}</p>}
            </div>
            <div className="text-left sm:text-right space-y-1">
              <p><span className="font-semibold text-slate-800">Date :</span> {order.date || '18-Sep-2026'}</p>
            </div>
          </div>

          {/* SECTION 1: Service Bill (if any services booked) */}
          {serviceItems.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Booked Services ({serviceItems.length})
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Services Subtotal: <strong className="font-mono text-slate-800">₹{servicesSubTotal}</strong>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-indigo-50/50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Sr.</th>
                      <th className="py-2 px-3">Service</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      {hasServiceDiscount && <th className="py-2 px-3 text-right">Dis.</th>}
                      <th className="py-2 px-3 text-right">Amt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{item.price}</td>
                        {hasServiceDiscount && (
                          <td className="py-2.5 px-3 text-right text-slate-500">{item.discAmount || '0'}</td>
                        )}
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900 font-mono">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 2: Sold Products (if any products purchased) */}
          {productItems.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Retail Products Sold ({productItems.length})
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Products Subtotal: <strong className="font-mono text-slate-800">₹{productsSubTotal}</strong>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-50/50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Sr.</th>
                      <th className="py-2 px-3">Product Name</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      {hasProductDiscount && <th className="py-2 px-3 text-right">Dis.</th>}
                      <th className="py-2 px-3 text-center">Qty.</th>
                      <th className="py-2 px-3 text-right">Amt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{item.price}</td>
                        {hasProductDiscount && (
                          <td className="py-2.5 px-3 text-right text-slate-500">{item.discAmount || '0'}</td>
                        )}
                        <td className="py-2.5 px-3 text-center font-mono">{item.qty || 1}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900 font-mono">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: Disposables & Single-Use Supplies (if any) */}
          {disposableItems.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Disposables & Single-Use Supplies ({disposableItems.length})
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Disposables Subtotal: <strong className="font-mono text-slate-800">₹{disposablesSubTotal}</strong>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-50/50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Sr.</th>
                      <th className="py-2 px-3">Item Name</th>
                      <th className="py-2 px-2 text-center">Unit</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      {hasDisposableDiscount && <th className="py-2 px-3 text-right">Dis.</th>}
                      <th className="py-2 px-3 text-center">Qty.</th>
                      <th className="py-2 px-3 text-right">Amt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {disposableItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                            {item.selectedUnit || item.unit || 'Pack'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{item.price}</td>
                        {hasDisposableDiscount && (
                          <td className="py-2.5 px-3 text-right text-slate-500">{item.discAmount || '0'}</td>
                        )}
                        <td className="py-2.5 px-3 text-center font-mono">{item.qty || 1}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900 font-mono">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: Service Packages (if any) */}
          {packageItems.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-violet-700 uppercase tracking-wider">
                  Service Packages ({packageItems.length})
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Packages Subtotal: <strong className="font-mono text-slate-800">₹{packagesSubTotal}</strong>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-violet-50/50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Sr.</th>
                      <th className="py-2 px-3">Package Name</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-2 text-center">Validity</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      {hasPackageDiscount && <th className="py-2 px-3 text-right">Dis.</th>}
                      <th className="py-2 px-3 text-right">Amt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-100">
                    {packageItems.map((item, idx) => {
                      const breakdown = getPackageBreakdown(item);
                      return (
                        <React.Fragment key={idx}>
                          <tr className="hover:bg-violet-50/40">
                            <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-violet-950 block text-[13px]">{item.name}</span>
                              <span className="text-[10px] text-violet-600 font-medium">Package Subscription Plan</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-medium capitalize">{item.category || item.header || 'Special Packages'}</td>
                            <td className="py-2.5 px-2 text-center text-slate-700 font-bold">{item.validityDays ? `${item.validityDays} Days` : '180 Days'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold">₹{item.price * (item.qty || 1)}</td>
                            {hasPackageDiscount && (
                              <td className="py-2.5 px-3 text-right text-slate-500 font-mono">{item.discAmount || '0'}</td>
                            )}
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                              ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                            </td>
                          </tr>
                          <tr className="bg-gradient-to-r from-violet-50/60 via-violet-50/30 to-white border-b border-violet-100">
                            <td colSpan={hasPackageDiscount ? 7 : 6} className="py-2 px-4">
                              <div className="flex items-start gap-2">
                                <Sparkles size={13} className="text-violet-600 shrink-0 mt-0.5" />
                                <div className="w-full">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] uppercase font-bold text-violet-800 tracking-wider">
                                      Included Services & Session Allowance
                                    </span>
                                    <span className="text-[10px] font-semibold text-violet-600">
                                      {breakdown.length} Services Covered
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                                    {breakdown.map((srv, sIdx) => (
                                      <div key={sIdx} className="flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-md border border-violet-100 shadow-2xs text-[11px]">
                                        <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                        <span className="font-semibold text-slate-800">{srv}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 5: Memberships (if any) */}
          {membershipItems.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider">
                  Memberships ({membershipItems.length})
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Memberships Subtotal: <strong className="font-mono text-slate-800">₹{membershipsSubTotal}</strong>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sky-50/50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Sr.</th>
                      <th className="py-2 px-3">Membership Plan</th>
                      <th className="py-2 px-3">Tier</th>
                      <th className="py-2 px-2 text-center">Validity</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      {hasMembershipDiscount && <th className="py-2 px-3 text-right">Dis.</th>}
                      <th className="py-2 px-3 text-right">Amt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membershipItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{item.tier || item.name}</td>
                        <td className="py-2.5 px-2 text-center text-slate-600 font-medium">{item.validityDays ? `${item.validityDays} Days` : '365 Days'}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{item.price * (item.qty || 1)}</td>
                        {hasMembershipDiscount && (
                          <td className="py-2.5 px-3 text-right text-slate-500">{item.discAmount || '0'}</td>
                        )}
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900 font-mono">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SubTotal & Grand Total Row */}
          <div className="flex flex-wrap items-center justify-end gap-6 pt-4 border-t border-slate-200 text-xs font-semibold text-slate-800">
            {serviceItems.length > 0 && (
              <div className="text-slate-600">
                <span>Services: </span>
                <span className="font-mono ml-1 font-bold text-slate-800">₹{servicesSubTotal}</span>
              </div>
            )}
            {productItems.length > 0 && (
              <div className="text-slate-600">
                <span>Products: </span>
                <span className="font-mono ml-1 font-bold text-slate-800">₹{productsSubTotal}</span>
              </div>
            )}
            {disposableItems.length > 0 && (
              <div className="text-slate-600">
                <span>Disposables: </span>
                <span className="font-mono ml-1 font-bold text-slate-800">₹{disposablesSubTotal}</span>
              </div>
            )}
            {packageItems.length > 0 && (
              <div className="text-violet-700">
                <span>Packages: </span>
                <span className="font-mono ml-1 font-bold">₹{packagesSubTotal}</span>
              </div>
            )}
            {membershipItems.length > 0 && (
              <div className="text-sky-700">
                <span>Memberships: </span>
                <span className="font-mono ml-1 font-bold">₹{membershipsSubTotal}</span>
              </div>
            )}
            {totalDiscount > 0 && (
              <div className="text-emerald-700">
                <span>Discount: </span>
                <span className="font-mono ml-1 font-bold">-₹{totalDiscount}</span>
              </div>
            )}
            <div>
              <span>SubTotal: </span>
              <span className="font-mono ml-1 font-bold text-slate-800">₹ {order.subTotal || order.grandTotal}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-900 font-bold">Grand Total: </span>
              <span className="font-mono ml-1 font-bold text-indigo-700 text-base">₹ {order.grandTotal}</span>
            </div>
          </div>

          {whatsAppSent && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-xs flex items-center">
              <CheckCircle2 size={16} className="text-emerald-600 mr-2 shrink-0" />
              <span>Bill & digital receipt sent to <strong>{order.guest?.mobile}</strong> via WhatsApp!</span>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3 sticky bottom-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleWhatsApp}
              className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <MessageCircle size={14} className="mr-1.5" /> WhatsApp
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer size={14} className="mr-1.5" /> Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download size={14} className="mr-1.5" /> Download
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const POSPage = () => {
  const [masterServices, setMasterServices] = useState(() => getMasterServices());
  const [masterProducts, setMasterProducts] = useState(() => getMasterProducts());
  const [masterStaff, setMasterStaff] = useState(() => getMasterStaff());
  const [packagesList, setPackagesList] = useState(() => getPackages());
  const [disposablesList, setDisposablesList] = useState(() => getDisposables());

  const [guestList, setGuestList] = useState(() => getCustomers());

  useEffect(() => {
    const handleUpdate = () => {
      setMasterServices(getMasterServices());
      setMasterProducts(getMasterProducts());
      setMasterStaff(getMasterStaff());
      setGuestList(getCustomers());
      setPackagesList(getPackages());
      setDisposablesList(getDisposables());
    };

    const handleTenantChanged = () => {
      handleUpdate();
      // Clear unsaved invoice and guest when company changes
      setInvoiceItems([]);
      setSelectedGuest(null);
      setActiveOrder(null);
      setPayments({
        Cash: '',
        Card: '',
        HDFC: '',
        GPay: '',
        'Phone Pay': '',
        Balance: '',
      });
    };

    window.addEventListener('servicesUpdated', handleUpdate);
    window.addEventListener('productsUpdated', handleUpdate);
    window.addEventListener('staffUpdated', handleUpdate);
    window.addEventListener('resparkStaffUpdated', handleUpdate);
    window.addEventListener('customersUpdated', handleUpdate);
    window.addEventListener('resparkPackagesUpdated', handleUpdate);
    window.addEventListener('disposablesUpdated', handleUpdate);
    window.addEventListener('tenantChanged', handleTenantChanged);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('servicesUpdated', handleUpdate);
      window.removeEventListener('productsUpdated', handleUpdate);
      window.removeEventListener('staffUpdated', handleUpdate);
      window.removeEventListener('resparkStaffUpdated', handleUpdate);
      window.removeEventListener('customersUpdated', handleUpdate);
      window.removeEventListener('resparkPackagesUpdated', handleUpdate);
      window.removeEventListener('disposablesUpdated', handleUpdate);
      window.removeEventListener('tenantChanged', handleTenantChanged);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const allServices = useMemo(() => {
    return masterServices.map(s => ({
      ...s,
      header: getServiceHeader(s),
      category: normalizeCategory(s.category),
    }));
  }, [masterServices]);

  // Dynamically compute unique service categories present in master services catalog
  const categories = useMemo(() => {
    const cats = Array.from(new Set(allServices.map(s => s.category).filter(Boolean)));
    return cats.length > 0 ? cats : ['HAIR'];
  }, [allServices]);

  const [gender, setGender] = useState('Female');
  const [activeCategory, setActiveCategory] = useState('HAIR');

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);
  const [activeMode, setActiveMode] = useState('Services'); // Services, Products, Disposables, Packages, Memberships
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [messageConfigs, setMessageConfigs] = useState({
    feedback: true,
    invoice: true,
    postCare: true
  });
  const [payments, setPayments] = useState({
    Cash: '',
    Card: '',
    HDFC: '',
    GPay: '',
    'Phone Pay': '',
    Balance: '',
  });
  const [instruction, setInstruction] = useState('');
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [showInvoiceBillModal, setShowInvoiceBillModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null); // When an order is created, becomes { id: '2', invoiceId: '2', ... }
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null); // Null until user clicks a payment method
  const [toast, setToast] = useState(null);
  const [fromAppointmentId, setFromAppointmentId] = useState(null);

  // Helper to get today's local date string in YYYY-MM-DD format
  const getTodayIsoDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convert "10:30 AM" into minutes from midnight for exact comparisons
  const parseSlotToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const modifier = match[3].toUpperCase();
    if (modifier === 'PM' && h < 12) h += 12;
    if (modifier === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  // Get default present/upcoming time slot for a given date
  const getDefaultTimeSlotForDate = (dateIso, allSlots) => {
    const todayIso = getTodayIsoDate();
    if (dateIso !== todayIso) {
      return allSlots[0] || '11:00 AM';
    }
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const upcomingSlot = allSlots.find(slot => parseSlotToMinutes(slot) >= currentMinutes);
    return upcomingSlot || allSlots[allSlots.length - 1] || '11:00 AM';
  };

  // Selected invoice date for POS sale (defaults to today's present date)
  const [selectedDate, setSelectedDate] = useState(() => getTodayIsoDate());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(() => getDefaultTimeSlotForDate(getTodayIsoDate(), timeSlots));
  const dateInputRef = useRef(null);

  // Filter time slots dynamically: if selected date is today, hide past elapsed time slots
  const availableTimeSlots = useMemo(() => {
    const todayIso = getTodayIsoDate();
    if (selectedDate !== todayIso) {
      return timeSlots; // Future dates: all time slots available
    }
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const futureSlots = timeSlots.filter(slot => parseSlotToMinutes(slot) >= currentMinutes);
    // If all slots have elapsed today, keep at least the last slot or present
    return futureSlots.length > 0 ? futureSlots : [timeSlots[timeSlots.length - 1]];
  }, [selectedDate]);

  // If the currently selected time slot is in the past for today, automatically adjust to the next available slot
  useEffect(() => {
    if (!availableTimeSlots.includes(selectedTimeSlot)) {
      setSelectedTimeSlot(availableTimeSlots[0] || '11:00 AM');
    }
  }, [availableTimeSlots, selectedTimeSlot]);

  // Format YYYY-MM-DD to DD-MMM-YYYY (e.g. 25-Sep-2026)
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '25-Sep-2026';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parts[2];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (months[monthIdx]) {
          return `${day}-${months[monthIdx]}-${year}`;
        }
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
      }
    } catch (e) {
      console.error(e);
    }
    return dateStr;
  };

  const handleDateChange = (newDate) => {
    if (!newDate) return;
    const todayIso = getTodayIsoDate();
    if (newDate < todayIso) {
      showToast('error', 'Cannot select a past date. Showing today instead.');
      newDate = todayIso;
    }
    setSelectedDate(newDate);
    if (activeOrder) {
      const updated = {
        ...activeOrder,
        date: newDate,
        dateDisplay: formatDateDisplay(newDate),
      };
      setActiveOrder(updated);
      saveOrder(updated);
    }
  };

  const location = useLocation();

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Auto-load appointment data transferred from Appointment module via "Bill in POS"
  useEffect(() => {
    if (location.state?.fromAppointment) {
      const appt = location.state.fromAppointment;
      setFromAppointmentId(appt.id);

      // 1. Set Selected Customer
      setSelectedGuest({
        name: appt.guest,
        mobile: appt.mobile || '',
        email: appt.email || '',
        gender: appt.gender || 'Female'
      });

      // 2. Add Booked Service Item
      const origPrice = Number(appt.originalPrice || appt.price) || 200;
      const finalPrice = Number(appt.price) || origPrice;
      const newItem = {
        id: `appt_item_${Date.now()}`,
        name: appt.service || 'Hair Cut (With Shampoo)',
        price: origPrice,
        qty: 1,
        staff: appt.staff || 'Respark Trial',
        discPercent: appt.discPercent !== undefined ? appt.discPercent : '',
        discAmount: appt.discAmount !== undefined ? appt.discAmount : '',
        subTotal: origPrice,
        total: finalPrice,
      };
      setInvoiceItems([newItem]);

      // 3. Set Special Instruction and Time Slot
      if (appt.instruction) {
        setInstruction(appt.instruction);
      }
      if (appt.timeSlot) {
        setSelectedTimeSlot(appt.timeSlot);
      }

      // 4. Pre-set Payment Method if paid or selected in appointment
      if (appt.paymentMethod && appt.paymentMethod !== 'Pay at Salon') {
        setSelectedPaymentMethod(appt.paymentMethod);
        setPayments({
          Cash: '',
          Card: '',
          HDFC: '',
          GPay: '',
          'Phone Pay': '',
          Balance: '',
          [appt.paymentMethod]: String(finalPrice)
        });
      }

      showToast('success', `Appointment for ${appt.guest} (${appt.service}) loaded into POS Invoice!`);
      // Clear location state to prevent repeating on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSelectPaymentMethod = (methodName) => {
    setSelectedPaymentMethod(methodName || null);
    if (!methodName) {
      setPayments({
        Cash: '',
        Card: '',
        HDFC: '',
        GPay: '',
        'Phone Pay': '',
        Balance: '',
      });
    } else if (methodName === 'Pay at Salon') {
      setPayments({
        Cash: '',
        Card: '',
        HDFC: '',
        GPay: '',
        'Phone Pay': '',
        Balance: '',
      });
    } else {
      setPayments({
        Cash: '',
        Card: '',
        HDFC: '',
        GPay: '',
        'Phone Pay': '',
        Balance: '',
        [methodName]: grandTotal > 0 ? String(grandTotal) : '',
      });
    }
  };

  const validateOrder = () => {
    if (!selectedGuest) {
      showToast('error', 'Please select or add a guest first.');
      return false;
    }
    if (invoiceItems.length === 0) {
      showToast('error', 'Please add at least one service or product to the invoice.');
      return false;
    }
    const missingStaff = invoiceItems.some(i => (i.itemType === 'service' || (!i.itemType && i.category !== 'PACKAGE' && i.category !== 'MEMBERSHIP')) && (!i.staff || i.staff.trim() === ''));
    if (missingStaff) {
      showToast('error', 'Error: Please select a staff member for all booked services.');
      return false;
    }
    if (!selectedPaymentMethod) {
      showToast('error', 'Please select a payment method before booking.');
      return false;
    }
    const todayIso = getTodayIsoDate();
    if (selectedDate < todayIso) {
      showToast('error', 'Cannot book an appointment for a past date. Please choose today or a future date.');
      return false;
    }
    if (selectedDate === todayIso) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (parseSlotToMinutes(selectedTimeSlot) < currentMinutes) {
        showToast('error', 'The selected time slot has already passed for today. Please select a present or upcoming time slot.');
        return false;
      }
    }
    return true;
  };

  const removeFromInvoice = (id) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  // "Book Order" Button: Saves booking, syncs with Appointments, and immediately displays invoice bill
  const handleCreate = () => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Booking or creating an order');
      return;
    }
    if (!validateOrder()) return;

    const newInvoiceId = getNextInvoiceId();
    const isPayAtSalon = selectedPaymentMethod === 'Pay at Salon';
    const payStatus = isPayAtSalon ? 'Unpaid' : (selectedPaymentMethod ? 'Paid' : 'Unpaid');

    // Check if the order contains salon chair services
    const hasServiceItems = invoiceItems.some(i => (i.itemType === 'service' || (!i.itemType && i.category !== 'PACKAGE' && i.category !== 'MEMBERSHIP' && i.category !== 'PRODUCT')) && i.itemType !== 'product' && i.itemType !== 'disposable' && i.itemType !== 'package' && i.itemType !== 'membership');
    
    // For pure retail products or packages, transaction is immediate (Completed if paid, Unpaid if Pay at Salon)
    const orderStatus = hasServiceItems 
      ? (isPayAtSalon ? 'Waiting' : 'In Progress') 
      : (isPayAtSalon ? 'Unpaid' : 'Completed');

    const finalPayments = isPayAtSalon 
      ? [] 
      : (selectedPaymentMethod ? [{ method: selectedPaymentMethod, amount: grandTotal }] : [{ method: 'Cash', amount: grandTotal }]);
    const finalMethod = selectedPaymentMethod || (isPayAtSalon ? 'Pay at Salon' : 'Cash');

    const newOrder = {
      id: newInvoiceId,
      invoiceId: newInvoiceId,
      invoiceNo: newInvoiceId,
      date: selectedDate,
      dateDisplay: formatDateDisplay(selectedDate),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      guest: selectedGuest,
      items: [...invoiceItems],
      subTotal: grandTotal,
      grandTotal: grandTotal,
      instruction: instruction,
      payments: finalPayments,
      paymentMethod: finalMethod,
      paymentStatus: payStatus,
      status: orderStatus,
    };
    saveOrder(newOrder);

    // If packages were sold to a guest, record package subscription in CRM
    if (selectedGuest && packageInvoiceItems.length > 0) {
      try {
        const pkgNames = packageInvoiceItems.map(p => p.name).join(', ');
        updateCustomer({
          ...selectedGuest,
          package: pkgNames,
          packageCount: packageInvoiceItems.length,
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Auto-record consumption for any disposables in invoice
    invoiceItems.filter(i => i.itemType === 'disposable').forEach(disp => {
      const q = Number(disp.qty) || 1;
      const rowAmt = Math.max(0, (disp.price * q) - (parseFloat(disp.discAmount) || 0));
      recordConsumption({
        itemId: disp.id,
        quantity: q,
        unit: disp.selectedUnit || disp.unit || 'Pack',
        unitCost: disp.price,
        totalCost: rowAmt,
        staffName: selectedGuest ? `Service for ${selectedGuest.name}` : 'POS Customer',
        purpose: `POS Order #${newInvoiceId}`,
        notes: `Customer Order #${newInvoiceId} (${disp.selectedUnit || 'Pack'} x ${q})`
      });
    });

    // Auto-sync POS order into Appointments list & calendar only if there are service items
    const serviceItemsForAppt = invoiceItems.filter(i => (i.itemType === 'service' || (!i.itemType && i.category !== 'PACKAGE' && i.category !== 'MEMBERSHIP')) && i.itemType !== 'product' && i.itemType !== 'disposable' && i.itemType !== 'package' && i.itemType !== 'membership');
    const productItemsForAppt = invoiceItems.filter(i => i.itemType === 'product');
    const disposableItemsForAppt = invoiceItems.filter(i => i.itemType === 'disposable');
    if (serviceItemsForAppt.length > 0) {
      const primaryStaff = serviceItemsForAppt[0]?.staff || 'Respark Trial';
      const serviceTitle = serviceItemsForAppt.map(i => i.name).join(', ') || 'Salon Service';
      const servicePrice = serviceItemsForAppt.reduce((acc, i) => acc + (i.price * (i.qty || 1) - (parseFloat(i.discAmount) || 0)), 0);
      const apptData = {
        guest: selectedGuest.name,
        mobile: selectedGuest.mobile || '+91 9876543210',
        service: serviceTitle,
        price: grandTotal,
        servicesPrice: servicePrice,
        paymentMethod: finalMethod,
        paymentStatus: payStatus,
        staff: primaryStaff,
        timeSlot: selectedTimeSlot,
        duration: '45 min',
        status: orderStatus,
        date: formatDateDisplay(selectedDate),
        instruction: instruction || 'Booked in POS',
        orderId: newInvoiceId,
        invoiceId: newInvoiceId,
        items: [...invoiceItems],
        products: productItemsForAppt,
        services: serviceItemsForAppt,
        disposables: disposableItemsForAppt,
        subTotal: grandTotal,
        grandTotal: grandTotal,
      };

      if (fromAppointmentId) {
        updateAppointment(fromAppointmentId, apptData);
      } else {
        saveAppointment({
          ...apptData,
          id: Date.now(),
        });
      }
    }

    // Update customer stats in customerStorage if guest is registered
    if (selectedGuest) {
      try {
        const allCusts = getCustomers();
        const cleanMobile = (selectedGuest.mobile || '').replace(/\D/g, '');
        const existingCust = allCusts.find(c => 
          (c.id && selectedGuest.id && String(c.id) === String(selectedGuest.id)) ||
          (cleanMobile && c.mobile && c.mobile.replace(/\D/g, '') === cleanMobile) ||
          (c.name && selectedGuest.name && c.name.toLowerCase() === selectedGuest.name.toLowerCase())
        );
        if (existingCust) {
          updateCustomer({
            ...existingCust,
            totalOrders: (existingCust.totalOrders || 0) + 1,
            totalPurchaseAmount: (existingCust.totalPurchaseAmount || 0) + grandTotal,
            lastVisited: formatDateDisplay(selectedDate)
          });
        }
      } catch (e) {
        console.error('Error updating customer order stats', e);
      }
    }

    // Directly open the Invoice Bill Modal
    setCompletedOrder(newOrder);
    setShowInvoiceBillModal(true);

    // Reset invoice form so active order buttons are not shown
    setActiveOrder(null);
    setInvoiceItems([]);
    setSelectedGuest(null);
    setInstruction('');
    setSelectedPaymentMethod(null);
    setFromAppointmentId(null);
    setPayments({ Cash: '', Card: '', HDFC: '', GPay: '', 'Phone Pay': '', Balance: '' });

    showToast('success', `Appointment booked successfully for ${selectedGuest.name} at ${selectedTimeSlot} (${formatDateDisplay(selectedDate)})!`);
  };

  // Phase 2: "Update" Button (Screenshot 2)
  const handleUpdateOrder = () => {
    if (!activeOrder) return;
    if (invoiceItems.length === 0) {
      showToast('error', 'Invoice cannot be empty.');
      return;
    }
    const updated = {
      ...activeOrder,
      date: selectedDate,
      dateDisplay: formatDateDisplay(selectedDate),
      items: [...invoiceItems],
      subTotal: grandTotal,
      grandTotal: grandTotal,
      guest: selectedGuest,
      instruction: instruction,
      payments: selectedPaymentMethod ? [{ method: selectedPaymentMethod, amount: grandTotal }] : activeOrder.payments,
      paymentMethod: selectedPaymentMethod || activeOrder.paymentMethod,
    };
    setActiveOrder(updated);
    saveOrder(updated);
    showToast('success', `Order #${activeOrder.id} updated successfully!`);
  };

  // Phase 2: "Complete" Button (Screenshot 2)
  const handleCompleteOrder = () => {
    if (!validateOrder()) return;
    const orderId = activeOrder?.id || getNextInvoiceId();
    const isPayAtSalon = selectedPaymentMethod === 'Pay at Salon';
    const payStatus = isPayAtSalon ? 'Unpaid' : 'Paid';
    const finalPayments = isPayAtSalon 
      ? [] 
      : (selectedPaymentMethod ? [{ method: selectedPaymentMethod, amount: grandTotal }] : [{ method: 'Cash', amount: grandTotal }]);
    const finalMethod = selectedPaymentMethod || (isPayAtSalon ? 'Pay at Salon' : 'Cash');

    const finalOrder = {
      ...(activeOrder || { 
        id: orderId, 
        invoiceId: orderId, 
        invoiceNo: orderId, 
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
      }),
      date: selectedDate,
      dateDisplay: formatDateDisplay(selectedDate),
      items: [...invoiceItems],
      subTotal: grandTotal,
      grandTotal: grandTotal,
      guest: selectedGuest,
      instruction: instruction,
      payments: finalPayments,
      paymentMethod: finalMethod,
      paymentStatus: payStatus,
      status: 'Completed',
    };
    setCompletedOrder(finalOrder);
    saveOrder(finalOrder);

    // If packages were sold to a guest, record package subscription in CRM
    if (selectedGuest && packageInvoiceItems.length > 0) {
      try {
        const pkgNames = packageInvoiceItems.map(p => p.name).join(', ');
        updateCustomer({
          ...selectedGuest,
          package: pkgNames,
          packageCount: packageInvoiceItems.length,
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Auto-record consumption for any disposables in invoice
    invoiceItems.filter(i => i.itemType === 'disposable').forEach(disp => {
      const q = Number(disp.qty) || 1;
      const rowAmt = Math.max(0, (disp.price * q) - (parseFloat(disp.discAmount) || 0));
      recordConsumption({
        itemId: disp.id,
        quantity: q,
        unit: disp.selectedUnit || disp.unit || 'Pack',
        unitCost: disp.price,
        totalCost: rowAmt,
        staffName: selectedGuest ? `Service for ${selectedGuest.name}` : 'POS Customer',
        purpose: `POS Order #${orderId}`,
        notes: `Customer Order #${orderId} (${disp.selectedUnit || 'Pack'} x ${q})`
      });
    });

    // Auto-sync completed order into Appointments list & calendar only if there are service items
    const serviceItemsForAppt = invoiceItems.filter(i => (i.itemType === 'service' || (!i.itemType && i.category !== 'PACKAGE' && i.category !== 'MEMBERSHIP')) && i.itemType !== 'product' && i.itemType !== 'disposable' && i.itemType !== 'package' && i.itemType !== 'membership');
    const productItemsForAppt = invoiceItems.filter(i => i.itemType === 'product');
    const disposableItemsForAppt = invoiceItems.filter(i => i.itemType === 'disposable');
    if (serviceItemsForAppt.length > 0) {
      const primaryStaff = serviceItemsForAppt[0]?.staff || 'Respark Trial';
      const serviceTitle = serviceItemsForAppt.map(i => i.name).join(', ') || 'Salon Service';
      const servicePrice = serviceItemsForAppt.reduce((acc, i) => acc + (i.price * (i.qty || 1) - (parseFloat(i.discAmount) || 0)), 0);
      const apptData = {
        guest: selectedGuest.name,
        mobile: selectedGuest.mobile || '+91 9876543210',
        service: serviceTitle,
        price: grandTotal,
        servicesPrice: servicePrice,
        paymentMethod: finalMethod,
        paymentStatus: payStatus,
        staff: primaryStaff,
        timeSlot: selectedTimeSlot,
        duration: '45 min',
        status: 'Completed',
        date: formatDateDisplay(selectedDate),
        instruction: instruction || 'Billed & Completed in POS',
        orderId: orderId,
        invoiceId: orderId,
        items: [...invoiceItems],
        products: productItemsForAppt,
        services: serviceItemsForAppt,
        disposables: disposableItemsForAppt,
        subTotal: grandTotal,
        grandTotal: grandTotal,
      };

      if (fromAppointmentId) {
        updateAppointment(fromAppointmentId, apptData);
      } else {
        saveAppointment({
          ...apptData,
          id: Date.now(),
        });
      }
    }

    setShowInvoiceBillModal(true);
    showToast('success', `Order #${finalOrder.id} completed & synchronized to Appointments!`);
  };

  // Phase 2: "View Bill" Button (Screenshot 2 & 3)
  const handleViewBill = () => {
    const orderId = activeOrder?.id || '2';
    const currentOrderData = {
      ...(activeOrder || { 
        id: orderId, 
        invoiceId: orderId, 
        invoiceNo: orderId, 
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
      }),
      date: selectedDate,
      dateDisplay: formatDateDisplay(selectedDate),
      items: [...invoiceItems],
      subTotal: grandTotal,
      grandTotal: grandTotal,
      guest: selectedGuest,
      instruction: instruction,
      payments: selectedPaymentMethod ? [{ method: selectedPaymentMethod, amount: grandTotal }] : [{ method: 'Cash', amount: grandTotal }],
      paymentMethod: selectedPaymentMethod || 'Cash',
      status: activeOrder ? 'In-Progress' : 'New',
    };
    setCompletedOrder(currentOrderData);
    setShowInvoiceBillModal(true);
  };

  // Phase 2: "Cancel Order" Button (Screenshot 2)
  const handleCancelOrder = () => {
    if (activeOrder) {
      cancelOrderInStore(activeOrder.id);
    }
    setActiveOrder(null);
    setSelectedPaymentMethod(null);
    setFromAppointmentId(null);
    setPayments({ Cash: '', Card: '', HDFC: '', GPay: '', 'Phone Pay': '', Balance: '' });
    showToast('info', 'Order has been cancelled. Switched back to new sale mode.');
  };

  // "Clear" Button
  const handleClear = () => {
    setInvoiceItems([]);
    setSelectedGuest(null);
    setInstruction('');
    setActiveOrder(null);
    setSelectedPaymentMethod(null);
    setFromAppointmentId(null);
    setSelectedDate(getTodayIsoDate());
    setSelectedTimeSlot(getDefaultTimeSlotForDate(getTodayIsoDate(), timeSlots));
    setPayments({ Cash: '', Card: '', HDFC: '', GPay: '', 'Phone Pay': '', Balance: '' });
  };

  // "Create & Complete" Button (Screenshot 1)
  const handleCreateAndComplete = () => {
    if (isReadOnlySession()) {
      notifyReadOnlyBlocked('Completing a POS order');
      return;
    }
    if (!validateOrder()) return;
    const newInvoiceId = getNextInvoiceId();
    const isPayAtSalon = selectedPaymentMethod === 'Pay at Salon';
    const payStatus = isPayAtSalon ? 'Unpaid' : 'Paid';
    const finalPayments = isPayAtSalon 
      ? [] 
      : (selectedPaymentMethod ? [{ method: selectedPaymentMethod, amount: grandTotal }] : [{ method: 'Cash', amount: grandTotal }]);
    const finalMethod = selectedPaymentMethod || (isPayAtSalon ? 'Pay at Salon' : 'Cash');

    const finalOrder = {
      id: newInvoiceId,
      invoiceId: newInvoiceId,
      invoiceNo: newInvoiceId,
      date: selectedDate,
      dateDisplay: formatDateDisplay(selectedDate),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      guest: selectedGuest,
      items: [...invoiceItems],
      subTotal: grandTotal,
      grandTotal: grandTotal,
      instruction: instruction,
      payments: finalPayments,
      paymentMethod: finalMethod,
      paymentStatus: payStatus,
      status: 'Completed',
    };
    setCompletedOrder(finalOrder);
    saveOrder(finalOrder);

    // If packages were sold to a guest, record package subscription in CRM
    if (selectedGuest && packageInvoiceItems.length > 0) {
      try {
        const pkgNames = packageInvoiceItems.map(p => p.name).join(', ');
        updateCustomer({
          ...selectedGuest,
          package: pkgNames,
          packageCount: packageInvoiceItems.length,
        });
      } catch (err) {
        console.error(err);
      }
    }

    // Auto-record consumption for any disposables in invoice
    invoiceItems.filter(i => i.itemType === 'disposable').forEach(disp => {
      const q = Number(disp.qty) || 1;
      const rowAmt = Math.max(0, (disp.price * q) - (parseFloat(disp.discAmount) || 0));
      recordConsumption({
        itemId: disp.id,
        quantity: q,
        unit: disp.selectedUnit || disp.unit || 'Pack',
        unitCost: disp.price,
        totalCost: rowAmt,
        staffName: selectedGuest ? `Service for ${selectedGuest.name}` : 'POS Customer',
        purpose: `POS Order #${newInvoiceId}`,
        notes: `Customer Order #${newInvoiceId} (${disp.selectedUnit || 'Pack'} x ${q})`
      });
    });

    // Auto-sync completed order into Appointments list & calendar only if there are service items
    const serviceItemsForAppt = invoiceItems.filter(i => (i.itemType === 'service' || (!i.itemType && i.category !== 'PACKAGE' && i.category !== 'MEMBERSHIP')) && i.itemType !== 'product' && i.itemType !== 'disposable' && i.itemType !== 'package' && i.itemType !== 'membership');
    const productItemsForAppt = invoiceItems.filter(i => i.itemType === 'product');
    const disposableItemsForAppt = invoiceItems.filter(i => i.itemType === 'disposable');
    if (serviceItemsForAppt.length > 0) {
      const primaryStaff = serviceItemsForAppt[0]?.staff || 'Respark Trial';
      const serviceTitle = serviceItemsForAppt.map(i => i.name).join(', ') || 'Salon Service';
      const servicePrice = serviceItemsForAppt.reduce((acc, i) => acc + (i.price * (i.qty || 1) - (parseFloat(i.discAmount) || 0)), 0);
      const apptData = {
        guest: selectedGuest.name,
        mobile: selectedGuest.mobile || '+91 9876543210',
        service: serviceTitle,
        price: grandTotal,
        servicesPrice: servicePrice,
        paymentMethod: finalMethod,
        paymentStatus: payStatus,
        staff: primaryStaff,
        timeSlot: selectedTimeSlot,
        duration: '45 min',
        status: 'Completed',
        date: formatDateDisplay(selectedDate),
        instruction: instruction || 'Billed & Completed in POS',
        orderId: newInvoiceId,
        invoiceId: newInvoiceId,
        items: [...invoiceItems],
        products: productItemsForAppt,
        services: serviceItemsForAppt,
        disposables: disposableItemsForAppt,
        subTotal: grandTotal,
        grandTotal: grandTotal,
      };

      if (fromAppointmentId) {
        updateAppointment(fromAppointmentId, apptData);
      } else {
        saveAppointment({
          ...apptData,
          id: Date.now(),
        });
      }
    }

    setShowInvoiceBillModal(true);
    showToast('success', `Order #${newInvoiceId} created & completed for ${formatDateDisplay(selectedDate)} at ${selectedTimeSlot}! Synchronized to Appointments.`);
  };

  const actionButtonLabels = ['Services', 'Products', 'Disposables', 'Packages', 'Memberships'];

  // Determine which items to display on left panel based on activeMode
  const getCurrentItems = () => {
    let items = [];
    if (activeMode === 'Services') {
      items = allServices.filter(s => {
        const matchesCategory = s.category === activeCategory;
        const sGender = s.gender || 'Both';
        const matchesGender = sGender === 'Both' || sGender.toLowerCase() === gender.toLowerCase();
        return matchesCategory && matchesGender;
      }).map(s => ({ ...s, itemType: 'service' }));
    } else if (activeMode === 'Products') {
      items = masterProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.salePrice || p.price || 0,
        header: p.header || p.category || 'Products',
        category: p.category || 'Product',
        stock: p.stock,
        itemType: 'product',
      }));
    } else if (activeMode === 'Disposables') {
      items = disposablesList.map(d => {
        const pPrice = Number(d.packPrice) || (d.unit === 'Pack' ? Number(d.unitCost) : Number(d.unitCost || 250));
        const ppu = Number(d.piecesPerUnit) || 50;
        const pcPrice = Number(d.piecePrice) || Math.max(1, Math.round(pPrice / ppu) || 5);
        const bPrice = Number(d.boxPrice) || (d.unit === 'Box' ? Number(d.unitCost) : Math.round(pPrice * 4.5));
        const defaultUnit = d.unit === 'Box' ? 'Box' : 'Pack';
        const defaultRate = defaultUnit === 'Box' ? bPrice : pPrice;
        return {
          id: d.id,
          name: d.name,
          price: defaultRate,
          packPrice: pPrice,
          boxPrice: bPrice,
          piecesPerUnit: ppu,
          piecePrice: pcPrice,
          header: d.category || 'Salon Disposables',
          category: d.category,
          unit: d.unit || 'Pack',
          baseUnit: d.unit || 'Pack',
          selectedUnit: defaultUnit,
          stock: d.stock,
          itemType: 'disposable',
        };
      });
    } else if (activeMode === 'Packages') {
      items = packagesList.map(p => ({
        ...p,
        header: p.header || 'Special Packages',
        itemType: 'package',
      }));
    } else if (activeMode === 'Memberships') {
      items = getMemberships().map(m => ({
        ...m,
        header: m.header || 'Annual Memberships',
        itemType: 'membership',
      }));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const baseItems = activeMode === 'Services'
        ? allServices.filter(s => {
            const sGender = s.gender || 'Both';
            return sGender === 'Both' || sGender.toLowerCase() === gender.toLowerCase();
          }).map(s => ({ ...s, itemType: 'service' }))
        : items;
      items = baseItems.filter(item =>
        item.name.toLowerCase().includes(q)
      );
    }

    return items;
  };

  const currentDisplayItems = getCurrentItems();

  // Group by header
  const groupedItems = currentDisplayItems.reduce((acc, curr) => {
    const h = curr.header || 'Items';
    if (!acc[h]) acc[h] = [];
    acc[h].push(curr);
    return acc;
  }, {});

  const addToInvoice = (item) => {
    const isProduct = item.itemType === 'product' || activeMode === 'Products';
    const isDisposable = item.itemType === 'disposable' || activeMode === 'Disposables';
    const isPackage = item.itemType === 'package' || activeMode === 'Packages';
    const isMembership = item.itemType === 'membership' || activeMode === 'Memberships';
    const existing = invoiceItems.find(i => i.id === item.id);
    if (existing) {
      setInvoiceItems(invoiceItems.map(i => {
        if (i.id !== item.id) return i;
        const newQty = (i.qty || 1) + 1;
        const sub = i.price * newQty;
        const discAmount = i.discPercent ? Math.round((sub * parseFloat(i.discPercent)) / 100) : (parseFloat(i.discAmount) || 0);
        return { ...i, qty: newQty, discAmount };
      }));
    } else {
      let defaultUnit = item.unit || 'Pack';
      let effectivePrice = item.price;
      let packPrice = Number(item.packPrice) || (item.unit === 'Pack' ? item.price : 250);
      let boxPrice = Number(item.boxPrice) || Math.round(packPrice * 4.5);
      let ppu = Number(item.piecesPerUnit) || 50;
      let piecePrice = Number(item.piecePrice) || Math.max(1, Math.round(packPrice / ppu) || 5);

      if (isDisposable) {
        defaultUnit = item.selectedUnit || (item.unit === 'Box' ? 'Box' : 'Pack');
        if (defaultUnit === 'Box') effectivePrice = boxPrice;
        else if (defaultUnit === 'Pieces' || defaultUnit === 'Piece') effectivePrice = piecePrice;
        else effectivePrice = packPrice;
      }

      const assignedType = isDisposable ? 'disposable' : isProduct ? 'product' : isPackage ? 'package' : isMembership ? 'membership' : (item.itemType || 'service');

      setInvoiceItems([...invoiceItems, { 
        ...item, 
        itemType: assignedType,
        qty: 1, 
        staff: (isProduct || isDisposable || isPackage || isMembership) ? '' : (item.staff || (masterStaff[0]?.name || 'Staff')),
        category: item.category || (isPackage ? (item.header || 'Special Packages') : (isMembership ? 'Annual Memberships' : item.category)),
        validityDays: item.validityDays || (isPackage ? 180 : (isMembership ? 365 : undefined)),
        ...(isDisposable ? {
          selectedUnit: defaultUnit,
          baseUnit: item.unit || 'Pack',
          packPrice: packPrice,
          boxPrice: boxPrice,
          piecesPerUnit: ppu,
          piecePrice: piecePrice,
        } : {}),
        price: effectivePrice,
        discPercent: '',
        discAmount: ''
      }]);
    }
  };

  const updateDisposableUnit = (id, newUnit) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id !== id) return item;
      let newPrice = item.packPrice || item.price;
      if (newUnit === 'Box') {
        newPrice = item.boxPrice || Math.round((item.packPrice || item.price) * 4.5);
      } else if (newUnit === 'Pieces' || newUnit === 'Piece') {
        newPrice = item.piecePrice || Math.max(1, Math.round((item.packPrice || item.price) / (item.piecesPerUnit || 50)));
      } else {
        newPrice = item.packPrice || item.price;
      }
      const q = item.qty || 1;
      const sub = newPrice * q;
      const discAmount = item.discPercent ? Math.round((sub * parseFloat(item.discPercent)) / 100) : (parseFloat(item.discAmount) || 0);
      return {
        ...item,
        selectedUnit: newUnit,
        price: newPrice,
        discAmount,
      };
    }));
  };

  const updateStaff = (id, newStaff) => {
    setInvoiceItems(invoiceItems.map(item =>
      item.id === id ? { ...item, staff: newStaff } : item
    ));
  };

  const updateQty = (id, newQty) => {
    const q = parseInt(newQty) || 1;
    if (q < 1) return;
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id !== id) return item;
      const sub = item.price * q;
      const discAmount = item.discPercent ? Math.round((sub * parseFloat(item.discPercent)) / 100) : (parseFloat(item.discAmount) || 0);
      return { ...item, qty: q, discAmount };
    }));
  };

  const updateDiscPercent = (id, percentVal) => {
    const p = Math.min(100, Math.max(0, parseFloat(percentVal) || 0));
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id !== id) return item;
      const sub = item.price * item.qty;
      const disc = percentVal === '' ? '' : Math.round((sub * p) / 100);
      return {
        ...item,
        discPercent: percentVal === '' ? '' : p,
        discAmount: disc,
      };
    }));
  };

  const updateDiscAmount = (id, amountVal) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id !== id) return item;
      const sub = item.price * item.qty;
      const disc = Math.min(sub, Math.max(0, parseFloat(amountVal) || 0));
      const p = (sub > 0 && amountVal !== '') ? Math.round((disc / sub) * 100) : '';
      return {
        ...item,
        discAmount: amountVal === '' ? '' : disc,
        discPercent: p,
      };
    }));
  };

  const grandTotal = invoiceItems.reduce((sum, item) => {
    const sub = item.price * (item.qty || 1);
    const disc = parseFloat(item.discAmount) || 0;
    return sum + Math.max(0, sub - disc);
  }, 0);

  const serviceInvoiceItems = useMemo(() => {
    return invoiceItems.filter(i => (i.itemType === 'service' || (!i.itemType && i.category !== 'PACKAGE' && i.category !== 'MEMBERSHIP')) && i.itemType !== 'product' && i.itemType !== 'disposable' && i.itemType !== 'package' && i.itemType !== 'membership');
  }, [invoiceItems]);

  const productInvoiceItems = useMemo(() => {
    return invoiceItems.filter(i => i.itemType === 'product');
  }, [invoiceItems]);

  const disposableInvoiceItems = useMemo(() => {
    return invoiceItems.filter(i => i.itemType === 'disposable');
  }, [invoiceItems]);

  const packageInvoiceItems = useMemo(() => {
    return invoiceItems.filter(i => i.itemType === 'package' || i.category === 'PACKAGE' || (i.header && String(i.header).toLowerCase().includes('package')));
  }, [invoiceItems]);

  const membershipInvoiceItems = useMemo(() => {
    return invoiceItems.filter(i => i.itemType === 'membership' || i.category === 'MEMBERSHIP' || (i.header && String(i.header).toLowerCase().includes('membership')));
  }, [invoiceItems]);

  const servicesSubTotal = useMemo(() => {
    return serviceInvoiceItems.reduce((sum, item) => {
      const sub = item.price * (item.qty || 1);
      const disc = parseFloat(item.discAmount) || 0;
      return sum + Math.max(0, sub - disc);
    }, 0);
  }, [serviceInvoiceItems]);

  const productsSubTotal = useMemo(() => {
    return productInvoiceItems.reduce((sum, item) => {
      const sub = item.price * (item.qty || 1);
      const disc = parseFloat(item.discAmount) || 0;
      return sum + Math.max(0, sub - disc);
    }, 0);
  }, [productInvoiceItems]);

  const disposablesSubTotal = useMemo(() => {
    return disposableInvoiceItems.reduce((sum, item) => {
      const sub = item.price * (item.qty || 1);
      const disc = parseFloat(item.discAmount) || 0;
      return sum + Math.max(0, sub - disc);
    }, 0);
  }, [disposableInvoiceItems]);

  const packagesSubTotal = useMemo(() => {
    return packageInvoiceItems.reduce((sum, item) => {
      const sub = item.price * (item.qty || 1);
      const disc = parseFloat(item.discAmount) || 0;
      return sum + Math.max(0, sub - disc);
    }, 0);
  }, [packageInvoiceItems]);

  const membershipsSubTotal = useMemo(() => {
    return membershipInvoiceItems.reduce((sum, item) => {
      const sub = item.price * (item.qty || 1);
      const disc = parseFloat(item.discAmount) || 0;
      return sum + Math.max(0, sub - disc);
    }, 0);
  }, [membershipInvoiceItems]);

  useEffect(() => {
    if (selectedPaymentMethod) {
      setPayments({
        Cash: '',
        Card: '',
        HDFC: '',
        GPay: '',
        'Phone Pay': '',
        Balance: '',
        [selectedPaymentMethod]: grandTotal > 0 ? String(grandTotal) : '',
      });
    }
  }, [grandTotal, selectedPaymentMethod]);

  return (
    <div className="flex flex-col md:flex-row h-full min-h-screen bg-slate-50 overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-full md:w-[40%] lg:w-[30%] bg-white border-r border-slate-200 flex flex-col h-screen">
        <div className="p-4 border-b border-slate-200 shrink-0">
          {/* Gender Toggle */}
          <div className="flex space-x-2 mb-4">
            {['Female', 'Male'].map(g => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`px-6 py-1.5 rounded-full font-medium text-sm transition-colors ${
                  gender === g ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeMode}`} 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex overflow-x-auto space-x-2 pb-2 no-scrollbar">
            {actionButtonLabels.map(label => {
              const isActive = activeMode === label;
              return (
                <button
                  key={label}
                  onClick={() => { setActiveMode(label); setSearchTerm(''); }}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? label === 'Services' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-slate-800 text-white shadow-xs'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories */}
        {activeMode === 'Services' && (
          <div className="flex overflow-x-auto p-4 space-x-2 shrink-0 border-b border-slate-200 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeCategory === cat 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Item List (Services, Products, Packages, Memberships) */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.keys(groupedItems).length === 0 ? (
            <p className="text-slate-500 text-sm text-center mt-4">No {activeMode.toLowerCase()} items found</p>
          ) : (
            Object.entries(groupedItems).map(([header, items]) => (
              <div key={header} className="mb-6">
                <h3 className="font-bold text-slate-800 mb-3 text-sm">{header}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {items.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => addToInvoice(item)}
                      className="flex justify-between items-center border border-slate-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
                    >
                      <span className="text-sm font-medium text-slate-700 truncate mr-2 group-hover:text-indigo-900">{item.name}</span>
                      <span className="text-sm font-semibold text-slate-900 shrink-0 group-hover:text-indigo-600">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-[60%] lg:w-[70%] bg-slate-50 flex flex-col h-screen">
        <div className="p-4 bg-white border-b border-slate-200 shrink-0">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <h1 className="text-xl font-bold text-slate-800">Invoice</h1>
          </div>

          <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
            <span className="text-sm font-semibold text-slate-700">Customer:</span>
            
            {selectedGuest ? (
              <div className="flex-1 bg-white border border-slate-200 rounded-lg p-3 text-xs shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Customer :</span>
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-md px-2.5 py-0.5 font-bold flex items-center gap-1.5">
                      {selectedGuest.name}
                      <button onClick={() => setSelectedGuest(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer" title="Change customer">
                        <X size={12} />
                      </button>
                    </span>
                  </div>
                  <div><span className="text-slate-400">Phone :</span> <span className="text-slate-800 font-mono font-bold">{selectedGuest.mobile}</span></div>
                  <div><span className="text-slate-400">Loyalty :</span> <span className="bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-semibold border border-amber-200 text-[10px]">{selectedGuest.loyalty || 'Silver'}</span></div>
                  <button 
                    onClick={() => setShowAddGuestModal(true)} 
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Edit Customer"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative flex-1 max-w-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase">Search or Pick Customer</span>
                  <button
                    type="button"
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Old Customers ({guestList.length})</span>
                    <ChevronDown size={12} className={`transition-transform ${showGuestDropdown ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={guestSearch}
                    onFocus={() => setShowGuestDropdown(true)}
                    onChange={(e) => {
                      setGuestSearch(e.target.value);
                      setShowGuestDropdown(true);
                    }}
                    placeholder="Search customer name or mobile..." 
                    className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {showGuestDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-56 overflow-y-auto z-40 divide-y divide-slate-100">
                    <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                      <span>Select From Old Customers</span>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {guestList.filter(g => !guestSearch || g.name.toLowerCase().includes(guestSearch.toLowerCase()) || (g.mobile && g.mobile.includes(guestSearch))).length} found
                      </span>
                    </div>
                    {guestList
                      .filter(g => !guestSearch || g.name.toLowerCase().includes(guestSearch.toLowerCase()) || (g.mobile && g.mobile.includes(guestSearch)))
                      .map(guest => (
                        <div
                          key={guest.id || guest.mobile || guest.name}
                          onClick={() => {
                            setSelectedGuest(guest);
                            setShowGuestDropdown(false);
                            setGuestSearch('');
                          }}
                          className="p-2.5 hover:bg-indigo-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                              {guest.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{guest.mobile || 'No mobile'}</span>
                              {guest.loyalty && (
                                <span className="bg-amber-50 text-amber-700 text-[9px] px-1.5 py-0.2 rounded font-semibold border border-amber-200">
                                  {guest.loyalty}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="text-[10px] px-2 py-0.5 bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white rounded text-slate-600 font-medium shrink-0 transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    {guestList.length === 0 && (
                      <div className="p-3 text-xs text-slate-400 text-center">No customers found</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setShowAddGuestModal(true)}
              className="text-indigo-600 font-medium text-sm flex items-center hover:text-indigo-800 transition-colors cursor-pointer shrink-0"
            >
              <Plus size={16} className="mr-1" /> Add Customer
            </button>
          </div>
          {!selectedGuest && (
            <p className="text-rose-500 text-xs mt-1 md:ml-14">Please select customer</p>
          )}
        </div>

        {/* Invoice Panels: Separated Booked Services and Retail Products Sold */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
          {/* Empty State */}
          {invoiceItems.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400 my-auto shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Sparkles size={24} />
              </div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">No services, products or disposables added</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Select services, retail products, or single-use disposables from the left panel to add them to this invoice.
              </p>
            </div>
          )}

          {/* BOX 1: BOOKED SERVICES */}
          {serviceInvoiceItems.length > 0 && (
            <div className="bg-white rounded-xl border border-indigo-100 shadow-xs overflow-hidden shrink-0">
              {/* Box Header */}
              <div className="bg-gradient-to-r from-indigo-50/80 via-indigo-50/40 to-slate-50 px-4 py-2.5 border-b border-indigo-100">
                {/* Row 1: title + subtotal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      Booked Services
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                        {serviceInvoiceItems.length}
                      </span>
                    </h3>
                  </div>
                  <div className="text-xs font-semibold text-indigo-950">
                    <span className="text-slate-500 font-normal mr-1">Services Subtotal:</span>
                    <span className="font-mono font-bold text-indigo-700 text-sm">₹{servicesSubTotal}</span>
                  </div>
                </div>
                {/* Row 2: Date & Slot selectors */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* DATE SELECTOR */}
                  <div
                    onClick={() => {
                      try {
                        dateInputRef.current?.showPicker();
                      } catch (e) {
                        dateInputRef.current?.focus();
                      }
                    }}
                    className="relative flex items-center bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer group hover:border-indigo-400"
                    title="Click to select appointment date (today & future dates only)"
                  >
                    <Calendar size={14} className="mr-1.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold tracking-tight select-none">
                      {formatDateDisplay(selectedDate)}
                    </span>
                    <input
                      ref={dateInputRef}
                      type="date"
                      min={getTodayIsoDate()}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                    />
                  </div>
                  {/* TIME SLOT SELECTOR */}
                  <div className="flex items-center bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors">
                    <Clock size={14} className="mr-1.5 text-indigo-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-500 mr-1.5">Slot:</span>
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                      title="Select appointment / service time slot (present & future only)"
                    >
                      {availableTimeSlots.map(ts => (
                        <option key={ts} value={ts}>{ts}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Services Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-slate-50/80 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold">Service Name</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Staff</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Price</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Sub Total</th>
                      <th className="text-center py-2.5 px-2 font-semibold">Disc%</th>
                      <th className="text-right py-2.5 px-2 font-semibold">Disc (₹)</th>
                      <th className="text-right py-2.5 px-4 font-semibold">Total</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceInvoiceItems.map(item => (
                      <tr key={item.id} className="text-xs hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <select 
                              value={item.staff || ''} 
                              onFocus={() => setMasterStaff(getMasterStaff())}
                              onChange={(e) => updateStaff(item.id, e.target.value)}
                              className="border border-slate-200 rounded px-2 py-1 text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                            >
                              <option value="">Select Staff</option>
                              {masterStaff?.filter(st => st.active !== false || (typeof st === 'object' ? st.name : st) === item.staff).map(st => {
                                const name = typeof st === 'string' ? st : (st.name || `${st.firstName || ''} ${st.lastName || ''}`.trim() || 'Staff');
                                const idKey = typeof st === 'object' ? (st.id || name) : name;
                                return <option key={idKey} value={name}>{name}</option>;
                              })}
                            </select>
                            {item.staff && (
                              <button 
                                onClick={() => updateStaff(item.id, '')}
                                className="text-slate-400 hover:text-rose-600 text-xs px-1 cursor-pointer font-bold"
                                title="Clear staff"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">₹{item.price}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">₹{item.price * (item.qty || 1)}</td>
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <input 
                              type="number" 
                              min="0"
                              max="100"
                              placeholder="0"
                              value={item.discPercent !== undefined ? item.discPercent : ''} 
                              onChange={(e) => updateDiscPercent(item.id, e.target.value)}
                              className="w-8 text-center text-xs font-mono outline-none text-slate-800"
                            />
                            <span className="text-[11px] text-slate-400 ml-0.5">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <span className="text-[11px] text-slate-400 mr-0.5">₹</span>
                            <input 
                              type="number" 
                              min="0"
                              max={item.price * (item.qty || 1)}
                              placeholder="0"
                              value={item.discAmount !== undefined ? item.discAmount : ''} 
                              onChange={(e) => updateDiscAmount(item.id, e.target.value)}
                              className="w-12 text-right text-xs font-mono outline-none text-slate-800"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={() => removeFromInvoice(item.id)} 
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg p-1.5 transition-colors cursor-pointer inline-flex items-center justify-center" 
                            title="Remove service"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BOX 2: RETAIL PRODUCTS SOLD */}
          {productInvoiceItems.length > 0 && (
            <div className="bg-white rounded-xl border border-emerald-200 shadow-xs overflow-hidden shrink-0">
              {/* Box Header */}
              <div className="bg-gradient-to-r from-emerald-50/80 via-emerald-50/40 to-slate-50 px-4 py-2.5 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    Retail Products Sold
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {productInvoiceItems.length}
                    </span>
                  </h3>
                  <span className="hidden sm:inline-block text-[11px] text-emerald-700/80 italic font-normal ml-1">
                    (Direct retail sale · No staff assigned)
                  </span>
                </div>
                <div className="text-xs font-semibold text-emerald-950">
                  <span className="text-slate-500 font-normal mr-1">Products Subtotal:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">₹{productsSubTotal}</span>
                </div>
              </div>

              {/* Products Table (NO STAFF COLUMN) */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead className="bg-slate-50/80 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold">Product Name</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Price</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Qty</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Sub Total</th>
                      <th className="text-center py-2.5 px-2 font-semibold">Disc%</th>
                      <th className="text-right py-2.5 px-2 font-semibold">Disc (₹)</th>
                      <th className="text-right py-2.5 px-4 font-semibold">Total</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productInvoiceItems.map(item => (
                      <tr key={item.id} className="text-xs hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span>{item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-normal">
                              Product
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">₹{item.price}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-2xs">
                            <input 
                              type="number" 
                              min="1"
                              value={item.qty || 1} 
                              onChange={(e) => updateQty(item.id, e.target.value)}
                              className="w-10 text-center text-xs font-mono outline-none text-slate-800"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">₹{item.price * (item.qty || 1)}</td>
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <input 
                              type="number" 
                              min="0"
                              max="100"
                              placeholder="0"
                              value={item.discPercent !== undefined ? item.discPercent : ''} 
                              onChange={(e) => updateDiscPercent(item.id, e.target.value)}
                              className="w-8 text-center text-xs font-mono outline-none text-slate-800"
                            />
                            <span className="text-[11px] text-slate-400 ml-0.5">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <span className="text-[11px] text-slate-400 mr-0.5">₹</span>
                            <input 
                              type="number" 
                              min="0"
                              max={item.price * (item.qty || 1)}
                              placeholder="0"
                              value={item.discAmount !== undefined ? item.discAmount : ''} 
                              onChange={(e) => updateDiscAmount(item.id, e.target.value)}
                              className="w-12 text-right text-xs font-mono outline-none text-slate-800"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={() => removeFromInvoice(item.id)} 
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg p-1.5 transition-colors cursor-pointer inline-flex items-center justify-center" 
                            title="Remove product"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BOX 3: DISPOSABLES & CONSUMABLES */}
          {disposableInvoiceItems.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden shrink-0">
              {/* Box Header */}
              <div className="bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-slate-50 px-4 py-2.5 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    Disposables & Single-Use Supplies
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {disposableInvoiceItems.length}
                    </span>
                  </h3>
                  <span className="hidden sm:inline-block text-[11px] text-amber-700/80 italic font-normal ml-1">
                    (Auto-deducted from Disposables Inventory)
                  </span>
                </div>
                <div className="text-xs font-semibold text-amber-950">
                  <span className="text-slate-500 font-normal mr-1">Disposables Subtotal:</span>
                  <span className="font-mono font-bold text-amber-700 text-sm">₹{disposablesSubTotal}</span>
                </div>
              </div>

              {/* Disposables Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[740px]">
                  <thead className="bg-slate-50/80 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold">Disposable Item</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Unit (UOM)</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Rate</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Qty</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Sub Total</th>
                      <th className="text-center py-2.5 px-2 font-semibold">Disc%</th>
                      <th className="text-right py-2.5 px-2 font-semibold">Disc (₹)</th>
                      <th className="text-right py-2.5 px-4 font-semibold">Total</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {disposableInvoiceItems.map(item => (
                      <tr key={item.id} className="text-xs hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Base: {item.baseUnit || item.unit || 'Pack'} · {item.piecesPerUnit || 50} pcs/pack
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <select
                              value={item.selectedUnit || 'Pack'}
                              onChange={(e) => updateDisposableUnit(item.id, e.target.value)}
                              className="text-xs font-bold border border-amber-300 rounded-md px-2 py-1 bg-amber-50 text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs hover:bg-amber-100 transition-colors"
                              title="Select packaging unit: Pack, Box, or Pieces"
                            >
                              <option value="Pack">Pack (Std)</option>
                              <option value="Box">Box (Bulk)</option>
                              <option value="Pieces">Pieces (Pcs)</option>
                            </select>
                            <span className="text-[10px] text-amber-700 font-medium mt-0.5">
                              {item.selectedUnit === 'Box' ? `₹${item.boxPrice || Math.round((item.packPrice || item.price) * 4.5)}/box` :
                               item.selectedUnit === 'Pieces' ? `₹${item.piecePrice || 5}/pc` :
                               `₹${item.packPrice || item.price}/pack`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                          ₹{item.price}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <input 
                              type="number" 
                              min="1" 
                              value={item.qty || 1} 
                              onChange={(e) => updateQty(item.id, e.target.value)}
                              className="w-12 text-center text-xs font-semibold outline-none text-slate-800"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                          ₹{item.price * (item.qty || 1)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <input 
                              type="number" 
                              min="0" 
                              max="100" 
                              placeholder="0" 
                              value={item.discPercent !== undefined ? item.discPercent : ''} 
                              onChange={(e) => updateDiscPercent(item.id, e.target.value)}
                              className="w-10 text-center text-xs outline-none text-slate-800"
                            />
                            <span className="text-[11px] text-slate-400 select-none">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <span className="text-[11px] text-slate-400 mr-0.5">₹</span>
                            <input 
                              type="number" 
                              min="0" 
                              max={item.price * (item.qty || 1)} 
                              placeholder="0" 
                              value={item.discAmount !== undefined ? item.discAmount : ''} 
                              onChange={(e) => updateDiscAmount(item.id, e.target.value)}
                              className="w-12 text-right text-xs font-mono outline-none text-slate-800"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={() => removeFromInvoice(item.id)} 
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg p-1.5 transition-colors cursor-pointer inline-flex items-center justify-center" 
                            title="Remove disposable"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BOX 4: PACKAGES */}
          {packageInvoiceItems.length > 0 && (
            <div className="bg-white rounded-xl border border-violet-200 shadow-xs overflow-hidden shrink-0">
              {/* Box Header */}
              <div className="bg-gradient-to-r from-violet-50/80 via-purple-50/40 to-slate-50 px-4 py-2.5 border-b border-violet-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-violet-900 flex items-center gap-1.5">
                    Packages
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                      {packageInvoiceItems.length}
                    </span>
                  </h3>
                  <span className="hidden sm:inline-block text-[11px] text-violet-700/80 italic font-normal ml-1">
                    (Package Subscriptions · No staff assigned)
                  </span>
                </div>
                <div className="text-xs font-semibold text-violet-950">
                  <span className="text-slate-500 font-normal mr-1">Packages Subtotal:</span>
                  <span className="font-mono font-bold text-violet-700 text-sm">₹{packagesSubTotal}</span>
                </div>
              </div>

              {/* Packages Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-slate-50/80 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold">Package Name</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Package Category</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Package Validity Days</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Package Amount</th>
                      <th className="text-center py-2.5 px-2 font-semibold">Disc%</th>
                      <th className="text-right py-2.5 px-2 font-semibold">Disc (₹)</th>
                      <th className="text-right py-2.5 px-4 font-semibold">Total</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {packageInvoiceItems.map(item => (
                      <tr key={item.id} className="text-xs hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 font-normal">
                              Package
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {item.category || item.header || 'Special Packages'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                            {item.validityDays ? `${item.validityDays} Days` : '180 Days'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 font-medium">
                          ₹{item.price * (item.qty || 1)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <input 
                              type="number" 
                              min="0"
                              max="100"
                              placeholder="0"
                              value={item.discPercent !== undefined ? item.discPercent : ''} 
                              onChange={(e) => updateDiscPercent(item.id, e.target.value)}
                              className="w-8 text-center text-xs font-mono outline-none text-slate-800"
                            />
                            <span className="text-[11px] text-slate-400 ml-0.5">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <span className="text-[11px] text-slate-400 mr-0.5">₹</span>
                            <input 
                              type="number" 
                              min="0"
                              max={item.price * (item.qty || 1)}
                              placeholder="0"
                              value={item.discAmount !== undefined ? item.discAmount : ''} 
                              onChange={(e) => updateDiscAmount(item.id, e.target.value)}
                              className="w-12 text-right text-xs font-mono outline-none text-slate-800"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={() => removeFromInvoice(item.id)} 
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg p-1.5 transition-colors cursor-pointer inline-flex items-center justify-center" 
                            title="Remove package"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BOX 5: MEMBERSHIPS */}
          {membershipInvoiceItems.length > 0 && (
            <div className="bg-white rounded-xl border border-sky-200 shadow-xs overflow-hidden shrink-0">
              {/* Box Header */}
              <div className="bg-gradient-to-r from-sky-50/80 via-blue-50/40 to-slate-50 px-4 py-2.5 border-b border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                    Memberships
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      {membershipInvoiceItems.length}
                    </span>
                  </h3>
                  <span className="hidden sm:inline-block text-[11px] text-sky-700/80 italic font-normal ml-1">
                    (Annual Membership Plans · No staff assigned)
                  </span>
                </div>
                <div className="text-xs font-semibold text-sky-950">
                  <span className="text-slate-500 font-normal mr-1">Memberships Subtotal:</span>
                  <span className="font-mono font-bold text-sky-700 text-sm">₹{membershipsSubTotal}</span>
                </div>
              </div>

              {/* Memberships Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-slate-50/80 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold">Membership Plan</th>
                      <th className="text-left py-2.5 px-3 font-semibold">Tier</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Validity (Days)</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Price</th>
                      <th className="text-center py-2.5 px-2 font-semibold">Disc%</th>
                      <th className="text-right py-2.5 px-2 font-semibold">Disc (₹)</th>
                      <th className="text-right py-2.5 px-4 font-semibold">Total</th>
                      <th className="text-center py-2.5 px-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {membershipInvoiceItems.map(item => (
                      <tr key={item.id} className="text-xs hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-normal">
                              Membership
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {item.tier || item.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            {item.validityDays ? `${item.validityDays} Days` : '365 Days'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 font-medium">
                          ₹{item.price * (item.qty || 1)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <input 
                              type="number" 
                              min="0"
                              max="100"
                              placeholder="0"
                              value={item.discPercent !== undefined ? item.discPercent : ''} 
                              onChange={(e) => updateDiscPercent(item.id, e.target.value)}
                              className="w-8 text-center text-xs font-mono outline-none text-slate-800"
                            />
                            <span className="text-[11px] text-slate-400 ml-0.5">%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="inline-flex items-center border border-slate-200 rounded px-1.5 py-0.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 bg-white shadow-2xs">
                            <span className="text-[11px] text-slate-400 mr-0.5">₹</span>
                            <input 
                              type="number" 
                              min="0"
                              max={item.price * (item.qty || 1)}
                              placeholder="0"
                              value={item.discAmount !== undefined ? item.discAmount : ''} 
                              onChange={(e) => updateDiscAmount(item.id, e.target.value)}
                              className="w-12 text-right text-xs font-mono outline-none text-slate-800"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={() => removeFromInvoice(item.id)} 
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg p-1.5 transition-colors cursor-pointer inline-flex items-center justify-center" 
                            title="Remove membership"
                          >
                            <X size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grand Total & Subtotal Breakdown Row */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
              {serviceInvoiceItems.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span>Services:</span>
                  <span className="font-mono font-bold text-slate-800">₹{servicesSubTotal}</span>
                </div>
              )}
              {productInvoiceItems.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Products:</span>
                  <span className="font-mono font-bold text-slate-800">₹{productsSubTotal}</span>
                </div>
              )}
              {disposableInvoiceItems.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Disposables:</span>
                  <span className="font-mono font-bold text-slate-800">₹{disposablesSubTotal}</span>
                </div>
              )}
              {packageInvoiceItems.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                  <span>Packages:</span>
                  <span className="font-mono font-bold text-slate-800">₹{packagesSubTotal}</span>
                </div>
              )}
              {membershipInvoiceItems.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span>Memberships:</span>
                  <span className="font-mono font-bold text-slate-800">₹{membershipsSubTotal}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-slate-800">
                Grand Total <span className="font-mono text-indigo-700 text-lg ml-2 font-black">₹{grandTotal}</span>
              </span>
            </div>
          </div>

          {/* Instruction Pill */}
          <div className="flex flex-wrap items-center justify-between mt-3 shrink-0 gap-2">
            {instruction ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3 py-1.5 rounded-lg max-w-md">
                <span className="font-semibold">Note:</span>
                <span className="truncate">{instruction}</span>
                <button onClick={() => setInstruction('')} className="text-amber-700 hover:text-amber-900 ml-1 cursor-pointer" title="Remove note">
                  <X size={13} />
                </button>
              </div>
            ) : <div />}
            
            <button 
              onClick={() => setShowInstructionModal(true)}
              className="px-4 py-1.5 rounded-full border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer ml-auto"
            >
              {instruction ? 'Edit Instruction' : 'Add Instruction'}
            </button>
          </div>
        </div>

        {/* Toast Notification Alert */}
        {toast && (
          <div className={`mx-4 my-2 p-3 rounded-lg flex items-center justify-between text-xs font-medium shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}>
            <div className="flex items-center space-x-2">
              {toast.type === 'error' ? <X size={16} className="text-rose-600 shrink-0" /> : <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-75 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Bottom Section */}
        <div className="bg-white border-t border-slate-200 p-4 shrink-0">
          <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={15} className="text-indigo-600" /> Payment Method & Billing
              </span>
              <div className="text-xs font-semibold text-slate-600">
                Total Amount: <span className="font-bold text-indigo-700 font-mono text-sm">₹{grandTotal}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Payment Method Dropdown */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Payment Method*
                </label>
                <select
                  value={selectedPaymentMethod || ''}
                  onChange={(e) => {
                    const m = e.target.value;
                    handleSelectPaymentMethod(m);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="">-- Select Payment Method --</option>
                  <option value="Cash">Cash (Immediate / Cash Counter)</option>
                  <option value="GPay">GPay / UPI (Instant Payment)</option>
                  <option value="Phone Pay">PhonePe (Instant Payment)</option>
                  <option value="Card">Credit / Debit Card</option>
                  <option value="HDFC">HDFC Bank Transfer</option>
                  <option value="Balance">Customer Wallet Balance</option>
                  <option value="Pay at Salon">Pay at Salon (Due on Visit / Unpaid)</option>
                </select>
              </div>

              {/* Payment Status Badge */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Payment Status
                </label>
                <div className="pt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold border ${
                      !selectedPaymentMethod
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : selectedPaymentMethod === 'Pay at Salon'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {!selectedPaymentMethod
                      ? 'Select Payment Method'
                      : selectedPaymentMethod === 'Pay at Salon'
                        ? 'Due on Visit (Unpaid)'
                        : `Paid (₹${grandTotal}) via ${selectedPaymentMethod}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick-select payment method pill icons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Quick Select:</span>
              {[
                { name: 'Cash', icon: Banknote },
                { name: 'Card', icon: CreditCard },
                { name: 'GPay', icon: Smartphone },
                { name: 'Phone Pay', icon: Smartphone },
                { name: 'HDFC', icon: Banknote },
                { name: 'Pay at Salon', label: 'Due on Visit' }
              ].map(method => {
                const isSelected = selectedPaymentMethod === method.name;
                return (
                  <button
                    key={method.name}
                    type="button"
                    onClick={() => handleSelectPaymentMethod(method.name)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {method.icon && <method.icon size={13} />}
                    <span>{method.label || method.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end w-full">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              <button 
                onClick={handleClear}
                className="flex-1 sm:flex-none px-6 py-2.5 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors cursor-pointer text-sm"
              >
                Clear
              </button>
              <button 
                onClick={handleCreate}
                disabled={!selectedPaymentMethod}
                title={!selectedPaymentMethod ? "Please select a payment method before booking" : ""}
                className={`flex-1 sm:flex-none px-7 py-2.5 rounded-lg font-bold transition-all text-sm ${
                  selectedPaymentMethod
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                Book Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD GUEST MODAL (SRS Section 4 & 18) */}
      <POSAddGuestModal
        isOpen={showAddGuestModal}
        onClose={() => setShowAddGuestModal(false)}
        onGuestAdded={(newGuest) => {
          if (isReadOnlySession()) {
            notifyReadOnlyBlocked('Adding new guests');
            return;
          }
          addCustomer(newGuest);
          setSelectedGuest(newGuest);
          setGuestList(getCustomers());
          setShowAddGuestModal(false);
        }}
      />

      {/* INSTRUCTION MODAL */}
      <POSInstructionModal
        isOpen={showInstructionModal}
        onClose={() => setShowInstructionModal(false)}
        currentInstruction={instruction}
        onSave={(savedText) => setInstruction(savedText)}
      />

      {/* INVOICE BILL MODAL (SRS Section 4 & 24) */}
      <POSInvoiceBillModal
        isOpen={showInvoiceBillModal}
        onClose={() => setShowInvoiceBillModal(false)}
        order={completedOrder}
      />
    </div>
  );
};

export default POSPage;
