import React, { useState } from 'react';
import { FileText, Download, Calendar, Filter, ChevronDown, Search, ArrowUpDown, ChevronRight } from 'lucide-react';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('Sales Summary');
  const [fromDate, setFromDate] = useState('01-Aug-2026');
  const [toDate, setToDate] = useState('26-Aug-2026');
  const [groupFilter, setGroupFilter] = useState('None');
  const [redemptionFilter, setRedemptionFilter] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  // 30+ Reports categorized as per SRS Section 58
  const reportCategories = [
    {
      category: 'Sales & Revenue',
      reports: [
        'Sales Summary',
        'Product Revenue',
        'Service Revenue',
        'Monthly Sale',
        'Day Wise Report',
        'Guest Collection',
        'Service Reminder',
      ]
    },
    {
      category: 'Staff Performance',
      reports: [
        'Staff Revenue',
        'Staff Attendance',
        'Tip Report',
      ]
    },
    {
      category: 'Memberships & Packages',
      reports: [
        'Membership Sold',
        'Membership Redemption',
        'Inter-Store Membership Report',
        'Packages Sold',
        'Package Redemption',
        'Gift Card Sold Report',
        'Gift Card Redemption',
        'Advance Received',
        'Balance Received',
        'Coupon Redemption',
        'Complimentary Report',
      ]
    },
    {
      category: 'Operational & Customer',
      reports: [
        'Appointment Report',
        'Guest Followups',
        'Cancelled Orders',
        'Cash Transactions',
        'GST Returns Report',
      ]
    },
    {
      category: 'Inventory Reports',
      reports: [
        'Daily Stock',
        'Stock Transaction',
        'Material Received',
        'Minimum Stock',
        'Reconcile Stock',
        'Consumable Tracking',
        'Stock Transfer',
        'Total Consumed',
        'Purchase Order Report',
        'GST Outwards Report',
        'Inventory Transaction Report',
      ]
    },
    {
      category: 'Financial Analytics',
      reports: [
        'PnL Report',
      ]
    }
  ];

  // Dynamic sample data generator based on selected report
  const getReportColumns = () => {
    switch (selectedReport) {
      case 'Sales Summary':
        return ['Date', 'Invoices', 'Services Rev', 'Product Rev', 'Tax (5%)', 'Discount', 'Total Net Revenue'];
      case 'Product Revenue':
        return ['Product Name', 'Category', 'SKU', 'Units Sold', 'Unit Price', 'Total Revenue'];
      case 'Service Revenue':
        return ['Service Name', 'Category', 'Times Performed', 'Rate', 'Discount', 'Net Amount'];
      case 'Staff Revenue':
        return ['Staff Name', 'Services Performed', 'Service Sales', 'Product Sales', 'Total Contribution'];
      case 'PnL Report':
        return ['Particulars / Category', 'POS Revenue', 'Direct Expenses', 'Overhead', 'Net Profit / Loss'];
      case 'Daily Stock':
        return ['Item Name', 'Category', 'Opening Stock', 'Received', 'Consumed / Sold', 'Closing Stock'];
      case 'Membership Sold':
        return ['Guest Name', 'Membership Plan', 'Date Assigned', 'Price Paid', 'Valid Till', 'Status'];
      default:
        return ['ID', 'Reference / Name', 'Category', 'Quantity', 'Amount (₹)', 'Date', 'Status'];
    }
  };

  const getReportRows = () => {
    switch (selectedReport) {
      case 'Sales Summary':
        return [
          ['26-Aug-2026', '12', '₹8,400', '₹1,200', '₹480', '₹200', '₹9,880'],
          ['25-Aug-2026', '18', '₹14,200', '₹2,500', '₹835', '₹500', '₹17,035'],
          ['24-Aug-2026', '15', '₹11,000', '₹1,800', '₹640', '₹350', '₹13,090'],
          ['23-Aug-2026', '21', '₹18,500', '₹3,400', '₹1,095', '₹700', '₹22,295'],
          ['22-Aug-2026', '14', '₹9,800', '₹1,100', '₹545', '₹250', '₹11,195'],
        ];
      case 'Product Revenue':
        return [
          ['Boost Bounce 200ml', 'Wella', 'SKU-W-01', '8', '₹670', '₹5,360'],
          ['Mask 500gm', 'Kinessence', 'SKU-K-02', '5', '₹1,800', '₹9,000'],
          ['Nourishing Shampoo', 'Kinessence', 'SKU-K-03', '6', '₹950', '₹5,700'],
          ['Reveal Shampoo 180ml', 'Wella', 'SKU-W-04', '4', '₹1,400', '₹5,600'],
        ];
      case 'Service Revenue':
        return [
          ['Hair Cut (With Shampoo)', 'Hair', '24', '₹200', '₹0', '₹4,800'],
          ['Hair Spa Loreal', 'Hair Spa', '15', '₹1,200', '₹600', '₹17,400'],
          ['Fruit Clean Up', 'Skin Care', '11', '₹400', '₹0', '₹4,400'],
          ['Global Color', 'Hair Color', '8', '₹2,000', '₹800', '₹15,200'],
        ];
      case 'Staff Revenue':
        return [
          ['Respark Trial', '18', '₹14,500', '₹3,200', '₹17,700'],
          ['Sohum K', '15', '₹12,400', '₹1,800', '₹14,200'],
          ['Swati R', '21', '₹16,800', '₹4,100', '₹20,900'],
          ['Akshay D', '12', '₹9,500', '₹1,100', '₹10,600'],
          ['Madhu G', '14', '₹11,200', '₹2,000', '₹13,200'],
        ];
      case 'PnL Report':
        return [
          ['Services & Products Sales', '₹68,200', '₹0', '₹0', '+₹68,200'],
          ['Salon Consumables & Stock Cost', '₹0', '₹12,400', '₹0', '-₹12,400'],
          ['Rent & Utilities', '₹0', '₹0', '₹15,000', '-₹15,000'],
          ['Staff Salary & Benefits', '₹0', '₹0', '₹22,000', '-₹22,000'],
          ['Repair & Housekeeping', '₹0', '₹0', '₹4,500', '-₹4,500'],
          ['NET PROFIT (EBITDA)', '₹68,200', '₹12,400', '₹41,500', '+₹14,300'],
        ];
      case 'Daily Stock':
        return [
          ['Antiox Shampoo', 'Kinessence', '5', '0', '0', '5 ml'],
          ['Boost Bounce', 'Wella', '6', '2', '1', '7 ml'],
          ['Hair Mask', 'Davines', '5', '0', '1', '4 gm'],
          ['Large Gloves', 'Disposables', '20', '50', '15', '55 units'],
        ];
      case 'Membership Sold':
        return [
          ['Bhanu', 'Silver Membership', '10-Sep-2026', '₹2,000', '10-Sep-2027', 'Active'],
          ['Priya Sharma', 'Gold Membership', '15-Aug-2026', '₹5,000', '15-Aug-2027', 'Active'],
          ['Rahul M', 'Silver Membership', '01-Jul-2026', '₹2,000', '01-Jul-2027', 'Active'],
        ];
      default:
        return [
          ['REC-001', 'Operational Record A', 'General', '1', '₹1,200', '26-Aug-2026', 'Completed'],
          ['REC-002', 'Operational Record B', 'General', '2', '₹2,400', '25-Aug-2026', 'Processed'],
          ['REC-003', 'Operational Record C', 'General', '1', '₹850', '24-Aug-2026', 'Completed'],
        ];
    }
  };

  const columns = getReportColumns();
  const rows = getReportRows();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Left Sidebar: 30+ Report Directory */}
      <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="text-indigo-600" size={18} />
            <h2 className="font-bold text-slate-800 text-sm">Reports Library</h2>
          </div>
          <p className="text-[11px] text-slate-400">30+ reports reading directly from operational transactions</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-4 max-h-[calc(100vh-140px)]">
          {reportCategories.map(cat => (
            <div key={cat.category} className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3">
                {cat.category}
              </span>
              {cat.reports.map(rep => {
                const isActive = selectedReport === rep;
                return (
                  <button
                    key={rep}
                    onClick={() => setSelectedReport(rep)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">{rep}</span>
                    {isActive && <ChevronRight size={12} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area: Filter & Data Table */}
      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
        {/* Top Filter Bar (SRS Section 59) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
            <div>
              <h1 className="text-lg font-bold text-slate-800">{selectedReport}</h1>
              <span className="text-xs text-slate-500">Real-time operational reporting & GST compliance</span>
            </div>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors">
              <Download size={15} /> Export as XLSX
            </button>
          </div>

          {/* Filter Controls Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* From Date */}
            <div className="flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50">
              <span className="text-slate-400">From:</span>
              <input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none w-24"
              />
              <Calendar size={13} className="text-slate-400" />
            </div>

            {/* To Date */}
            <div className="flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50">
              <span className="text-slate-400">To:</span>
              <input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none w-24"
              />
              <Calendar size={13} className="text-slate-400" />
            </div>

            {/* Group Filter (SRS Section 59) */}
            <div className="flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-lg bg-white">
              <span className="text-slate-400">Group:</span>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none"
              >
                <option value="None">None</option>
                <option value="Category">Category</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            {/* Redemption Filter (SRS Section 59) */}
            <div className="flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-lg bg-white">
              <span className="text-slate-400">Redemption:</span>
              <select
                value={redemptionFilter}
                onChange={(e) => setRedemptionFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none"
              >
                <option value="All">All</option>
                <option value="Redeemed">Redeemed Only</option>
                <option value="Unredeemed">Unredeemed</option>
              </select>
            </div>

            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-xs transition-colors">
              Show Report
            </button>
          </div>
        </div>

        {/* Report Results Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto p-4 flex-1">
            <table className="w-full min-w-[750px] text-left border-collapse text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  {columns.map((col, idx) => (
                    <th key={idx} className="py-3 px-4">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td 
                        key={cellIdx} 
                        className={`py-3.5 px-4 ${
                          cellIdx === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'
                        } ${
                          cell.startsWith('+') ? 'text-emerald-600 font-bold' : cell.startsWith('-') ? 'text-rose-600 font-bold' : ''
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
            <span>Showing records for range {fromDate} → {toDate}</span>
            <span>{rows.length} rows loaded</span>
          </div>
        </div>
      </div>
    </div>
  );
}
