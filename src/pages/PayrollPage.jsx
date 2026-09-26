import React, { useState, useEffect } from 'react';
import { FileText, DollarSign, Download, Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { getMasterStaff } from '../utils/staffStorage.js';

export default function PayrollPage() {
  const [masterStaff, setMasterStaff] = useState(() => getMasterStaff());

  useEffect(() => {
    const handleUpdate = () => setMasterStaff(getMasterStaff());
    window.addEventListener('staffUpdated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.removeEventListener('staffUpdated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);
  const [activeTab, setActiveTab] = useState('Payslip'); // Payslip, Salary Management
  const [selectedStaff, setSelectedStaff] = useState('Respark Trial');
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [showSlip, setShowSlip] = useState(false);
  const [payrollConfigMissing, setPayrollConfigMissing] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];

  const salaryData = [
    { id: 1, staff: 'Respark Trial', designation: 'Senior Stylist', basic: 25000, commission: 8500, deduction: 1500, net: 32000, status: 'Processed' },
    { id: 2, staff: 'Sohum K', designation: 'Color Specialist', basic: 22000, commission: 6200, deduction: 1200, net: 27000, status: 'Processed' },
    { id: 3, staff: 'Swati R', designation: 'Beautician & Spa', basic: 20000, commission: 7800, deduction: 1000, net: 26800, status: 'Processed' },
    { id: 4, staff: 'Akshay D', designation: 'Grooming Expert', basic: 18000, commission: 4500, deduction: 800, net: 21700, status: 'Pending' },
    { id: 5, staff: 'Madhu G', designation: 'Hair Stylist', basic: 19000, commission: 5100, deduction: 900, net: 23200, status: 'Pending' },
  ];

  const handleShowPayslip = () => {
    // Demonstration of SRS Section 52: "when payroll configuration is absent: Show Payslip -> Payroll config not found"
    if (selectedStaff === 'Madhu G') {
      setPayrollConfigMissing(true);
      setShowSlip(false);
    } else {
      setPayrollConfigMissing(false);
      setShowSlip(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Payroll Management</h1>
          <p className="text-xs text-slate-500 mt-1">Manage staff salary structures, process monthly payslips, and export records</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          {['Payslip', 'Salary Management'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPayrollConfigMissing(false); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. PAYSLIP GENERATION (SRS Section 52)                   */}
      {/* ======================================================== */}
      {activeTab === 'Payslip' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Staff Member</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600"
                >
                  {masterStaff?.map(st => (
                    <option key={st.id} value={st.name}>{st.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600"
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-600"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2 pt-5">
                <button
                  onClick={handleShowPayslip}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Show Payslip
                </button>
              </div>
            </div>
          </div>

          {/* Payroll Config Not Found Warning (SRS Section 52) */}
          {payrollConfigMissing && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-3 text-rose-800">
              <AlertCircle className="text-rose-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-bold text-sm">Payroll config not found</h3>
                <p className="text-xs text-rose-600 mt-1">
                  Salary configuration is missing for {selectedStaff}. Please configure salary rules under Staff Management before generating payslips.
                </p>
              </div>
            </div>
          )}

          {/* Generated Payslip Card */}
          {showSlip && !payrollConfigMissing && (
            <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">RESpark Salon</h2>
                  <p className="text-xs text-slate-500">Payslip for {selectedMonth} {selectedYear}</p>
                </div>
                <button
                  onClick={() => alert('Downloading PDF Payslip...')}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Employee Name:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedStaff}</p>
                </div>
                <div>
                  <span className="text-slate-400">Designation:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">Senior Stylist</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-bold text-slate-800">₹25,000</span>
                </div>
                <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600">Service & Product Commission</span>
                  <span className="font-bold text-emerald-600">+₹8,500</span>
                </div>
                <div className="flex justify-between items-center text-sm py-2 border-b border-slate-100">
                  <span className="text-slate-600">Professional Deductions / TDS</span>
                  <span className="font-bold text-rose-600">-₹1,500</span>
                </div>
                <div className="flex justify-between items-center text-base py-3 bg-slate-50 px-4 rounded-xl font-bold">
                  <span className="text-slate-800">Net Salary Payable</span>
                  <span className="text-indigo-600 text-lg">₹32,000</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SALARY MANAGEMENT (SRS Section 53)                    */}
      {/* ======================================================== */}
      {activeTab === 'Salary Management' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
              >
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold">
                Show Salary
              </button>
            </div>

            <button
              onClick={() => alert('Exporting all salaries to XLSX...')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Download size={14} /> Export All
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[700px] text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Basic Pay</th>
                    <th className="py-3 px-4">Commission</th>
                    <th className="py-3 px-4">Deductions</th>
                    <th className="py-3 px-4 font-bold text-slate-800">Net Pay</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salaryData.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{s.staff}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{s.designation}</td>
                      <td className="py-3.5 px-4 text-slate-600">₹{s.basic.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-emerald-600 font-medium">+₹{s.commission.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-rose-500 font-medium">-₹{s.deduction.toLocaleString()}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">₹{s.net.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          s.status === 'Processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
