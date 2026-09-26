import React, { useState } from 'react';
import { MessageSquare, History, Search, Download, Calendar, Send, CheckCheck, AlertTriangle, Check, RefreshCw } from 'lucide-react';

export default function WhatsAppPage() {
  const [activeTab, setActiveTab] = useState('History'); // Chat, History
  const [fromDate, setFromDate] = useState('01-Aug-2026');
  const [toDate, setToDate] = useState('26-Aug-2026');
  const [searchMobile, setSearchMobile] = useState('');

  // Sample data conforming exactly to SRS Section 54
  const historyData = [
    {
      srNo: 1,
      date: '26-Aug-2026 10:45 AM',
      recipientName: 'Bhanu',
      recipientNumber: '+91 9876543210',
      message: 'Hi Bhanu, your invoice #9 for ₹540 has been generated. Thank you for visiting RESpark Salon!',
      templateName: 'salon_transaction_invoice_1',
      status: 'Sent',
      errorDetails: '-'
    },
    {
      srNo: 2,
      date: '25-Aug-2026 04:12 PM',
      recipientName: 'Priya Sharma',
      recipientNumber: '+91 9123456789',
      message: 'Hi Priya, thank you for your visit today! We would love your feedback: https://feedback.respark.in/f/821',
      templateName: 'salon_service_feedback_1',
      status: 'Delivered',
      errorDetails: '-'
    },
    {
      srNo: 3,
      date: '24-Aug-2026 01:20 PM',
      recipientName: 'Rahul M',
      recipientNumber: '+91 9988776655',
      message: 'Refer a friend and get 10% off your next hair styling session! Your code: REF001',
      templateName: 'referral_reward_percentage',
      status: 'Failed',
      errorDetails: 'Message Undeliverable: Recipient phone was unreachable'
    },
    {
      srNo: 4,
      date: '22-Aug-2026 11:30 AM',
      recipientName: 'Anita Roy',
      recipientNumber: '+91 9811002233',
      message: 'Hi Anita, reminder for your upcoming Mani & Pedi appointment tomorrow at 11:00 AM.',
      templateName: 'salon_appointment_reminder',
      status: 'Delivered',
      errorDetails: '-'
    },
  ];

  const filteredHistory = historyData.filter(item => 
    !searchMobile || item.recipientNumber.includes(searchMobile) || item.recipientName.toLowerCase().includes(searchMobile.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">WhatsApp Communication</h1>
          <p className="text-xs text-slate-500 mt-1">Automated transactional messaging, bills, appointment reminders, and customer chat</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          {[
            { id: 'History', label: 'History & Logs', icon: History },
            { id: 'Chat', label: 'Live Chat', icon: MessageSquare },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. WHATSAPP HISTORY (SRS Section 54)                     */}
      {/* ======================================================== */}
      {activeTab === 'History' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
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

              <div className="flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-lg w-56">
                <Search size={14} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Mobile Number"
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 outline-none w-full"
                />
              </div>

              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-xs transition-colors">
                Show History
              </button>
            </div>

            <button
              onClick={() => alert('Downloading WhatsApp message audit logs...')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Download size={14} /> Download
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[950px] text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Sr No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Recipient Name</th>
                    <th className="py-3 px-4">Recipient Number</th>
                    <th className="py-3 px-4">Template Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Error Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map(item => (
                    <tr key={item.srNo} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{item.srNo}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{item.date}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{item.recipientName}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">{item.recipientNumber}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                          {item.templateName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.status === 'Delivered' || item.status === 'Sent'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-rose-600 font-medium">{item.errorDetails}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CHAT SIMULATION                                       */}
      {/* ======================================================== */}
      {activeTab === 'Chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row h-[560px] overflow-hidden">
          {/* Chat Contact List */}
          <div className="w-full md:w-80 border-r border-slate-200 flex flex-col">
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <input
                type="text"
                placeholder="Search chats..."
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
              />
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {['Bhanu', 'Priya Sharma', 'Rahul M', 'Anita Roy'].map((name, idx) => (
                <div key={name} className={`p-3.5 hover:bg-slate-50 cursor-pointer ${idx === 0 ? 'bg-indigo-50/50' : ''}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-800">{name}</span>
                    <span className="text-[10px] text-slate-400">10:45 AM</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-1">Invoice generated and sent</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conversation Panel */}
          <div className="flex-1 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Bhanu</h3>
                <span className="text-xs text-emerald-600 font-medium">WhatsApp Connected</span>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-xs text-xs max-w-sm shadow-xs space-y-1">
                  <p>Hi Bhanu, your invoice #9 for ₹540 has been generated. Thank you for visiting RESpark Salon!</p>
                  <span className="text-[10px] text-indigo-200 block text-right">10:45 AM ✓✓</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                placeholder="Type WhatsApp message..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600"
              />
              <button className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700">
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
