import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Eye, FileText, Trash2, Printer } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getInvoices, deleteInvoice } from '../../redux/billingSlice';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../../components/billing/InvoiceTemplate';
import InvoiceViewDrawer from '../../components/billing/InvoiceViewDrawer';
import { downloadCSV } from '../../utils/exportCsv';

const BillHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { invoices = [], isLoading = false } = useSelector((state) => state.billing || {});
  const { userInfo } = useSelector((state) => state.auth || {});

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [printingBill, setPrintingBill] = useState(null);
  const [viewingBill, setViewingBill] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const businessInfo = {
    name: userInfo?.businessName || 'VyaparPro',
    address: userInfo?.businessAddress || '123 Business Street, Tech City',
    phone: userInfo?.mobile || '',
    gst: userInfo?.gstNumber || ''
  };

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingBill?.invoiceNumber || 'Invoice',
    onAfterPrint: () => setPrintingBill(null)
  });

  useEffect(() => {
    if (printingBill) {
      handlePrint();
    }
  }, [printingBill, handlePrint]);

  useEffect(() => {
    dispatch(getInvoices());
  }, [dispatch]);

  const handleDeleteClick = (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    dispatch(deleteInvoice(confirmDelete))
      .unwrap()
      .then(() => {
        toast.success('Invoice deleted successfully');
        setConfirmDelete(null);
      })
      .catch(err => {
        toast.error(err || 'Failed to delete invoice');
        setConfirmDelete(null);
      });
  };

  const filtered = (invoices || []).filter(b => {
    if (!b) return false;
    const matchStatus = filter === 'All' || b.status === filter;
    const searchString = (search || '').toLowerCase();
    const matchSearch = 
      (b.customerName || '').toLowerCase().includes(searchString) || 
      (b.invoiceNumber || '').toLowerCase().includes(searchString);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Bill History</h2>
        <button onClick={() => navigate('/billing')} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors shadow-soft w-fit">
          <FileText size={16} /> New Bill
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Bills</p>
          <h3 className="text-3xl font-bold text-gray-900">{invoices.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Revenue</p>
          <h3 className="text-3xl font-bold text-gray-900">
            ₹ {invoices.filter(b => b.status === 'Paid').reduce((a, b) => a + (b.total || 0), 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Pending Due</p>
          <h3 className="text-3xl font-bold text-red-500">
            ₹ {invoices.filter(b => b.status === 'Pending' || b.status === 'Hold').reduce((a, b) => a + (b.total || 0), 0).toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-gray-100">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {['All', 'Paid', 'Pending', 'Hold', 'Returned', 'Partial Return'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filter === f ? 'bg-primary text-white shadow-soft' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl">
              <Search size={16} className="text-gray-400" />
              <input type="text" placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent outline-none text-sm w-40" />
            </div>
            <button 
              onClick={() => {
                const data = filtered.map(b => ({
                  'Invoice No': b.invoiceNumber,
                  'Customer': b.customerName,
                  'Date': new Date(b.createdAt).toLocaleDateString(),
                  'Total Items': b.items.reduce((acc, curr) => acc + curr.quantity, 0),
                  'Amount': b.total || 0,
                  'Status': b.status
                }));
                downloadCSV(data, 'bill-history.csv');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 bg-white"
            >
              <Download size={15} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
          <thead>
            <tr className="text-left py-3.5 px-5 text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-50 border-b border-gray-100">
              <th className="py-4 px-6 text-left font-bold">Invoice No.</th>
              <th className="py-4 px-5 text-left font-bold">Customer</th>
              <th className="py-4 px-5 text-left font-bold">Items</th>
              <th className="py-4 px-5 text-left font-bold">Amount</th>
              <th className="py-4 px-5 text-left font-bold">Date</th>
              <th className="py-4 px-5 text-left font-bold">Status</th>
              <th className="py-4 px-5 text-right font-bold">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-sm text-gray-500">Loading invoices...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-10 text-center text-sm text-gray-500">No invoices found.</td>
              </tr>
            ) : (
              filtered.map((bill) => (
                <tr key={bill._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-primary">{bill.invoiceNumber}</td>
                  <td className="py-4 px-5 font-semibold text-gray-900">{bill.customerName}</td>
                  <td className="py-4 px-5 text-gray-500">
                    {bill.items.reduce((acc, curr) => acc + curr.quantity, 0)} items
                  </td>
                  <td className="py-4 px-5 font-bold text-gray-900">₹ {(bill.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-5 text-gray-500">{new Date(bill.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                      bill.status === 'Pending' ? 'bg-red-100 text-red-700' :
                      bill.status === 'Returned' ? 'bg-red-100 text-red-600' :
                      bill.status === 'Partial Return' ? 'bg-rose-100 text-rose-600' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setPrintingBill(bill)} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors" title="Print">
                        <Printer size={15} />
                      </button>
                      <button onClick={() => setViewingBill(bill)} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors" title="View Invoice">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => handleDeleteClick(bill._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <InvoiceTemplate ref={printRef} invoice={printingBill} business={businessInfo} />
      </div>



      {/* Invoice View Drawer */}
      {viewingBill && (
        <InvoiceViewDrawer
          invoice={viewingBill}
          businessInfo={businessInfo}
          onClose={() => setViewingBill(null)}
          onUpdated={() => dispatch(getInvoices())}
        />
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Invoice?</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to cancel/delete this invoice? This will restore the stock.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmDeleteAction} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillHistory;
