import { useState, useEffect, useMemo } from 'react';
import { Table, TrendingUp, TrendingDown, Banknote, ReceiptText, Package, BarChart2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { getInvoices } from '../../redux/billingSlice';
import { getExpenses } from '../../redux/expenseSlice';
import { downloadCSV } from '../../utils/exportCsv';
import { useNavigate } from 'react-router-dom';

export default function SalesReport() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [range, setRange] = useState('All Time');
  const [chartRange, setChartRange] = useState('Last 6 Months');

  const { invoices = [] } = useSelector((state) => state.billing || {});
  const { expenses = [] } = useSelector((state) => state.expense || {});

  useEffect(() => {
    dispatch(getInvoices());
    dispatch(getExpenses());
  }, [dispatch]);

  // Calculations Helper for range
  const { filteredInvoices, filteredExpenses } = useMemo(() => {
    const now = new Date();
    let start, end;

    if (range === 'This Month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (range === 'Last Month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (range === 'This Year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else {
      start = new Date(0);
      end = new Date(now.getFullYear() + 10, 11, 31);
    }

    const fInv = invoices.filter(i => {
      const d = new Date(i.createdAt);
      return d >= start && d <= end;
    });

    const fExp = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });

    return { filteredInvoices: fInv, filteredExpenses: fExp };
  }, [invoices, expenses, range]);

  // Calculate stats
  const totalSales = filteredInvoices
    .filter(inv => inv.status === 'Paid')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  
  const netProfit = totalSales - totalExpenses;
  const isProfit = netProfit >= 0;

  const totalBills = filteredInvoices.length;
  const avgBillValue = totalBills > 0 ? (totalSales / totalBills) : 0;

  // Chart Data (Revenue vs Expense)
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    if (chartRange === 'Last 6 Months') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentMonth = now.getMonth();
      for (let i = 5; i >= 0; i--) {
        let m = currentMonth - i;
        let y = now.getFullYear();
        if (m < 0) {
          m += 12;
          y -= 1;
        }
        const monthSales = invoices
          .filter(inv => inv.status === 'Paid' && new Date(inv.createdAt).getMonth() === m && new Date(inv.createdAt).getFullYear() === y)
          .reduce((acc, curr) => acc + (curr.total || 0), 0);

        const monthExpenses = expenses
          .filter(exp => new Date(exp.date).getMonth() === m && new Date(exp.date).getFullYear() === y)
          .reduce((acc, curr) => acc + (curr.amount || 0), 0);

        data.push({ month: months[m], sales: monthSales, expenses: monthExpenses });
      }
    } else if (chartRange === 'This Year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i <= now.getMonth(); i++) {
        const start = new Date(now.getFullYear(), i, 1);
        const end = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59);
        const s = invoices.filter(inv => inv.status === 'Paid' && new Date(inv.createdAt) >= start && new Date(inv.createdAt) <= end).reduce((a,b) => a+(b.total||0), 0);
        const e = expenses.filter(exp => new Date(exp.date) >= start && new Date(exp.date) <= end).reduce((a,b) => a+(b.amount||0), 0);
        data.push({ month: months[i], sales: s, expenses: e });
      }
    }
    
    return data;
  }, [invoices, expenses, chartRange]);

  // Category Data (Expenses by Category for the selected range)
  const categoryData = useMemo(() => {
    const categories = {};
    filteredExpenses.forEach(exp => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });
    const colors = ['#5B4CF0', '#6366f1', '#bfdbfe', '#f59e0b', '#10b981', '#ec4899'];
    return Object.keys(categories).map((key, index) => ({
      name: key,
      value: categories[key],
      color: colors[index % colors.length]
    }));
  }, [filteredExpenses]);

  // Top Products Calculation
  const topProducts = useMemo(() => {
    const productMap = {};
    filteredInvoices.filter(inv => inv.status === 'Paid').forEach(inv => {
      inv.items.forEach(item => {
        if (!productMap[item.name]) {
          productMap[item.name] = { name: item.name, unitsSold: 0, revenue: 0, category: 'Product' };
        }
        productMap[item.name].unitsSold += item.quantity;
        productMap[item.name].revenue += (item.price * item.quantity);
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // top 5
  }, [filteredInvoices]);

  const handleExport = () => {
    const data = [];
    data.push({ 'Metric': 'Total Sales', 'Amount': totalSales });
    data.push({ 'Metric': 'Total Expenses', 'Amount': totalExpenses });
    data.push({ 'Metric': 'Net Profit', 'Amount': netProfit });
    data.push({ 'Metric': 'Total Bills Generated', 'Amount': totalBills });
    data.push({ 'Metric': 'Average Bill Value', 'Amount': avgBillValue });
    data.push({}, { 'Metric': '--- EXPENSES BY CATEGORY ---', 'Amount': '' });
    categoryData.forEach(c => data.push({ 'Metric': c.name, 'Amount': c.value }));
    data.push({}, { 'Metric': '--- TOP PRODUCTS ---', 'Amount': '' });
    topProducts.forEach(p => data.push({ 'Metric': p.name, 'Amount': p.revenue }));
    
    downloadCSV(data, `master-report-${range.replace(' ', '-').toLowerCase()}.csv`);
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* ── Report Tabs ── */}
      <div className="flex gap-2 bg-white border border-gray-200 rounded-2xl p-1.5 w-fit">
        <button
          className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white shadow-soft"
        >
          Sales & Profit
        </button>
        <button
          onClick={() => navigate('/reports/analytics')}
          className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <BarChart2 size={14} /> Advanced Analytics
        </button>
        <button
          onClick={() => navigate('/reports/tax')}
          className="px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <ReceiptText size={14} /> GST & Tax Report
        </button>
      </div>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Visualizing your business growth and performance indicators.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={range}
            onChange={e => setRange(e.target.value)}
            className="border border-gray-200 text-sm px-3 py-2 rounded-xl outline-none bg-white font-medium"
          >
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Year</option>
            <option>All Time</option>
          </select>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors bg-white"
          >
            <Table size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Sales */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-soft flex flex-col justify-between h-[150px]">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Total Sales ({range})</p>
            <div className="w-7 h-7 rounded bg-indigo-50 flex items-center justify-center text-indigo-500">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="flex items-end gap-2 mb-4">
            <h3 className="text-2xl font-bold text-gray-900">₹{totalSales.toLocaleString('en-IN')}</h3>
          </div>
          <div className="flex items-end gap-1 h-10 mt-auto">
             <div className="w-full bg-indigo-100 rounded-t-sm h-[30%]"></div>
             <div className="w-full bg-indigo-200 rounded-t-sm h-[45%]"></div>
             <div className="w-full bg-indigo-300 rounded-t-sm h-[55%]"></div>
             <div className="w-full bg-indigo-400 rounded-t-sm h-[70%]"></div>
             <div className="w-full bg-indigo-500 rounded-t-sm h-[65%]"></div>
             <div className="w-full bg-primary rounded-t-sm h-[100%]"></div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-soft flex flex-col justify-between h-[150px]">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Net Profit ({range})</p>
            <div className={`w-7 h-7 rounded flex items-center justify-center ${isProfit ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
              <Banknote size={14} />
            </div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className={`text-2xl font-bold ${isProfit ? 'text-gray-900' : 'text-red-500'}`}>
              {isProfit ? '' : '-'}₹{Math.abs(netProfit).toLocaleString('en-IN')}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-auto">Profit/Loss for period</p>
        </div>

        {/* Total Bills */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-soft flex flex-col justify-between h-[150px]">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Total Bills ({range})</p>
            <div className="w-7 h-7 rounded bg-gray-100 flex items-center justify-center text-gray-500">
              <ReceiptText size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-1 mb-6 mt-1">
            <h3 className="text-2xl font-bold text-gray-900">{totalBills}</h3>
            <span className="text-[11px] text-gray-500 font-semibold">Issued</span>
          </div>
            <p className="text-[10px] text-gray-500 leading-snug">Volume generated</p>
        </div>

        {/* Avg Bill Value */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-soft flex flex-col justify-between h-[150px]">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Avg. Bill Value</p>
            <div className="w-7 h-7 rounded bg-red-50 flex items-center justify-center text-red-500">
              <TrendingDown size={14} />
            </div>
          </div>
          <div className="flex items-end gap-2 mb-4 mt-1">
            <h3 className="text-2xl font-bold text-gray-900">₹{Math.round(avgBillValue).toLocaleString('en-IN')}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-auto">Per Paid Invoice</p>
        </div>
      </div>

      {/* ── Charts Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Monthly Revenue */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-soft p-6 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-[15px]">Monthly Revenue</h3>
              <p className="text-[11px] text-gray-400 mt-1">Revenue vs Expense flow</p>
            </div>
            <select
              value={chartRange}
              onChange={e => setChartRange(e.target.value)}
              className="text-[11px] font-bold text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg cursor-pointer outline-none"
            >
              <option>Last 6 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="flex-1 min-h-[260px] w-full mt-4">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="1 0" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={{ stroke: '#f1f5f9', strokeWidth: 2 }} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis tickFormatter={(val) => `₹${val/1000}k`} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px'}} />
                <Bar dataKey="sales" name="Sales" fill="#5B4CF0" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 text-[15px]">Expenses by Category ({range})</h3>
            <p className="text-[11px] text-gray-400 mt-1">Cost distribution across categories</p>
          </div>
          <div className="flex-1 relative min-h-[180px] flex items-center justify-center mt-2">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={0} dataKey="value" stroke="none">
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
               <span className="text-xl font-bold text-gray-900">{categoryData.length > 0 ? '100%' : '0%'}</span>
               <span className="text-[10px] text-gray-500 font-bold mt-0.5">Total</span>
            </div>
          </div>
          
          {/* Custom Legend */}
          <div className="mt-8 space-y-4 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
            {categoryData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs font-semibold text-gray-600 truncate max-w-[80px]" title={item.name}>{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">₹{item.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
            {categoryData.length === 0 && (
              <p className="text-xs text-center text-gray-500">No expenses recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-soft overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-[15px]">Top Performing Products ({range})</h3>
            <p className="text-[11px] text-gray-400 mt-1">Items generating the most revenue</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[550px]">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="py-4 px-6 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Product</th>
                <th className="py-4 px-6 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                <th className="py-4 px-6 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Units Sold</th>
                <th className="py-4 px-6 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Revenue Generated</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((prod, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                        <Package size={18} />
                      </div>
                      <span className="font-bold text-gray-900">{prod.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-500 font-medium">{prod.category}</td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full text-xs">
                      {prod.unitsSold} units
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-bold text-gray-900">₹{prod.revenue.toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {topProducts.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-gray-500 text-sm">No sales data for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
