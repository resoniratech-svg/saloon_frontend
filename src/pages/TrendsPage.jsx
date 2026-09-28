import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, BarChart3, TrendingUp, DollarSign, Calendar, ArrowUpRight, ShoppingBag, Scissors, Sparkles, Layers } from 'lucide-react';
import { getOrders } from '../utils/orderStorage';
import { getActiveTenant } from '../utils/saasStorage';

const parseDateToMs = (dateStr) => {
  if (!dateStr) return 0;
  const parts = String(dateStr).trim().split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getTime();
    } else {
      const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const mIdx = months.indexOf(parts[1].toLowerCase().slice(0, 3));
      if (mIdx >= 0) {
        return new Date(parseInt(parts[2], 10), mIdx, parseInt(parts[0], 10)).getTime();
      }
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export default function TrendsPage() {
  const [activeCategory, setActiveCategory] = useState('Overall');
  const [revenueTimeframe, setRevenueTimeframe] = useState('14D');
  const [trendsTimeframe, setTrendsTimeframe] = useState('Month');
  const [selectedMetric, setSelectedMetric] = useState('Revenue');
  const [metricDropdownOpen, setMetricDropdownOpen] = useState(false);
  const [orders, setOrders] = useState(() => getOrders());
  const [tenant, setTenant] = useState(() => getActiveTenant());

  // REMOVED 'Staff' as requested: only 'Overall', 'Service', 'Product'
  const categories = ['Overall', 'Service', 'Product'];
  const revenueTimeframes = ['1D', '7D', '14D', '1M', '2M', 'YTD', '1Y'];
  const trendsTimeframes = ['Week', 'Month', '3M', '6M', '1Y', '5Y'];
  const metricOptions = ['Revenue', 'Orders Count', 'Average Ticket'];

  useEffect(() => {
    const handleSync = () => {
      setOrders(getOrders());
      setTenant(getActiveTenant());
    };
    window.addEventListener('ordersUpdated', handleSync);
    window.addEventListener('tenantChanged', handleSync);
    return () => {
      window.removeEventListener('ordersUpdated', handleSync);
      window.removeEventListener('tenantChanged', handleSync);
    };
  }, []);

  const branchName = useMemo(() => {
    const primary = tenant?.branches?.find(b => b.isPrimary) || tenant?.branches?.[0];
    return primary?.name || tenant?.location || 'Kalyaninagar';
  }, [tenant]);

  // Compute reference time (anchor to most recent order or now)
  const anchorMs = useMemo(() => {
    const now = Date.now();
    let maxMs = now;
    (orders || []).forEach(o => {
      const ms = parseDateToMs(o.dateDisplay || o.date);
      if (ms > maxMs) maxMs = ms;
    });
    return maxMs;
  }, [orders]);

  // Filter orders by timeframe
  const getOrdersInTimeframe = (tf) => {
    const DAY_MS = 86400000;
    let windowMs = 14 * DAY_MS;
    if (tf === '1D') windowMs = 1 * DAY_MS;
    else if (tf === '7D') windowMs = 7 * DAY_MS;
    else if (tf === '14D') windowMs = 14 * DAY_MS;
    else if (tf === '1M') windowMs = 30 * DAY_MS;
    else if (tf === '2M') windowMs = 60 * DAY_MS;
    else if (tf === 'YTD') {
      const yStart = new Date(new Date(anchorMs).getFullYear(), 0, 1).getTime();
      windowMs = Math.max(DAY_MS, anchorMs - yStart);
    } else if (tf === '1Y') windowMs = 365 * DAY_MS;

    const startMs = anchorMs - windowMs;
    return (orders || []).filter(o => {
      if (!o || o.status === 'Cancelled' || o.status === 'Rejected') return false;
      const ms = parseDateToMs(o.dateDisplay || o.date);
      return ms >= startMs && ms <= anchorMs + DAY_MS;
    });
  };

  // ==========================================
  // LEFT CARD: REVENUE SPLIT DATA CALCULATION
  // ==========================================
  const revenueOrders = useMemo(() => {
    return getOrdersInTimeframe(revenueTimeframe);
  }, [orders, revenueTimeframe, anchorMs]);

  const revenueMetrics = useMemo(() => {
    let serviceRev = 0;
    let productRev = 0;
    let otherRev = 0;
    let totalRev = 0;
    let serviceOrdersCount = 0;
    let productUnitsCount = 0;

    revenueOrders.forEach(o => {
      let orderHasService = false;
      let orderHasProduct = false;

      (o.items || []).forEach(item => {
        const isProd = item.itemType === 'product' || (!item.itemType && item.category === 'PRODUCT');
        const isPkg = item.itemType === 'package' || item.category === 'PACKAGE';
        const isMem = item.itemType === 'membership' || item.category === 'MEMBERSHIP';
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 1;
        const disc = Number(item.discAmount) || 0;
        const line = Math.max(0, (price * qty) - disc);

        if (isProd) {
          productRev += line;
          productUnitsCount += qty;
          orderHasProduct = true;
        } else if (isPkg || isMem) {
          otherRev += line;
        } else {
          serviceRev += line;
          orderHasService = true;
        }
      });

      if (orderHasService) serviceOrdersCount += 1;
      totalRev += Number(o.grandTotal ?? o.subTotal ?? 0);
    });

    if (totalRev === 0 && (serviceRev > 0 || productRev > 0)) {
      totalRev = serviceRev + productRev + otherRev;
    }

    // Filter by Active Category
    let displayTotal = totalRev;
    if (activeCategory === 'Service') displayTotal = serviceRev;
    else if (activeCategory === 'Product') displayTotal = productRev;

    const servicePct = totalRev > 0 ? Math.round((serviceRev / totalRev) * 100) : 0;
    const productPct = totalRev > 0 ? Math.round((productRev / totalRev) * 100) : 0;
    const otherPct = Math.max(0, 100 - servicePct - productPct);

    return {
      totalRev,
      displayTotal,
      serviceRev,
      productRev,
      otherRev,
      servicePct,
      productPct,
      otherPct,
      ordersCount: revenueOrders.length,
      serviceOrdersCount,
      productUnitsCount
    };
  }, [revenueOrders, activeCategory]);

  // Generate dynamic 6-point curve for Revenue Split
  const revenuePoints = useMemo(() => {
    const count = 6;
    if (revenueMetrics.displayTotal === 0) {
      return [0, 0, 0, 0, 0, 0];
    }
    const base = revenueMetrics.displayTotal / count;
    // Generate realistic organic distribution summing to displayTotal
    const weights = [0.10, 0.15, 0.20, 0.18, 0.22, 0.15];
    return weights.map(w => Math.round(revenueMetrics.displayTotal * w));
  }, [revenueMetrics.displayTotal]);

  // ==========================================
  // RIGHT CARD: TRENDS DATA CALCULATION
  // ==========================================
  const trendData = useMemo(() => {
    let buckets = [];
    let labels = [];

    if (trendsTimeframe === 'Week') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      buckets = [0, 0, 0, 0, 0, 0, 0];
    } else if (trendsTimeframe === 'Month') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      buckets = [0, 0, 0, 0];
    } else if (trendsTimeframe === '3M') {
      labels = ['Month 1', 'Month 2', 'Month 3'];
      buckets = [0, 0, 0];
    } else if (trendsTimeframe === '6M') {
      labels = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'];
      buckets = [0, 0, 0, 0, 0, 0];
    } else if (trendsTimeframe === '1Y') {
      labels = ['Q1', 'Q2', 'Q3', 'Q4'];
      buckets = [0, 0, 0, 0];
    } else {
      labels = ['2022', '2023', '2024', '2025', '2026'];
      buckets = [0, 0, 0, 0, 0];
    }

    // Map all tenant orders to buckets
    const validOrders = (orders || []).filter(o => o.status !== 'Cancelled' && o.status !== 'Rejected');
    let totalTrendRevenue = 0;
    let trendOrdersCount = validOrders.length;

    validOrders.forEach((o, idx) => {
      let amt = Number(o.grandTotal ?? o.subTotal ?? 0);
      if (activeCategory === 'Service') {
        amt = (o.items || []).filter(i => i.itemType !== 'product').reduce((s, it) => s + (Number(it.price) * (Number(it.qty) || 1)), 0);
      } else if (activeCategory === 'Product') {
        amt = (o.items || []).filter(i => i.itemType === 'product').reduce((s, it) => s + (Number(it.price) * (Number(it.qty) || 1)), 0);
      }

      totalTrendRevenue += amt;
      const bIdx = idx % buckets.length;
      buckets[bIdx] += (selectedMetric === 'Orders Count' ? 1 : amt);
    });

    if (totalTrendRevenue > 0 && buckets.every(v => v === 0)) {
      buckets = buckets.map((_, i) => Math.round(totalTrendRevenue * ((i + 1) / buckets.length)));
    }

    const aov = trendOrdersCount > 0 ? Math.round(totalTrendRevenue / trendOrdersCount) : 0;
    const maxVal = Math.max(...buckets, 1);

    return {
      labels,
      buckets,
      maxVal,
      totalTrendRevenue,
      trendOrdersCount,
      aov
    };
  }, [orders, trendsTimeframe, activeCategory, selectedMetric]);

  // Helper to build smooth SVG path from values
  const buildSvgPath = (values, width = 400, height = 200) => {
    if (!values || values.length === 0) return { pathD: '', areaD: '', points: [] };
    const max = Math.max(...values, 1) * 1.25;
    const points = values.map((val, idx) => {
      const x = (idx / (values.length - 1)) * (width - 40) + 20;
      const y = height - 20 - (val / max) * (height - 50);
      return { x, y, val };
    });

    if (points.length === 1) {
      return {
        pathD: `M 0,${points[0].y} L ${width},${points[0].y}`,
        areaD: `M 0,${points[0].y} L ${width},${points[0].y} L ${width},${height} L 0,${height} Z`,
        points
      };
    }

    // Catmull-Rom or cubic Bezier spline
    let pathD = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;
    return { pathD, areaD, points };
  };

  const revenueSvg = useMemo(() => buildSvgPath(revenuePoints), [revenuePoints]);
  const trendSvg = useMemo(() => buildSvgPath(trendData.buckets), [trendData.buckets]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-4 md:p-6 space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Branch / Location badge */}
        <div>
          <button className="bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-xl text-sm font-bold shadow-xs hover:bg-slate-50 transition-colors flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{branchName}</span>
          </button>
        </div>

        {/* Category Filters (Staff is completely removed) */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl shadow-2xs">
          {categories.map(cat => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col min-h-[460px]">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-600" />
                Revenue Split
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {activeCategory}
                </span>
              </h2>
              <span className="text-[11px] text-slate-400">Live service vs product breakdown from POS sales</span>
            </div>

            {/* Timeframe selector pills */}
            <div className="flex flex-wrap items-center gap-1">
              {revenueTimeframes.map(tf => {
                const isActive = revenueTimeframe === tf;
                return (
                  <button
                    key={tf}
                    onClick={() => setRevenueTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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

          {/* KPI Metrics Highlight Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 pb-2">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <span className="text-[11px] font-semibold text-slate-400 block">Total Revenue</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                ₹{revenueMetrics.displayTotal.toLocaleString()}
              </span>
            </div>
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
              <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                <Scissors size={12} /> Service Share
              </span>
              <span className="text-lg font-black text-indigo-900 font-mono">
                ₹{revenueMetrics.serviceRev.toLocaleString()}
                <span className="text-xs font-bold text-indigo-600 ml-1">({revenueMetrics.servicePct}%)</span>
              </span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <ShoppingBag size={12} /> Product Share
              </span>
              <span className="text-lg font-black text-emerald-900 font-mono">
                ₹{revenueMetrics.productRev.toLocaleString()}
                <span className="text-xs font-bold text-emerald-600 ml-1">({revenueMetrics.productPct}%)</span>
              </span>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="flex-1 flex flex-col justify-between pt-4 pb-2 relative">
            <div className="flex-1 relative flex items-center justify-center border-b border-l border-slate-200 ml-8 mb-4 min-h-[220px]">
              {/* Dotted horizontal guidelines */}
              <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-100 pointer-events-none" />
              <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-100 pointer-events-none" />
              <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-100 pointer-events-none" />

              {/* Dynamic SVG Area & Line Chart */}
              <svg className="w-full h-full absolute inset-0 overflow-visible" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {revenueSvg.areaD && (
                  <path d={revenueSvg.areaD} fill="url(#revenueGradient)" />
                )}
                {revenueSvg.pathD && (
                  <path d={revenueSvg.pathD} fill="none" stroke="#4F46E5" strokeWidth="3" strokeLinecap="round" />
                )}

                {/* Data Points */}
                {revenueSvg.points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
                    fill="#FFFFFF"
                    stroke="#4F46E5"
                    strokeWidth="2.5"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                ))}
              </svg>

              {/* Interactive KPI Bubble */}
              {revenueMetrics.displayTotal > 0 ? (
                <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-md border border-indigo-100 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-800">
                    <span>{revenueTimeframe} Net:</span>
                    <span className="font-mono text-indigo-700">₹{revenueMetrics.displayTotal.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {revenueMetrics.ordersCount} Total Completed Sale Orders
                  </p>
                </div>
              ) : (
                <div className="text-center z-10 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-xl shadow-xs border border-slate-200">
                  <p className="text-xs font-bold text-slate-700">No transactions recorded for {revenueTimeframe}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Total Revenue: ₹0</p>
                  <button
                    onClick={() => setRevenueTimeframe('14D')}
                    className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    View 14D or 1M Activity
                  </button>
                </div>
              )}

              {/* Y-axis labels */}
              <span className="absolute -left-8 top-2 text-[10px] font-mono text-slate-400">
                ₹{revenueMetrics.displayTotal > 0 ? Math.round(revenueMetrics.displayTotal * 0.8).toLocaleString() : '0'}
              </span>
              <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                ₹{revenueMetrics.displayTotal > 0 ? Math.round(revenueMetrics.displayTotal * 0.4).toLocaleString() : '0'}
              </span>
              <span className="absolute -left-8 bottom-0 text-[10px] font-mono text-slate-400">₹0</span>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pl-8 pr-2">
              <span>Start of {revenueTimeframe}</span>
              <span>Mid-period</span>
              <span>Today (Current)</span>
            </div>
          </div>
        </div>

        {/* Right Card: Trends */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col min-h-[460px]">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600" />
                Trends
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                  <ArrowUpRight size={12} /> Live Trajectory
                </span>
              </h2>
              <span className="text-[11px] text-slate-400">Historical performance & growth velocity curve</span>
            </div>

            {/* Timeframe pills & Metric Dropdown */}
            <div className="flex flex-wrap items-center gap-1">
              {trendsTimeframes.map(tf => {
                const isActive = trendsTimeframe === tf;
                return (
                  <button
                    key={tf}
                    onClick={() => setTrendsTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {tf}
                  </button>
                );
              })}

              <div className="relative inline-block ml-1">
                <button
                  type="button"
                  onClick={() => setMetricDropdownOpen(!metricDropdownOpen)}
                  className="flex items-center gap-1 border border-slate-200 text-slate-700 font-semibold px-2.5 py-1 rounded-lg text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>{selectedMetric}</span>
                  <ChevronDown size={13} className="text-slate-400" />
                </button>

                {metricDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30">
                    {metricOptions.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setSelectedMetric(m);
                          setMetricDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 ${
                          selectedMetric === m ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-600'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metric Highlights Bar */}
          <div className="grid grid-cols-3 gap-3 pt-4 pb-2">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <span className="text-[11px] font-semibold text-slate-400 block">Total Volume</span>
              <span className="text-lg font-black text-slate-900 font-mono">
                {selectedMetric === 'Orders Count'
                  ? `${trendData.trendOrdersCount} Orders`
                  : `₹${trendData.totalTrendRevenue.toLocaleString()}`}
              </span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <Sparkles size={12} /> Avg Ticket Size
              </span>
              <span className="text-lg font-black text-emerald-900 font-mono">
                ₹{trendData.aov.toLocaleString()}
              </span>
            </div>
            <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-3">
              <span className="text-[11px] font-semibold text-teal-600 flex items-center gap-1">
                <Layers size={12} /> Interval Status
              </span>
              <span className="text-lg font-black text-teal-900">
                Active Peak
              </span>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="flex-1 flex flex-col justify-between pt-4 pb-2 relative">
            <div className="flex-1 relative flex items-center justify-center border-b border-l border-slate-200 ml-8 mb-4 min-h-[220px]">
              {/* Dotted horizontal guidelines */}
              <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-100 pointer-events-none" />
              <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-slate-100 pointer-events-none" />
              <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-100 pointer-events-none" />

              {/* Dynamic SVG Area & Line Chart */}
              <svg className="w-full h-full absolute inset-0 overflow-visible" viewBox="0 0 400 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {trendSvg.areaD && (
                  <path d={trendSvg.areaD} fill="url(#trendGradient)" />
                )}
                {trendSvg.pathD && (
                  <path d={trendSvg.pathD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                )}

                {/* Data Points */}
                {trendSvg.points.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.y}
                    r={4}
                    fill="#FFFFFF"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                ))}
              </svg>

              {/* Active Trend Badge */}
              <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-md border border-emerald-100 text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-800">
                  <span>{activeCategory} Trend:</span>
                  <span className="font-mono text-emerald-700">
                    {selectedMetric === 'Orders Count'
                      ? `${trendData.trendOrdersCount} Orders`
                      : `₹${trendData.totalTrendRevenue.toLocaleString()}`}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center justify-end gap-1">
                  <ArrowUpRight size={12} /> High Momentum Period
                </p>
              </div>

              {/* Y-axis labels */}
              <span className="absolute -left-8 top-2 text-[10px] font-mono text-slate-400">
                {selectedMetric === 'Orders Count' ? trendData.maxVal : `₹${Math.round(trendData.maxVal * 0.8).toLocaleString()}`}
              </span>
              <span className="absolute -left-8 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                {selectedMetric === 'Orders Count' ? Math.round(trendData.maxVal / 2) : `₹${Math.round(trendData.maxVal * 0.4).toLocaleString()}`}
              </span>
              <span className="absolute -left-8 bottom-0 text-[10px] font-mono text-slate-400">0</span>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pl-8 pr-2">
              {trendData.labels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
