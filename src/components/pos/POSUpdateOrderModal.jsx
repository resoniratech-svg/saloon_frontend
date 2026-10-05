import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Calendar, Search, Trash2, Edit2, Plus, Minus, CreditCard, 
  Coins, Smartphone, Building2, Wallet, CheckCircle2, ChevronDown 
} from 'lucide-react';
import { services as servicesDataImport, staffMembers } from '../../data/mockData';
import { saveOrder } from '../../utils/orderStorage';
import { getMasterServices, normalizeCategory, getServiceHeader } from '../../utils/serviceStorage';
import { getMasterProducts } from '../../utils/productStorage';
import { getMasterStaff } from '../../utils/staffStorage';
import { getPackages } from '../../utils/packageStorage';
import { getMemberships } from '../../utils/membershipStorage';
import { getDisposables } from '../../utils/disposablesStorage';

const samplePackages = [
  { id: 'pkg1', name: 'Hair Care Package (180 Days)', price: 4999, header: 'Hair Packages' },
  { id: 'pkg2', name: 'Bridal Glow Special Suite', price: 14999, header: 'Bridal Packages' },
];

const sampleMemberships = [
  { id: 'mem1', name: 'Silver Tier Membership', price: 2000, header: 'Annual Memberships' },
  { id: 'mem2', name: 'Gold Tier Membership', price: 5000, header: 'Annual Memberships' },
];

