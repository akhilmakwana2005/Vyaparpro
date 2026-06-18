import { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { getInvoices } from '../../redux/billingSlice';
import { getExpenses } from '../../redux/expenseSlice';
import { getCustomers } from '../../redux/customerSlice';
import { getProducts } from '../../redux/productSlice';
import {
  TrendingUp, TrendingDown, Users, ShoppingBag, Wallet, BarChart2,
  ArrowLeft, Star, Calendar, Download
} from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const KPICard = ({ title, value, sub, icon: Icon, iconBg, iconText, trend, isPositive }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-soft flex flex-col gap-3">
    <div className="flex justify-between items-start">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg} ${iconText}`}>
        <Icon size={16} />
      </div>
    </div>
    <div>
      <h3 className="text-2xl font-black text-gray-900">{value}</h3>
      {sub && <p className="text-xs text-gray-400 font-medium mt-0.5">{sub}</p>}
    </div>
    {trend && (
      <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {trend}
      </div>
    )}
  </div>
);

// Helper to get date bounds
const getDateBounds = (filter) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  
  const prevStart = new Date(now);
  const prevEnd = new Date(now);

  end.setHours(23, 59, 59, 999);

  if (filter === 'This Month') {
    start.setDate(1); start.setHours(0, 0, 0, 0);
    prevStart.setMonth(prevStart.getMonth() - 1); prevStart.setDate(1); prevStart.setHours(0, 0, 0, 0);
    prevEnd.setDate(0); prevEnd.setHours(23, 59, 59, 999);
  } else if (filter === 'Last Month') {
    start.setMonth(start.getMonth() - 1); start.setDate(1); start.setHours(0, 0, 0, 0);
    end.setDate(0); end.setHours(23, 59, 59, 999);
    
    prevStart.setMonth(prevStart.getMonth() - 2); prevStart.setDate(1); prevStart.setHours(0, 0, 0, 0);
    prevEnd.setMonth(prevEnd.getMonth() - 1); prevEnd.setDate(0); prevEnd.setHours(23, 59, 59, 999);
  } else if (filter === 'This Year') {
    start.setMonth(0, 1); start.setHours(0, 0, 0, 0);
    prevStart.setFullYear(prevStart.getFullYear() - 1); prevStart.setMonth(0, 1); prevStart.setHours(0, 0, 0, 0);
    prevEnd.setFullYear(prevEnd.getFullYear() - 1); prevEnd.setMonth(11, 31); prevEnd.setHours(23, 59, 59, 999);
  } else {
    // All Time
    start.setTime(0);
    prevStart.setTime(0);
    prevEnd.setTime(0);
  }

  return { start, end, prevStart, prevEnd };
};

export default function Analytics() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { invoices = []  } = useSelector((s) => s.billing   || {});
  const { expenses = []  } = useSelector((s) => s.expense   || {});
  const { customers = [] } = useSelector((s) => s.customer  || {});
  const { products = []  } = useSelector((s) => s.product   || {});

  const [dateFilter, setDateFilter] = useState('This Month');

  useEffect(() => {
    dispatch(getInvoices());
    dispatch(getExpenses());
    dispatch(getCustomers());
    dispatch(getProducts());
  }, [dispatch]);

  // ── Dynamic Filtering ───────────────────────────────────────────────────────
  const { filteredInvoices, prevInvoices, filteredExpenses, prevExpenses, filteredCustomers, prevCustomers } = useMemo(() => {
    const { start, end, prevStart, prevEnd } = getDateBounds(dateFilter);
    
    return {
      filteredInvoices: invoices.filter(i => {
        const d = new Date(i.createdAt);
        return d >= start && d <= end;
      }),
      prevInvoices: invoices.filter(i => {
        const d = new Date(i.createdAt);
        return d >= prevStart && d <= prevEnd;
      }),
      filteredExpenses: expenses.filter(e => {
        const d = new Date(e.createdAt || e.date);
        return d >= start && d <= end;
      }),
      prevExpenses: expenses.filter(e => {
        const d = new Date(e.createdAt || e.date);
        return d >= prevStart && d <= prevEnd;
      }),
      filteredCustomers: customers.filter(c => {
        const d = new Date(c.createdAt);
        return d >= start && d <= end;
      }),
      prevCustomers: customers.filter(c => {
        const d = new Date(c.createdAt);
        return d >= prevStart && d <= prevEnd;
      })
    };
  }, [invoices, expenses, customers, dateFilter]);

  // ── Revenue Growth Calculation ─────────────────────────────────────────────
  const currentRev = filteredInvoices.filter(i => i.status === 'Paid').reduce((a, b) => a + (b.total || 0), 0);
  const prevRev = prevInvoices.filter(i => i.status === 'Paid').reduce((a, b) => a + (b.total || 0), 0);
  
  const growthPct = useMemo(() => {
    if (dateFilter === 'All Time') return null;
    if (prevRev === 0) return currentRev > 0 ? 100 : 0;
    return (((currentRev - prevRev) / prevRev) * 100).toFixed(1);
  }, [currentRev, prevRev, dateFilter]);

  // ── Top Customer ────────────────────────────────────────────────────────────
  const topCustomer = useMemo(() => {
    const map = {};
    filteredInvoices.filter(i => i.status === 'Paid').forEach(inv => {
      const key = inv.customerName || 'Walk-in';
      map[key] = (map[key] || 0) + (inv.total || 0);
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], value: sorted[0][1] } : null;
  }, [filteredInvoices]);

  // ── Top Product ─────────────────────────────────────────────────────────────
  const topProduct = useMemo(() => {
    const map = {};
    filteredInvoices.filter(i => i.status === 'Paid').forEach(inv => {
      inv.items.forEach(item => {
        map[item.name] = (map[item.name] || 0) + ((item.price || 0) * item.quantity);
      });
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { name: sorted[0][0], value: sorted[0][1] } : null;
  }, [filteredInvoices]);

  // ── Expense Ratio ───────────────────────────────────────────────────────────
  const totalExpenses = filteredExpenses.reduce((a, b) => a + (b.amount || 0), 0);
  const netProfit = currentRev - totalExpenses;
  const expenseRatio = currentRev > 0 ? Math.round((totalExpenses / currentRev) * 100) : (totalExpenses > 0 ? 100 : 0);

  const donutData = currentRev > 0 || totalExpenses > 0
    ? [{ name: 'Profit', value: Math.max(netProfit, 0) }, { name: 'Expenses', value: totalExpenses }]
    : [{ name: 'No Data', value: 1 }];

  // ── Revenue Growth Chart (last 6 months, static for visual trend) ──────────
  const revenueGrowthData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i;
      let m = now.getMonth() - offset;
      let y = now.getFullYear();
      if (m < 0) { m += 12; y -= 1; }
      const revenue = invoices
        .filter(inv => inv.status === 'Paid' &&
          new Date(inv.createdAt).getMonth() === m &&
          new Date(inv.createdAt).getFullYear() === y)
        .reduce((a, b) => a + (b.total || 0), 0);
      return { month: MONTHS[m], revenue };
    });
  }, [invoices]);

  // ── Best Selling Days ───────────────────────────────────────────────────────
  const bestDaysData = useMemo(() => {
    const dayMap = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    filteredInvoices.filter(inv => inv.status === 'Paid').forEach(inv => {
      const d = new Date(inv.createdAt).getDay();
      dayMap[d] += inv.total || 0;
    });
    return DAYS.map((name, i) => ({ name, sales: dayMap[i] }));
  }, [filteredInvoices]);

  // ── Low Stock Count ─────────────────────────────────────────────────────────
  const lowStockCount = products.filter(p => p.stock <= (p.minStockAlert || 5)).length;

  const handleExportCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Date Filter', dateFilter],
      ['Total Revenue', currentRev],
      ['Total Expenses', totalExpenses],
      ['Net Profit', netProfit],
      ['Total Invoices', filteredInvoices.length],
      ['New Customers', filteredCustomers.length],
      ['Top Customer', topCustomer ? topCustomer.name : 'N/A'],
      ['Best Product', topProduct ? topProduct.name : 'N/A'],
      ['Expense Ratio (%)', expenseRatio]
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n' 
      + rows.map(e => e.join(',')).join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analytics_export_${dateFilter.replace(' ', '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
            <p className="text-sm text-gray-500 mt-0.5">Deep-dive into your business performance metrics.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-sm font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2.5 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="This Month">This Month</option>
            <option value="Last Month">Last Month</option>
            <option value="This Year">This Year</option>
            <option value="All Time">All Time</option>
          </select>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={`Revenue (${dateFilter})`}
          value={`₹ ${currentRev.toLocaleString('en-IN')}`}
          sub={dateFilter !== 'All Time' ? `vs prev period: ₹${prevRev.toLocaleString('en-IN')}` : 'Total accumulated revenue'}
          icon={TrendingUp}
          iconBg="bg-green-50"
          iconText="text-green-500"
          trend={growthPct !== null ? `${growthPct > 0 ? '+' : ''}${growthPct}%` : null}
          isPositive={Number(growthPct) >= 0}
        />
        <KPICard
          title="Top Customer"
          value={topCustomer?.name || '—'}
          sub={topCustomer ? `₹ ${topCustomer.value.toLocaleString('en-IN')} total` : 'No paid invoices yet'}
          icon={Users}
          iconBg="bg-purple-50"
          iconText="text-purple-500"
        />
        <KPICard
          title="Best Product"
          value={topProduct?.name || '—'}
          sub={topProduct ? `₹ ${topProduct.value.toLocaleString('en-IN')} revenue` : 'No sales yet'}
          icon={Star}
          iconBg="bg-yellow-50"
          iconText="text-yellow-500"
        />
        <KPICard
          title="Expense Ratio"
          value={`${expenseRatio}%`}
          sub="expenses vs revenue"
          icon={Wallet}
          iconBg={expenseRatio > 80 ? 'bg-red-50' : 'bg-blue-50'}
          iconText={expenseRatio > 80 ? 'text-red-500' : 'text-blue-500'}
          trend={`${lowStockCount} items low stock globally`}
          isPositive={lowStockCount === 0}
        />
      </div>

      {/* Revenue Growth Chart + Expense Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
          <div className="mb-5">
            <h3 className="font-bold text-gray-900">Revenue Growth Trend</h3>
            <p className="text-xs text-gray-400 mt-0.5">Monthly revenue over the last 6 months</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueGrowthData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B4CF0" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#5B4CF0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={v => [`₹ ${v.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#5B4CF0" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#5B4CF0', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit vs Expense Donut */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900">Profit vs Expenses</h3>
            <p className="text-xs text-gray-400 mt-0.5">Financial health for {dateFilter}</p>
          </div>
          <div className="flex-1 relative min-h-[180px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={65} outerRadius={85}
                  paddingAngle={donutData.length > 1 ? 3 : 0} dataKey="value" stroke="none">
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#10b981' : '#f87171'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={v => [`₹ ${v.toLocaleString('en-IN')}`]}
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`text-xl font-black ${netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {netProfit >= 0 ? '' : '−'}₹{Math.abs(netProfit).toLocaleString('en-IN', { notation: 'compact', maximumFractionDigits: 1 })}
              </span>
              <span className="text-[10px] text-gray-400 font-bold mt-0.5">Net Profit</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {[
              { label: 'Profit',   color: 'bg-emerald-500', value: `₹ ${Math.max(netProfit, 0).toLocaleString('en-IN')}` },
              { label: 'Expenses', color: 'bg-red-400',     value: `₹ ${totalExpenses.toLocaleString('en-IN')}` },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-xs font-semibold text-gray-600">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Best Selling Days */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
          <div className="mb-5">
            <h3 className="font-bold text-gray-900">Best Selling Days</h3>
            <p className="text-xs text-gray-400 mt-0.5">Revenue by day of week ({dateFilter})</p>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bestDaysData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                  formatter={v => [`₹ ${v.toLocaleString('en-IN')}`, 'Sales']}
                />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {bestDaysData.map((entry, i) => {
                    const max = Math.max(...bestDaysData.map(d => d.sales));
                    return <Cell key={i} fill={entry.sales === max && max > 0 ? '#5B4CF0' : '#c7d2fe'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Summary Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <BarChart2 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Business Summary</h3>
              <p className="text-xs text-gray-400 mt-0.5">Key performance indicators ({dateFilter})</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-gray-100 flex-1">
            {[
              { label: 'Total Revenue',  value: `₹ ${currentRev.toLocaleString('en-IN')}`,      color: 'text-green-600' },
              { label: 'Total Expenses', value: `₹ ${totalExpenses.toLocaleString('en-IN')}`,     color: 'text-red-500'   },
              { label: 'Total Invoices', value: filteredInvoices.length,                                    color: 'text-primary'   },
              { label: 'New Customers',  value: filteredCustomers.length,                                   color: 'text-purple-600'},
              { label: 'Total Products', value: products.length,                                    color: 'text-blue-600'  },
              { label: 'Low Stock Items',value: lowStockCount,                                      color: lowStockCount > 0 ? 'text-orange-500' : 'text-gray-400' },
              { label: 'Pending Bills',  value: filteredInvoices.filter(i=>i.status==='Pending').length,   color: 'text-orange-500'},
              { label: 'Paid Bills',     value: filteredInvoices.filter(i=>i.status==='Paid').length,      color: 'text-green-600' },
            ].map((item, i) => (
              <div key={i} className="p-5 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{item.label}</p>
                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
