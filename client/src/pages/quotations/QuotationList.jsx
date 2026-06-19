import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Eye, Trash2, Printer, FilePlus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getQuotations, deleteQuotation, convertQuotationToInvoice } from '../../redux/quotationSlice';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import QuotationTemplate from '../../components/billing/QuotationTemplate';
import QuotationViewDrawer from '../../components/billing/QuotationViewDrawer';

const QuotationList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { quotations = [], isLoading = false } = useSelector((state) => state.quotation || {});
  const { userInfo } = useSelector((state) => state.auth || {});

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [printingQuotation, setPrintingQuotation] = useState(null);
  const [viewingQuotation, setViewingQuotation] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const businessInfo = {
    businessName: userInfo?.businessName || 'VyaparPro',
    businessAddress: userInfo?.businessAddress || '123 Business Street, Tech City',
    mobile: userInfo?.mobile || '',
    gstNumber: userInfo?.gstNumber || ''
  };

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingQuotation?.quotationNumber || 'Estimate',
    onAfterPrint: () => setPrintingQuotation(null)
  });

  useEffect(() => {
    if (printingQuotation) {
      handlePrint();
    }
  }, [printingQuotation, handlePrint]);

  useEffect(() => {
    dispatch(getQuotations());
  }, [dispatch]);

  const handleDeleteClick = (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;
    dispatch(deleteQuotation(confirmDelete))
      .unwrap()
      .then(() => {
        toast.success('Quotation deleted successfully');
        setConfirmDelete(null);
      })
      .catch(err => {
        toast.error(err || 'Failed to delete quotation');
        setConfirmDelete(null);
      });
  };

  const handleConvert = (id) => {
    if (window.confirm('Convert this estimate to a final bill? This will deduct stock.')) {
      dispatch(convertQuotationToInvoice(id))
        .unwrap()
        .then(() => {
          toast.success('Converted to Invoice successfully');
        })
        .catch((err) => {
          toast.error(err || 'Failed to convert to invoice. Check stock.');
        });
    }
  };

  const filtered = (quotations || []).filter(q => {
    if (!q) return false;
    const matchStatus = filter === 'All' || q.status === filter;
    const searchString = (search || '').toLowerCase();
    const matchSearch = 
      (q.customerName || '').toLowerCase().includes(searchString) || 
      (q.quotationNumber || '').toLowerCase().includes(searchString);
    return matchStatus && matchSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return 'text-green-600 bg-green-50 border border-green-200';
      case 'Sent': return 'text-blue-600 bg-blue-50 border border-blue-200';
      case 'Rejected': return 'text-red-600 bg-red-50 border border-red-200';
      case 'Converted': return 'text-purple-600 bg-purple-50 border border-purple-200';
      case 'Expired': return 'text-orange-600 bg-orange-50 border border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border border-gray-200'; // Draft
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Quotations & Estimates</h2>
        <button onClick={() => navigate('/quotations/add')} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors shadow-soft w-fit">
          <FileText size={16} /> New Estimate
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Estimates</p>
          <h3 className="text-3xl font-bold text-gray-900">{quotations.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Draft / Sent</p>
          <h3 className="text-3xl font-bold text-blue-500">
            {quotations.filter(q => q.status === 'Draft' || q.status === 'Sent').length}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-soft border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Converted</p>
          <h3 className="text-3xl font-bold text-green-500">
            {quotations.filter(q => q.status === 'Converted').length}
          </h3>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-soft border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by customer or estimate #"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          {['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Converted', 'Expired'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8 text-gray-500 text-sm">Loading estimates...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <FileText size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium mb-1">No estimates found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimate #</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(quotation => (
                  <tr key={quotation._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{new Date(quotation.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      <div className="text-xs text-gray-400">{new Date(quotation.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">#{quotation.quotationNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">{quotation.customerName}</div>
                      <div className="text-xs text-gray-500">{quotation.items.length} items</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">₹{(quotation.total || 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(quotation.status)}`}>
                        {quotation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 transition-opacity">
                        {quotation.status !== 'Converted' && quotation.status !== 'Expired' && quotation.status !== 'Rejected' && (
                          <button onClick={() => handleConvert(quotation._id)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Convert to Bill">
                            <FilePlus size={15} />
                          </button>
                        )}
                        <button onClick={() => setPrintingQuotation(quotation)} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors" title="Print Estimate">
                          <Printer size={15} />
                        </button>
                        <button onClick={() => setViewingQuotation(quotation)} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors" title="View Estimate">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => handleDeleteClick(quotation._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Estimate">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden print container */}
      <div style={{ display: 'none' }}>
        {printingQuotation && (
          <QuotationTemplate 
            ref={printRef} 
            quotation={printingQuotation} 
            business={businessInfo} 
          />
        )}
      </div>

      {/* View Drawer */}
      {viewingQuotation && (
        <QuotationViewDrawer
          quotation={viewingQuotation}
          business={businessInfo}
          onClose={() => setViewingQuotation(null)}
          onUpdated={() => {
            dispatch(getQuotations());
            setViewingQuotation(null);
          }}
        />
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Estimate?</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this estimate? This action cannot be undone.</p>
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

export default QuotationList;