const POSUpdateOrderModal = ({ isOpen, onClose, order, onOrderUpdated, onViewBill }) => {
  const [masterServices, setMasterServices] = useState(() => getMasterServices());
  const [masterProducts, setMasterProducts] = useState(() => getMasterProducts());
  const [masterStaff, setMasterStaff] = useState(() => getMasterStaff());
  const [packagesList, setPackagesList] = useState(() => getPackages());
  const [disposablesList, setDisposablesList] = useState(() => getDisposables());

  useEffect(() => {
    if (isOpen) {
      setMasterServices(getMasterServices());
      setMasterProducts(getMasterProducts());
      setMasterStaff(getMasterStaff());
      setPackagesList(getPackages());
      setDisposablesList(getDisposables());
    }
  }, [isOpen]);

  const allServices = useMemo(() => {
    return masterServices.map(s => ({
      ...s,
      header: getServiceHeader(s),
      category: normalizeCategory(s.category),
    }));
  }, [masterServices]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allServices.map(s => s.category).filter(Boolean)));
    return cats.length > 0 ? cats : ['HAIR'];
  }, [allServices]);

  const [selectedGender, setSelectedGender] = useState('Male');
  const [activeMode, setActiveMode] = useState('Add Service');
  const [activeCategory, setActiveCategory] = useState('HAIR');

  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash');
  const [payments, setPayments] = useState({
    Cash: '',
    Card: '',
    HDFC: '',
    GPay: '',
    'Phone Pay': '',
    Balance: ''
  });
  
  const [instruction, setInstruction] = useState('');
  const [isEditUnlocked, setIsEditUnlocked] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Sync state whenever modal opens with the selected order
  useEffect(() => {
    if (order) {
      setInvoiceItems(order.items ? JSON.parse(JSON.stringify(order.items)) : []);
      setSelectedGuest(order.guest || { name: 'bhanu', mobile: '+91 987554321' });
      setSelectedPaymentMethod(order.paymentMethod || 'Cash');
      
      const pMap = { Cash: '', Card: '', HDFC: '', GPay: '', 'Phone Pay': '', Balance: '' };
      if (order.payments && order.payments.length > 0) {
        order.payments.forEach(p => {
          if (pMap[p.method] !== undefined) pMap[p.method] = p.amount;
        });
      } else {
        pMap[order.paymentMethod || 'Cash'] = order.grandTotal || 800;
      }
      setPayments(pMap);
      setInstruction(order.instruction || '');
      setIsEditUnlocked(false);
      setSaveSuccessNotice(false);
    }
  }, [order, isOpen]);

  // Calculate totals
  const subTotal = invoiceItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalDiscount = invoiceItems.reduce((sum, item) => sum + (parseFloat(item.discAmount) || 0), 0);
  const grandTotal = Math.max(0, subTotal - totalDiscount);

  // Determine if order is modified, editing is unlocked, or new services are added
  const isOrderModified = (
    isEditUnlocked ||
    invoiceItems.length !== (order?.items?.length || 0) ||
    grandTotal !== (order?.grandTotal || 0)
  );

  // Keep selected payment amount synced with grandTotal if one method chosen
  const handlePaymentSelect = (method) => {
    setSelectedPaymentMethod(method);
    const newPayments = { Cash: '', Card: '', HDFC: '', GPay: '', 'Phone Pay': '', Balance: '' };
    newPayments[method] = grandTotal;
    setPayments(newPayments);
  };

  const handlePaymentAmountChange = (method, amount) => {
    setPayments(prev => ({ ...prev, [method]: amount }));
  };

  // Auto-sync selected payment method amount whenever grand total changes
  useEffect(() => {
    if (selectedPaymentMethod) {
      setPayments(prev => ({
        ...prev,
        [selectedPaymentMethod]: grandTotal
      }));
    }
  }, [grandTotal, selectedPaymentMethod]);

  // Item additions & modifications
  const addToInvoice = (item) => {
    setIsEditUnlocked(true);
    const isProduct = item.itemType === 'product' || activeMode === 'Add Product';
    const isDisposable = item.itemType === 'disposable' || activeMode === 'Add Disposables';
    const existing = invoiceItems.find(i => i.id === item.id);
    if (existing) {
      setInvoiceItems(invoiceItems.map(i => {
        if (i.id !== item.id) return i;
        const newQty = i.qty + 1;
        const sub = i.price * newQty;
        const discAmount = i.discPercent ? Math.round((sub * parseFloat(i.discPercent)) / 100) : (parseFloat(i.discAmount) || 0);
        return { ...i, qty: newQty, discAmount };
      }));
    } else {
      let defaultUnit = item.unit || 'Pack';
      let packPrice = Number(item.packPrice) || (item.unit === 'Pack' ? item.price : 250);
      let boxPrice = Number(item.boxPrice) || Math.round(packPrice * 4.5);
      let ppu = Number(item.piecesPerUnit) || 50;
      let piecePrice = Number(item.piecePrice) || Math.max(1, Math.round(packPrice / ppu) || 5);
      let effectivePrice = item.price;

      if (isDisposable) {
        defaultUnit = item.selectedUnit || (item.unit === 'Box' ? 'Box' : 'Pack');
        if (defaultUnit === 'Box') effectivePrice = boxPrice;
        else if (defaultUnit === 'Pieces' || defaultUnit === 'Piece') effectivePrice = piecePrice;
        else effectivePrice = packPrice;
      }

      setInvoiceItems([
        ...invoiceItems,
        {
          ...item,
          itemType: isDisposable ? 'disposable' : isProduct ? 'product' : (item.itemType || 'service'),
          qty: 1,
          staff: (isProduct || isDisposable) ? '' : 'Swati R',
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
        }
      ]);
    }
  };

  const updateDisposableUnit = (id, newUnit) => {
    setIsEditUnlocked(true);
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
      const sub = newPrice * item.qty;
      const discAmount = item.discPercent ? Math.round((sub * parseFloat(item.discPercent)) / 100) : (parseFloat(item.discAmount) || 0);
      return { ...item, selectedUnit: newUnit, price: newPrice, discAmount };
    }));
  };

  const updateQuantity = (id, newQty) => {
    setIsEditUnlocked(true);
    if (newQty <= 0) {
      removeFromInvoice(id);
      return;
    }
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id === id) {
        const sub = item.price * newQty;
        const discAmount = item.discPercent ? Math.round((sub * parseFloat(item.discPercent)) / 100) : (parseFloat(item.discAmount) || 0);
        return { ...item, qty: newQty, discAmount };
      }
      return item;
    }));
  };

  const updateStaff = (id, newStaff) => {
    setIsEditUnlocked(true);
    setInvoiceItems(invoiceItems.map(item =>
      item.id === id ? { ...item, staff: newStaff } : item
    ));
  };

  const updateDiscount = (id, field, value) => {
    setInvoiceItems(invoiceItems.map(item => {
      if (item.id !== id) return item;
      const sub = item.price * item.qty;
      let newDiscPercent = item.discPercent;
      let newDiscAmount = item.discAmount;

      if (field === 'percent') {
        newDiscPercent = value;
        const p = parseFloat(value) || 0;
        newDiscAmount = p > 0 ? Math.round((sub * p) / 100) : '';
      } else if (field === 'amount') {
        newDiscAmount = value;
        const a = parseFloat(value) || 0;
        newDiscPercent = a > 0 && sub > 0 ? Math.round((a / sub) * 100) : '';
      }
      return { ...item, discPercent: newDiscPercent, discAmount: newDiscAmount };
    }));
  };

  const removeFromInvoice = (id) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };

  // Filter display items
  const getCurrentItems = () => {
    let items = [];
    if (activeMode === 'Add Service') {
      items = allServices.filter(s => {
        const matchesCategory = s.category === activeCategory;
        const sGender = s.gender || 'Both';
        const matchesGender = sGender === 'Both' || sGender.toLowerCase() === selectedGender.toLowerCase();
        return matchesCategory && matchesGender;
      });
    } else if (activeMode === 'Add Product') {
      items = masterProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.salePrice || p.price || 0,
        header: p.header || (p.productTag === 'Hair' || p.category === 'HAIR' ? 'Hair Styling & Shampoos' : 'Skin & Face Products'),
        category: p.category || 'SKIN',
        barcode: p.barcode,
        sku: p.sku,
        stock: p.stock,
      }));
    } else if (activeMode === 'Add Disposables') {
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
    } else if (activeMode === 'Add Package') {
      items = packagesList.map(p => ({
        ...p,
        header: p.header || 'Special Packages'
      }));
    } else if (activeMode === 'Add Membership') {
      items = getMemberships().map(m => ({
        ...m,
        header: m.header || 'Annual Memberships'
      }));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const baseItems = activeMode === 'Add Service'
        ? allServices.filter(s => {
            const sGender = s.gender || 'Both';
            return sGender === 'Both' || sGender.toLowerCase() === selectedGender.toLowerCase();
          })
        : items;
      items = baseItems.filter(item =>
        item.name.toLowerCase().includes(q)
      );
    }
    return items;
  };

  const currentDisplayItems = getCurrentItems();
  const groupedItems = currentDisplayItems.reduce((acc, curr) => {
    const h = curr.header || 'Services';
    if (!acc[h]) acc[h] = [];
    acc[h].push(curr);
    return acc;
  }, {});

  // Save changes to persistent storage
  const handleSaveEdit = () => {
    if (invoiceItems.length === 0) {
      alert('Order must have at least one service/item.');
      return;
    }

    const updatedOrder = {
      ...order,
      items: [...invoiceItems],
      subTotal: grandTotal,
      grandTotal: grandTotal,
      discount: totalDiscount,
      guest: selectedGuest,
      instruction: instruction,
      paymentMethod: selectedPaymentMethod || 'Cash',
      payments: selectedPaymentMethod ? [{ method: selectedPaymentMethod, amount: grandTotal }] : order.payments,
    };

    saveOrder(updatedOrder);
    setSaveSuccessNotice(true);
    if (onOrderUpdated) onOrderUpdated(updatedOrder);
    setTimeout(() => {
      setSaveSuccessNotice(false);
    }, 3000);
  };

  const handleClear = () => {
    setInvoiceItems([]);
  };

  const handleViewBillClick = () => {
    const currentOrderData = {
      ...order,
      items: [...invoiceItems],
      subTotal: grandTotal,
      grandTotal: grandTotal,
      guest: selectedGuest,
      paymentMethod: selectedPaymentMethod || 'Cash',
    };
    if (onViewBill) onViewBill(currentOrderData);
  };

  const actionButtonLabels = ['Add Service', 'Add Product', 'Add Disposables', 'Add Package'];

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER (Exact match to Screenshot 2: "Update Bill (COMPLETED)Invoice Id:2") */}
        <div className="relative py-2.5 px-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex-1 text-center">
            <h2 className="text-sm sm:text-base font-semibold text-rose-500 tracking-wide">
              Update Bill ({order.status?.toUpperCase() || 'COMPLETED'})Invoice Id:{order.invoiceId || order.id}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* NOTIFICATION BANNER */}
        {saveSuccessNotice && (
          <div className="bg-emerald-500 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 size={15} /> Order #{order.invoiceId || order.id} updated and saved successfully!
          </div>
        )}

        {/* SPLIT SCREEN BODY */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* ==================================================== */}
          {/* LEFT PANEL: SERVICE SELECTOR (Matches Screenshot 2) */}
          {/* ==================================================== */}
          <div className="w-full lg:w-[38%] border-r border-slate-200 flex flex-col bg-slate-50/50 overflow-hidden">
            
            <div className="p-3 bg-white border-b border-slate-200 space-y-2.5">
              {/* Gender and Search in a row */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-slate-200 p-0.5 bg-slate-100 text-xs shrink-0">
                  <button
                    onClick={() => setSelectedGender('Female')}
                    className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                      selectedGender === 'Female' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Female
                  </button>
                  <button
                    onClick={() => setSelectedGender('Male')}
                    className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                      selectedGender === 'Male' ? 'bg-sky-500 text-white shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Male
                  </button>
                </div>

                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Service"
                    className="w-full pl-3 pr-8 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                  />
                  <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
                {actionButtonLabels.map((lbl) => (
                  <button
                    key={lbl}
                    onClick={() => setActiveMode(lbl)}
                    className={`px-2.5 py-1 rounded-md whitespace-nowrap text-[11px] font-medium transition-colors cursor-pointer border ${
                      activeMode === lbl
                        ? 'border-sky-400 bg-sky-50 text-sky-700 font-semibold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Category Pills */}
              {activeMode === 'Add Service' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold tracking-wider transition-all whitespace-nowrap border cursor-pointer ${
                        activeCategory === cat
                          ? 'border-sky-400 bg-sky-50 text-sky-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Service Cards List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {Object.entries(groupedItems).map(([header, items]) => (
                <div key={header} className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-800 tracking-wide">{header}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        onClick={() => addToInvoice(it)}
                        className="bg-white border border-slate-200 rounded-lg p-2.5 flex justify-between items-center hover:border-sky-400 hover:bg-sky-50/40 cursor-pointer transition-all shadow-2xs group"
                      >
                        <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 leading-snug line-clamp-2">
                          {it.name}
                        </span>
                        <span className="text-xs font-bold text-slate-900 font-mono ml-2 shrink-0">
                          {it.price}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================================================== */}
          {/* RIGHT PANEL: INVOICE EDITOR (Matches Screenshot 2)   */}
          {/* ==================================================== */}
          <div className="w-full lg:w-[62%] flex flex-col bg-white overflow-y-auto">
            
            {/* INVOICE TOP BAR */}
            <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Invoice</h2>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <span>{order.dateDisplay || order.date || '18-Sep-2026'}</span>
                  <Calendar size={14} className="text-slate-500" />
                </div>
                <button className="text-sky-600 hover:text-sky-700 p-0.5">
                  <Edit2 size={14} />
                </button>
              </div>
            </div>

            {/* GUEST DETAILS BOX (Exact 2-line layout from Screenshot 2) */}
            <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-200 text-xs text-slate-700 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600">Guest :</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-800 font-medium">
                    {selectedGuest?.name || 'bhanu'}
                    <X size={11} className="text-slate-400 cursor-pointer hover:text-slate-600" />
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">DOB : </span>
                  <span className="font-medium text-slate-700">{selectedGuest?.dob || 'Sep 18'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Last Visited : </span>
                  <span className="font-medium text-slate-700">{selectedGuest?.lastVisited || 'Sep 18'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Adv : </span>
                  <span className="font-medium text-slate-700">{selectedGuest?.adv || 'NA'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Membership : </span>
                  <span className="font-medium text-slate-700">{selectedGuest?.membership || 'NA'}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <div>
                  <span className="text-slate-500">Phone : </span>
                  <span className="font-medium text-slate-800">{selectedGuest?.mobile || '+91 987554321'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Anniv : </span>
                  <span className="font-medium text-slate-700">{selectedGuest?.anniversaryDate || 'Sep 10'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Due Bal : </span>
                  <span className="font-medium text-slate-700">{selectedGuest?.dueBal || 'NA'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Package : </span>
                  <span className="font-medium text-slate-700">{selectedGuest?.package || 'NA'}</span>
                </div>
              </div>
            </div>

            {/* INVOICE TABLE & "CLICK HERE TO EDIT" BANNER */}
            <div className="relative flex-1 min-h-[200px] border-b border-slate-200 overflow-x-auto">
              
              {/* "CLICK HERE TO EDIT" BANNER (Matching Screenshot 2) */}
              {!isEditUnlocked && (
                <div 
                  onClick={() => setIsEditUnlocked(true)}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center cursor-pointer group"
                >
                  <div className="bg-white/95 backdrop-blur-xs border border-slate-300 shadow-md py-2.5 px-8 rounded-md group-hover:border-sky-500 group-hover:shadow-lg transition-all">
                    <span className="text-xs font-bold tracking-wider text-slate-800 group-hover:text-sky-600 uppercase">
                      CLICK HERE TO EDIT
                    </span>
                  </div>
                </div>
              )}

              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Service Name</th>
                    <th className="py-2.5 px-3">Staff</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Sub Total</th>
                    <th className="py-2.5 px-2 text-center">Disc%</th>
                    <th className="py-2.5 px-2 text-center">Disc</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">
                        No items in this invoice. Select services from the left panel.
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map((item) => {
                      const itemSubTotal = item.price * item.qty;
                      const itemTotal = Math.max(0, itemSubTotal - (parseFloat(item.discAmount) || 0));

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          {/* Service Name */}
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{item.name}</span>
                              {item.itemType === 'disposable' && (
                                <select
                                  value={item.selectedUnit || item.unit || 'Pack'}
                                  onChange={(e) => updateDisposableUnit(item.id, e.target.value)}
                                  className="text-[11px] font-bold border border-amber-300 rounded px-1.5 py-0.5 bg-amber-50 text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs hover:bg-amber-100"
                                  title="Change Unit: Pack, Box, or Pieces"
                                >
                                  <option value="Pack">Pack</option>
                                  <option value="Box">Box</option>
                                  <option value="Pieces">Pieces</option>
                                </select>
                              )}
                            </div>
                          </td>

                          {/* Staff Dropdown */}
                          <td className="py-2 px-2">
                            <select
                              value={item.staff || ''}
                              onFocus={() => setMasterStaff(getMasterStaff())}
                              onChange={(e) => updateStaff(item.id, e.target.value)}
                              className="border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 bg-white focus:outline-none focus:border-sky-500"
                            >
                              <option value="">Select Staff</option>
                              {masterStaff?.filter(st => st.active !== false || (typeof st === 'object' ? st.name : st) === item.staff).map((s) => {
                                const staffName = typeof s === 'object' ? (s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Staff') : s;
                                const staffKey = typeof s === 'object' ? (s.id || staffName) : s;
                                return (
                                  <option key={staffKey} value={staffName}>{staffName}</option>
                                );
                              })}
                            </select>
                          </td>

                          {/* Qty */}
                          <td className="py-2 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => updateQuantity(item.id, item.qty - 1)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-5 text-center font-mono font-semibold">{item.qty}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.qty + 1)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {item.price}
                          </td>

                          {/* Sub Total */}
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                            {itemSubTotal}
                          </td>

                          {/* Disc% */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              value={item.discPercent || ''}
                              onChange={(e) => updateDiscount(item.id, 'percent', e.target.value)}
                              placeholder="0"
                              className="w-12 text-center border border-slate-200 rounded py-1 text-xs focus:outline-none focus:border-sky-500 font-mono"
                            />
                          </td>

                          {/* Disc Amount */}
                          <td className="py-2 px-2 text-center">
                            <input
                              type="number"
                              value={item.discAmount || ''}
                              onChange={(e) => updateDiscount(item.id, 'amount', e.target.value)}
                              placeholder="0"
                              className="w-14 text-center border border-slate-200 rounded py-1 text-xs focus:outline-none focus:border-sky-500 font-mono"
                            />
                          </td>

                          {/* Total */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {itemTotal}
                          </td>

                          {/* Delete Item */}
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() => removeFromInvoice(item.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* GRAND TOTAL & QUICK ACTION BUTTONS */}
            <div className="p-4 space-y-3 bg-white">
              <div className="flex justify-end items-center">
                <span className="text-xs font-semibold text-slate-600 mr-2">Grand Total</span>
                <span className="text-lg font-bold font-mono text-slate-900">₹{grandTotal}</span>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-xs text-slate-700 font-medium cursor-pointer transition-colors">
                  Add Instruction
                </button>
                <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-xs text-slate-700 font-medium cursor-pointer transition-colors">
                  Apply Discount
                </button>
                <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-xs text-slate-700 font-medium cursor-pointer transition-colors">
                  Apply Gift Card
                </button>
                <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md text-xs text-slate-700 font-medium cursor-pointer transition-colors">
                  Add Tip
                </button>
              </div>

              {/* PAY WITH SECTION (Matching Screenshot 2) */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-700 mb-1.5 block">Pay with</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {/* Cash */}
                  <div
                    onClick={() => handlePaymentSelect('Cash')}
                    className={`border rounded-lg p-2 flex flex-col justify-between cursor-pointer transition-all ${
                      selectedPaymentMethod === 'Cash'
                        ? 'border-sky-400 bg-sky-50/40 shadow-2xs ring-1 ring-sky-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                      <span>Cash</span>
                      <Coins size={14} className="text-amber-500" />
                    </div>
                    <input
                      type="text"
                      value={payments.Cash}
                      onChange={(e) => handlePaymentAmountChange('Cash', e.target.value)}
                      placeholder="0.0"
                      className="mt-1 text-right text-xs font-mono font-bold bg-transparent focus:outline-none w-full"
                    />
                  </div>

                  {/* Card */}
                  <div
                    onClick={() => handlePaymentSelect('Card')}
                    className={`border rounded-lg p-2 flex flex-col justify-between cursor-pointer transition-all ${
                      selectedPaymentMethod === 'Card'
                        ? 'border-sky-400 bg-sky-50/40 shadow-2xs ring-1 ring-sky-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                      <span>Card</span>
                      <CreditCard size={14} className="text-sky-500" />
                    </div>
                    <input
                      type="text"
                      value={payments.Card}
                      onChange={(e) => handlePaymentAmountChange('Card', e.target.value)}
                      placeholder="0.0"
                      className="mt-1 text-right text-xs font-mono font-bold bg-transparent focus:outline-none w-full"
                    />
                  </div>

                  {/* HDFC */}
                  <div
                    onClick={() => handlePaymentSelect('HDFC')}
                    className={`border rounded-lg p-2 flex flex-col justify-between cursor-pointer transition-all ${
                      selectedPaymentMethod === 'HDFC'
                        ? 'border-sky-400 bg-sky-50/40 shadow-2xs ring-1 ring-sky-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                      <span>HDFC</span>
                      <Building2 size={14} className="text-rose-500" />
                    </div>
                    <input
                      type="text"
                      value={payments.HDFC}
                      onChange={(e) => handlePaymentAmountChange('HDFC', e.target.value)}
                      placeholder="0.0"
                      className="mt-1 text-right text-xs font-mono font-bold bg-transparent focus:outline-none w-full"
                    />
                  </div>

                  {/* GPay */}
                  <div
                    onClick={() => handlePaymentSelect('GPay')}
                    className={`border rounded-lg p-2 flex flex-col justify-between cursor-pointer transition-all ${
                      selectedPaymentMethod === 'GPay'
                        ? 'border-sky-400 bg-sky-50/40 shadow-2xs ring-1 ring-sky-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                      <span>GPay</span>
                      <Smartphone size={14} className="text-emerald-500" />
                    </div>
                    <input
                      type="text"
                      value={payments.GPay}
                      onChange={(e) => handlePaymentAmountChange('GPay', e.target.value)}
                      placeholder="0.0"
                      className="mt-1 text-right text-xs font-mono font-bold bg-transparent focus:outline-none w-full"
                    />
                  </div>

                  {/* Phone Pay */}
                  <div
                    onClick={() => handlePaymentSelect('Phone Pay')}
                    className={`border rounded-lg p-2 flex flex-col justify-between cursor-pointer transition-all ${
                      selectedPaymentMethod === 'Phone Pay'
                        ? 'border-sky-400 bg-sky-50/40 shadow-2xs ring-1 ring-sky-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                      <span>Phone Pay</span>
                      <Smartphone size={14} className="text-purple-500" />
                    </div>
                    <input
                      type="text"
                      value={payments['Phone Pay']}
                      onChange={(e) => handlePaymentAmountChange('Phone Pay', e.target.value)}
                      placeholder="0.0"
                      className="mt-1 text-right text-xs font-mono font-bold bg-transparent focus:outline-none w-full"
                    />
                  </div>

                  {/* Balance */}
                  <div
                    onClick={() => handlePaymentSelect('Balance')}
                    className={`border rounded-lg p-2 flex flex-col justify-between cursor-pointer transition-all ${
                      selectedPaymentMethod === 'Balance'
                        ? 'border-sky-400 bg-sky-50/40 shadow-2xs ring-1 ring-sky-400'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                      <span>Balance</span>
                      <Wallet size={14} className="text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={payments.Balance}
                      onChange={(e) => handlePaymentAmountChange('Balance', e.target.value)}
                      placeholder="0.0"
                      className="mt-1 text-right text-xs font-mono font-bold bg-transparent focus:outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Message Configurations Notice */}
              <div className="text-xs text-slate-500 pt-1">
                <span className="font-semibold text-slate-700">Message Configurations: </span>
                <span>Message Will Not Send On A Completed Order</span>
              </div>

              {/* BOTTOM ACTIONS (Update / Edit, Clear, View Bill) */}
              <div className="pt-2 flex justify-end items-center gap-2.5">
                <button
                  onClick={() => {
                    if (!isEditUnlocked && !isOrderModified) {
                      setIsEditUnlocked(true);
                    } else {
                      handleSaveEdit();
                    }
                  }}
                  className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                  title={isOrderModified ? "Update bill with new services" : "Click to edit bill"}
                >
                  {isOrderModified ? 'Update' : 'Edit'}
                </button>
                <button
                  onClick={handleClear}
                  className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  Clear
                </button>
                <button
                  onClick={handleViewBillClick}
                  className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-95"
                >
                  View Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSUpdateOrderModal;
