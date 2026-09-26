import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Search, Plus, AlertTriangle, ArrowDownRight, ArrowUpRight,
  Trash2, Edit2, ShieldCheck, CheckCircle2, History, AlertCircle,
  FileText, Download, X, Layers, Users, Sparkles, Box, RefreshCw
} from 'lucide-react';
import {
  getDisposables,
  addDisposableItem,
  updateDisposableItem,
  deleteDisposableItem,
  recordInwardStock,
  recordConsumption,
  recordWastage,
  getConsumptionLogs,
  getWastageLogs,
  getInwardLogs
} from '../utils/disposablesStorage';
import { getMasterStaff } from '../utils/staffStorage';

export default function DisposablesPage() {
  const [items, setItems] = useState(() => getDisposables());
  const [consumptionLogs, setConsumptionLogs] = useState(() => getConsumptionLogs());
  const [wastageLogs, setWastageLogs] = useState(() => getWastageLogs());
  const [inwardLogs, setInwardLogs] = useState(() => getInwardLogs());
  const [staffList, setStaffList] = useState(() => getMasterStaff());

  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'consumption' | 'wastage' | 'inward'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    category: 'Hair & Styling',
    unit: 'Pack',
    unitCost: 150,
    stock: 10,
    minStock: 5,
    supplier: ''
  });

  const [showInwardModal, setShowInwardModal] = useState(false);
  const [inwardForm, setInwardForm] = useState({
    itemId: '',
    quantity: 10,
    supplier: '',
    invoiceNo: '',
    notes: ''
  });

  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [consumptionForm, setConsumptionForm] = useState({
    itemId: '',
    quantity: 1,
    staffName: 'Respark Trial',
    purpose: 'Hair Cut & Styling Service',
    notes: ''
  });

  const [showWastageModal, setShowWastageModal] = useState(false);
  const [wastageForm, setWastageForm] = useState({
    itemId: '',
    quantity: 1,
    reason: 'Damaged / Torn on opening',
    notes: ''
  });

  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const reloadData = () => {
    setItems(getDisposables());
    setConsumptionLogs(getConsumptionLogs());
    setWastageLogs(getWastageLogs());
    setInwardLogs(getInwardLogs());
    setStaffList(getMasterStaff());
  };

  useEffect(() => {
    const handleUpdate = () => reloadData();
    window.addEventListener('disposablesUpdated', handleUpdate);
    window.addEventListener('disposablesConsumptionUpdated', handleUpdate);
    window.addEventListener('disposablesWastageUpdated', handleUpdate);
    window.addEventListener('disposablesInwardUpdated', handleUpdate);
    window.addEventListener('staffUpdated', handleUpdate);
    window.addEventListener('tenantChanged', handleUpdate);

    return () => {
      window.removeEventListener('disposablesUpdated', handleUpdate);
      window.removeEventListener('disposablesConsumptionUpdated', handleUpdate);
      window.removeEventListener('disposablesWastageUpdated', handleUpdate);
      window.removeEventListener('disposablesInwardUpdated', handleUpdate);
      window.removeEventListener('staffUpdated', handleUpdate);
      window.removeEventListener('tenantChanged', handleUpdate);
    };
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalItems = items.length;
    const totalStockValue = items.reduce((sum, item) => sum + (item.stock * (item.unitCost || 0)), 0);
    const lowStockCount = items.filter(i => i.stock <= i.minStock).length;
    const totalConsumedItems = consumptionLogs.reduce((sum, log) => sum + (log.quantity || 0), 0);
    const totalConsumedCost = consumptionLogs.reduce((sum, log) => sum + (log.totalCost || 0), 0);
    const totalWastageLoss = wastageLogs.reduce((sum, log) => sum + (log.totalLoss || 0), 0);

    return {
      totalItems,
      totalStockValue,
      lowStockCount,
      totalConsumedItems,
      totalConsumedCost,
      totalWastageLoss
    };
  }, [items, consumptionLogs, wastageLogs]);

  // Categories list
  const categories = ['All', 'Hair & Styling', 'Skin & Facial', 'Waxing & Nails', 'Sanitization & Grooming'];

  // Filtered items for Catalog Tab
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const matchStatus =
        selectedStatusFilter === 'All' ? true :
        selectedStatusFilter === 'Low' ? item.stock <= item.minStock :
        selectedStatusFilter === 'Out' ? item.stock <= 0 :
        item.stock > item.minStock;

      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.supplier && item.supplier.toLowerCase().includes(q));

      return matchCat && matchStatus && matchSearch;
    });
  }, [items, selectedCategory, selectedStatusFilter, searchQuery]);

  // Handle Item Modal Open
  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        sku: item.sku || '',
        category: item.category || 'Hair & Styling',
        unit: item.unit || 'Pack',
        unitCost: item.unitCost || 0,
        stock: item.stock || 0,
        minStock: item.minStock || 5,
        supplier: item.supplier || ''
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        sku: `DSP-${Date.now().toString().slice(-4)}`,
        category: 'Hair & Styling',
        unit: 'Pack',
        unitCost: 150,
        stock: 10,
        minStock: 5,
        supplier: ''
      });
    }
    setShowItemModal(true);
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      alert('Please enter a disposable item name');
      return;
    }
    if (editingItem) {
      updateDisposableItem(editingItem.id, itemForm);
      triggerToast(`Updated "${itemForm.name}" successfully!`);
    } else {
      addDisposableItem(itemForm);
      triggerToast(`Added new disposable "${itemForm.name}"!`);
    }
    setShowItemModal(false);
  };

  const handleDeleteItem = (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from salon disposables?`)) {
      deleteDisposableItem(id);
      triggerToast(`Removed "${name}".`);
    }
  };

  // Quick Inward Action
  const handleOpenInward = (item = null) => {
    setInwardForm({
      itemId: item ? item.id : (items[0]?.id || ''),
      quantity: 10,
      supplier: item ? (item.supplier || '') : '',
      invoiceNo: `INV-${Date.now().toString().slice(-5)}`,
      notes: ''
    });
    setShowInwardModal(true);
  };

  const handleSaveInward = (e) => {
    e.preventDefault();
    if (!inwardForm.itemId) return;
    recordInwardStock(inwardForm);
    const itm = items.find(i => i.id === inwardForm.itemId);
    triggerToast(`Added +${inwardForm.quantity} to ${itm?.name || 'item'}!`);
    setShowInwardModal(false);
  };

  // Quick Consume Action
  const handleOpenConsume = (item = null) => {
    const staffNames = staffList.map(s => typeof s === 'string' ? s : s.name);
    setConsumptionForm({
      itemId: item ? item.id : (items[0]?.id || ''),
      quantity: 1,
      staffName: staffNames[0] || 'Respark Trial',
      purpose: item?.category === 'Skin & Facial' ? 'Facial & Skin Treatment' : 'Hair Cut & Styling',
      notes: ''
    });
    setShowConsumptionModal(true);
  };

  const handleSaveConsumption = (e) => {
    e.preventDefault();
    if (!consumptionForm.itemId) return;
    const itm = items.find(i => i.id === consumptionForm.itemId);
    if (itm && consumptionForm.quantity > itm.stock) {
      if (!window.confirm(`Warning: Requested quantity (${consumptionForm.quantity}) exceeds in-hand stock (${itm.stock}). Proceed anyway?`)) {
        return;
      }
    }
    recordConsumption(consumptionForm);
    triggerToast(`Logged check-out of ${consumptionForm.quantity} ${itm?.unit || 'unit(s)'} for ${consumptionForm.staffName}!`);
    setShowConsumptionModal(false);
  };

  // Quick Wastage Action
  const handleOpenWastage = (item = null) => {
    setWastageForm({
      itemId: item ? item.id : (items[0]?.id || ''),
      quantity: 1,
      reason: 'Damaged / Torn packaging on opening',
      notes: ''
    });
    setShowWastageModal(true);
  };

  const handleSaveWastage = (e) => {
    e.preventDefault();
    if (!wastageForm.itemId) return;
    recordWastage(wastageForm);
    const itm = items.find(i => i.id === wastageForm.itemId);
    triggerToast(`Recorded ${wastageForm.quantity} wasted for ${itm?.name || 'item'}.`);
    setShowWastageModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Package size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Salon Disposables & Single-Use Supplies
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  COGS & Hygiene
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Track single-use capes, gloves, neck paper, sanitization & stylist consumption logs
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenConsume()}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <ArrowDownRight size={15} />
            <span>Staff Check-Out</span>
          </button>

          <button
            onClick={() => handleOpenInward()}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <ArrowUpRight size={15} />
            <span>Inward Restock</span>
          </button>

          <button
            onClick={() => handleOpenItemModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-300 cursor-pointer active:scale-95"
          >
            <Plus size={15} />
            <span>Add Disposable Item</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Disposables</span>
            <Box size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{metrics.totalItems}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 4 Salon Departments</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Valuation</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">₹</span>
          </div>
          <div className="text-2xl font-black text-slate-800">₹{metrics.totalStockValue.toLocaleString()}</div>
          <p className="text-[11px] text-slate-400 mt-1">In-hand inventory cost</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Alerts</span>
            <AlertTriangle size={16} className={metrics.lowStockCount > 0 ? "text-amber-500" : "text-slate-300"} />
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`text-2xl font-black ${metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {metrics.lowStockCount}
            </div>
            {metrics.lowStockCount > 0 && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                Needs Reorder
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Below minimum threshold</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Staff Consumption</span>
            <Users size={16} className="text-violet-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{metrics.totalConsumedItems} units</div>
          <p className="text-[11px] text-slate-400 mt-1">Worth ₹{metrics.totalConsumedCost.toLocaleString()} used in services</p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers size={14} />
          <span>Catalog & Stock In-Hand</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'catalog' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('consumption')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'consumption'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowDownRight size={14} />
          <span>Staff Usage Logs</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'consumption' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {consumptionLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('inward')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'inward'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowUpRight size={14} />
          <span>Inward Purchase History</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'inward' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {inwardLogs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('wastage')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'wastage'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertCircle size={14} />
          <span>Wastage & Damage</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'wastage' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {wastageLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CATALOG & STOCK */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Right: Search & Status Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item, SKU, supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Low">Low Stock Only</option>
                <option value="Out">Out of Stock Only</option>
              </select>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-center">In-Hand Stock</th>
                    <th className="py-3 px-4 text-center">Min Threshold</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total Value</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400 font-medium">
                        No disposable items found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => {
                      const isLow = item.stock <= item.minStock;
                      const isOut = item.stock <= 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                              <span>SKU: {item.sku || 'N/A'}</span>
                              {item.supplier && <span>• Vendor: {item.supplier}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-700">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-600">
                            {item.unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-black text-sm ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                              {item.stock}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-slate-500">
                            {item.minStock} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-700">
                            ₹{item.unitCost}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">
                            ₹{(item.stock * (item.unitCost || 0)).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle size={10} /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={10} /> In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenInward(item)}
                                title="Add Inward Stock"
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                              >
                                + Inward
                              </button>
                              <button
                                onClick={() => handleOpenConsume(item)}
                                title="Check Out For Staff"
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                              >
                                Consume
                              </button>
                              <button
                                onClick={() => handleOpenWastage(item)}
                                title="Record Damaged Item"
                                className="px-1.5 py-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <AlertCircle size={14} />
                              </button>
                              <button
                                onClick={() => handleOpenItemModal(item)}
                                title="Edit Item"
                                className="px-1.5 py-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, item.name)}
                                title="Delete Item"
                                className="px-1.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF USAGE / CONSUMPTION */}
      {activeTab === 'consumption' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Stylist & Front-Desk Consumption Log</h2>
              <p className="text-xs text-slate-500">Audit trail of single-use supplies issued to staff members for client services</p>
            </div>
            <button
              onClick={() => handleOpenConsume()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Log Staff Consumption
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Staff Member</th>
                  <th className="py-2.5 px-4">Disposable Item</th>
                  <th className="py-2.5 px-4">Service / Purpose</th>
                  <th className="py-2.5 px-4 text-center">Qty Used</th>
                  <th className="py-2.5 px-4 text-right">Cost (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consumptionLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      No consumption logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  consumptionLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono text-slate-500">{log.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-black">
                          {log.staffName?.slice(0, 1) || 'S'}
                        </span>
                        <span>{log.staffName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{log.itemName}</div>
                        <div className="text-[10px] text-slate-400">{log.category}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {log.purpose}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-black text-indigo-600">
                        {log.quantity} {log.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">
                        ₹{log.totalCost || (log.quantity * (log.unitCost || 0))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INWARD HISTORY */}
      {activeTab === 'inward' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Inward Purchase & Restock History</h2>
              <p className="text-xs text-slate-500">Record of supplies purchased and replenished from vendor shipments</p>
            </div>
            <button
              onClick={() => handleOpenInward()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Record Inward Stock
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Item Name</th>
                  <th className="py-2.5 px-4">Supplier / Vendor</th>
                  <th className="py-2.5 px-4">Invoice / Ref #</th>
                  <th className="py-2.5 px-4 text-center">Qty Added</th>
                  <th className="py-2.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inwardLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      No inward stock entries recorded yet.
                    </td>
                  </tr>
                ) : (
                  inwardLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono text-slate-500">{log.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{log.itemName}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{log.supplier || 'N/A'}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{log.invoiceNo || '-'}</td>
                      <td className="py-3 px-4 text-center font-black text-emerald-600">
                        +{log.quantity} {log.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{log.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: WASTAGE & DAMAGE */}
      {activeTab === 'wastage' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Wastage, Spoiled & Damaged Supplies</h2>
              <p className="text-xs text-slate-500">Track items damaged during handling, water leakage, or expired before use</p>
            </div>
            <button
              onClick={() => handleOpenWastage()}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Log Wastage / Damage
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Item Name</th>
                  <th className="py-2.5 px-4">Reason / Root Cause</th>
                  <th className="py-2.5 px-4 text-center">Qty Wasted</th>
                  <th className="py-2.5 px-4 text-right">Financial Loss (₹)</th>
                  <th className="py-2.5 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wastageLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      No damaged or wasted supplies logged.
                    </td>
                  </tr>
                ) : (
                  wastageLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono text-slate-500">{log.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{log.itemName}</td>
                      <td className="py-3 px-4 font-semibold text-amber-700">{log.reason}</td>
                      <td className="py-3 px-4 text-center font-black text-rose-600">
                        {log.quantity} {log.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-600">
                        ₹{log.totalLoss || (log.quantity * (log.unitCost || 0))}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{log.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT DISPOSABLE ITEM */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-indigo-400" />
                <h3 className="font-bold text-sm">
                  {editingItem ? 'Edit Disposable Item' : 'Add New Disposable Item'}
                </h3>
              </div>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Item Name*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Disposable Cutting Capes (Pack of 50)"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Category*</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Hair & Styling">Hair & Styling</option>
                    <option value="Skin & Facial">Skin & Facial</option>
                    <option value="Waxing & Nails">Waxing & Nails</option>
                    <option value="Sanitization & Grooming">Sanitization & Grooming</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit of Measure*</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Pack">Pack</option>
                    <option value="Box">Box</option>
                    <option value="Roll">Roll</option>
                    <option value="Tub">Tub</option>
                    <option value="Pieces">Pieces</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">In-Hand Stock*</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemForm.stock}
                    onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Min Alert Level*</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={itemForm.minStock}
                    onChange={(e) => setItemForm({ ...itemForm, minStock: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Unit Cost (₹)*</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={itemForm.unitCost}
                    onChange={(e) => setItemForm({ ...itemForm, unitCost: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    placeholder="DSP-01"
                    value={itemForm.sku}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Default Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Salon Supplies Direct"
                    value={itemForm.supplier}
                    onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INWARD RESTOCK */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight size={18} />
                <h3 className="font-bold text-sm">Record Inward Stock Replenishment</h3>
              </div>
              <button onClick={() => setShowInwardModal(false)} className="text-emerald-200 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInward} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Item*</label>
                <select
                  value={inwardForm.itemId}
                  onChange={(e) => setInwardForm({ ...inwardForm, itemId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  required
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Current: {i.stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity Added*</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={inwardForm.quantity}
                    onChange={(e) => setInwardForm({ ...inwardForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Invoice / PO #</label>
                  <input
                    type="text"
                    value={inwardForm.invoiceNo}
                    onChange={(e) => setInwardForm({ ...inwardForm, invoiceNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Supplier / Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. HygienePro Healthcare"
                  value={inwardForm.supplier}
                  onChange={(e) => setInwardForm({ ...inwardForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes / Batch</label>
                <input
                  type="text"
                  placeholder="Optional shipment notes"
                  value={inwardForm.notes}
                  onChange={(e) => setInwardForm({ ...inwardForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STAFF CONSUMPTION */}
      {showConsumptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownRight size={18} />
                <h3 className="font-bold text-sm">Issue / Check-Out Disposables to Stylist</h3>
              </div>
              <button onClick={() => setShowConsumptionModal(false)} className="text-indigo-200 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConsumption} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Disposable Item*</label>
                <select
                  value={consumptionForm.itemId}
                  onChange={(e) => setConsumptionForm({ ...consumptionForm, itemId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  required
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stock: {i.stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Assigned Staff*</label>
                  <select
                    value={consumptionForm.staffName}
                    onChange={(e) => setConsumptionForm({ ...consumptionForm, staffName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                    required
                  >
                    {staffList.map(st => {
                      const name = typeof st === 'string' ? st : st.name;
                      return <option key={name} value={name}>{name}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity Issued*</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={consumptionForm.quantity}
                    onChange={(e) => setConsumptionForm({ ...consumptionForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Service / Purpose*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hair Cut Station, Facial Room, Dye Station"
                  value={consumptionForm.purpose}
                  onChange={(e) => setConsumptionForm({ ...consumptionForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Station 2 refill"
                  value={consumptionForm.notes}
                  onChange={(e) => setConsumptionForm({ ...consumptionForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConsumptionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Record Check-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: WASTAGE & DAMAGE */}
      {showWastageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-amber-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <h3 className="font-bold text-sm">Log Damaged / Contaminated Disposables</h3>
              </div>
              <button onClick={() => setShowWastageModal(false)} className="text-amber-200 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveWastage} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Select Disposable Item*</label>
                <select
                  value={wastageForm.itemId}
                  onChange={(e) => setWastageForm({ ...wastageForm, itemId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  required
                >
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stock: {i.stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quantity Lost*</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={wastageForm.quantity}
                    onChange={(e) => setWastageForm({ ...wastageForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reason*</label>
                  <select
                    value={wastageForm.reason}
                    onChange={(e) => setWastageForm({ ...wastageForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Damaged / Torn on opening">Torn / Damaged on opening</option>
                    <option value="Contaminated / Dropped on floor">Contaminated on floor</option>
                    <option value="Water / Chemical spill in stock">Chemical / Water spill</option>
                    <option value="Defective vendor batch">Defective vendor batch</option>
                    <option value="Expired / Discolored">Expired / Discolored</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Audit Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Box leaked during transit"
                  value={wastageForm.notes}
                  onChange={(e) => setWastageForm({ ...wastageForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWastageModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Log Wastage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
