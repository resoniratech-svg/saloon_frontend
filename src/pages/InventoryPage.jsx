import React, { useState, useEffect } from 'react';
import {
  Search, Clock, CheckCircle, XCircle, ClipboardList,
  ChevronRight, ChevronDown, Plus, Download, Upload, Save,
  CheckCircle2, Trash2, X, Package, Check
} from 'lucide-react';
import { getMasterVendors, saveMasterVendors } from '../utils/vendorStorage';
import { getMasterProducts } from '../utils/productStorage';


const DashboardTab = () => (
  <div className="space-y-6">
    {/* Top Row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <span className="text-sm text-slate-500 font-medium">Pending PO</span>
          <Clock className="w-5 h-5 text-rose-500" />
        </div>
        <div className="text-3xl font-bold text-slate-800 mt-4">0</div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <span className="text-sm text-slate-500 font-medium">Approved PO</span>
          <CheckCircle className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="text-3xl font-bold text-slate-800 mt-4">0</div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <span className="text-sm text-slate-500 font-medium">Rejected PO</span>
          <XCircle className="w-5 h-5 text-rose-500" />
        </div>
        <div className="text-3xl font-bold text-slate-800 mt-4">0</div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start">
          <span className="text-sm text-slate-500 font-medium">Min Stock Item</span>
          <ClipboardList className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="text-3xl font-bold text-slate-800 mt-4">1</div>
      </div>
    </div>

    {/* Middle Row */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Inventory Summary</h3>
        <div className="flex flex-wrap gap-8">
          <div>
            <div className="text-sm text-slate-500 font-medium">Stock In Hand</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">96</div>
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Stock Yet To Be Received</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">0</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Product Summary</h3>
        <div className="flex flex-wrap gap-8">
          <div>
            <div className="text-sm text-slate-500 font-medium">Total Items</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">24</div>
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Active Items</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">24</div>
          </div>
          <div>
            <div className="text-sm text-slate-500 font-medium">Inactive Items</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">0</div>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom Row */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 min-h-[160px] flex flex-col shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">Top Selling Items</h3>
        <div className="flex-1 flex items-center justify-center text-slate-400 italic text-sm">
          No top selling items yet.
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-5 min-h-[160px] flex flex-col shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">Most Used Consumables</h3>
        <div className="flex-1 flex items-center justify-center text-slate-400 italic text-sm">
          No consumable usage data yet.
        </div>
      </div>
    </div>
  </div>
);

const PurchaseOrderTab = () => {
  const [vendors, setVendors] = useState(() => getMasterVendors());
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);

  const [itemSearch, setItemSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [qty, setQty] = useState(1);

  const [expectedBy, setExpectedBy] = useState('');
  const [comment, setComment] = useState('');
  const [poItems, setPoItems] = useState([]);
  const [placedCount, setPlacedCount] = useState(0);
  const [notification, setNotification] = useState('');

  const [allProducts, setAllProducts] = useState(() => getMasterProducts());

  useEffect(() => {
    const handleUpdate = () => {
      setVendors(getMasterVendors());
      setAllProducts(getMasterProducts());
    };
    const handleTenant = () => {
      handleUpdate();
      setSelectedVendor(null);
      setSelectedItem(null);
      setPoItems([]);
    };
    window.addEventListener('vendorsUpdated', handleUpdate);
    window.addEventListener('productsUpdated', handleUpdate);
    window.addEventListener('tenantChanged', handleTenant);
    return () => {
      window.removeEventListener('vendorsUpdated', handleUpdate);
      window.removeEventListener('productsUpdated', handleUpdate);
      window.removeEventListener('tenantChanged', handleTenant);
    };
  }, []);

  // Filter vendors based on search input
  const filteredVendorsList = vendors.filter(v => {
    if (!vendorSearch.trim()) return true;
    const q = vendorSearch.toLowerCase().trim();
    return (
      (v.firmName && v.firmName.toLowerCase().includes(q)) ||
      (v.vendorName && v.vendorName.toLowerCase().includes(q)) ||
      (v.city && v.city.toLowerCase().includes(q))
    );
  });

  // Items list strictly showing selected vendor's items only
  const vendorProducts = selectedVendor
    ? allProducts.filter(prod => {
        const vItems = selectedVendor.items || [];
        return vItems.some(item =>
          typeof item === 'object' ? item.id === prod.id : item === prod.id
        );
      })
    : [];

  const availableItemsList = vendorProducts
    .filter(p => {
      if (!itemSearch.trim()) return true;
      const q = itemSearch.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.header && p.header.toLowerCase().includes(q))
      );
    })
    .map(prod => {
      let effectivePrice = prod.price || prod.salePrice || 100;
      if (selectedVendor && selectedVendor.items) {
        const vItem = selectedVendor.items.find(item =>
          typeof item === 'object' ? item.id === prod.id : item === prod.id
        );
        if (vItem && typeof vItem === 'object' && vItem.amount) {
          effectivePrice = Number(vItem.amount);
        }
      }
      return {
        ...prod,
        effectivePrice
      };
    });


  const handleAddItem = () => {
    let itemToAdd = selectedItem;
    if (!itemToAdd && itemSearch.trim()) {
      itemToAdd = availableItemsList.find(p => p.name.toLowerCase() === itemSearch.toLowerCase().trim());
    }

    if (!itemToAdd) {
      alert('Please search and select an item from the list');
      return;
    }

    const quantity = Math.max(1, parseInt(qty) || 1);
    const price = itemToAdd.effectivePrice || itemToAdd.price || itemToAdd.salePrice || 100;
    const totalVal = price * quantity;

    const existingIndex = poItems.findIndex(p => p.id === itemToAdd.id);
    if (existingIndex > -1) {
      const updated = [...poItems];
      updated[existingIndex].qty += quantity;
      updated[existingIndex].totalValue = updated[existingIndex].qty * updated[existingIndex].price;
      setPoItems(updated);
    } else {
      setPoItems(prev => [
        ...prev,
        {
          id: itemToAdd.id,
          name: itemToAdd.name,
          inStock: itemToAdd.stock || 25,
          qty: quantity,
          price: price,
          totalValue: totalVal
        }
      ]);
    }

    setItemSearch('');
    setSelectedItem(null);
    setQty(1);
  };

  const handleRemoveItem = (id) => {
    setPoItems(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    setSelectedVendor(null);
    setVendorSearch('');
    setPoItems([]);
    setItemSearch('');
    setSelectedItem(null);
    setQty(1);
    setExpectedBy('');
    setComment('');
  };

  const handleSubmitPO = () => {
    if (!selectedVendor) {
      alert('Please select a vendor before submitting');
      return;
    }
    if (poItems.length === 0) {
      alert('Please add at least one item to the Purchase Order');
      return;
    }

    setPlacedCount(prev => prev + 1);
    setNotification(`Purchase Order for "${selectedVendor.firmName || selectedVendor.vendorName}" submitted successfully!`);
    handleClearAll();
    setTimeout(() => setNotification(''), 4000);
  };

  const totalItemsCount = poItems.reduce((sum, item) => sum + item.qty, 0);
  const totalPoValue = poItems.reduce((sum, item) => sum + item.totalValue, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col min-h-[calc(100vh-6rem)] md:min-h-[calc(100vh-4rem)] shadow-sm">
      {notification && (
        <div className="m-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      {/* Status Pills */}
      <div className="p-4 border-b border-slate-200 flex items-center gap-3 overflow-x-auto whitespace-nowrap hide-scrollbar shrink-0">
        {[
          `Placed ${placedCount}`,
          'Approved 0',
          'Rejected 0',
          'Partial Settled 0',
          'Settled 0',
          'Cancelled 0',
          `Total ${placedCount}`
        ].map((status, i) => (
          <span
            key={i}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              status.startsWith('Placed') && placedCount > 0
                ? 'bg-sky-50 text-sky-700 border-sky-300 font-bold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {status}
          </span>
        ))}
        <button
          onClick={handleClearAll}
          className="ml-auto flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {/* Form Section */}
      <div className="p-4 space-y-4 border-b border-slate-200 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vendor Search Input with Live Dropdown */}
          <div className="space-y-1 relative">
            <label className="text-sm text-slate-600 font-medium">Vendor:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search By Firm Name"
                value={vendorSearch}
                onFocus={() => setShowVendorDropdown(true)}
                onChange={(e) => {
                  setVendorSearch(e.target.value);
                  setShowVendorDropdown(true);
                  if (selectedVendor && e.target.value !== (selectedVendor.firmName || selectedVendor.vendorName)) {
                    setSelectedVendor(null);
                  }
                }}
                className={`w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-all ${
                  selectedVendor
                    ? 'border-sky-400 bg-sky-50/40 text-sky-900 font-semibold focus:border-sky-500 focus:ring-sky-500'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {vendorSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVendor(null);
                    setVendorSearch('');
                    setShowVendorDropdown(false);
                    setItemSearch('');
                    setSelectedItem(null);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Vendor Suggestions Dropdown */}
            {showVendorDropdown && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowVendorDropdown(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 max-h-60 overflow-y-auto">
                  {filteredVendorsList.length > 0 ? (
                    filteredVendorsList.map((v) => {
                      const isSelected = selectedVendor?.id === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedVendor(v);
                            setVendorSearch(v.firmName || v.vendorName);
                            setShowVendorDropdown(false);
                            setItemSearch('');
                            setSelectedItem(null);
                          }}
                          className={`px-3.5 py-2.5 hover:bg-sky-50 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-50 last:border-0 ${
                            isSelected ? 'bg-sky-50 font-semibold text-sky-900' : ''
                          }`}
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-800">
                              {v.firmName || v.vendorName}
                            </div>
                            <div className="text-xs text-slate-400">
                              {v.vendorName} {v.city ? `• ${v.city}` : ''} {v.mobile ? `• ${v.mobile}` : ''}
                            </div>
                          </div>
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              v.active ? 'bg-sky-500' : 'bg-slate-300'
                            }`}
                            title={v.active ? 'Active' : 'Inactive'}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-xs text-slate-500 text-center italic">
                      No vendors found matching "{vendorSearch}". You can create one in Vendor Management.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Expected By Date */}
          <div className="space-y-1">
            <label className="text-sm text-slate-600 font-medium">Expected By:</label>
            <input
              type="date"
              value={expectedBy}
              onChange={(e) => setExpectedBy(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* PO Date */}
          <div className="space-y-1">
            <label className="text-sm text-slate-600 font-medium">PO Date:</label>
            <div className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-700 font-semibold">
              19-Sep-2026
            </div>
          </div>
        </div>

        {/* Item Selection & Qty Row */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-4 items-end pt-1">
          <div className="space-y-1 relative">
            <label className="text-sm text-slate-600 font-medium">Item:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Item By Name"
                value={itemSearch}
                onFocus={() => setShowItemDropdown(true)}
                onChange={(e) => {
                  setItemSearch(e.target.value);
                  setShowItemDropdown(true);
                  if (selectedItem && e.target.value !== selectedItem.name) {
                    setSelectedItem(null);
                  }
                }}
                className={`w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-all ${
                  selectedItem
                    ? 'border-indigo-400 bg-indigo-50/30 text-indigo-900 font-semibold focus:border-indigo-500 focus:ring-indigo-500'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
              />
              {itemSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    setItemSearch('');
                    setShowItemDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Item Suggestions Dropdown */}
            {showItemDropdown && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowItemDropdown(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 max-h-60 overflow-y-auto">
                  {!selectedVendor ? (
                    <div className="px-4 py-4 text-xs text-amber-700 bg-amber-50 text-center font-medium m-2 rounded-lg border border-amber-200">
                      Please select a Vendor first to view their assigned items.
                    </div>
                  ) : vendorProducts.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-slate-500 text-center italic m-2">
                      No items assigned to <strong className="text-slate-700">{selectedVendor.firmName || selectedVendor.vendorName}</strong>. You can assign items in <strong className="text-sky-600">Vendor Management &gt; Vendor Items</strong>.
                    </div>
                  ) : availableItemsList.length > 0 ? (
                    availableItemsList.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setSelectedItem(prod);
                          setItemSearch(prod.name);
                          setShowItemDropdown(false);
                        }}
                        className="px-3.5 py-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {prod.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {prod.header || prod.category || 'Product'} • Stock: {prod.stock || 25}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-indigo-600">
                          ₹{prod.effectivePrice}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-slate-500 text-center italic">
                      No items found matching "{itemSearch}" for this vendor
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-600 font-medium">Qty:</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-center font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-sm w-full md:w-auto cursor-pointer active:scale-95"
          >
            Add
          </button>
        </div>

        {/* Summary Counter */}
        <div className="flex gap-6 text-sm font-semibold text-slate-800 pt-2 border-t border-slate-100">
          <span>Total Items: <span className="text-indigo-600">{totalItemsCount}</span></span>
          <span>Total Value: <span className="text-indigo-600">₹{totalPoValue.toLocaleString()}</span></span>
          {selectedVendor && (
            <span className="text-xs text-slate-500 self-center ml-auto">
              Vendor: <strong className="text-slate-800">{selectedVendor.firmName || selectedVendor.vendorName}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-indigo-600 text-white sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 font-medium">Sr.No.</th>
              <th className="py-3 px-4 font-medium">Item Name</th>
              <th className="py-3 px-4 font-medium text-center">In Stock</th>
              <th className="py-3 px-4 font-medium text-center">Required Qty</th>
              <th className="py-3 px-4 font-medium text-right">Price</th>
              <th className="py-3 px-4 font-medium text-right">Total value</th>
              <th className="py-3 px-4 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {poItems.length > 0 ? (
              poItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-600">{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                  <td className="py-3 px-4 text-center text-slate-600">{item.inStock}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800">{item.qty}</td>
                  <td className="py-3 px-4 text-right text-slate-700">₹{item.price}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800">₹{item.totalValue.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400 italic">
                  No items added yet. Select an item above and click Add.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-4 shrink-0 rounded-b-xl">
        <textarea
          placeholder="Write a comment"
          rows="2"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none bg-white"
        />
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors bg-white cursor-pointer"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={handleSubmitPO}
            className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};


const ApprovalTab = () => {
  const [poExpanded, setPoExpanded] = useState(false);
  const [trExpanded, setTrExpanded] = useState(true);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Purchase Order Section */}
      <div className="border-b border-slate-200">
        <button 
          onClick={() => setPoExpanded(!poExpanded)}
          className="w-full py-4 px-5 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            {poExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
            Purchase Order
            <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs ml-2 shadow-sm">0</span>
          </div>
        </button>
        {poExpanded && (
          <div className="p-5 text-slate-500 text-sm italic bg-slate-50 border-t border-slate-100">
            No pending purchase orders.
          </div>
        )}
      </div>

      {/* Transfer Request Section */}
      <div>
        <button 
          onClick={() => setTrExpanded(!trExpanded)}
          className="w-full py-4 px-5 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
        >
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            {trExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
            Transfer Request
            <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs ml-2 shadow-sm">0</span>
          </div>
        </button>
        {trExpanded && (
          <div className="p-5 text-slate-500 text-sm italic bg-slate-50 border-t border-slate-100">
            No transfer requests.
          </div>
        )}
      </div>
    </div>
  );
};

const StockReconciliationTab = () => {
  const mockData = [
    {category:'Kinessence',item:'Antiox Shampoo',actualStock:5,adjustStock:5,stockDiff:0,stockValue:8625,actualCons:0,adjustCons:0,unit:'ml',consDiff:0},
    {category:'Disposables',item:'Big Mask',actualStock:0,adjustStock:0,stockDiff:0,stockValue:0,actualCons:0,adjustCons:0,unit:'-',consDiff:0},
    {category:'Wella',item:'Boost Bounce',actualStock:6,adjustStock:6,stockDiff:0,stockValue:4020,actualCons:1,adjustCons:1,unit:'ml',consDiff:0},
    {category:'Disposables',item:'Hair Cape',actualStock:0,adjustStock:0,stockDiff:0,stockValue:0,actualCons:0,adjustCons:0,unit:'-',consDiff:0},
    {category:'Davines',item:'Hair Mask',actualStock:5,adjustStock:5,stockDiff:0,stockValue:18000,actualCons:0,adjustCons:0,unit:'gm',consDiff:0},
    {category:'Disposables',item:'Large Gloves',actualStock:0,adjustStock:0,stockDiff:0,stockValue:0,actualCons:0,adjustCons:0,unit:'-',consDiff:0},
    {category:'Kinessence',item:'Mask',actualStock:5,adjustStock:5,stockDiff:0,stockValue:9000,actualCons:0,adjustCons:0,unit:'gm',consDiff:0},
    {category:'Davines',item:'Natural Teach Enrgizing Shampoo',actualStock:4,adjustStock:4,stockDiff:0,stockValue:11200,actualCons:0,adjustCons:0,unit:'ml',consDiff:0}
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] shadow-sm">
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-end shrink-0">
        <div className="space-y-1">
          <label className="text-sm text-slate-600 font-medium">Item:</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search By Name" className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full sm:w-48" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-600 font-medium">Category:</label>
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full sm:w-40 bg-white">
            <option>All</option>
            <option>Kinessence</option>
            <option>Disposables</option>
            <option>Wella</option>
            <option>Davines</option>
          </select>
        </div>
        <div className="flex gap-2 ml-auto w-full sm:w-auto">
          <button className="flex-1 sm:flex-none items-center justify-center flex gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Import
          </button>
          <button className="flex-1 sm:flex-none items-center justify-center flex gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Upload className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
          <thead className="bg-slate-100 text-xs font-bold text-slate-500 uppercase sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="py-3 px-4">Category Name</th>
              <th className="py-3 px-4">Item Name</th>
              <th className="py-3 px-4 text-center">Actual Stock</th>
              <th className="py-3 px-4 text-center">Adjust Stock</th>
              <th className="py-3 px-4 text-center">Stock Diff</th>
              <th className="py-3 px-4 text-right">Stock Value</th>
              <th className="py-3 px-4 text-center">Actual Cons.</th>
              <th className="py-3 px-4 text-center">Adjust Cons.</th>
              <th className="py-3 px-4 text-center">Unit</th>
              <th className="py-3 px-4 text-center">Cons. Diff</th>
              <th className="py-3 px-4">Remark*</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {mockData.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="py-2 px-4 text-slate-600">{row.category}</td>
                <td className="py-2 px-4 font-medium text-slate-800">{row.item}</td>
                <td className="py-2 px-4 text-center text-slate-600">{row.actualStock}</td>
                <td className="py-2 px-4 text-center">
                  <input type="number" defaultValue={row.adjustStock} className="w-16 px-2 py-1.5 text-center border border-slate-300 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </td>
                <td className="py-2 px-4 text-center text-slate-600">{row.stockDiff}</td>
                <td className="py-2 px-4 text-right font-medium text-slate-800">₹{row.stockValue}</td>
                <td className="py-2 px-4 text-center text-slate-600">{row.actualCons}</td>
                <td className="py-2 px-4 text-center">
                  <input type="number" defaultValue={row.adjustCons} className="w-16 px-2 py-1.5 text-center border border-slate-300 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </td>
                <td className="py-2 px-4 text-center text-slate-600">{row.unit}</td>
                <td className="py-2 px-4 text-center text-slate-600">{row.consDiff}</td>
                <td className="py-2 px-4">
                  <input type="text" placeholder="Remark" className="w-32 px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </td>
                <td className="py-2 px-4 text-center">
                  <button className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-md hover:bg-indigo-50 transition-colors">
                    <Save className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0 rounded-b-xl">
        <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors bg-white">
          Clear All
        </button>
        <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
          Update All
        </button>
      </div>
    </div>
  );
};

const VendorManagementTab = () => {
  const [vendors, setVendors] = useState(() => getMasterVendors());
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [searchFirm, setSearchFirm] = useState('');
  const [notification, setNotification] = useState('');
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  const emptyVendorForm = {
    vendorName: '',
    firmName: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    gstNumber: '',
    address: '',
    area: '',
    landmark: '',
    city: '',
    pincode: '',
    active: true,
    items: []
  };

  const [vendorForm, setVendorForm] = useState(emptyVendorForm);

  useEffect(() => {
    const handleUpdate = () => {
      setVendors(getMasterVendors());
    };
    window.addEventListener('vendorsUpdated', handleUpdate);
    return () => window.removeEventListener('vendorsUpdated', handleUpdate);
  }, []);

  const allProducts = getMasterProducts();

  const handleSelectVendor = (v) => {
    setSelectedVendorId(v.id);
    setVendorForm({
      vendorName: v.vendorName || '',
      firmName: v.firmName || '',
      mobile: v.mobile || '',
      alternateMobile: v.alternateMobile || '',
      email: v.email || '',
      gstNumber: v.gstNumber || '',
      address: v.address || '',
      area: v.area || '',
      landmark: v.landmark || '',
      city: v.city || '',
      pincode: v.pincode || '',
      active: v.active !== undefined ? v.active : true,
      items: v.items || []
    });
  };

  const handleCreateNew = () => {
    setSelectedVendorId(null);
    setVendorForm(emptyVendorForm);
  };

  const handleCancel = () => {
    if (selectedVendorId) {
      const v = vendors.find(item => item.id === selectedVendorId);
      if (v) handleSelectVendor(v);
      else handleCreateNew();
    } else {
      handleCreateNew();
    }
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!vendorForm.vendorName.trim()) {
      alert('Please enter Vendor Name');
      return;
    }
    if (!vendorForm.firmName.trim()) {
      alert('Please enter Firm Name');
      return;
    }
    if (!vendorForm.mobile.trim()) {
      alert('Please enter Mobile Number');
      return;
    }
    if (!vendorForm.address.trim()) {
      alert('Please enter Address');
      return;
    }
    if (!vendorForm.city.trim()) {
      alert('Please enter City');
      return;
    }

    if (selectedVendorId) {
      // Update existing vendor
      const updated = vendors.map(v => v.id === selectedVendorId ? { ...vendorForm, id: selectedVendorId } : v);
      setVendors(updated);
      saveMasterVendors(updated);
      setNotification(`Vendor "${vendorForm.firmName}" updated successfully!`);
    } else {
      // Create new vendor
      const newVendor = {
        ...vendorForm,
        id: 'v_' + Date.now()
      };
      const updated = [newVendor, ...vendors];
      setVendors(updated);
      saveMasterVendors(updated);
      setSelectedVendorId(newVendor.id);
      setNotification(`Vendor "${newVendor.firmName}" created successfully!`);
    }

    setTimeout(() => setNotification(''), 3500);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      const updated = vendors.filter(v => v.id !== id);
      setVendors(updated);
      saveMasterVendors(updated);
      handleCreateNew();
      setNotification('Vendor deleted successfully.');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const isItemChecked = (prodId) => {
    return (vendorForm.items || []).some(item => (typeof item === 'object' ? item.id === prodId : item === prodId));
  };

  const getItemAmount = (prodId, defaultPrice) => {
    const found = (vendorForm.items || []).find(item => (typeof item === 'object' ? item.id === prodId : item === prodId));
    if (found && typeof found === 'object' && found.amount !== undefined && found.amount !== '') {
      return found.amount;
    }
    return defaultPrice || 0;
  };

  const handleToggleItem = (prod) => {
    setVendorForm(prev => {
      const current = prev.items || [];
      const exists = current.some(item => (typeof item === 'object' ? item.id === prod.id : item === prod.id));
      if (exists) {
        return {
          ...prev,
          items: current.filter(item => (typeof item === 'object' ? item.id !== prod.id : item !== prod.id))
        };
      } else {
        const defaultAmt = prod.salePrice || prod.price || 0;
        return {
          ...prev,
          items: [...current, { id: prod.id, amount: defaultAmt, name: prod.name }]
        };
      }
    });
  };

  const handleItemAmountChange = (prod, newAmount) => {
    setVendorForm(prev => {
      const current = prev.items || [];
      const exists = current.some(item => (typeof item === 'object' ? item.id === prod.id : item === prod.id));
      if (exists) {
        return {
          ...prev,
          items: current.map(item => {
            const itemId = typeof item === 'object' ? item.id : item;
            if (itemId === prod.id) {
              return { id: prod.id, amount: newAmount, name: prod.name };
            }
            return item;
          })
        };
      } else {
        return {
          ...prev,
          items: [...current, { id: prod.id, amount: newAmount, name: prod.name }]
        };
      }
    });
  };


  // Filter vendors by firm name or vendor name
  const filteredVendors = vendors.filter(v => {
    const q = searchFirm.toLowerCase().trim();
    if (!q) return true;
    return (
      (v.firmName && v.firmName.toLowerCase().includes(q)) ||
      (v.vendorName && v.vendorName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          {notification}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row min-h-[calc(100vh-8rem)] shadow-sm overflow-hidden">
        {/* ======================================================== */}
        {/* LEFT PANEL: Search & Vendor List                         */}
        {/* ======================================================== */}
        <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0 bg-white justify-between">
          <div>
            {/* Search Box */}
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search By Firm"
                  value={searchFirm}
                  onChange={(e) => setSearchFirm(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Vendors List */}
            <div className="overflow-y-auto max-h-[calc(100vh-280px)] p-2 space-y-1">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((v) => {
                  const isSelected = selectedVendorId === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVendor(v)}
                      className={`px-4 py-3 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-500 shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold truncate text-slate-800">{v.firmName || v.vendorName}</div>
                        <div className="text-xs text-slate-400 truncate">{v.vendorName} • {v.city || 'Vendor'}</div>
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          v.active ? 'bg-sky-500' : 'bg-slate-300'
                        }`}
                        title={v.active ? 'Active' : 'Inactive'}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 italic text-sm">
                  Search not found
                </div>
              )}
            </div>
          </div>

          {/* Create Button at Bottom of Left Panel */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleCreateNew}
              className="w-full bg-sky-500 hover:bg-sky-600 active:scale-98 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              Create
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: Create / Update Vendor Form                 */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col justify-between p-6 bg-white overflow-y-auto">
          <div className="space-y-6">
            {/* Top Bar: Title & Active Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-sky-500 font-bold text-base border-b-2 border-sky-500 pb-3 -mb-3.5 inline-block">
                {selectedVendorId ? 'Update Vendor' : 'Create Vendor'}
              </span>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 select-none">
                <div
                  onClick={() => setVendorForm(p => ({ ...p, active: !p.active }))}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                    vendorForm.active ? 'bg-sky-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      vendorForm.active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700">Active</span>
              </div>
            </div>

            {/* Form Fields Grid strictly matching reference */}
            <form onSubmit={handleSave} className="space-y-4 pt-1">
              {/* Row 1: Vendor Name* & Firm Name* */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Vendor Name<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vendorForm.vendorName}
                    onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                    placeholder="Enter Vendor Name"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Firm Name<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vendorForm.firmName}
                    onChange={(e) => setVendorForm({ ...vendorForm, firmName: e.target.value })}
                    placeholder="Enter Firm Name"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Mobile* & Alternate Mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Mobile<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={vendorForm.mobile}
                    onChange={(e) => setVendorForm({ ...vendorForm, mobile: e.target.value })}
                    placeholder="Enter Mobile Number"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Alternate Mobile
                  </label>
                  <input
                    type="tel"
                    value={vendorForm.alternateMobile}
                    onChange={(e) => setVendorForm({ ...vendorForm, alternateMobile: e.target.value })}
                    placeholder="Enter Alternate Mobile"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Email & GST Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                    placeholder="Enter Email"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={vendorForm.gstNumber}
                    onChange={(e) => setVendorForm({ ...vendorForm, gstNumber: e.target.value })}
                    placeholder="Enter GST Number"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono uppercase transition-all"
                  />
                </div>
              </div>

              {/* Row 4: Address* & Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Address<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                    placeholder="Enter Address"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Area
                  </label>
                  <input
                    type="text"
                    value={vendorForm.area}
                    onChange={(e) => setVendorForm({ ...vendorForm, area: e.target.value })}
                    placeholder="Enter Area"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Row 5: Landmark, City*, Pincode (3 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={vendorForm.landmark}
                    onChange={(e) => setVendorForm({ ...vendorForm, landmark: e.target.value })}
                    placeholder="Enter Landmark"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    City<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vendorForm.city}
                    onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })}
                    placeholder="Enter City"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={vendorForm.pincode}
                    onChange={(e) => setVendorForm({ ...vendorForm, pincode: e.target.value })}
                    placeholder="Enter Pincode"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-100">
            <div>
              {selectedVendorId && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedVendorId)}
                  className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Delete Vendor
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowItemsModal(true)}
                className="px-5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Package size={15} className="text-slate-500" />
                <span>Vendor Items ({vendorForm.items ? vendorForm.items.length : 0})</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-8 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                {selectedVendorId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: VENDOR ITEMS ASSIGNMENT                           */}
      {/* ======================================================== */}
      {showItemsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowItemsModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Vendor Items
                </h3>
                <p className="text-xs text-slate-500">
                  Assign products & consumables supplied by {vendorForm.firmName || vendorForm.vendorName || 'this vendor'}
                </p>
              </div>
              <button onClick={() => setShowItemsModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>
            </div>

            {/* Search inside modal */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* List of Products */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {allProducts
                .filter(p => {
                  if (!itemSearch) return true;
                  return (
                    p.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
                    (p.category && p.category.toLowerCase().includes(itemSearch.toLowerCase()))
                  );
                })
                .map(prod => {
                  const isChecked = isItemChecked(prod.id);
                  const defaultAmt = prod.salePrice || prod.price || 0;
                  const currentAmt = getItemAmount(prod.id, defaultAmt);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleToggleItem(prod)}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                        isChecked ? 'bg-sky-50/60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by container click
                          className="w-4 h-4 rounded text-sky-500 focus:ring-sky-400 accent-sky-500 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-800 truncate">{prod.name}</div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {prod.header || prod.category} • SKU: {prod.sku || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Manually enter amount option */}
                      <div
                        className="flex items-center gap-1.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-xs font-semibold text-slate-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={currentAmt}
                          onChange={(e) => handleItemAmountChange(prod, e.target.value)}
                          placeholder="Amount"
                          title="Enter purchase / vendor item amount"
                          className="w-24 px-2.5 py-1 text-right text-xs font-semibold text-slate-800 border border-slate-300 focus:border-sky-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                {(vendorForm.items || []).length} items selected
              </span>
              <button
                type="button"
                onClick={() => setShowItemsModal(false)}
                className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                Add Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const ConsumableCheckoutTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState([
    { id: 1, category: 'Wella', name: 'Boost Bounce', currentStock: 6, checkoutQty: '' },
    { id: 2, category: 'Kinessence', name: 'Mask', currentStock: 5, checkoutQty: '' },
    { id: 3, category: 'Kinessence', name: 'Nourishing Shampoo', currentStock: 4, checkoutQty: '' },
    { id: 4, category: 'Wella', name: 'Oil Reflections\nReveal Shampoo\n- 90 ml', currentStock: 6, checkoutQty: '' },
    { id: 5, category: 'Wella', name: 'Oil Reflections\nReveal Shampoo\n- 180 ml', currentStock: 8, checkoutQty: '' },
  ]);

  const handleQtyChange = (id, val) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, checkoutQty: val } : item));
  };

  const handleClearAll = () => {
    setItems(prev => prev.map(item => ({ ...item, checkoutQty: '' })));
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">Item :</span>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search By Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="All">All</option>
            <option value="Wella">Wella</option>
            <option value="Kinessence">Kinessence</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead style={{ backgroundColor: '#E0F2FE' }}>
              <tr>
                <th className="py-3 px-4 text-xs font-semibold text-slate-700">Category Name</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-700">Item Name</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-700 text-center">Current Stock</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-700 text-center">Checkout Qty</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-700 text-center">Closing Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const qtyNum = parseInt(item.checkoutQty) || 0;
                const closingStock = Math.max(0, item.currentStock - qtyNum);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 text-sm text-slate-700 font-medium">{item.category}</td>
                    <td className="py-3.5 px-4 text-sm text-slate-800 font-medium whitespace-pre-line">{item.name}</td>
                    <td className="py-3.5 px-4 text-sm text-slate-600 text-center">{item.currentStock}</td>
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max={item.currentStock}
                        value={item.checkoutQty}
                        onChange={(e) => handleQtyChange(item.id, e.target.value)}
                        className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:border-indigo-600"
                        placeholder=""
                      />
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-600 text-center">{closingStock}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-end items-center gap-3 pt-2">
        <button
          onClick={handleClearAll}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
        >
          Clear All
        </button>
        <button
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const tabs = [
    'Dashboard', 
    'Purchase Order', 
    'Approval', 
    'Stock Reconciliation', 
    'Vendor Management', 
    'Consumable Checkout'
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard': return <DashboardTab />;
      case 'Purchase Order': return <PurchaseOrderTab />;
      case 'Approval': return <ApprovalTab />;
      case 'Stock Reconciliation': return <StockReconciliationTab />;
      case 'Vendor Management': return <VendorManagementTab />;
      case 'Consumable Checkout': return <ConsumableCheckoutTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', minHeight: 'calc(100vh - 64px)', background: '#F8FAFC' }}>
      {/* Left Sidebar — Vertical list matching original screenshot */}
      <div style={{ 
        width: '200px', 
        minWidth: '200px', 
        backgroundColor: '#555E6B', 
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 8px',
        gap: '4px',
        flexShrink: 0
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                fontSize: '13.5px',
                fontWeight: isActive ? '600' : '400',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
                color: '#FFFFFF',
                lineHeight: '1.3'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', minWidth: 0 }}>
        {renderContent()}
      </div>
    </div>
  );
}


