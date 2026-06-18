import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Wallet, ShoppingBag, Users, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDispatch, useSelector } from 'react-redux';
import { getInvoices } from '../../redux/billingSlice';
import { getProducts } from '../../redux/productSlice';
import { getCustomers } from '../../redux/customerSlice';

const StatCard = ({ title, value, icon: Icon, trend, isPositive, colorClass, bgClass, iconClass, showArrow = true }) => (
  <div className="bg-white p-6 rounded-2xl shadow-soft">
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="text-gray-500 text-xs font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${bgClass} ${iconClass}`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="flex items-center gap-1">
      {showArrow && (isPositive ? <TrendingUp size={14} className={colorClass} /> : <TrendingDown size={14} className={colorClass} />)}
      <span className={`text-xs font-bold ${colorClass}`}>
        {trend}
      </span>
    </div>
  </div>
);

const Dashboard = () => {
  const dispatch = useDispatch();
  
  const { invoices = [] } = useSelector((state) => state.billing || {});
  const { products = [] } = useSelector((state) => state.product || {});
  const { customers = [] } = useSelector((state) => state.customer || {});

  const [chartRange, setChartRange] = useState('This Week');

  useEffect(() => {
    dispatch(getInvoices());
    dispatch(getProducts());
    dispatch(getCustomers());
  }, [dispatch]);

  // Calculations Helper
  const calcSalesForPeriod = (start, end) => {
    return invoices
      .filter(i => i.status === 'Paid' && new Date(i.createdAt) >= start && new Date(i.createdAt) <= end)
      .reduce((a, b) => a + (b.total || 0), 0);
  };

  const calcTrendPercentage = (current, previous) => {
    if (previous === 0) return { text: 'N/A', isPositive: true };
    const diff = current - previous;
    const percentage = Math.abs((diff / previous) * 100).toFixed(1);
    return {
      text: `${percentage}% vs Prev`,
      isPositive: diff >= 0
    };
  };

  const calcProfitForPeriod = (start, end) => {
    return invoices
      .filter(i => i.status === 'Paid' && new Date(i.createdAt) >= start && new Date(i.createdAt) <= end)
      .reduce((totalProfit, inv) => {
        const invProfit = inv.items.reduce((itemProfit, item) => {
          const product = products.find(p => p._id === item.product || p.name === item.name);
          const purchasePrice = product ? (product.purchasePrice || 0) : 0;
          const sellingPrice = item.price || 0;
          return itemProfit + ((sellingPrice - purchasePrice) * item.quantity);
        }, 0);
        return totalProfit + invProfit - (inv.discount || 0);
      }, 0);
  };

  // Metrics
  const { todaySales, todayTrend, todayProfit, profitTrend, pendingDue, pendingTrend, newCustomersTrend } = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    
    const yesterdayStart = new Date(); yesterdayStart.setDate(yesterdayStart.getDate() - 1); yesterdayStart.setHours(0,0,0,0);
    const yesterdayEnd = new Date(); yesterdayEnd.setDate(yesterdayEnd.getDate() - 1); yesterdayEnd.setHours(23,59,59,999);

    const sevenDaysAgoStart = new Date(); sevenDaysAgoStart.setDate(sevenDaysAgoStart.getDate() - 7); sevenDaysAgoStart.setHours(0,0,0,0);

    // Sales Trend
    const tSales = calcSalesForPeriod(todayStart, todayEnd);
    const ySales = calcSalesForPeriod(yesterdayStart, yesterdayEnd);
    const tTrend = calcTrendPercentage(tSales, ySales);

    // Profit Trend
    const tProfit = calcProfitForPeriod(todayStart, todayEnd);
    const yProfit = calcProfitForPeriod(yesterdayStart, yesterdayEnd);
    const pTrend = calcTrendPercentage(tProfit, yProfit);

    // Pending Due
    const pDue = invoices.filter(i => i.status === 'Pending' || i.status === 'Hold').reduce((a, b) => a + (b.total || 0), 0);
    
    // Growth metrics
    const newCustomers = customers.filter(c => new Date(c.createdAt) >= sevenDaysAgoStart).length;

    return { 
      todaySales: tSales, 
      todayTrend: tTrend, 
      todayProfit: tProfit,
      profitTrend: pTrend,
      pendingDue: pDue,
      pendingTrend: { text: 'Active Balance', isPositive: false, showArrow: false },
      newCustomersTrend: { text: `+${newCustomers} this week`, isPositive: true, showArrow: true }
    };
  }, [invoices, customers, products]);

  // Chart Data
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();

    if (chartRange === 'This Week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const start = new Date(d.setHours(0,0,0,0));
        const end = new Date(d.setHours(23,59,59,999));
        data.push({ name: start.toLocaleDateString('en-US', { weekday: 'short' }), sales: calcSalesForPeriod(start, end) });
      }
    } else if (chartRange === 'This Month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        const start = new Date(d.setHours(0,0,0,0));
        const end = new Date(d.setHours(23,59,59,999));
        if (d <= now) {
          data.push({ name: i.toString(), sales: calcSalesForPeriod(start, end) });
        }
      }
    } else if (chartRange === 'This Year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i <= now.getMonth(); i++) {
        const start = new Date(now.getFullYear(), i, 1);
        const end = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59);
        data.push({ name: months[i], sales: calcSalesForPeriod(start, end) });
      }
    }
    return data;
  }, [invoices, chartRange]);

  // Recent Bills
  const recentBills = [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  // Low Stock Alert
  const lowStockProducts = [...products].filter(p => p.stock <= (p.minStockAlert || 5)).slice(0, 5);

  // Top Products Calculation
  const topProducts = useMemo(() => {
    const productMap = {};
    invoices.filter(inv => inv.status === 'Paid').forEach(inv => {
      inv.items.forEach(item => {
        if (!productMap[item.name]) {
          // Find real product to get image
          const realProduct = products.find(p => p._id === item.product || p.name === item.name);
          productMap[item.name] = { name: item.name, revenue: 0, image: realProduct?.image };
        }
        productMap[item.name].revenue += (item.price * item.quantity);
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4); // top 4 for dashboard
  }, [invoices, products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-700 bg-white px-4 py-2 rounded-xl shadow-soft border border-gray-100 w-fit">
          Today: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Sales" 
          value={`₹ ${todaySales.toLocaleString('en-IN')}`} 
          icon={Wallet} 
          trend={todayTrend.text} 
          isPositive={todayTrend.isPositive} 
          colorClass={todayTrend.text === 'N/A' ? 'text-gray-400' : (todayTrend.isPositive ? 'text-green-500' : 'text-red-500')}
          bgClass="bg-green-50"
          iconClass="text-green-500"
          showArrow={todayTrend.text !== 'N/A'}
        />
        <StatCard 
          title="Today's Profit" 
          value={`₹ ${todayProfit.toLocaleString('en-IN')}`} 
          icon={TrendingUp} 
          trend={profitTrend.text} 
          isPositive={profitTrend.isPositive} 
          colorClass={profitTrend.text === 'N/A' ? 'text-gray-400' : (profitTrend.isPositive ? 'text-blue-500' : 'text-red-500')}
          bgClass="bg-blue-50"
          iconClass="text-blue-500"
          showArrow={profitTrend.text !== 'N/A'}
        />
        <StatCard 
          title="Total Customers" 
          value={customers.length} 
          icon={Users} 
          trend={newCustomersTrend.text} 
          isPositive={newCustomersTrend.isPositive} 
          colorClass="text-purple-500"
          bgClass="bg-purple-50"
          iconClass="text-purple-500"
        />
        <StatCard 
          title="Pending Due" 
          value={`₹ ${pendingDue.toLocaleString('en-IN')}`} 
          icon={Wallet} 
          trend={pendingTrend.text} 
          isPositive={pendingTrend.isPositive} 
          colorClass="text-orange-500"
          bgClass="bg-orange-50"
          iconClass="text-orange-500"
          showArrow={pendingTrend.showArrow}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-900">Sales Overview</h3>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value)}
              className="text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer"
            >
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5B4CF0" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#5B4CF0" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} tickFormatter={(value) => `${(value / 1000).toFixed(1)}K`} />
                <Tooltip cursor={{stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '3 3'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px'}} />
                <Area type="monotone" dataKey="sales" stroke="#5B4CF0" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" dot={{r: 4, fill: '#5B4CF0', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-2xl shadow-soft flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-900">Top Products</h3>
          </div>
          <div className="space-y-4 flex-1">
            {topProducts.map((product, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 overflow-hidden border border-gray-100">
                    {product.image ? (
                      <img src={`http://localhost:5000${product.image}`} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                    ) : null}
                    <Package size={18} className="text-gray-400" style={{ display: product.image ? 'none' : 'block' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors max-w-[120px] truncate" title={product.name}>{product.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-xs font-bold text-gray-900">₹ {(product.revenue || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-gray-500 py-4">No products yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bills */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-900">Recent Bills</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs font-bold text-gray-900 border-b border-gray-100">
                  <th className="pb-3 font-bold">Bill No.</th>
                  <th className="pb-3 font-bold">Customer</th>
                  <th className="pb-3 font-bold">Amount</th>
                  <th className="pb-3 font-bold">Date</th>
                  <th className="pb-3 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {recentBills.map((bill) => (
                  <tr key={bill._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-500 px-2">{bill.invoiceNumber}</td>
                    <td className="py-3 font-bold text-gray-900 truncate max-w-[100px]">{bill.customerName}</td>
                    <td className="py-3 font-bold text-gray-900">₹ {(bill.total || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3 font-medium text-gray-500">{new Date(bill.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</td>
                    <td className="py-3 text-right px-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${
                        bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {bill.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentBills.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-xs text-gray-500">No recent bills found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-6 rounded-2xl shadow-soft">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-gray-900">Low Stock Alert</h3>
          </div>
          <div className="space-y-4">
            {lowStockProducts.map((product) => {
              return (
                <div key={product._id} className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 overflow-hidden border border-gray-100">
                    {product.image ? (
                      <img src={`http://localhost:5000${product.image}`} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                    ) : null}
                    <Package size={18} className="text-gray-400" style={{ display: product.image ? 'none' : 'block' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors max-w-[150px] truncate">{product.name}</p>
                    <p className="text-[10px] font-medium text-red-500 mt-0.5">Stock: {product.stock}</p>
                  </div>
                </div>
              );
            })}
            {lowStockProducts.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-xs text-gray-500 py-4">No low stock items.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
