import { useState, useEffect, useMemo } from 'react';
import { Search, Download, UserPlus, Filter, TrendingUp, ChevronLeft, ChevronRight, ChevronDown, Trash2, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCustomers, deleteCustomer, sendReminderSMS } from '../../redux/customerSlice';
import { getInvoices } from '../../redux/billingSlice';
import toast from 'react-hot-toast';
import { downloadCSV } from '../../utils/exportCsv';

const filters = ['All Customers', 'Defaulters', 'Loyalty Members'];

const CustomerList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { customers = [], isLoading } = useSelector((state) => state.customer || {});
  const { invoices = [] } = useSelector((state) => state.billing || {});

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Customers');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(getCustomers());
    dispatch(getInvoices());
  }, [dispatch]);

  const handleDelete = (id, e) => {
    e.stopPropagation(); // prevent row click
    if (window.confirm('Are you sure you want to delete this customer?')) {
      dispatch(deleteCustomer(id))
        .unwrap()
        .then(() => toast.success('Customer deleted successfully!'))
        .catch((err) => toast.error(err || 'Failed to delete customer'));
    }
  };

  const handleSendReminder = (id, e) => {
    e.stopPropagation();
    const loadingToast = toast.loading('Sending SMS reminder...');
    dispatch(sendReminderSMS(id))
      .unwrap()
      .then((res) => {
        toast.dismiss(loadingToast);
        toast.success(res.simulated ? 'Simulated SMS Sent!' : 'SMS Sent successfully!');
      })
      .catch((err) => {
        toast.dismiss(loadingToast);
        toast.error(err || 'Failed to send SMS');
      });
  };

  // Calculate Customer Stats Map
  const customerStats = useMemo(() => {
    const stats = {};
    invoices.forEach(inv => {
      if (inv.customer) {
        if (!stats[inv.customer]) {
          stats[inv.customer] = { totalPurchases: 0 };
        }
        if (inv.status === 'Paid') {
          stats[inv.customer].totalPurchases += (inv.total || 0);
        }
      }
    });
    return stats;
  }, [invoices]);

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.mobile && c.mobile.includes(search));
    const matchFilter =
      activeFilter === 'All Customers' ||
      (activeFilter === 'Defaulters' && c.openingBalance > 0) ||
      (activeFilter === 'Loyalty Members' && (customerStats[c._id]?.totalPurchases || 0) > 0);
    return matchSearch && matchFilter;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedCustomers = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Stats Logic
  const activeThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const uniqueCustomers = new Set();
    
    invoices.forEach(inv => {
      const invDate = new Date(inv.createdAt);
      if (invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear && inv.customer) {
        uniqueCustomers.add(inv.customer);
      }
    });
    return uniqueCustomers.size;
  }, [invoices]);

  const handleExport = () => {
    const data = filtered.map(c => ({
      'Name': c.name,
      'Email': c.email || '',
      'Mobile': c.mobile || '',
      'Total Purchases': customerStats[c._id]?.totalPurchases || 0,
      'Pending Balance': c.openingBalance || 0,
      'Address': c.address || '',
      'Added On': new Date(c.createdAt).toLocaleDateString()
    }));
    downloadCSV(data, 'customers_list.csv');
  };

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your customer database and track their financial history.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors bg-white">
            <Download size={16} /> Export List
          </button>
          <button onClick={() => navigate('/customers/add')} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-colors shadow-soft">
            <UserPlus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Card 1 — Total Customers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-6 py-5">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">Total Customers</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">{customers.length}</span>
          </div>
        </div>

        {/* Card 2 — Active This Month */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-6 py-5">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">Active This Month</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">{activeThisMonth}</span>
          </div>
        </div>

        {/* Card 3 — Total Outstanding */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft px-6 py-5">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">Total Outstanding</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-primary">₹{customers.reduce((acc, curr) => acc + (curr.openingBalance || 0), 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Card 4 — Retention Growth (purple) */}
        <div className="bg-primary rounded-2xl px-6 py-6 text-white flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-[15px] mb-2">Retention Growth</h4>
            <p className="text-[11px] text-white opacity-80 leading-relaxed">
              Repeat customer rate is up by 14% compared to last quarter.
            </p>
          </div>
          <div className="flex items-center gap-3.5 mt-5">
            <div className="w-10 h-10 rounded-[10px] bg-white/20 flex items-center justify-center">
              <TrendingUp size={20} className="text-white" strokeWidth={2} />
            </div>
            <button className="text-[13px] font-medium text-white underline underline-offset-4 decoration-white/60 hover:decoration-white transition-colors">
              View full report
            </button>
          </div>
        </div>
      </div>

      {/* ── Customer Table ── */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-6 py-4 border-b border-gray-100 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0">
                <Filter size={13} /> Filter By
              </button>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {filters.map(f => (
                  <button
                    key={f}
                    onClick={() => { setActiveFilter(f); setPage(1); }}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                      activeFilter === f
                        ? 'bg-blue-50 text-primary border border-primary border-opacity-30'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none transition-colors w-full"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Showing <span className="font-bold text-gray-700">{filtered.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}–{Math.min(page * itemsPerPage, filtered.length)}</span> of{' '}
            <span className="font-bold text-gray-700">{filtered.length}</span>
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3.5 px-6 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Customer Name</th>
              <th className="text-left py-3.5 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Mobile Number</th>
              <th className="text-left py-3.5 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Total Purchases</th>
              <th className="text-left py-3.5 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Total Due</th>
              <th className="text-left py-3.5 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Added On</th>
              <th className="py-3.5 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-sm text-gray-500">Loading customers...</td>
              </tr>
            ) : paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-sm text-gray-500">No customers found.</td>
              </tr>
            ) : (
              paginatedCustomers.map((customer, idx) => (
                <tr
                  key={customer._id}
                  onClick={() => navigate(`/customers/${customer._id}`)}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${idx === paginatedCustomers.length - 1 ? 'border-b-0' : ''}`}
                >
                  {/* Name + Avatar */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary bg-opacity-10 text-primary font-bold text-sm items-center justify-center flex flex-shrink-0 overflow-hidden border border-gray-100">
                        {customer.image ? (
                          <img src={customer.image} alt={customer.name} className="w-full h-full object-cover" />
                        ) : (
                          customer.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{customer.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{customer.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  {/* Mobile */}
                  <td className="py-4 px-4 text-sm text-gray-600 font-medium">{customer.mobile}</td>
                  {/* Purchases */}
                  <td className="py-4 px-4 text-sm font-bold text-gray-900">
                    ₹ {(customerStats[customer._id]?.totalPurchases || 0).toLocaleString('en-IN')}
                  </td>
                  {/* Due */}
                  <td className="py-4 px-4">
                    {!customer.openingBalance ? (
                      <span className="text-xs font-bold text-green-600 border border-green-300 bg-green-50 px-3 py-1.5 rounded-full">
                        Paid Clear
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
                        ₹{customer.openingBalance.toLocaleString('en-IN')} Due
                      </span>
                    )}
                  </td>
                  {/* Added On */}
                  <td className="py-4 px-4 text-sm text-gray-500">{new Date(customer.createdAt).toLocaleDateString()}</td>
                  {/* Actions */}
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {customer.openingBalance > 0 && customer.mobile && (
                        <button 
                          onClick={(e) => handleSendReminder(customer._id, e)}
                          className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold"
                          title="Send SMS Reminder"
                        >
                          <MessageSquare size={14} /> SMS
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleDelete(customer._id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-6 py-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Rows per page:</span>
              <button className="flex items-center gap-1 font-bold text-gray-700 hover:bg-gray-100 px-2 py-1 rounded-lg">
                {itemsPerPage} <ChevronDown size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 2), Math.min(totalPages, page + 1)).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    page === n ? 'bg-primary text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerList;
