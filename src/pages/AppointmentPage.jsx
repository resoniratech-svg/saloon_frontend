import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Clock, User, Scissors, Check, X,
  ChevronDown, Phone, Search, List, LayoutGrid, Trash2, CheckCircle2, XCircle,
  AlertCircle, CreditCard, CalendarClock, Play, RotateCcw, Pencil, UserCheck,
  FileText, Printer, Download, MessageCircle, Users, Banknote, Smartphone,
  Landmark, Wallet
} from 'lucide-react';
import { timeSlots } from '../data/mockData.js';
import { getMasterStaff, initialStaffMembers } from '../utils/staffStorage.js';
import { getCustomers } from '../utils/customerStorage.js';
import { getMasterServices } from '../utils/serviceStorage.js';
import { getMasterProducts } from '../utils/productStorage.js';
import { getOrders, updateOrder, updateOrderStatus } from '../utils/orderStorage.js';
import { getAppointments, saveAppointment, updateAppointment, deleteAppointment } from '../utils/appointmentStorage.js';
import { getActiveTenant } from '../utils/saasStorage.js';

// ==========================================
// APPOINTMENT INVOICE BILL MODAL
// ==========================================
const AppointmentInvoiceModal = ({ isOpen, onClose, appointment }) => {
  const [whatsAppSent, setWhatsAppSent] = useState(false);

  if (!isOpen || !appointment) return null;

  const allOrders = getOrders();
  const linkedOrder = (appointment.orderId || appointment.invoiceId)
    ? allOrders.find(o => String(o.id) === String(appointment.orderId) || String(o.invoiceId) === String(appointment.invoiceId))
    : allOrders.find(o => 
        (o.appointmentId && String(o.appointmentId) === String(appointment.id)) ||
        (o.guest?.name && appointment.guest && o.guest.name.trim().toLowerCase() === appointment.guest.trim().toLowerCase() && (
          (o.guest?.mobile && appointment.mobile && o.guest.mobile.replace(/\D/g, '') === appointment.mobile.replace(/\D/g, '')) ||
          (o.dateDisplay === appointment.date || o.date === appointment.date)
        ))
      );

  // Extract items from appointment or linked POS order
  const rawItems = (appointment.items && appointment.items.length > 0)
    ? appointment.items
    : (linkedOrder?.items && linkedOrder.items.length > 0)
      ? linkedOrder.items
      : [];

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

  let serviceItems = (appointment.services && appointment.services.length > 0)
    ? appointment.services.filter(isServiceItem)
    : [];
  if (serviceItems.length === 0 && rawItems.length > 0) {
    serviceItems = rawItems.filter(isServiceItem);
  }

  let productItems = (appointment.products && appointment.products.length > 0)
    ? appointment.products.filter(isProductItem)
    : [];
  if (productItems.length === 0 && rawItems.length > 0) {
    productItems = rawItems.filter(isProductItem);
  }

  let disposableItems = (appointment.disposables && appointment.disposables.length > 0)
    ? appointment.disposables.filter(isDisposableItem)
    : [];
  if (disposableItems.length === 0 && rawItems.length > 0) {
    disposableItems = rawItems.filter(isDisposableItem);
  }

  const originalPrice = Number(appointment.originalPrice || appointment.price) || 200;
  const finalPrice = Number(appointment.price) || originalPrice;
  const discountAmount = parseFloat(appointment.discAmount) || Math.max(0, originalPrice - finalPrice);

  const finalServices = serviceItems.length > 0
    ? serviceItems
    : (rawItems.length === 0 ? [{
        name: appointment.service || 'Salon Service',
        staff: appointment.staff || 'Respark Trial',
        price: originalPrice,
        discAmount: discountAmount,
        qty: 1,
        total: finalPrice
      }] : []);

  const servicesSubTotal = finalServices.reduce((sum, it) => sum + ((it.price * (it.qty || 1)) - (parseFloat(it.discAmount) || 0)), 0);
  const productsSubTotal = productItems.reduce((sum, it) => sum + ((it.price * (it.qty || 1)) - (parseFloat(it.discAmount) || 0)), 0);
  const disposablesSubTotal = disposableItems.reduce((sum, it) => sum + ((it.price * (it.qty || 1)) - (parseFloat(it.discAmount) || 0)), 0);
  const calculatedGrandTotal = servicesSubTotal + productsSubTotal + disposablesSubTotal;
  const grandTotal = calculatedGrandTotal > 0 ? calculatedGrandTotal : (Number(appointment.grandTotal) || finalPrice);
  const invoiceId = appointment.invoiceId || appointment.orderId || linkedOrder?.invoiceId || `INV-${appointment.id || '101'}`;
  const isPaid = appointment.paymentStatus === 'Paid' || linkedOrder?.paymentStatus === 'Paid';
  const paymentMethod = appointment.paymentMethod || linkedOrder?.paymentMethod || 'Cash';

  const hasServiceDiscount = finalServices.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);
  const hasProductDiscount = productItems.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);
  const hasDisposableDiscount = disposableItems.some(it => (parseFloat(it.discAmount) || parseFloat(it.discount) || 0) > 0);
  const totalDiscount = finalServices.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0) +
                        productItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0) +
                        disposableItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0);

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
  const guestGstin = appointment.gstNumber || appointment.guestGstin || linkedOrder?.guest?.gstNumber || '';

  const handlePrint = () => {
    window.print();
  };

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
Bill To : ${appointment.guest || 'Customer'}
Phone : ${appointment.mobile || '+91 9876543210'}
Invoice ID : ${invoiceId}
${guestGstin ? `GSTIN : ${guestGstin}\n` : ''}Date : ${appointment.date || '18-Sep-2026'}
Time Slot : ${appointment.timeSlot || '11:00 AM'}
Payment Status : ${isPaid ? `Paid via ${paymentMethod}` : 'Due on Visit (Unpaid)'}
------------------------------------------------`;

    if (finalServices.length > 0) {
      textData += `
