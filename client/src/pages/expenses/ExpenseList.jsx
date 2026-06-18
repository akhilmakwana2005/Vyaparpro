import { useState, useEffect, useMemo } from 'react';
import { Plus, Wallet, ClipboardList, Download, Trash2, Edit2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getExpenses, deleteExpense, updateExpense } from '../../redux/expenseSlice';
import toast from 'react-hot-toast';
import { downloadCSV } from '../../utils/exportCsv';

export default function ExpenseList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { expenses = [], isLoading } = useSelector((state) => state.expense || {});

  // Filters
  const [dateRange, setDateRange] = useState('All'); // All, This Month, Last Month
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentModeFilter, setPaymentModeFilter] = useState('All');

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    dispatch(getExpenses());
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await dispatch(deleteExpense(id)).unwrap();
        toast.success('Expense deleted successfully');
      } catch (err) {
        toast.error(err || 'Failed to delete expense');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateExpense({ id: editData._id, expenseData: editData })).unwrap();
      toast.success('Expense updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err || 'Failed to update expense');
    }
  };

  // Compute filtering
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return [...expenses].sort((a,b) => new Date(b.date) - new Date(a.date)).filter(exp => {
      // Date Filter
      let matchDate = true;
      const expDate = new Date(exp.date);
      if (dateRange === 'This Month') {
        matchDate = expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
      } else if (dateRange === 'Last Month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const year = currentMonth === 0 ? currentYear - 1 : currentYear;
        matchDate = expDate.getMonth() === lastMonth && expDate.getFullYear() === year;
      }

      // Category Filter
      const matchCategory = categoryFilter === 'All' || exp.category === categoryFilter;
      
      // Payment Mode Filter
      const matchPayment = paymentModeFilter === 'All' || (exp.paymentMode || 'Cash') === paymentModeFilter;

      return matchDate && matchCategory && matchPayment;
    });
  }, [expenses, dateRange, categoryFilter, paymentModeFilter]);

  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalItems = filteredExpenses.length;

  // Compute Top Category
  const topCategory = useMemo(() => {
    const cats = {};
    filteredExpenses.forEach(exp => {
      cats[exp.category] = (cats[exp.category] || 0) + (exp.amount || 0);
    });
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], amount: sorted[0][1] } : { name: 'None', amount: 0 };
  }, [filteredExpenses]);

  const topCategoryPercentage = totalExpenses > 0 ? Math.round((topCategory.amount / totalExpenses) * 100) : 0;

  // Extract unique categories for dropdown
  const uniqueCategories = ['All', ...new Set(expenses.map(e => e.category))];
  const paymentModes = ['All', 'Cash', 'UPI', 'Bank Transfer', 'Cheque'];

  const exportCSV = () => {
    const data = filteredExpenses.map(exp => ({
      Date: new Date(exp.date).toLocaleDateString(),
      Title: exp.title,
      Category: exp.category,
      Amount: exp.amount,
      PaymentMode: exp.paymentMode || 'Cash',
      Notes: exp.notes || ''
    }));
    downloadCSV(data, 'expenses_export.csv');
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and track your business expenditures across all categories.</p>
        </div>
        <button onClick={() => navigate('/expenses/add')} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-colors shadow-soft w-fit">
          <Plus size={18} strokeWidth={2.5} /> Add Expense
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
              <Wallet size={20} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Total Filtered Expenses</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-[10px] bg-gray-100 text-gray-500 flex items-center justify-center mb-4">
            <ClipboardList size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Filtered Expense Records</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{totalItems} Items</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Top Category</p>
            <h3 className="text-xl font-bold text-gray-900 mb-1 truncate max-w-[120px]">{topCategory.name}</h3>
            <p className="text-sm text-gray-400 font-medium">₹{topCategory.amount.toLocaleString('en-IN')}</p>
          </div>
          <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-[6px] border-gray-100">
             {/* Progress simulation with conic-gradient for accurate percentage representation */}
             <div className="absolute inset-[-6px] rounded-full" style={{ background: `conic-gradient(#5B4CF0 ${topCategoryPercentage}%, transparent 0)` }}>
                <div className="absolute inset-[6px] bg-white rounded-full"></div>
             </div>
             <span className="text-xs font-bold text-gray-700 z-10">{topCategoryPercentage}%</span>
          </div>
        </div>
      </div>

      {/* ── Filters Row ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative border border-gray-200 rounded-xl px-4 py-1.5 w-full sm:w-44">
            <span className="absolute -top-2.5 left-3 bg-white px-1 text-[9px] font-bold text-primary tracking-widest uppercase">Date Range</span>
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full text-sm font-medium text-gray-700 outline-none bg-transparent pt-1">
              {['All', 'This Month', 'Last Month'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div className="relative border border-gray-200 rounded-xl px-4 py-1.5 w-full sm:w-44">
            <span className="absolute -top-2.5 left-3 bg-white px-1 text-[9px] font-bold text-primary tracking-widest uppercase">Category</span>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full text-sm font-medium text-gray-700 outline-none bg-transparent pt-1">
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="relative border border-gray-200 rounded-xl px-4 py-1.5 w-full sm:w-44">
            <span className="absolute -top-2.5 left-3 bg-white px-1 text-[9px] font-bold text-primary tracking-widest uppercase">Payment Mode</span>
            <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} className="w-full text-sm font-medium text-gray-700 outline-none bg-transparent pt-1">
              {paymentModes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button onClick={exportCSV} className="px-4 py-2 rounded-xl border border-gray-200 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 text-sm font-bold transition-colors">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left py-4 px-6 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Date</th>
              <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Category</th>
              <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Description</th>
              <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Amount</th>
              <th className="text-left py-4 px-4 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Mode</th>
              <th className="text-right py-4 px-6 text-[10px] font-bold text-gray-400 tracking-widest uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-sm text-gray-500">Loading expenses...</td>
              </tr>
            ) : filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-sm text-gray-500">No expenses found for this filter.</td>
              </tr>
            ) : (
              filteredExpenses.map((expense, idx) => (
                <tr key={expense._id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx === filteredExpenses.length - 1 ? 'border-b-0' : ''}`}>
                  <td className="py-4 px-6 text-sm font-bold text-gray-800">{new Date(expense.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="py-4 px-4">
                    <span className="bg-blue-50 text-slate-500 font-semibold px-3 py-1.5 rounded-full text-xs">
                      {expense.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">{expense.title}</td>
                  <td className="py-4 px-4 text-sm font-bold text-gray-900">₹ {(expense.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-4 text-xs font-bold text-gray-700">
                    {expense.paymentMode || 'Cash'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditData(expense); setIsEditing(true); }} className="text-gray-400 hover:text-primary transition-colors p-1" title="Edit Expense">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(expense._id)} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Delete Expense">
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500">Showing {filteredExpenses.length} expenses</p>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">Edit Expense</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input type="text" value={editData.title || ''} onChange={e => setEditData({...editData, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <input type="text" value={editData.category || ''} onChange={e => setEditData({...editData, category: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                  <input type="number" value={editData.amount || ''} onChange={e => setEditData({...editData, amount: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" value={editData.date ? new Date(editData.date).toISOString().split('T')[0] : ''} onChange={e => setEditData({...editData, date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
                  <select value={editData.paymentMode || 'Cash'} onChange={e => setEditData({...editData, paymentMode: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isLoading} className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-opacity-90">{isLoading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
