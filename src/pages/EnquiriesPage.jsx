import React, { useState } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, Calendar, Phone, Mail, Share2, Award, UserCheck, X } from 'lucide-react';

export default function EnquiriesPage() {
  const [activeTab, setActiveTab] = useState('Enquiries'); // Enquiries, Referral Dashboard

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Form State (SRS Section 48 & 49)
  const [form, setForm] = useState({
    followUpDate: '26-Aug-2026',
    contactNumber: '+91 9876501234',
    name: 'Kavita Singh',
    email: 'kavita@example.com',
    priority: 'High',
    status: 'Following Up',
    service: 'Bridal Glow Package',
    description: 'Enquired about 3-day bridal treatment package and pricing',
  });

  const [enquiries, setEnquiries] = useState([
    {
      id: 1,
      mobile: '+91 9876501234',
      name: 'Kavita Singh',
      email: 'kavita@example.com',
      priority: 'High',
      status: 'Following Up',
      service: 'Bridal Glow Package',
      description: 'Enquired about 3-day bridal treatment package and pricing',
      createdOn: '20-Aug-2026',
      followUp: '26-Aug-2026',
      lastUpdatedOn: '21-Aug-2026',
      lastUpdatedBy: 'Siri H'
    },
    {
      id: 2,
      mobile: '+91 9811223344',
      name: 'Rohan Verma',
      email: 'rohan.v@gmail.com',
      priority: 'Medium',
      status: 'Converted',
      service: 'Hair Color Highlights',
      description: 'Interested in global caramel highlights',
      createdOn: '18-Aug-2026',
      followUp: '22-Aug-2026',
      lastUpdatedOn: '22-Aug-2026',
      lastUpdatedBy: 'Sohum K'
    },
  ]);

  const handleOpenEdit = (enq) => {
    setSelectedEnquiry(enq);
    setForm({
      followUpDate: enq.followUp,
      contactNumber: enq.mobile,
      name: enq.name,
      email: enq.email,
      priority: enq.priority,
      status: enq.status,
      service: enq.service,
      description: enq.description,
    });
    setShowEditModal(true);
  };

  const handleSaveAdd = () => {
    const newEnq = {
      id: enquiries.length + 1,
      mobile: form.contactNumber,
      name: form.name,
      email: form.email,
      priority: form.priority,
      status: form.status,
      service: form.service,
      description: form.description,
      createdOn: '26-Aug-2026',
      followUp: form.followUpDate,
      lastUpdatedOn: '26-Aug-2026',
      lastUpdatedBy: 'Siri H'
    };
    setEnquiries([newEnq, ...enquiries]);
    setShowAddModal(false);
  };

  const handleSaveEdit = () => {
    setEnquiries(enquiries.map(enq => enq.id === selectedEnquiry.id ? {
      ...enq,
      service: form.service,
      status: form.status,
      followUp: form.followUpDate,
      description: form.description,
      lastUpdatedOn: '26-Aug-2026',
      lastUpdatedBy: 'Siri H'
    } : enq));
    setShowEditModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Enquiries & Referrals</h1>
          <p className="text-xs text-slate-500 mt-1">Track prospective client requests, schedule follow-ups, and review customer referral rewards</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl">
          {['Enquiries', 'Referral Dashboard'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
      {/* 1. ENQUIRIES LIST (SRS Section 48 & 49)                   */}
      {/* ======================================================== */}
      {activeTab === 'Enquiries' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-800">Customer Follow-up Enquiries</h2>
              <p className="text-xs text-slate-500">Track and convert incoming salon leads</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus size={16} /> Add Enquiry
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[950px] text-left border-collapse text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Follow Up</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enquiries.map(enq => (
                    <tr key={enq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">{enq.mobile}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{enq.name}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          enq.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {enq.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          enq.status === 'Converted' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {enq.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{enq.service}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{enq.followUp}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">{enq.lastUpdatedOn} by {enq.lastUpdatedBy}</td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenEdit(enq)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          title="Edit Enquiry"
                        >
                          <Edit2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. REFERRAL DASHBOARD (SRS Section 50)                   */}
      {/* ======================================================== */}
      {activeTab === 'Referral Dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Referral Reward Rate</span>
              <div className="text-2xl font-bold text-slate-800 mt-1">10% Off</div>
              <span className="text-[11px] text-emerald-600">On referee's first service visit</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Referrals Issued</span>
              <div className="text-2xl font-bold text-indigo-600 mt-1">28 Codes</div>
              <span className="text-[11px] text-slate-400">Generated by CRM guests</span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Converted Referrals</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">12 Bookings</div>
              <span className="text-[11px] text-slate-400">₹24,500 additional revenue</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Share2 size={24} />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Referral Program Active</h3>
              <p className="text-xs text-slate-500">
                Customers receive automated SMS/WhatsApp referral links upon completing their invoice. When referees visit, points automatically credit to the referrer's loyalty balance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ADD ENQUIRY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Add New Enquiry</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Name*</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contact Number*</label>
                <input
                  type="text"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Follow-up Date*</label>
                <input
                  type="text"
                  value={form.followUpDate}
                  onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Service Interested*</label>
                <input
                  type="text"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="Following Up">Following Up</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSaveAdd} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ENQUIRY MODAL (SRS Section 49: Pencil -> Edit -> Update Service -> Submit) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Edit Enquiry</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Update Service</label>
                <input
                  type="text"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="Following Up">Following Up</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Follow-up Date</label>
                <input
                  type="text"
                  value={form.followUpDate}
                  onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleSaveEdit} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-sm">Update Enquiry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