BOOKED SERVICES:
${finalServices.map((it, idx) => {
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
SubTotal: ₹ ${grandTotal}
Grand Total: ₹ ${grandTotal}
================================================
`;
    const element = document.createElement("a");
    const file = new Blob([textData], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice-${appointment.guest?.replace(/\s+/g, '_') || 'Customer'}-${appointment.id || 'order'}.txt`;
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
          <div className="flex items-center gap-2">
            <FileText className="text-indigo-600" size={18} />
            <h2 className="text-base font-bold text-slate-800">Order Invoice Bill</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Invoice Content */}
        <div className="p-8 text-xs text-slate-700 font-sans" id="printable-appointment-invoice">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            {/* Logo */}
            <div>
              <div className="flex items-center space-x-2">
                {tenant?.logoUrl ? (
                  <img
                    src={tenant.logoUrl}
                    alt={companyName}
                    className="h-10 max-w-[160px] object-contain mb-1"
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
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
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
              <p><span className="font-semibold text-slate-800">Bill To :</span> {appointment.guest}</p>
              <p><span className="font-semibold text-slate-800">Phone :</span> {appointment.mobile || '+91 9876543210'}</p>
              <p><span className="font-semibold text-slate-800">Invoice ID :</span> {invoiceId}</p>
              {guestGstin && <p><span className="font-semibold text-slate-800">GSTIN :</span> {guestGstin}</p>}
            </div>
            <div className="text-left sm:text-right space-y-1">
              <p><span className="font-semibold text-slate-800">Date :</span> {appointment.date || '18-Sep-2026'}</p>
              <p><span className="font-semibold text-slate-800">Time Slot :</span> {appointment.timeSlot || '11:00 AM'}</p>
              <p>
                <span className="font-semibold text-slate-800">Payment Status : </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] ${
                  isPaid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {isPaid
                    ? `Paid (${paymentMethod})`
                    : 'Due on Visit (Unpaid)'}
                </span>
              </p>
            </div>
          </div>

          {/* SECTION 1: Service Bill */}
          {finalServices.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Service Bill ({finalServices.length})
                </h3>
                {(productItems.length > 0 || disposableItems.length > 0) && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    Services Subtotal: <strong className="font-mono text-slate-800">₹{servicesSubTotal}</strong>
                  </span>
                )}
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-indigo-50/50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Sr.</th>
                      <th className="py-2.5 px-3">Item / Service</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      {hasServiceDiscount && <th className="py-2.5 px-3 text-right">Dis.</th>}
                      <th className="py-2.5 px-3 text-center">Qty.</th>
                      <th className="py-2.5 px-3 text-right">Amt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {finalServices.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{item.price}</td>
                        {hasServiceDiscount && (
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{item.discAmount || 0}</td>
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

          {/* SECTION 2: Retail Products Sold (if any products were sold) */}
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
                  <thead className="bg-emerald-50/60 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Sr.</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      {hasProductDiscount && <th className="py-2.5 px-3 text-right">Dis.</th>}
                      <th className="py-2.5 px-3 text-center">Qty.</th>
                      <th className="py-2.5 px-3 text-right">Amt.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span>{item.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Product
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{item.price}</td>
                        {hasProductDiscount && (
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{item.discAmount || 0}</td>
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
                  <thead className="bg-amber-50/60 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Sr.</th>
                      <th className="py-2.5 px-3">Item Name</th>
                      <th className="py-2.5 px-2 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      {hasDisposableDiscount && <th className="py-2.5 px-3 text-right">Dis.</th>}
                      <th className="py-2.5 px-3 text-center">Qty.</th>
                      <th className="py-2.5 px-3 text-right">Amt.</th>
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
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">₹{item.discAmount || 0}</td>
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
                {finalServices.length > 0 && (
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
              <span className="font-mono ml-1 font-bold text-slate-800">₹ {grandTotal}</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-900 font-bold">Grand Total: </span>
              <span className="font-mono ml-1 font-bold text-indigo-700 text-base">₹ {grandTotal}</span>
            </div>
          </div>

          {whatsAppSent && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg text-xs flex items-center">
              <CheckCircle2 size={16} className="text-emerald-600 mr-2 shrink-0" />
              <span>Bill & receipt sent to <strong>{appointment.mobile}</strong> via WhatsApp!</span>
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

// Date helpers for interactive calendar picker
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const parseDateStr = (dateStr) => {
  if (!dateStr) return new Date(2026, 8, 18);
  const parts = String(dateStr).trim().split(/[-/ ]+/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
    }
    const d = parseInt(parts[0], 10);
    const mStr = parts[1].toLowerCase();
    const y = parseInt(parts[2], 10);
    const mIdx = SHORT_MONTHS.findIndex(m => m.toLowerCase() === mStr.slice(0, 3));
    if (mIdx !== -1 && !isNaN(d) && !isNaN(y)) {
      return new Date(y, mIdx, d);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(2026, 8, 18) : parsed;
};

const formatDateDDMMMYYYY = (dateObj) => {
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = SHORT_MONTHS[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateYYYYMMDD = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

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

const getDefaultUpcomingSlot = (dateIso, allSlots) => {
  const todayIso = formatDateYYYYMMDD(new Date());
  if (dateIso !== todayIso) {
    return allSlots[0] || '11:00 AM';
  }
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextSlot = allSlots.find(slot => parseSlotToMinutes(slot) >= currentMinutes);
  return nextSlot || allSlots[allSlots.length - 1] || '11:00 AM';
};

export default function AppointmentPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [masterStaff, setMasterStaff] = useState(() => getMasterStaff());
  const [masterServices, setMasterServices] = useState(() => getMasterServices());
  const [existingCustomers, setExistingCustomers] = useState(() => getCustomers());
  const [appointments, setAppointments] = useState(() => getAppointments());
  const [masterProducts, setMasterProducts] = useState(() => getMasterProducts());
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);
  const guestDropdownRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => {
      setMasterStaff(getMasterStaff());
      setMasterServices(getMasterServices());
      setMasterProducts(getMasterProducts());
      setExistingCustomers(getCustomers());
      setAppointments(getAppointments());
    };
    window.addEventListener('staffUpdated', handleUpdate);
    window.addEventListener('servicesUpdated', handleUpdate);
    window.addEventListener('productsUpdated', handleUpdate);
    window.addEventListener('customersUpdated', handleUpdate);
    window.addEventListener('appointmentsUpdated', handleUpdate);
    window.addEventListener('tenantChanged', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('staffUpdated', handleUpdate);
      window.removeEventListener('servicesUpdated', handleUpdate);
      window.removeEventListener('productsUpdated', handleUpdate);
      window.removeEventListener('customersUpdated', handleUpdate);
      window.removeEventListener('appointmentsUpdated', handleUpdate);
      window.removeEventListener('tenantChanged', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (guestDropdownRef.current && !guestDropdownRef.current.contains(e.target)) {
        setGuestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => formatDateDDMMMYYYY(new Date()));
  const [filterByDate, setFilterByDate] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Total');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGridStaff, setSelectedGridStaff] = useState('All');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Reschedule modal state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '18-Sep-2026',
    timeSlot: '11:00 AM',
    staff: 'Respark Trial'
  });
  const [rescheduleCalMonth, setRescheduleCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });

  // Change Staff modal state
  const [changeStaffModalOpen, setChangeStaffModalOpen] = useState(false);
  const [changeStaffTarget, setChangeStaffTarget] = useState(null);
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState('');

  // Collect Payment modal state
  const [collectPaymentModalOpen, setCollectPaymentModalOpen] = useState(false);
  const [collectPaymentTarget, setCollectPaymentTarget] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash');
  const [markCompletedAfterPayment, setMarkCompletedAfterPayment] = useState(true);

  // View Invoice modal state
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedInvoiceAppt, setSelectedInvoiceAppt] = useState(null);

  const handleViewInvoice = (appt) => {
    setSelectedInvoiceAppt(appt);
    setInvoiceModalOpen(true);
  };

  const getApptInvoiceNo = (appt) => {
    if (!appt) return '#INV';
    const formatInv = (val) => {
      if (!val) return '';
      const s = String(val).trim();
      return s.startsWith('#') ? s : `#${s}`;
    };
    if (appt.invoiceNo) return formatInv(appt.invoiceNo);
    if (appt.invoiceId) return formatInv(appt.invoiceId);
    if (appt.orderId) {
      const raw = String(appt.orderId).replace(/^ord_/, '');
      return formatInv(raw.length > 5 ? raw.slice(-4) : raw);
    }
    try {
      const allOrders = getOrders() || [];
      const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
      const apptPhone = cleanPhone(appt.mobile);
      const apptGuest = (appt.guest || '').trim().toLowerCase();

      const matched = allOrders.find(o => {
        if (appt.orderId && String(o.id) === String(appt.orderId)) return true;
        if (appt.invoiceId && String(o.invoiceId) === String(appt.invoiceId)) return true;
        if (o.appointmentId && String(o.appointmentId) === String(appt.id)) return true;
        const oPhone = cleanPhone(o.guest?.mobile || o.guest?.phone);
        const oName = (o.guest?.name || '').trim().toLowerCase();
        if (apptPhone && oPhone && (apptPhone.endsWith(oPhone) || oPhone.endsWith(apptPhone)) && (o.date === appt.date || o.dateDisplay === appt.dateDisplay)) {
          return true;
        }
        if (apptGuest && oName && apptGuest === oName && (o.date === appt.date || o.dateDisplay === appt.dateDisplay)) {
          return true;
        }
        return false;
      });

      if (matched) {
        return formatInv(matched.invoiceNo || matched.invoiceId || matched.id);
      }
    } catch (e) {}

    return formatInv(appt.id ? String(appt.id).slice(-4) : '101');
  };

  // Appointment form (SRS Section 29)
  const [appointmentForm, setAppointmentForm] = useState(() => ({
    guest: '',
    mobile: '',
    service: 'Hair Cut (With Shampoo)',
    originalPrice: 200,
    discPercent: '',
    discAmount: '',
    price: 200,
    staff: 'Respark Trial',
    date: formatDateYYYYMMDD(new Date()),
    timeSlot: getDefaultUpcomingSlot(formatDateYYYYMMDD(new Date()), timeSlots),
    paymentMethod: 'Pay at Salon',
    paymentStatus: 'Unpaid',
    instruction: '',
    selectedProducts: []
  }));

  // Filter time slots dynamically for the Book Appointment modal: if selected date is today, hide past elapsed time slots
  const availableModalTimeSlots = useMemo(() => {
    const todayIso = formatDateYYYYMMDD(new Date());
    const formDateIso = appointmentForm.date || todayIso;
    if (formDateIso !== todayIso) {
      return timeSlots; // Future dates: all time slots available
    }
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const futureSlots = timeSlots.filter(slot => parseSlotToMinutes(slot) >= currentMinutes);
    return futureSlots.length > 0 ? futureSlots : [timeSlots[timeSlots.length - 1]];
  }, [appointmentForm.date]);

  // Ensure appointmentForm.timeSlot remains valid when date changes
  useEffect(() => {
    if (!availableModalTimeSlots.includes(appointmentForm.timeSlot)) {
      setAppointmentForm(prev => ({
        ...prev,
        timeSlot: availableModalTimeSlots[0] || '11:00 AM'
      }));
    }
  }, [availableModalTimeSlots, appointmentForm.timeSlot]);

  const handleFormDiscPercentChange = (percentVal) => {
    const orig = appointmentForm.originalPrice || 200;
    if (percentVal === '') {
      setAppointmentForm(prev => ({
        ...prev,
        discPercent: '',
        discAmount: '',
        price: orig
      }));
      return;
    }
    const p = Math.min(100, Math.max(0, parseFloat(percentVal) || 0));
    const disc = Math.round((orig * p) / 100);
    const finalPrice = Math.max(0, orig - disc);
    setAppointmentForm(prev => ({
      ...prev,
      discPercent: percentVal,
      discAmount: disc > 0 ? String(disc) : '',
      price: finalPrice
    }));
  };

  const handleFormDiscAmountChange = (amountVal) => {
    const orig = appointmentForm.originalPrice || 200;
    if (amountVal === '') {
      setAppointmentForm(prev => ({
        ...prev,
        discAmount: '',
        discPercent: '',
        price: orig
      }));
      return;
    }
    const disc = Math.min(orig, Math.max(0, parseFloat(amountVal) || 0));
    const p = orig > 0 ? Math.round((disc / orig) * 100) : 0;
    const finalPrice = Math.max(0, orig - disc);
    setAppointmentForm(prev => ({
      ...prev,
      discAmount: amountVal,
      discPercent: p > 0 ? String(p) : '',
      price: finalPrice
    }));
  };

  // Filtered registered guests matching user typed text
  const filteredGuests = existingCustomers.filter(c => {
    const query = (appointmentForm.guest || '').toLowerCase().trim();
    if (!query) return true;
    return (
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.mobile && c.mobile.includes(query))
    );
  });

  const handleSelectGuest = (cust) => {
    setAppointmentForm(prev => ({
      ...prev,
      guest: cust.name,
      mobile: cust.mobile || ''
    }));
    setGuestDropdownOpen(false);
  };

  // Group services by header/category for organized dropdown
  const groupedServices = masterServices.reduce((acc, s) => {
    const group = s.header || s.category || 'General Services';
    if (!acc[group]) acc[group] = [];
    acc[group].push(s);
    return acc;
  }, {});

  // Filter appointments by selected date
  const dateFilteredAppointments = appointments.filter(a => {
    if (!filterByDate) return true;
    const apptDate = a.date || '18-Sep-2026';
    return apptDate === selectedDate;
  });

  // Dynamic counts for status tabs based on active date filter
  const counts = {
    Total: dateFilteredAppointments.length,
    Waiting: dateFilteredAppointments.filter(a => a.status === 'Waiting').length,
    'In Progress': dateFilteredAppointments.filter(a => a.status === 'In Progress').length,
    Completed: dateFilteredAppointments.filter(a => a.status === 'Completed').length,
    Cancelled: dateFilteredAppointments.filter(a => a.status === 'Cancelled').length
  };

  const tabs = [
    { id: 'Total', count: counts.Total, bg: 'bg-slate-900 text-white' },
    { id: 'Waiting', count: counts.Waiting, bg: 'bg-amber-500 text-white' },
    { id: 'In Progress', count: counts['In Progress'], bg: 'bg-indigo-600 text-white' },
    { id: 'Completed', count: counts.Completed, bg: 'bg-emerald-600 text-white' },
    { id: 'Cancelled', count: counts.Cancelled, bg: 'bg-slate-600 text-white' }
  ];

  const handleOpenCreateModal = () => {
    const todayIso = formatDateYYYYMMDD(new Date());
    let initDate = todayIso;
    if (selectedDate) {
      const parsed = parseDateStr(selectedDate);
      const iso = formatDateYYYYMMDD(parsed);
      if (iso >= todayIso) {
        initDate = iso;
      }
    }
    const initialSlot = getDefaultUpcomingSlot(initDate, timeSlots);
    setAppointmentForm(prev => ({
      ...prev,
      date: initDate,
      timeSlot: initialSlot
    }));
    setShowCreateModal(true);
  };

  const handleCreateAppointment = () => {
    const origPrice = Number(appointmentForm.originalPrice || appointmentForm.price || 200);
    const discAmt = parseFloat(appointmentForm.discAmount) || 0;
    const finalServicePrice = Math.max(0, origPrice - discAmt);
    const addedProducts = appointmentForm.selectedProducts || [];
    const productsTotal = addedProducts.reduce((sum, p) => sum + (Number(p.price) * (Number(p.qty) || 1)), 0);
    const finalGrandTotal = finalServicePrice + productsTotal;

    const chosenDateObj = parseDateStr(appointmentForm.date);
    const apptDateStr = formatDateDDMMMYYYY(chosenDateObj);

    const serviceItem = {
      id: `srv_${Date.now()}`,
      name: appointmentForm.service || 'Hair Cut (With Shampoo)',
      price: origPrice,
      discAmount: discAmt,
      qty: 1,
      staff: appointmentForm.staff || 'Respark Trial',
      itemType: 'service'
    };

    const productItems = addedProducts.map(p => ({
      id: p.id || `prd_${Date.now()}_${Math.random()}`,
      name: p.name,
      price: Number(p.price) || 0,
      qty: Number(p.qty) || 1,
      discAmount: 0,
      itemType: 'product'
    }));

    const newAppt = {
      guest: appointmentForm.guest || 'Walk-in Customer',
      mobile: appointmentForm.mobile || '+91 9876543210',
      service: appointmentForm.service || 'Hair Cut (With Shampoo)',
      originalPrice: origPrice,
      discPercent: appointmentForm.discPercent || '',
      discAmount: discAmt > 0 ? discAmt : 0,
      price: finalGrandTotal,
      servicesPrice: finalServicePrice,
      productsPrice: productsTotal,
      paymentMethod: appointmentForm.paymentMethod || 'Pay at Salon',
      paymentStatus: appointmentForm.paymentStatus || 'Unpaid',
      staff: appointmentForm.staff || 'Respark Trial',
      timeSlot: appointmentForm.timeSlot || '11:00 AM',
      instruction: appointmentForm.instruction || '',
      duration: appointmentForm.duration || '45 min',
      date: apptDateStr,
      status: 'Waiting',
      items: [serviceItem, ...productItems],
      products: productItems,
      services: [serviceItem]
    };
    saveAppointment(newAppt);
    setShowCreateModal(false);
    setAppointmentForm({
      guest: '',
      mobile: '',
      service: 'Hair Cut (With Shampoo)',
      originalPrice: 200,
      discPercent: '',
      discAmount: '',
      price: 200,
      staff: 'Respark Trial',
      date: formatDateYYYYMMDD(new Date()),
      timeSlot: getDefaultUpcomingSlot(formatDateYYYYMMDD(new Date()), timeSlots),
      paymentMethod: 'Pay at Salon',
      paymentStatus: 'Unpaid',
      instruction: '',
      selectedProducts: []
    });
  };

  const handleUpdateStatus = (id, newStatus) => {
    updateAppointment(id, { status: newStatus });
    setAppointments(getAppointments());
    const targetAppt = appointments.find(a => a.id === id);
    const orderIdToUpdate = targetAppt?.orderId || targetAppt?.invoiceId;
    if (orderIdToUpdate) {
      updateOrderStatus(orderIdToUpdate, newStatus);
    }
  };

  const handleDeleteAppointment = (id) => {
    if (window.confirm('Are you sure you want to remove this appointment?')) {
      deleteAppointment(id);
    }
  };

  const handleOpenReschedule = (appt) => {
    setRescheduleTarget(appt);
    const targetDate = appt.date || selectedDate || '18-Sep-2026';
    setRescheduleForm({
      date: targetDate,
      timeSlot: appt.timeSlot || '11:00 AM',
      staff: appt.staff || (typeof masterStaff[0] === 'string' ? masterStaff[0] : masterStaff[0]?.name || 'Respark Trial')
    });
    const parsed = parseDateStr(targetDate);
    setRescheduleCalMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    setRescheduleModalOpen(true);
  };

  const handleRescheduleQuickDate = (dateStr) => {
    setRescheduleForm(prev => ({ ...prev, date: dateStr }));
    const d = parseDateStr(dateStr);
    setRescheduleCalMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const handlePrevCalMonth = () => {
    setRescheduleCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextCalMonth = () => {
    setRescheduleCalMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectCalDay = (dayNum) => {
    const d = new Date(rescheduleCalMonth.getFullYear(), rescheduleCalMonth.getMonth(), dayNum);
    setRescheduleForm(prev => ({ ...prev, date: formatDateDDMMMYYYY(d) }));
  };

  // Date Filter & Navigation Handlers
  const handlePrevDay = () => {
    const d = parseDateStr(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDateDDMMMYYYY(d));
    setFilterByDate(true);
  };

  const handleNextDay = () => {
    const d = parseDateStr(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDateDDMMMYYYY(d));
    setFilterByDate(true);
  };

  const handleSelectToday = () => {
    setSelectedDate(formatDateDDMMMYYYY(new Date()));
    setFilterByDate(true);
  };

  const handleSelectTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(formatDateDDMMMYYYY(tomorrow));
    setFilterByDate(true);
  };

  const handleSelectCustomDate = (pickedDateStr) => {
    setSelectedDate(pickedDateStr);
    setFilterByDate(true);
  };

  const handleSaveReschedule = () => {
    if (!rescheduleTarget) return;
    updateAppointment(rescheduleTarget.id, {
      date: rescheduleForm.date,
      timeSlot: rescheduleForm.timeSlot,
      staff: rescheduleForm.staff
    });
    setRescheduleModalOpen(false);
    setRescheduleTarget(null);
  };

  const handleOpenChangeStaff = (appt) => {
    setChangeStaffTarget(appt);
    setSelectedStaffToAssign(appt.staff || (typeof masterStaff[0] === 'string' ? masterStaff[0] : masterStaff[0]?.name || 'Respark Trial'));
    setChangeStaffModalOpen(true);
  };

  const handleSaveChangeStaff = () => {
    if (!changeStaffTarget || !selectedStaffToAssign) return;
    updateAppointment(changeStaffTarget.id, {
      staff: selectedStaffToAssign
    });
    setChangeStaffModalOpen(false);
    setChangeStaffTarget(null);
  };

  const handleOpenCollectPayment = (appt, completeAfter = false) => {
    setCollectPaymentTarget(appt);
    setSelectedPaymentMethod('Cash');
    setMarkCompletedAfterPayment(completeAfter || appt.status === 'In Progress');
    setCollectPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!collectPaymentTarget) return;
    const finalStatus = markCompletedAfterPayment ? 'Completed' : collectPaymentTarget.status;
    updateAppointment(collectPaymentTarget.id, {
      paymentStatus: 'Paid',
      paymentMethod: selectedPaymentMethod,
      status: finalStatus
    });
    setAppointments(getAppointments());

    // Sync to linked POS order in orderStorage so CRM, Cash Management, and Invoices update immediately
    try {
      const allOrders = getOrders();
      const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
      const targetPhone = cleanPhone(collectPaymentTarget.mobile);
      const targetGuest = (collectPaymentTarget.guest || '').trim().toLowerCase();

      const matchedOrder = allOrders.find(o => 
        (collectPaymentTarget.orderId && (String(o.id) === String(collectPaymentTarget.orderId) || String(o.invoiceId) === String(collectPaymentTarget.orderId) || String(o.invoiceNo) === String(collectPaymentTarget.orderId))) ||
        (collectPaymentTarget.invoiceId && (String(o.invoiceId) === String(collectPaymentTarget.invoiceId) || String(o.id) === String(collectPaymentTarget.invoiceId) || String(o.invoiceNo) === String(collectPaymentTarget.invoiceId))) ||
        (o.appointmentId && String(o.appointmentId) === String(collectPaymentTarget.id)) ||
        (targetPhone && cleanPhone(o.guest?.mobile) && (targetPhone.endsWith(cleanPhone(o.guest?.mobile)) || cleanPhone(o.guest?.mobile).endsWith(targetPhone)) && (o.date === collectPaymentTarget.date || o.dateDisplay === collectPaymentTarget.date)) ||
        (targetGuest && (o.guest?.name || '').trim().toLowerCase() === targetGuest && (o.date === collectPaymentTarget.date || o.dateDisplay === collectPaymentTarget.date))
      );

      const orderIdToUpdate = matchedOrder?.id || matchedOrder?.invoiceId || matchedOrder?.invoiceNo || collectPaymentTarget.orderId || collectPaymentTarget.invoiceId;
      if (orderIdToUpdate) {
        updateOrder(orderIdToUpdate, {
          paymentStatus: 'Paid',
          paymentMethod: selectedPaymentMethod,
          payments: [{ method: selectedPaymentMethod, amount: collectPaymentTarget.price || collectPaymentTarget.grandTotal || 0 }],
          status: finalStatus
        });
      }
    } catch (e) {
      console.error('Failed to sync payment to linked POS order:', e);
    }

    setCollectPaymentModalOpen(false);
    setCollectPaymentTarget(null);
  };

  // Filter appointments by Status & Search Query
  const filteredAppointments = dateFilteredAppointments.filter(a => {
    if (activeFilter !== 'Total' && a.status !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchGuest = a.guest?.toLowerCase().includes(q);
      const matchMobile = a.mobile?.includes(q);
      const matchService = a.service?.toLowerCase().includes(q);
      const matchStaff = a.staff?.toLowerCase().includes(q);
      if (!matchGuest && !matchMobile && !matchService && !matchStaff) {
        return false;
      }
    }
    return true;
  });

  // Reschedule calendar grid calculations
  const calViewYear = rescheduleCalMonth.getFullYear();
  const calViewMonth = rescheduleCalMonth.getMonth();
  const calFirstDayOfWeek = new Date(calViewYear, calViewMonth, 1).getDay(); // 0 = Sun
  const calDaysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
  const calDaysInPrevMonth = new Date(calViewYear, calViewMonth, 0).getDate();

  const calPrevDays = [];
  for (let i = calFirstDayOfWeek - 1; i >= 0; i--) {
    calPrevDays.push(calDaysInPrevMonth - i);
  }

  const calCurrentDays = Array.from({ length: calDaysInMonth }, (_, i) => i + 1);
  const calSelectedDateObj = parseDateStr(rescheduleForm.date);

  // Dynamic Current Time Indicator line calculation
  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const totalMinutesFromMidnight = currentHours * 60 + currentMinutes;
  // Schedule starts at 8:00 AM (480 min) to 8:00 PM (1200 min), each 30 min is 64px
  const minutesFromStart = totalMinutesFromMidnight - 480;
  const timeLineTop = Math.max(0, Math.min(25 * 64, (minutesFromStart / 30) * 64));
  const formattedCurrentTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // Ensure all staff from master staff, initial staff, and appointments are present in grid
  const allStaffList = React.useMemo(() => {
    const staffMap = new Map();

    // 1. Master staff
    (masterStaff || []).forEach(s => {
      const name = typeof s === 'string' ? s : s.name;
      if (name && name.trim()) {
        const key = name.trim().toLowerCase();
        staffMap.set(key, {
          id: s.id || name,
          name: name.trim(),
          role: s.role || s.position || s.designation || 'Stylist',
          avatar: name.trim().slice(0, 2).toUpperCase()
        });
      }
    });

    // 2. Initial staff (only for demo tenant)
    const currentTenant = getActiveTenant();
    if (currentTenant?.id === 'tenant_glamour') {
      (initialStaffMembers || []).forEach(s => {
        const key = s.name.trim().toLowerCase();
        if (!staffMap.has(key)) {
          staffMap.set(key, {
            id: s.id,
            name: s.name.trim(),
            role: s.role || s.position || s.designation || 'Stylist',
            avatar: s.name.trim().slice(0, 2).toUpperCase()
          });
        }
      });
    }

    // 3. Any staff appearing in appointments
    appointments.forEach(a => {
      if (a.staff && a.staff.trim()) {
        const key = a.staff.trim().toLowerCase();
        if (!staffMap.has(key)) {
          staffMap.set(key, {
            id: a.staff.trim(),
            name: a.staff.trim(),
            role: 'Stylist',
            avatar: a.staff.trim().slice(0, 2).toUpperCase()
          });
        }
      }
    });

    return Array.from(staffMap.values());
  }, [masterStaff, appointments]);

  const visibleGridStaff = React.useMemo(() => {
    if (selectedGridStaff === 'All') return allStaffList;
    return allStaffList.filter(s => s.name.toLowerCase() === selectedGridStaff.toLowerCase());
  }, [allStaffList, selectedGridStaff]);

  const allGridTimeSlots = React.useMemo(() => {
    const parseTimeToMins = (t) => {
      if (!t) return 0;
      const parts = t.trim().split(' ');
      if (parts.length < 2) return 0;
      let [h, m] = parts[0].split(':').map(Number);
      const period = parts[1].toUpperCase();
      if (period === 'PM' && h !== 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      return h * 60 + (m || 0);
    };

    const slotSet = new Set(timeSlots);
    appointments.forEach(a => {
      if (a.timeSlot && a.timeSlot.trim()) slotSet.add(a.timeSlot.trim());
    });

    return Array.from(slotSet).sort((a, b) => parseTimeToMins(a) - parseTimeToMins(b));
  }, [appointments]);

  const getStaffApptCount = (staffName) => {
    return dateFilteredAppointments.filter(a => 
      a.staff?.trim().toLowerCase() === staffName?.trim().toLowerCase() &&
      (activeFilter === 'Total' || a.status === activeFilter)
    ).length;
  };

  const renderPaymentMethodBadge = (appt) => {
    const isPaid = appt.paymentStatus === 'Paid';

    // 1. Multiple split payments
    if (isPaid && Array.isArray(appt.payments) && appt.payments.length > 1) {
      const methodsSummary = appt.payments.map(p => p.method).join(' + ');
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Wallet size={12} className="text-purple-600 shrink-0" />
            <span>Split ({methodsSummary})</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {appt.payments.map(p => `${p.method}: ₹${p.amount}`).join(', ')}
          </span>
        </div>
      );
    }

    // 2. Single resolved payment method
    let method = (appt.payments?.[0]?.method || appt.paymentMethod || '').trim();
    if (!method) {
      method = isPaid ? 'Cash' : 'Pay at Salon';
    }

    const mLower = method.toLowerCase();

    if (mLower.includes('cash')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
          <Banknote size={13} className="text-emerald-600 shrink-0" />
          <span>Cash</span>
        </span>
      );
    }

    if (mLower.includes('card')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs">
          <CreditCard size={13} className="text-sky-600 shrink-0" />
          <span>Card</span>
        </span>
      );
    }

    if (mLower.includes('gpay') || mLower.includes('google pay')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-2xs">
          <Smartphone size={13} className="text-indigo-600 shrink-0" />
          <span>GPay (UPI)</span>
        </span>
      );
    }

    if (mLower.includes('phone') || mLower.includes('phonepe')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200 shadow-2xs">
          <Smartphone size={13} className="text-violet-600 shrink-0" />
          <span>PhonePe</span>
        </span>
      );
    }

    if (mLower.includes('upi')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
          <Smartphone size={13} className="text-teal-600 shrink-0" />
          <span>UPI</span>
        </span>
      );
    }

    if (mLower.includes('hdfc') || mLower.includes('bank') || mLower.includes('netbanking')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
          <Landmark size={13} className="text-blue-600 shrink-0" />
          <span>Net Banking</span>
        </span>
      );
    }

    // Unpaid / Due on Visit
    if (!isPaid || mLower.includes('salon') || mLower.includes('due') || mLower.includes('unpaid')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <Clock size={12} className="text-slate-400 shrink-0" />
          <span>Pay at Salon</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
        <Wallet size={12} className="text-slate-600 shrink-0" />
        <span>{method}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50">
      {/* Top Header Bar matching screenshot with View Mode Toggle */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 border-b border-slate-200 shadow-xs">
        {/* Left: Date Navigator & View Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Previous Day Button */}
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title="Previous Day"
          >
            <ChevronLeft size={18} />
          </button>

          {/* TODAY Shortcut Button */}
          <button
            type="button"
            onClick={handleSelectToday}
            className={`text-xs font-bold rounded-lg px-3 py-1.5 transition-all shadow-xs cursor-pointer border ${
              filterByDate && selectedDate === '18-Sep-2026'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            TODAY
          </button>

          {/* Interactive Date Picker Display */}
          <div className="relative flex items-center group">
            <label className="flex items-center gap-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all shadow-2xs">
              <Calendar size={13} className="text-indigo-600 shrink-0" />
              <span className="text-slate-800 font-bold text-xs sm:text-sm">{selectedDate}</span>
              <ChevronDown size={12} className="text-slate-400 group-hover:text-indigo-600" />
              <input
                type="date"
                value={formatDateYYYYMMDD(parseDateStr(selectedDate))}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    handleSelectCustomDate(formatDateDDMMMYYYY(new Date(y, m - 1, d)));
                  }
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                title="Click to choose a date from calendar"
              />
            </label>
          </div>

          {/* TOMORROW Shortcut Button */}
          <button
            type="button"
            onClick={handleSelectTomorrow}
            className={`text-xs font-bold rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer border ${
              filterByDate && selectedDate === '19-Sep-2026'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'text-slate-500 hover:text-indigo-600 border-transparent hover:border-slate-200'
            }`}
          >
            TOMORROW
          </button>

          {/* Next Day Button */}
          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title="Next Day"
          >
            <ChevronRight size={18} />
          </button>

          {/* All Dates Toggle Button */}
          <button
            type="button"
            onClick={() => setFilterByDate(prev => !prev)}
            className={`text-xs font-bold rounded-lg px-2.5 py-1.5 transition-all shadow-xs cursor-pointer border ${
              !filterByDate
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle between viewing selected date only vs all dates"
          >
            {!filterByDate ? 'Showing All' : 'All Dates'}
          </button>

          {/* View Mode Toggle Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 ml-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={14} />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Calendar Grid</span>
            </button>
          </div>
        </div>

        {/* Right: Status Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          {tabs.map(tab => {
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? tab.bg + ' shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.id}
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 font-bold">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: APPOINTMENT LIST VIEW */}
      {viewMode === 'list' && (
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {/* List Search & Info Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 mb-4 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, mobile, service, staff..."
                className="w-full pl-10 pr-8 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5 text-xs text-slate-500">
              <span className="font-medium">
                Showing <strong className="text-slate-800 font-bold">{filteredAppointments.length}</strong> {filterByDate ? `for ${selectedDate}` : 'total'}
              </span>
              {filterByDate ? (
                <span className="bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 text-[11px] flex items-center gap-1">
                  <Calendar size={11} />
                  <span>{selectedDate}</span>
                  <button
                    onClick={() => setFilterByDate(false)}
                    className="ml-1 text-slate-400 hover:text-indigo-900 font-bold cursor-pointer"
                    title="Show all dates"
                  >
                    ×
                  </button>
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-600 font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 text-[11px]">
                  All Dates
                </span>
              )}
              {activeFilter !== 'Total' && (
                <span className="bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 text-[11px]">
                  Filter: {activeFilter}
                </span>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredAppointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Invoice No.</th>
                      <th className="py-3.5 px-4">Customer Name</th>
                      <th className="py-3.5 px-4">Service</th>
                      <th className="py-3.5 px-4">Assigned Staff</th>
                      <th className="py-3.5 px-4">Time Slot</th>
                      <th className="py-3.5 px-4">Payment Status</th>
                      <th className="py-3.5 px-4">Payment Method</th>
                      <th className="py-3.5 px-4">Appointment Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredAppointments.map((appt) => {
                      const getStatusBadge = (status) => {
                        switch (status) {
                          case 'Waiting':
                            return 'bg-amber-50 text-amber-700 border-amber-200';
                          case 'In Progress':
                            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                          case 'Completed':
                            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          case 'Cancelled':
                            return 'bg-slate-100 text-slate-600 border-slate-200';
                          default:
                            return 'bg-slate-100 text-slate-600 border-slate-200';
                        }
                      };

                      return (
                        <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* 0. Invoice Number */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleViewInvoice(appt)}
                              className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs group"
                              title="Click to view full Tax Invoice & Bill Receipt"
                            >
                              <FileText size={12} className="text-indigo-500 group-hover:text-indigo-700 shrink-0" />
                              <span>{getApptInvoiceNo(appt)}</span>
                            </button>
                          </td>

                          {/* 1. Customer Name & Mobile */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                                {appt.guest ? appt.guest.charAt(0).toUpperCase() : 'C'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 text-sm truncate">{appt.guest}</div>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                  <Phone size={11} className="text-slate-400 shrink-0" />
                                  <span>{appt.mobile || '+91 9876543210'}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Service & Duration */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 text-xs">{appt.service}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded font-medium">
                                {appt.duration || '45 min'}
                              </span>
                              {appt.instruction && (
                                <span className="text-[10px] text-slate-400 italic truncate max-w-[160px]" title={appt.instruction}>
                                  "{appt.instruction}"
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Assigned Staff */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleOpenChangeStaff(appt)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-slate-700 hover:text-indigo-700 font-semibold text-xs transition-all cursor-pointer group shadow-2xs"
                              title="Click to edit / change assigned staff"
                            >
                              <Scissors size={12} className="text-indigo-600 shrink-0" />
                              <span>{appt.staff}</span>
                              <Pencil size={11} className="text-slate-400 group-hover:text-indigo-600 ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </td>

                          {/* 4. Time Slot & Date */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                              <Clock size={13} className="text-indigo-600 shrink-0" />
                              <span>{appt.timeSlot}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                              {appt.date || selectedDate}
                            </div>
                          </td>

                          {/* 5. Payment Status */}
                          <td className="py-3.5 px-4">
                            {appt.paymentStatus === 'Paid' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {appt.paymentMethod === 'Cash' || appt.paymentMethod === 'GPay' || appt.paymentMethod === 'Card' ? 'Paid' : 'Paid Advance'}
                                </span>
                                <div className="text-xs font-mono font-bold text-slate-800">
                                  ₹{appt.price || 200}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Due on Visit
                                </span>
                                <div className="text-xs font-mono font-bold text-slate-700">
                                  ₹{appt.price || 200}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCollectPayment(appt)}
                                  className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                                  title="Collect Payment from Customer"
                                >
                                  <CreditCard size={11} />
                                  <span>Collect Payment</span>
                                </button>
                              </div>
                            )}
                          </td>

                          {/* 6. Payment Method */}
                          <td className="py-3.5 px-4">
                            {renderPaymentMethodBadge(appt)}
                          </td>

                          {/* 7. Appointment Lifecycle Status Dropdown */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <div className="relative inline-block">
                                <select
                                  value={appt.status || 'Waiting'}
                                  onChange={(e) => {
                                    const newStatus = e.target.value;
                                    if (newStatus === 'Completed' && appt.paymentStatus !== 'Paid') {
                                      handleOpenCollectPayment(appt, true);
                                    } else {
                                      handleUpdateStatus(appt.id, newStatus);
                                    }
                                  }}
                                  className={`text-xs font-bold pl-2.5 pr-6 py-1 rounded-lg border appearance-none cursor-pointer outline-none transition-all shadow-2xs font-sans ${
                                    appt.status === 'Waiting'
                                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/70 focus:ring-1 focus:ring-amber-400'
                                      : appt.status === 'In Progress'
                                      ? 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100/70 focus:ring-1 focus:ring-indigo-400'
                                      : appt.status === 'Completed'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100/70 focus:ring-1 focus:ring-emerald-400'
                                      : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100/70 focus:ring-1 focus:ring-rose-400'
                                  }`}
                                  title="Change Appointment Status"
                                >
                                  <option value="Waiting">Waiting</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                <ChevronDown 
                                  size={12} 
                                  className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 opacity-70" 
                                />
                              </div>
                            </div>
                          </td>

                          {/* 7. Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Invoice Button */}
                              <button
                                onClick={() => handleViewInvoice(appt)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                                title="View Order Invoice / Bill"
                              >
                                <FileText size={11} />
                                <span>View Invoice</span>
                              </button>

                              {/* Edit Staff Button */}
                              {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleOpenChangeStaff(appt)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 hover:bg-violet-600 hover:text-white text-violet-700 border border-violet-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                                  title="Edit / Change Assigned Staff"
                                >
                                  <Pencil size={11} />
                                  <span>Edit Staff</span>
                                </button>
                              )}

                              {/* Reschedule Button */}
                              {appt.status !== 'Completed' && appt.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleOpenReschedule(appt)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                                  title="Reschedule Appointment"
                                >
                                  <CalendarClock size={12} />
                                  <span>Reschedule</span>
                                </button>
                              )}

                              {/* Cancel Appointment Button */}
                              {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to cancel the appointment for ${appt.guest}?`)) {
                                      handleUpdateStatus(appt.id, 'Cancelled');
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                                  title="Cancel Appointment"
                                >
                                  <XCircle size={11} />
                                  <span>Cancel Appointment</span>
                                </button>
                              )}

                              {/* Delete Appointment */}
                              <button
                                onClick={() => handleDeleteAppointment(appt.id)}
                                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete Appointment"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-3">
                  <Calendar size={26} />
                </div>
                <h4 className="text-base font-bold text-slate-800 mb-1">No Appointments Found</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  {searchQuery
                    ? `No appointments match "${searchQuery}" under ${activeFilter}.`
                    : `No appointments are currently scheduled under the "${activeFilter}" filter.`}
                </p>
                <button
                  onClick={() => navigate('/pos')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Go to POS to Book Order</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: SCHEDULE CALENDAR GRID */}
      {viewMode === 'grid' && (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
          {/* Calendar Grid Toolbar: Staff Filter & Grid Stats */}
          <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users size={14} className="text-indigo-600" />
                <span>Staff:</span>
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedGridStaff('All')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedGridStaff === 'All'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Staff ({allStaffList.length})
                </button>
                {allStaffList.map(s => {
                  const count = getStaffApptCount(s.name);
                  const isSelected = selectedGridStaff.toLowerCase() === s.name.toLowerCase();
                  return (
                    <button
                      key={s.id || s.name}
                      type="button"
                      onClick={() => setSelectedGridStaff(s.name)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{s.name}</span>
                      {count > 0 && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
              <span>Showing <strong>{dateFilteredAppointments.length}</strong> orders on <strong>{filterByDate ? selectedDate : 'All Dates'}</strong></span>
            </div>
          </div>

          {/* Scrollable Calendar Grid Container */}
          <div className="flex-1 overflow-auto bg-white">
            <div style={{ minWidth: `${Math.max(900, visibleGridStaff.length * 190 + 96)}px` }}>
              {/* Header row with Staff Names */}
              <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-20 shadow-xs">
                <div className="w-24 shrink-0 border-r border-slate-200 p-2 text-center text-xs font-bold text-slate-400 uppercase flex items-center justify-center bg-slate-50">
                  Time
                </div>
                {visibleGridStaff.map((staff) => {
                  const count = getStaffApptCount(staff.name);
                  return (
                    <div
                      key={staff.id || staff.name}
                      className="flex-1 min-w-[190px] text-center py-2.5 px-3 border-r border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-0.5"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs truncate max-w-full">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold shrink-0">
                          {staff.avatar}
                        </div>
                        <span className="truncate">{staff.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-slate-400">{staff.role}</span>
                        <span className={`px-1.5 py-0.2 rounded-full font-bold text-[10px] ${
                          count > 0 ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {count} {count === 1 ? 'order' : 'orders'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grid Body */}
              <div className="relative">
                {/* Dynamic Live Current Time Indicator Red Line */}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-rose-500 z-30 pointer-events-none transition-all duration-500"
                  style={{ top: `${timeLineTop}px` }}
                >
                  {/* Live Current Time Pill Badge on Sticky Time Column */}
                  <div className="absolute left-1.5 -top-2.5 bg-rose-500 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 z-40 pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{formattedCurrentTime}</span>
                  </div>
                  {/* Red Marker Dot at grid start */}
                  <div className="absolute left-24 -top-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white shadow-xs" />
                </div>

                {/* Time Slot Rows */}
                {allGridTimeSlots.map((time, timeIdx) => (
                  <div key={timeIdx} className="flex relative min-h-[64px]">
                    {/* Sticky Time Column */}
                    <div className="w-24 shrink-0 border-r border-b border-slate-200 py-3 pr-3 text-right text-xs font-medium text-slate-500 bg-white sticky left-0 z-10 select-none flex items-start justify-end">
                      {time}
                    </div>

                    {/* Staff Columns */}
                    {visibleGridStaff.map((staff) => {
                      const staffName = staff.name;
                      
                      // Find ALL appointments matching this staff, time, date, and status filter
                      const matchingAppts = appointments.filter(a => {
                        const staffMatch = (a.staff?.trim().toLowerCase() === staffName?.trim().toLowerCase());
                        const timeMatch = (a.timeSlot?.trim().toLowerCase() === time?.trim().toLowerCase());
                        const dateMatch = (!filterByDate || (a.date || '18-Sep-2026') === selectedDate);
                        const statusMatch = (activeFilter === 'Total' || a.status === activeFilter);
                        return staffMatch && timeMatch && dateMatch && statusMatch;
                      });

                      return (
                        <div
                          key={staffName}
                          onClick={() => {
                            setAppointmentForm(prev => ({ ...prev, staff: staffName, timeSlot: time, date: selectedDate }));
                            setShowCreateModal(true);
                          }}
                          className="flex-1 min-w-[190px] border-b border-r border-slate-100 p-1.5 relative hover:bg-indigo-50/40 transition-colors cursor-pointer"
                        >
                          {matchingAppts.length > 0 ? (
                            <div className="flex flex-col gap-1.5 h-full">
                              {matchingAppts.map((appt) => (
                                <div
                                  key={appt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewInvoice(appt);
                                  }}
                                  title={`Click to view invoice • ${appt.guest} (${appt.service}) - ${appt.status}`}
                                  className={`rounded-lg p-2 text-xs shadow-xs flex flex-col justify-between hover:ring-2 hover:ring-white hover:shadow-md transition-all cursor-pointer ${
                                    appt.status === 'Waiting'
                                      ? 'bg-amber-500 text-white'
                                      : appt.status === 'In Progress'
                                      ? 'bg-indigo-600 text-white'
                                      : appt.status === 'Completed'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-400 text-white opacity-70 line-through'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="font-bold truncate text-[12px]">{appt.guest}</div>
                                    <span className="text-[9px] uppercase font-extrabold px-1 rounded bg-black/20 shrink-0">
                                      {appt.status}
                                    </span>
                                  </div>
                                  <div className="text-[11px] opacity-90 truncate font-medium">{appt.service}</div>
                                  <div className="flex items-center justify-between text-[10px] opacity-80 font-mono mt-0.5">
                                    <span>{appt.duration || '45 min'}</span>
                                    <span className="font-bold font-mono">₹{appt.price}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full min-h-[46px] flex items-center justify-center group/slot">
                              <span className="text-[11px] text-slate-300 select-none group-hover/slot:text-indigo-600 group-hover/slot:font-semibold group-hover/slot:bg-indigo-50 group-hover/slot:px-2 group-hover/slot:py-0.5 group-hover/slot:rounded group-hover/slot:border group-hover/slot:border-indigo-200 transition-all">
                                + Book
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE APPOINTMENT MODAL (SRS Section 29) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="text-indigo-600" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Book Appointment</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name with Old / Registered Customers Dropdown */}
              <div className="relative" ref={guestDropdownRef}>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-600 uppercase">
                    Customer Name*
                  </label>
                  <button
                    type="button"
                    onClick={() => setGuestDropdownOpen(!guestDropdownOpen)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Old Customers ({existingCustomers.length})</span>
                    <ChevronDown size={12} className={`transition-transform ${guestDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={appointmentForm.guest}
                    onChange={(e) => {
                      setAppointmentForm({ ...appointmentForm, guest: e.target.value });
                      setGuestDropdownOpen(true);
                    }}
                    onFocus={() => setGuestDropdownOpen(true)}
                    placeholder="Search or enter customer name"
                    className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setGuestDropdownOpen(!guestDropdownOpen)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Old Customers Dropdown List */}
                {guestDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                    <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                      <span>Select From Old Customers</span>
                      <span className="text-[10px] text-indigo-600 font-medium">{filteredGuests.length} found</span>
                    </div>
                    {filteredGuests.length > 0 ? (
                      filteredGuests.map((c) => (
                        <div
                          key={c.id || c.mobile || c.name}
                          onClick={() => handleSelectGuest(c)}
                          className="p-2.5 hover:bg-indigo-50/80 cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{c.mobile || 'No mobile'}</span>
                              {c.loyalty && (
                                <span className="bg-amber-50 text-amber-700 text-[9px] px-1.5 py-0.2 rounded font-semibold border border-amber-200">
                                  {c.loyalty}
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
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No registered customer matching "{appointmentForm.guest}". Enter custom name to proceed.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Customer Mobile</label>
                <input
                  type="text"
                  value={appointmentForm.mobile || ''}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, mobile: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Service*</label>
                <select
                  value={appointmentForm.service}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const foundService = masterServices.find(s => s.name === selectedName);
                    const servicePrice = foundService?.price || 200;
                    const p = appointmentForm.discPercent ? parseFloat(appointmentForm.discPercent) : 0;
                    const disc = p > 0 ? Math.round((servicePrice * p) / 100) : (parseFloat(appointmentForm.discAmount) || 0);
                    const finalPrice = Math.max(0, servicePrice - disc);
                    setAppointmentForm({
                      ...appointmentForm,
                      service: selectedName,
                      originalPrice: servicePrice,
                      discAmount: disc > 0 ? String(disc) : '',
                      price: finalPrice,
                      duration: foundService?.duration ? (foundService.duration.endsWith('m') ? `${foundService.duration}in` : foundService.duration) : '45 min'
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="">-- Select Service --</option>
                  {Object.entries(groupedServices).map(([category, items]) => (
                    <optgroup key={category} label={category}>
                      {items.map(s => (
                        <option key={s.id || s.name} value={s.name}>
                          {s.name} {s.price ? `(₹${s.price})` : ''} {s.duration ? `• ${s.duration}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  {appointmentForm.service && !masterServices.some(s => s.name === appointmentForm.service) && (
                    <option value={appointmentForm.service}>{appointmentForm.service}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Assigned Staff*</label>
                <select
                  value={appointmentForm.staff}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, staff: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600"
                >
                  {masterStaff?.map(st => {
                    const name = typeof st === 'string' ? st : st.name;
                    return <option key={name} value={name}>{name}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center justify-between">
                  <span>Appointment Date*</span>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    {formatDateDDMMMYYYY(parseDateStr(appointmentForm.date))}
                  </span>
                </label>
                <input
                  type="date"
                  min={formatDateYYYYMMDD(new Date())}
                  value={appointmentForm.date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const todayIso = formatDateYYYYMMDD(new Date());
                    setAppointmentForm(prev => ({
                      ...prev,
                      date: newDate < todayIso ? todayIso : newDate
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center justify-between">
                  <span>Time Slot*</span>
                  {appointmentForm.date === formatDateYYYYMMDD(new Date()) && (
                    <span className="text-[10px] text-emerald-600 font-medium">Present / Upcoming</span>
                  )}
                </label>
                <select
                  value={appointmentForm.timeSlot}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  {availableModalTimeSlots?.map(ts => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>

              {/* Disc % and Disc Amount (₹) matching POS */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Disc%</label>
                <div className="relative flex items-center border border-slate-200 rounded-lg bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={appointmentForm.discPercent ?? ''}
                    onChange={(e) => handleFormDiscPercentChange(e.target.value)}
                    className="w-full pl-3 pr-7 py-2 text-sm outline-none text-slate-800 rounded-lg"
                  />
                  <span className="absolute right-2.5 text-xs font-bold text-slate-400 select-none">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Disc Amount (₹)</label>
                <div className="relative flex items-center border border-slate-200 rounded-lg bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                  <span className="absolute left-2.5 text-xs font-bold text-slate-400 select-none">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={appointmentForm.originalPrice || 200}
                    placeholder="0"
                    value={appointmentForm.discAmount ?? ''}
                    onChange={(e) => handleFormDiscAmountChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm outline-none text-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* Retail Products Sold (Optional) */}
              <div className="md:col-span-2 p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Retail Products Sold (Optional)
                    {appointmentForm.selectedProducts && appointmentForm.selectedProducts.length > 0 && (
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-1.5 py-0.2 rounded-full">
                        {appointmentForm.selectedProducts.length}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Products Total: <strong className="font-mono text-emerald-700 font-bold">
                      ₹{appointmentForm.selectedProducts ? appointmentForm.selectedProducts.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.qty) || 1)), 0) : 0}
                    </strong>
                  </span>
                </div>

                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const found = masterProducts.find(p => String(p.id) === String(e.target.value));
                      if (found) {
                        const current = appointmentForm.selectedProducts || [];
                        const exists = current.find(p => p.id === found.id);
                        if (exists) {
                          setAppointmentForm(prev => ({
                            ...prev,
                            selectedProducts: prev.selectedProducts.map(p => p.id === found.id ? { ...p, qty: (p.qty || 1) + 1 } : p)
                          }));
                        } else {
                          setAppointmentForm(prev => ({
                            ...prev,
                            selectedProducts: [...(prev.selectedProducts || []), { id: found.id, name: found.name, price: found.salePrice || found.price || 0, qty: 1 }]
                          }));
                        }
                      }
                      e.target.value = '';
                    }}
                  >
                    <option value="">+ Add Retail Product to Sale...</option>
                    {masterProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.salePrice || p.price} {p.stock !== undefined ? `(Stock: ${p.stock})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Products List */}
                {appointmentForm.selectedProducts && appointmentForm.selectedProducts.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {appointmentForm.selectedProducts.map(prod => (
                      <div key={prod.id} className="flex items-center justify-between bg-white border border-emerald-200/80 rounded-lg px-3 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{prod.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">₹{prod.price} each</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
                            <span className="text-[10px] text-slate-500 mr-1">Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={prod.qty}
                              onChange={(e) => {
                                const q = Math.max(1, parseInt(e.target.value) || 1);
                                setAppointmentForm(prev => ({
                                  ...prev,
                                  selectedProducts: prev.selectedProducts.map(p => p.id === prod.id ? { ...p, qty: q } : p)
                                }));
                              }}
                              className="w-8 text-center text-xs font-mono outline-none bg-transparent font-bold"
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-900 min-w-[50px] text-right">
                            ₹{prod.price * prod.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAppointmentForm(prev => ({
                                ...prev,
                                selectedProducts: prev.selectedProducts.filter(p => p.id !== prod.id)
                              }));
                            }}
                            className="text-slate-400 hover:text-rose-600 font-bold px-1 text-sm cursor-pointer"
                            title="Remove product"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Method & Billing Section */}
              <div className="md:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={14} className="text-indigo-600" /> Payment Method & Billing
                  </span>
                  <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    {Boolean(appointmentForm.discAmount && Number(appointmentForm.discAmount) > 0) && (
                      <span className="line-through text-slate-400 text-xs font-mono">
                        ₹{appointmentForm.originalPrice || 200}
                      </span>
                    )}
                    <span>
                      Est. Total: <span className="font-bold text-indigo-700 font-mono text-sm">
                        ₹{(appointmentForm.price ?? 200) + (appointmentForm.selectedProducts ? appointmentForm.selectedProducts.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.qty) || 1)), 0) : 0)}
                      </span>
                    </span>
                    {Boolean(appointmentForm.discPercent && Number(appointmentForm.discPercent) > 0) && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded">
                        {appointmentForm.discPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Payment Method*
                    </label>
                    <select
                      value={appointmentForm.paymentMethod}
                      onChange={(e) => {
                        const m = e.target.value;
                        setAppointmentForm({
                          ...appointmentForm,
                          paymentMethod: m,
                          paymentStatus: m === 'Pay at Salon' ? 'Unpaid' : 'Paid'
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      <option value="Pay at Salon">Pay at Salon (Due on Visit)</option>
                      <option value="Cash">Cash (Advance Payment)</option>
                      <option value="GPay">GPay / UPI (Advance Payment)</option>
                      <option value="Phone Pay">PhonePe (Advance Payment)</option>
                      <option value="Card">Credit / Debit Card</option>
                      <option value="HDFC">HDFC Bank Transfer</option>
                      <option value="Balance">Customer Wallet Balance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Payment Status
                    </label>
                    <div className="pt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          appointmentForm.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {appointmentForm.paymentStatus === 'Paid'
                          ? `Paid Advance (₹${appointmentForm.price || 200})`
                          : 'Due on Visit (Unpaid)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Special Instruction</label>
                <textarea
                  rows={2}
                  value={appointmentForm.instruction}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, instruction: e.target.value })}
                  placeholder="e.g. Brief instruction"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAppointment}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
              >
                Confirm Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {rescheduleModalOpen && rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setRescheduleModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <CalendarClock size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Reschedule Appointment</h3>
                  <p className="text-xs text-slate-500">
                    For <strong className="text-indigo-600 font-semibold">{rescheduleTarget.guest}</strong> • {rescheduleTarget.service}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRescheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date Selection with Interactive Calendar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Select New Date
                  </label>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Calendar size={11} className="text-indigo-600" />
                    <span>{rescheduleForm.date}</span>
                  </span>
                </div>

                {/* Quick Date Presets */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => handleRescheduleQuickDate(formatDateDDMMMYYYY(new Date()))}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      rescheduleForm.date === formatDateDDMMMYYYY(new Date())
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar size={12} />
                    <span>Today ({formatDateDDMMMYYYY(new Date())})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { const t = new Date(); t.setDate(t.getDate() + 1); handleRescheduleQuickDate(formatDateDDMMMYYYY(t)); }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      (() => { const t = new Date(); t.setDate(t.getDate() + 1); return rescheduleForm.date === formatDateDDMMMYYYY(t); })()
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar size={12} />
                    <span>Tomorrow ({(() => { const t = new Date(); t.setDate(t.getDate() + 1); return formatDateDDMMMYYYY(t); })()})</span>
                  </button>
                </div>

                {/* Interactive Calendar Widget */}
                <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-3 shadow-2xs">
                  {/* Calendar Month Header */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={handlePrevCalMonth}
                      className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar size={13} className="text-indigo-600" />
                      <span>{FULL_MONTHS[calViewMonth]} {calViewYear}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleNextCalMonth}
                      className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Days of Week */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayName, idx) => (
                      <span
                        key={dayName}
                        className={`text-[10px] font-bold py-0.5 ${idx === 0 || idx === 6 ? 'text-rose-500' : 'text-slate-400'}`}
                      >
                        {dayName}
                      </span>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {/* Previous Month Inactive Days */}
                    {calPrevDays.map((d, idx) => (
                      <span
                        key={`prev-${idx}`}
                        className="text-[11px] text-slate-300 py-1 font-medium select-none"
                      >
                        {d}
                      </span>
                    ))}

                    {/* Current Month Days */}
                    {calCurrentDays.map((d) => {
                      const selected = (
                        calSelectedDateObj.getFullYear() === calViewYear &&
                        calSelectedDateObj.getMonth() === calViewMonth &&
                        calSelectedDateObj.getDate() === d
                      );
                      const todayNow = new Date();
                      const isToday = (calViewYear === todayNow.getFullYear() && calViewMonth === todayNow.getMonth() && d === todayNow.getDate());
                      return (
                        <button
                          key={`curr-${d}`}
                          type="button"
                          onClick={() => handleSelectCalDay(d)}
                          className={`text-xs py-1 px-1 rounded-lg font-semibold transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                            selected
                              ? 'bg-indigo-600 text-white font-bold shadow-xs scale-105 z-10'
                              : isToday
                              ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 hover:bg-indigo-100'
                              : 'text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow-2xs'
                          }`}
                        >
                          <span>{d}</span>
                          {isToday && !selected && (
                            <span className="w-1 h-1 bg-indigo-600 rounded-full mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Bar: Manual/Native Picker Sync */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Or pick specific date:</span>
                    <input
                      type="date"
                      value={formatDateYYYYMMDD(calSelectedDateObj)}
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-').map(Number);
                          const picked = new Date(y, m - 1, d);
                          setRescheduleForm(prev => ({ ...prev, date: formatDateDDMMMYYYY(picked) }));
                          setRescheduleCalMonth(new Date(y, m - 1, 1));
                        }
                      }}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select New Time Slot
                </label>
                <select
                  value={rescheduleForm.timeSlot}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, timeSlot: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  {timeSlots?.map(ts => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>

              {/* Assigned Staff Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Staff
                </label>
                <select
                  value={rescheduleForm.staff}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, staff: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  {masterStaff?.map(st => {
                    const name = typeof st === 'string' ? st : st.name;
                    return <option key={name} value={name}>{name}</option>;
                  })}
                </select>
              </div>

              {/* Summary Box */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock size={13} className="text-indigo-600" />
                  <span>Reschedule Summary:</span>
                </div>
                <div>Moving from <span className="line-through text-slate-400">{rescheduleTarget.timeSlot} ({rescheduleTarget.date || selectedDate})</span></div>
                <div className="font-semibold text-indigo-700">
                  ➔ New: {rescheduleForm.timeSlot} on {rescheduleForm.date} with {rescheduleForm.staff}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={handleSaveReschedule}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs cursor-pointer"
              >
                <Check size={16} />
                <span>Confirm Reschedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE / EDIT STAFF MODAL */}
      {changeStaffModalOpen && changeStaffTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setChangeStaffModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Change Assigned Staff</h3>
                  <p className="text-xs text-slate-500">
                    For <strong className="text-indigo-600 font-semibold">{changeStaffTarget.guest}</strong> • {changeStaffTarget.service}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setChangeStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-500">Current Assigned Staff:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Scissors size={12} className="text-indigo-600" />
                  {changeStaffTarget.staff}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select New Staff Member
                </label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {masterStaff?.map(st => {
                    const staffName = typeof st === 'string' ? st : st.name;
                    const isSelected = selectedStaffToAssign === staffName;
                    return (
                      <div
                        key={staffName}
                        onClick={() => setSelectedStaffToAssign(staffName)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs ring-1 ring-indigo-500'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {staffName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-xs">{staffName}</div>
                            <div className="text-[10px] text-slate-400">Available • Stylist</div>
                          </div>
                        </div>
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                            ✓
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-[11px] font-semibold text-slate-500 group-hover:text-indigo-600"
                          >
                            Select
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-2.5 bg-violet-50/60 rounded-xl border border-violet-100 text-[11px] text-violet-800 flex items-center gap-2">
                <Clock size={13} className="text-violet-600 shrink-0" />
                <span>Time Slot remains <strong>{changeStaffTarget.timeSlot}</strong> on <strong>{changeStaffTarget.date || selectedDate}</strong></span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setChangeStaffModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveChangeStaff}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs cursor-pointer"
              >
                <Check size={16} />
                <span>Confirm Staff Change</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COLLECT PAYMENT MODAL */}
      {collectPaymentModalOpen && collectPaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setCollectPaymentModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Collect Payment</h3>
                  <p className="text-xs text-slate-500">
                    For <strong className="text-indigo-600 font-semibold">{collectPaymentTarget.guest}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCollectPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Order Amount Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Amount to Collect
                  </span>
                  <span className="text-2xl font-black text-emerald-900 font-mono">
                    ₹{collectPaymentTarget.price || 200}
                  </span>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {collectPaymentTarget.service} • {collectPaymentTarget.staff}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/80 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                  <CreditCard size={24} />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Cash', label: 'Cash', desc: 'Salon Cash Drawer' },
                    { id: 'GPay', label: 'GPay / UPI', desc: 'Instant QR / UPI' },
                    { id: 'Phone Pay', label: 'PhonePe', desc: 'UPI Payment' },
                    { id: 'Card', label: 'Card (POS)', desc: 'Credit / Debit Card' },
                    { id: 'HDFC', label: 'Net Banking', desc: 'Bank Transfer' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedPaymentMethod === m.id
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{m.label}</span>
                        {selectedPaymentMethod === m.id && (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mark Completed Checkbox */}
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={markCompletedAfterPayment}
                  onChange={(e) => setMarkCompletedAfterPayment(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="font-medium">
                  Also mark appointment status as <strong className="text-emerald-700 font-bold">Completed</strong>
                </span>
              </label>

              {/* POS Billing Alternative */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Need to add retail products or package?</span>
                <button
                  type="button"
                  onClick={() => {
                    setCollectPaymentModalOpen(false);
                    navigate('/pos', { state: { fromAppointment: collectPaymentTarget } });
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                >
                  Bill in Full POS ➔
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCollectPaymentModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-xs cursor-pointer"
              >
                <Check size={16} />
                <span>Confirm Payment (₹{collectPaymentTarget.price || 200})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENT INVOICE BILL MODAL */}
      <AppointmentInvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => {
          setInvoiceModalOpen(false);
          setSelectedInvoiceAppt(null);
        }}
        appointment={selectedInvoiceAppt}
      />
    </div>
  );
}
