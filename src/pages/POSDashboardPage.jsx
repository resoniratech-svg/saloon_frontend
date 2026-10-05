import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, User, Eye, Check, X, Clock, CheckCircle2, AlertCircle, 
  Phone, Printer, Download, MessageCircle, Ticket, Trash2, LayoutGrid, List 
} from 'lucide-react';
import { getOrders, updateOrderStatus, deleteOrderInStore, syncOrdersFromBackend } from '../utils/orderStorage';
import { getActiveTenant } from '../utils/saasStorage';
import POSUpdateOrderModal from '../components/pos/POSUpdateOrderModal';

// ==========================================
// BILL INVOICE MODAL (Matches Screenshot 3)
// ==========================================
const POSDashboardInvoiceModal = ({ isOpen, onClose, order }) => {
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

  const isServiceItem = (i) => {
    if (!i) return false;
    return !isDisposableItem(i) && !isProductItem(i);
  };

  const serviceItems = allItems.filter(isServiceItem);
  const productItems = allItems.filter(isProductItem);
  const disposableItems = allItems.filter(isDisposableItem);

  const servicesSubTotal = serviceItems.reduce((sum, it) => sum + (it.price * (it.qty || 1) - (parseFloat(it.discAmount) || 0)), 0);
  const productsSubTotal = productItems.reduce((sum, it) => sum + (it.price * (it.qty || 1) - (parseFloat(it.discAmount) || 0)), 0);
  const disposablesSubTotal = disposableItems.reduce((sum, it) => sum + (it.price * (it.qty || 1) - (parseFloat(it.discAmount) || 0)), 0);

  const hasServiceDiscount = serviceItems.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);
  const hasProductDiscount = productItems.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);
  const hasDisposableDiscount = disposableItems.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);
  const totalDiscount = allItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0);

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
${guestGstin ? `GSTIN : ${guestGstin}\n` : ''}Date : ${order.dateDisplay || order.date || '18-Sep-2026'}
------------------------------------------------`;

    if (serviceItems.length > 0) {
      textData += `
