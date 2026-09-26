import React, { useState } from 'react';
import { ChevronDown, BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function TrendsPage() {
  const [activeCategory, setActiveCategory] = useState('Overall');
  const [revenueTimeframe, setRevenueTimeframe] = useState('1D');
  const [trendsTimeframe, setTrendsTimeframe] = useState('Week');

  const categories = ['Overall', 'Service', 'Product', 'Staff'];
  const revenueTimeframes = ['1D', '7D', '14D', '1M', '2M', 'YTD', '1Y'];
  const trendsTimeframes = ['Week', 'Month', '3M', '6M', '1Y', '5Y'];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Branch / Location pill */}
        <div>
          <button className="bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors">
            Kalyaninagar
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl">
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Left Card: Revenue Split */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col min-h-[420px]">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Revenue Split</h2>
            
            {/* Timeframe pills */}
            <div className="flex flex-wrap items-center gap-1">
              {revenueTimeframes.map(tf => {
                const isActive = revenueTimeframe === tf;
                return (
                  <button
                    key={tf}
                    onClick={() => setRevenueTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="flex-1 flex flex-col justify-between pt-6 pb-2 relative">
            {/* Chart Grid Lines & Empty / Placeholder Chart */}
            <div className="flex-1 relative flex items-center justify-center border-b border-l border-slate-200 ml-6 mb-6">
              {/* Dotted horizontal guidelines */}
              <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-100 pointer-events-none" />
              <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-100 pointer-events-none" />
              <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-100 pointer-events-none" />

              {/* Decorative SVG curve / chart representation */}
              <svg className="w-full h-full absolute inset-0 text-indigo-500/20" viewBox="0 0 400 200" preserveAspectRatio="none">
                <path
                  d="M 0,180 Q 100,160 200,120 T 400,90 L 400,200 L 0,200 Z"
                  fill="currentColor"
                />
                <path
                  d="M 0,180 Q 100,160 200,120 T 400,90"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2.5"
                />
              </svg>

              <div className="text-center z-10 bg-white/80 backdrop-blur-xs px-4 py-2 rounded-xl shadow-xs border border-slate-100">
                <p className="text-xs font-semibold text-slate-700">No revenue split recorded for {revenueTimeframe}</p>
                <p className="text-[11px] text-slate-400">Total Revenue: ₹0</p>
              </div>

              {/* Y-axis label */}
              <span className="absolute -left-6 bottom-0 text-[11px] text-slate-400">0</span>
            </div>

            {/* X-axis label */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 pl-6">
              <span>0</span>
              <span className="rotate-[-25deg] origin-top-left">Auto</span>
            </div>
          </div>
        </div>

        {/* Right Card: Trends */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col min-h-[420px]">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Trends</h2>

            {/* Timeframe pills & Dropdown */}
            <div className="flex flex-wrap items-center gap-1">
              {trendsTimeframes.map(tf => {
                const isActive = trendsTimeframe === tf;
                return (
                  <button
                    key={tf}
                    onClick={() => setTrendsTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {tf}
                  </button>
                );
              })}

              <div className="relative inline-block ml-1">
                <button className="flex items-center gap-1 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-xs hover:bg-slate-50">
                  Select <ChevronDown size={13} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="flex-1 flex flex-col justify-between pt-6 pb-2 relative">
            {/* Chart Grid Lines & Empty / Placeholder Chart */}
            <div className="flex-1 relative flex items-center justify-center border-b border-l border-slate-200 ml-6 mb-6">
              {/* Dotted horizontal guidelines */}
              <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-100 pointer-events-none" />
              <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-100 pointer-events-none" />
              <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-100 pointer-events-none" />

              {/* Decorative trend line */}
              <svg className="w-full h-full absolute inset-0 text-emerald-500/20" viewBox="0 0 400 200" preserveAspectRatio="none">
                <path
                  d="M 0,190 Q 120,170 220,130 T 400,80 L 400,200 L 0,200 Z"
                  fill="currentColor"
                />
                <path
                  d="M 0,190 Q 120,170 220,130 T 400,80"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                />
              </svg>

              <div className="text-center z-10 bg-white/80 backdrop-blur-xs px-4 py-2 rounded-xl shadow-xs border border-slate-100">
                <p className="text-xs font-semibold text-slate-700">No trend data for {trendsTimeframe}</p>
                <p className="text-[11px] text-slate-400">Showing {activeCategory} Trends</p>
              </div>

              {/* Y-axis label */}
              <span className="absolute -left-6 bottom-0 text-[11px] text-slate-400">0</span>
            </div>

            {/* X-axis label */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 pl-6">
              <span>0</span>
              <span>Auto</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
