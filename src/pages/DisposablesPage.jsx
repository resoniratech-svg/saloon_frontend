import React, { useState, useEffect, useMemo } from 'react';
import {
  Package, Search, Plus, Trash2, Edit2, CheckCircle2,
  X, Layers, Box
} from 'lucide-react';
import {
  getDisposables,
  addDisposableItem,
  updateDisposableItem,
  deleteDisposableItem
} from '../utils/disposablesStorage';

export default function DisposablesPage() {
  const [items, setItems] = useState(() => getDisposables());
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Hair & Styling',
    unit: 'Pack',
    unitCost: 150
  });

  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const reloadData = () => {
    setItems(getDisposables());
  };

  useEffect(() => {
    const handleUpdate = () => reloadData();
    window.addEventListener('disposablesUpdated', handleUpdate);
    window.addEventListener('tenantChanged', handleUpdate);

    return () => {
      window.removeEventListener('disposablesUpdated', handleUpdate);
      window.removeEventListener('tenantChanged', handleUpdate);
    };
  }, []);

  // Filtered items (live search across name, category, and unit)
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!item) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        item.name?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.unit?.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  // Handle Item Modal Open
  const handleOpenItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name || '',
        category: item.category || 'Hair & Styling',
        unit: item.unit || 'Pack',
        unitCost: item.unitCost || 0
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: '',
        category: 'Hair & Styling',
        unit: 'Pack',
        unitCost: 150
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
    reloadData();
    setShowItemModal(false);
  };

  const handleDeleteItem = (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from salon disposables?`)) {
      deleteDisposableItem(id);
      triggerToast(`Removed "${name}".`);
      reloadData();
    }
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
                Track single-use capes, gloves, neck paper, sanitization & supplies
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="flex items-center gap-2 flex-wrap">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Disposables</span>
            <Box size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">{items.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Single-use catalog items</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Unit Cost</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">₹</span>
          </div>
          <div className="text-2xl font-black text-slate-800">
            ₹{items.length > 0 ? Math.round(items.reduce((sum, i) => sum + (Number(i.unitCost) || 0), 0) / items.length).toLocaleString() : 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Average cost per unit</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Categories</span>
            <Layers size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {new Set(items.map(i => i.category)).size || 4}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Hair, Skin, Waxing & Sanitization</p>
        </div>
      </div>

      {/* MAIN CATALOG SECTION */}
      <div className="space-y-4">
        {/* Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Disposable Supplies List</h2>
            <p className="text-xs text-slate-500">View and manage salon single-use items</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by item name, category, or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Catalog Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Unit of Measure</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">
                      No disposable items found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg font-semibold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-600">
                        {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono text-sm">
                        ₹{Number(item.unitCost || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenItemModal(item)}
                            title="Edit Item"
                            className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer font-bold text-xs inline-flex items-center gap-1"
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            title="Delete Item"
                            className="px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer font-bold text-xs inline-flex items-center gap-1"
                          >
                            <Trash2 size={13} /> Delete
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

      {/* MODAL: ADD / EDIT DISPOSABLE ITEM */}
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

              <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
}