BOOKED SERVICES:
${serviceItems.map((it, idx) => {
  const discPart = hasServiceDiscount ? ` | Dis: ₹${it.discAmount || 0}` : '';
  return `${idx + 1} | ${it.name} | Rate: ₹${it.price}${discPart} | Qty: ${it.qty || 1} | Amt: ₹${(it.price * (it.qty || 1)) - (parseFloat(it.discAmount) || 0)}`;
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
Status: ${order.status}
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
              </div>
              <p className="text-[11px] font-medium text-slate-500 tracking-wide mt-0.5">
                {tenant?.tagline || 'Excellence in Beauty & Care'}
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
              <p><span className="font-semibold text-slate-800">Date :</span> {order.dateDisplay || order.date || '18-Sep-2026'}</p>
            </div>
          </div>

          {/* SECTION 1: Service Bill */}
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
                      <th className="py-2 px-3 text-center">Qty.</th>
                      <th className="py-2 px-3 text-right">Amt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{item.price}</td>
                        {hasServiceDiscount && (
                          <td className="py-2.5 px-3 text-right text-slate-500">{item.discAmount || 0}</td>
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

          {/* SECTION 2: Sold Products */}
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
                        <td className="py-2.5 px-3 text-right font-mono">₹{item.price}</td>
                        {hasProductDiscount && (
                          <td className="py-2.5 px-3 text-right text-slate-500">{item.discAmount || 0}</td>
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

          {/* SECTION 3: Disposables & Single-Use Supplies */}
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
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                            {item.selectedUnit || item.unit || 'Pack'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{item.price}</td>
                        {hasDisposableDiscount && (
                          <td className="py-2.5 px-3 text-right text-slate-500">{item.discAmount || 0}</td>
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

          {/* SubTotal & Grand Total Row */}
          <div className="flex flex-wrap items-center justify-end gap-6 pt-4 border-t border-slate-200 text-xs font-semibold text-slate-800">
            {(productItems.length > 0 || disposableItems.length > 0) && (
              <>
                <div className="text-slate-600">
                  <span>Services: </span>
                  <span className="font-mono ml-1 font-bold text-slate-800">₹{servicesSubTotal}</span>
                </div>
                {productItems.length > 0 && (
                  <div className="text-slate-600">
                    <span>Products: </span>
                    <span className="font-mono ml-1 font-bold text-slate-800">₹{productsSubTotal}</span>
                  </div>
                )}
                {disposableItems.length > 0 && (
                  <div className="text-amber-700">
                    <span>Disposables: </span>
                    <span className="font-mono ml-1 font-bold text-amber-800">₹{disposablesSubTotal}</span>
                  </div>
                )}
              </>
            )}
            {totalDiscount > 0 && (
              <div className="text-emerald-700">
                <span>Discount: </span>
                <span className="font-mono ml-1 font-bold">-₹{totalDiscount}</span>
              </div>
            )}
            <div>
              <span>SubTotal: </span>
              <span className="font-mono ml-1 font-bold">₹ {order.subTotal || order.grandTotal}</span>
            </div>
            <div>
              <span className="text-slate-900 font-bold">Grand Total: </span>
              <span className="font-mono ml-1 font-bold text-indigo-700 text-sm">₹ {order.grandTotal}</span>
            </div>
          </div>

          {whatsAppSent && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-xs flex items-center">
              <CheckCircle2 size={16} className="text-emerald-600 mr-2 shrink-0" />
              <span>Bill & digital receipt sent to <strong>{order.guest?.mobile}</strong> via WhatsApp!</span>
            </div>
          )}
        </div>

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

const POSDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('Total');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' (matches screenshot 1) or 'table'
  const [orders, setOrders] = useState([]);
  const todayIso = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);
  const [isDateFiltered, setIsDateFiltered] = useState(false);
  
  // Modals state
  const [selectedOrderForBill, setSelectedOrderForBill] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load orders from persistent order storage
  const loadOrders = (enableDateFilter = false) => {
    const list = getOrders();
    setOrders(list);
    if (enableDateFilter) {
      setIsDateFiltered(true);
    }
  };

  useEffect(() => {
    loadOrders();
    syncOrdersFromBackend().then(() => loadOrders()).catch(() => {});
    const handleSync = () => loadOrders();
    window.addEventListener('ordersUpdated', handleSync);
    window.addEventListener('tenantChanged', handleSync);
    return () => {
      window.removeEventListener('ordersUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
    };
  }, []);

  // Filter by date range if user clicked Show Orders
  const visibleOrders = orders.filter(order => {
    if (!isDateFiltered) return true;
    const oDate = order.date;
    if (startDate && oDate && oDate < startDate) return false;
    if (endDate && oDate && oDate > endDate) return false;
    return true;
  });

  // Compute status counts dynamically
  const newCount = visibleOrders.filter(o => o.status === 'New').length;
  const acceptedCount = visibleOrders.filter(o => o.status === 'Accepted').length;
  const rejectedCount = visibleOrders.filter(o => o.status === 'Rejected').length;
  const completedCount = visibleOrders.filter(o => o.status === 'Completed').length;
  const totalCount = visibleOrders.length;

  const tabs = [
    { id: 'New', count: newCount },
    { id: 'Accepted', count: acceptedCount },
    { id: 'Rejected', count: rejectedCount },
    { id: 'Completed', count: completedCount },
    { id: 'Total', count: totalCount }
  ];

  // Filter orders by active tab
  const filteredOrders = visibleOrders.filter(order => {
    if (activeTab === 'Total') return true;
    return order.status === activeTab;
  });

  const handleStatusChange = (orderId, newStatus) => {
    const updated = updateOrderStatus(orderId, newStatus);
    setOrders(updated);
  };

  const handleViewBill = (order) => {
    setSelectedOrderForBill(order);
    setShowBillModal(true);
  };

  // Open Edit modal (Matches Screenshot 2)
  const handleEditOrder = (order) => {
    setSelectedOrderForEdit(order);
    setShowEditModal(true);
  };

  // Delete / Cancel order (red trash icon in Screenshot 1)
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to permanently delete this order from the database?')) {
      const updated = await deleteOrderInStore(orderId);
      setOrders(updated);
      await loadOrders();
    }
  };

  const handleOrderUpdated = (updatedOrder) => {
    loadOrders();
    setSelectedOrderForEdit(updatedOrder);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 space-y-4 min-h-screen">
      {/* Top filter bar (Exact replica of Screenshot 1) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-2">
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-600 font-mono" 
          />
          <span className="text-slate-500 font-bold">-</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-indigo-600 font-mono" 
          />
          <button 
            onClick={() => loadOrders(true)}
            className="bg-sky-500 hover:bg-sky-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            Show Orders
          </button>
          {isDateFiltered && (
            <button
              onClick={() => setIsDateFiltered(false)}
              className="text-xs text-sky-600 hover:text-sky-800 underline font-medium cursor-pointer ml-1"
            >
              Show All
            </button>
          )}
        </div>

        {/* Status filter pills & View Switcher */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-sky-500 text-white border-sky-500 shadow-xs font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.id}
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activeTab === tab.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Switcher: Cards vs Table */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-sky-600 shadow-2xs font-semibold' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Card View (Screenshot 1)"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-sky-600 shadow-2xs font-semibold' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Content Area */}
      <div className="flex-1 bg-white rounded-xl shadow-xs border border-slate-200 p-4 overflow-hidden flex flex-col min-h-[500px]">
        {filteredOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
              <AlertCircle size={32} />
            </div>
            <p className="text-slate-500 text-lg font-medium">
              {activeTab === 'Total' ? 'Total Orders Not Available' : `No ${activeTab} Orders Available`}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Orders created from the POS Quick Sale page will appear here filtered by date and status.
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* ========================================================== */
          /* CARDS VIEW (Exact replica of Screenshot 1)                 */
          /* ========================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => handleEditOrder(order)}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row: Order ID & Actions (Ticket & Trash) */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-base">
                      {order.invoiceId || order.id}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditOrder(order);
                        }}
                        className="text-sky-400 hover:text-sky-600 transition-colors p-1 cursor-pointer rounded hover:bg-sky-50"
                        title="Edit Order (Screenshot 2)"
                      >
                        <Ticket size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order.id);
                        }}
                        className="text-rose-500 hover:text-rose-700 transition-colors p-1 cursor-pointer rounded hover:bg-rose-50"
                        title="Delete Order"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="mt-2">
                    <div className="font-bold text-slate-800 text-sm">
                      {order.guest?.name || 'Walk-in'}
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {order.guest?.mobile || '+91 987554321'}
                    </div>
                  </div>

                  {/* Services / Items summary */}
                  <div className="mt-3.5 space-y-1 text-xs text-slate-600 border-t border-slate-50 pt-2.5">
                    {(order.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="truncate max-w-[180px] font-medium">{it.name}</span>
                        <span className="font-mono text-slate-700 font-semibold ml-2">{it.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer: Date, Time, Total, Type */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="truncate mr-2">
                    <span>{order.dateDisplay || order.date}, {order.time || '12:34 PM'}, Total : </span>
                    <span className="font-bold text-slate-900 font-mono">₹ {order.grandTotal}</span>
                  </div>
                  <span className="text-slate-600 font-medium shrink-0">
                    {order.orderType || 'Pickup'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ========================================================== */
          /* TABLE VIEW                                                 */
          /* ========================================================== */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Services / Items</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map(order => (
                  <tr 
                    key={order.id} 
                    onClick={() => handleEditOrder(order)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    {/* Order ID */}
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">
                      #{order.invoiceId || order.id}
                    </td>

                    {/* Date & Time */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{order.dateDisplay || order.date}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {order.time || '12:00 PM'}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <User size={13} className="text-sky-600" />
                        {order.guest?.name || 'Walk-in'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {order.guest?.mobile || 'N/A'}
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(order.items || []).map((it, idx) => (
                          <span 
                            key={idx} 
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200"
                          >
                            {it.name} <strong className="text-sky-600">x{it.qty}</strong>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{order.grandTotal}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {order.paymentMethod || (order.payments && order.payments[0]?.method) || 'Cash'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        order.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="flex items-center px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-sky-200 shadow-2xs"
                          title="Edit Order"
                        >
                          <Ticket size={13} className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleViewBill(order)}
                          className="flex items-center px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="View Bill"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UPDATE BILL MODAL (Exact match to Screenshot 2) */}
      <POSUpdateOrderModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        order={selectedOrderForEdit}
        onOrderUpdated={handleOrderUpdated}
        onViewBill={(orderData) => {
          setSelectedOrderForBill(orderData);
          setShowBillModal(true);
        }}
      />

      {/* BILL INVOICE MODAL */}
      <POSDashboardInvoiceModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        order={selectedOrderForBill}
      />
    </div>
  );
};

export default POSDashboardPage;
