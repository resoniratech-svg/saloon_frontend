import React, { useState } from 'react';
import { X, Printer, MessageCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { getActiveTenant } from '../../utils/saasStorage';
import { getPackages } from '../../utils/packageStorage';

export const getPackageBreakdown = (item) => {
  if (!item) return [];

  // 1. If services are already explicitly defined as array
  if (Array.isArray(item.services) && item.services.length > 0) {
    return item.services.map(s => typeof s === 'string' ? s : (s.name || s.title || String(s)));
  }

  // 2. If services are a comma or plus or newline separated string
  if (typeof item.services === 'string' && item.services.trim().length > 0) {
    return item.services.split(/[,+\n]/).map(s => s.trim()).filter(Boolean);
  }

  // 3. Look up from getPackages() in packageStorage
  try {
    const allPackages = getPackages() || [];
    const matched = allPackages.find(p => 
      (p.id && item.id && String(p.id) === String(item.id)) ||
      (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
    );
    if (matched && matched.services) {
      if (typeof matched.services === 'string') {
        return matched.services.split(/[,+\n]/).map(s => s.trim()).filter(Boolean);
      }
      if (Array.isArray(matched.services)) {
        return matched.services;
      }
    }
  } catch (err) {
    console.error('Error retrieving package services:', err);
  }

  // 4. Intelligent contextual breakdown based on package name & category
  const lowerName = (item.name || '').toLowerCase();
  const lowerCat = (item.category || item.header || '').toLowerCase();

  if (lowerName.includes('gold')) {
    return [
      '2x Premium Hair Cut & Styling',
      '2x Loreal Hair Spa & Deep Conditioning',
      '1x Charcoal D-Tan Face Pack',
      '1x Beard Grooming / Shave'
    ];
  }
  if (lowerName.includes('silver')) {
    return [
      '1x Deep Cleansing Facial & Scrub',
      '1x Hair Cut & Blow Dry',
      '1x Relaxing Head Massage'
    ];
  }
  if (lowerName.includes('platinum')) {
    return [
      '3x Premium Hair Cut & Styling',
      '3x Luxury Hair Spa',
      '2x O3+ Whitening Facial',
      '1x Deluxe Pedicure & Manicure'
    ];
  }
  if (lowerName.includes('bridal') || lowerCat.includes('bridal')) {
    return [
      '1x Pre-Bridal Skin Cleanup & Polish',
      '2x Bridal Glow Facials',
      '1x Deluxe Manicure & Pedicure',
      '1x Bridal Hair Styling & Makeup'
    ];
  }
  if (lowerCat.includes('skin') || lowerName.includes('skin')) {
    return [
      '2x Deep Cleansing Facials',
      '1x D-Tan Treatment',
      '1x Face Bleach / Cleanup'
    ];
  }
  if (lowerCat.includes('hair') || lowerName.includes('hair')) {
    return [
      '2x Hair Cut & Wash',
      '2x Loreal Hair Spa',
      '1x Scalp Conditioning'
    ];
  }

  return [
    'Complete Treatment Package Sessions',
    'Consultation & Custom Styling'
  ];
};

const InvoiceBillModal = ({ isOpen, onClose, order }) => {
  const [whatsAppSent, setWhatsAppSent] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const allItems = order.items && order.items.length > 0
    ? order.items
    : [{ name: 'Salon Service Visit', itemType: 'service', qty: 1, price: order.grandTotal || 0, total: order.grandTotal || 0 }];

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
    return i.itemType === 'package' || 
           i.category === 'PACKAGE' || 
           (i.header && String(i.header).toLowerCase().includes('package')) ||
           (i.name && String(i.name).toLowerCase().includes('package'));
  };

  const isMembershipItem = (i) => {
    if (!i) return false;
    return i.itemType === 'membership' || 
           i.category === 'MEMBERSHIP' || 
           (i.header && String(i.header).toLowerCase().includes('membership')) ||
           (i.name && String(i.name).toLowerCase().includes('membership'));
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

  const totalDiscount = serviceItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0) +
                        productItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0) +
                        disposableItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0) +
                        packageItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0) +
                        membershipItems.reduce((sum, it) => sum + (parseFloat(it.discAmount) || 0), 0);

  const tenant = getActiveTenant();
  const primaryBranch = tenant?.branches?.find(b => b.isPrimary) || tenant?.branches?.[0];

  const brandPrefix = tenant?.logoTextPrefix || '';
  const brandSuffix = tenant?.logoTextSuffix || '';
  const companyName = tenant?.companyName || tenant?.brandName || (brandPrefix ? `${brandPrefix}${brandSuffix}` : 'RESPARK SALON');

  const branchName = primaryBranch?.name?.trim() || '';
  const cityName = primaryBranch?.city?.trim() || tenant?.city?.trim() || '';

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

  const explicitAddress = (tenant?.address || primaryBranch?.address || '').trim();
  const displayAddress = (explicitAddress && explicitAddress.toLowerCase() !== companyLocation.toLowerCase())
    ? explicitAddress
    : '';

  const companyPhone = tenant?.phone || tenant?.mobile || primaryBranch?.phone || '';
  const companyEmail = tenant?.email || '';
  const companyGstin = tenant?.gstin || tenant?.gstNumber || '';

  const guestName = order.guest?.name || order.customer?.name || 'Customer';
  const guestPhone = order.guest?.mobile || order.customer?.mobile || '';
  const guestEmail = order.guest?.email || order.customer?.email || '';
  const guestGstin = order.guest?.gstNumber || '';

  const handleWhatsApp = () => {
    let cleanPhone = (guestPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    let itemsList = '';
    let counter = 1;

    if (serviceItems && serviceItems.length > 0) {
      serviceItems.forEach((it) => {
        const net = (it.price * (it.qty || 1)) - (parseFloat(it.discAmount) || 0);
        itemsList += `${counter}. *${it.name}* (Qty: ${it.qty || 1}) - ₹${net}\n`;
        counter++;
      });
    }

    if (packageItems && packageItems.length > 0) {
      packageItems.forEach((it) => {
        const net = (it.price * (it.qty || 1)) - (parseFloat(it.discAmount) || 0);
        itemsList += `${counter}. *${it.name}* (Package) - ₹${net}\n`;
        counter++;
      });
    }

    if (productItems && productItems.length > 0) {
      productItems.forEach((it) => {
        const net = (it.price * (it.qty || 1)) - (parseFloat(it.discAmount) || 0);
        itemsList += `${counter}. *${it.name}* (Qty: ${it.qty || 1}) - ₹${net}\n`;
        counter++;
      });
    }

    if (membershipItems && membershipItems.length > 0) {
      membershipItems.forEach((it) => {
        itemsList += `${counter}. *${it.name}* (Membership) - ₹${it.price}\n`;
        counter++;
      });
    }

    const invoiceNum = order.invoiceNo || order.invoiceId || order.id || '1';
    const dateStr = order.dateDisplay || order.date || 'Recent';
    const timeStr = order.time ? ` • ${order.time}` : '';
    const paymentMode = order.paymentMethod || order.paymentMode || 'Paid';
    const grandTotalVal = Number(order.grandTotal ?? order.subTotal ?? 0).toLocaleString();

    const message = `🧾 *TAX INVOICE / BILL RECEIPT*
*${companyName.toUpperCase()}*
📍 ${companyLocation}${displayAddress ? `, ${displayAddress}` : ''}
${companyPhone ? `📞 ${companyPhone}\n` : ''}${companyGstin ? `GSTIN: ${companyGstin}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${guestName}
📱 *Phone:* ${guestPhone || '-'}
📄 *Invoice ID:* #${invoiceNum}
📅 *Date:* ${dateStr}${timeStr}
💳 *Payment:* ${paymentMode} (Completed)
━━━━━━━━━━━━━━━━━━━━
*BOOKED SERVICES / ITEMS:*
${itemsList || '1. Salon Services - ₹' + grandTotalVal + '\n'}━━━━━━━━━━━━━━━━━━━━
💰 *Grand Total: ₹${grandTotalVal}*

Thank you for visiting *${companyName}*!
Please retain this receipt for membership & package benefits. ✨`;

    const encodedMsg = encodeURIComponent(message);
    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
      : `https://wa.me/?text=${encodedMsg}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    setWhatsAppSent(true);
    setTimeout(() => setWhatsAppSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col my-auto">
        {/* Top Header */}
        <div className="flex justify-between items-center px-6 py-3.5 border-b border-slate-200 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-800">Tax Invoice / Bill Receipt</span>
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              #{order.invoiceNo || order.invoiceId || order.id}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Invoice Printable Area */}
        <div className="p-6 md:p-8 text-xs text-slate-700 font-sans" id="printable-invoice">
          {/* Salon Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
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
              </div>
              <p className="text-[11px] font-medium text-slate-500 tracking-wide mt-0.5">
                {tenant?.tagline || 'Excellence in Beauty & Care'}
              </p>
            </div>

            <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5">
              <p className="font-bold text-slate-800 text-xs">{companyLocation}</p>
              {displayAddress && <p>{displayAddress}</p>}
              {companyPhone && <p>{companyPhone}</p>}
              {companyEmail && <p>{companyEmail}</p>}
              {companyGstin && <p className="font-medium text-slate-700">GSTIN: {companyGstin}</p>}
            </div>
          </div>

          {/* Bill To & Invoice Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div className="space-y-1">
              <p><span className="font-semibold text-slate-800">Bill To :</span> {guestName}</p>
              <p><span className="font-semibold text-slate-800">Phone :</span> {guestPhone || '-'}{guestEmail ? `, ${guestEmail}` : ''}</p>
              <p><span className="font-semibold text-slate-800">Invoice ID :</span> #{order.invoiceId || order.invoiceNo || order.id || '1'}</p>
              {guestGstin && <p><span className="font-semibold text-slate-800">GSTIN :</span> {guestGstin}</p>}
            </div>
            <div className="text-left sm:text-right space-y-1">
              <p><span className="font-semibold text-slate-800">Date :</span> {order.dateDisplay || order.date || 'Recent'}</p>
              {order.time && <p><span className="font-semibold text-slate-800">Time :</span> {order.time}</p>}
              <p><span className="font-semibold text-slate-800">Payment :</span> <span className="font-bold text-indigo-600">{order.paymentMethod || 'Cash'}</span></p>
              <p><span className="font-semibold text-slate-800">Status :</span> <span className="text-emerald-600 font-bold">{order.status || 'Completed'}</span></p>
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
                  Subtotal: <strong className="font-mono text-slate-800">₹{servicesSubTotal}</strong>
                </span>
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-indigo-50/50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Sr.</th>
                      <th className="py-2 px-3">Service</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {serviceItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {item.name}
                          {item.staff && <span className="text-[11px] text-slate-400 ml-1.5">({item.staff})</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">₹{item.price}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 2: Packages (With Included Services Breakdown) */}
          {packageItems.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  Service Packages ({packageItems.length})
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Packages Subtotal: <strong className="font-mono text-slate-800">₹{packagesSubTotal}</strong>
                </span>
              </div>
              <div className="border border-purple-200 rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-50 text-slate-700 font-semibold border-b border-purple-200">
                    <tr>
                      <th className="py-2 px-3">Sr.</th>
                      <th className="py-2 px-3">Package Name</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-center">Validity</th>
                      <th className="py-2 px-3 text-right">Package Amount</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {packageItems.map((item, idx) => {
                      const breakdown = getPackageBreakdown(item);
                      return (
                        <React.Fragment key={idx}>
                          <tr className="hover:bg-purple-50/40">
                            <td className="py-2.5 px-3 text-slate-400 font-medium">{idx + 1}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-purple-950 block text-[13px]">{item.name}</span>
                              <span className="text-[10px] text-purple-600 font-medium">Active Subscription Plan</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-medium capitalize">{item.category || 'Package'}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-700 font-bold">{item.validityDays || 180} Days</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold">₹{item.price}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                              ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                            </td>
                          </tr>

                          {/* INCLUDED SERVICES BREAKDOWN SUB-ROW */}
                          <tr className="bg-gradient-to-r from-purple-50/60 via-purple-50/30 to-white border-b border-purple-100">
                            <td colSpan="6" className="py-2 px-4">
                              <div className="flex items-start gap-2">
                                <Sparkles size={13} className="text-purple-600 shrink-0 mt-0.5" />
                                <div className="w-full">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider">
                                      Included Services & Session Allowance
                                    </span>
                                    <span className="text-[10px] font-semibold text-purple-600">
                                      {breakdown.length} Services Covered
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                                    {breakdown.map((srv, sIdx) => (
                                      <div key={sIdx} className="flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-md border border-purple-100 shadow-2xs text-[11px]">
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

          {/* SECTION 3: Retail Products */}
          {productItems.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Retail Products ({productItems.length})
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
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Amt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2 px-3 text-right font-mono">₹{item.price}</td>
                        <td className="py-2 px-3 text-center font-mono">{item.qty || 1}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                          ₹{Math.max(0, (item.price * (item.qty || 1)) - (parseFloat(item.discAmount) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: Memberships */}
          {membershipItems.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  Memberships ({membershipItems.length})
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  Memberships Subtotal: <strong className="font-mono text-slate-800">₹{membershipsSubTotal}</strong>
                </span>
              </div>
              <div className="border border-teal-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-teal-50/50 text-slate-700 font-semibold border-b border-teal-200">
                    <tr>
                      <th className="py-2 px-3">Sr.</th>
                      <th className="py-2 px-3">Membership Plan</th>
                      <th className="py-2 px-3">Tier</th>
                      <th className="py-2 px-3 text-center">Validity</th>
                      <th className="py-2 px-3 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-100">
                    {membershipItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-teal-50/30">
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-teal-900">{item.name}</td>
                        <td className="py-2 px-3 text-slate-600">{item.category || 'VIP'}</td>
                        <td className="py-2 px-3 text-center font-mono">{item.validityDays || 365} Days</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">₹{item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grand Total Block */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <div className="w-64 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">₹{order.subTotal ?? order.grandTotal ?? 0}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-rose-500 font-medium">
                  <span>Discounts Applied:</span>
                  <span className="font-mono">-₹{totalDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="font-mono text-indigo-700 text-base">₹{Number(order.grandTotal ?? order.subTotal ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Salon Greeting */}
          <div className="text-center pt-6 mt-6 border-t border-dashed border-slate-200 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">Thank you for visiting {companyName}!</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Please retain this invoice for membership, package & loyalty benefits.</p>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Bill</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                whatsAppSent
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {whatsAppSent ? <CheckCircle2 size={14} /> : <MessageCircle size={14} />}
              <span>{whatsAppSent ? 'WhatsApp Opened!' : 'Share WhatsApp'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBillModal;
