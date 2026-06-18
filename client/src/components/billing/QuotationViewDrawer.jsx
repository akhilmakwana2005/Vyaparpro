import { useRef } from 'react';
import { X, Printer, CheckCircle, User, Calendar, Hash, Package, FileText, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { convertQuotationToInvoice } from '../../redux/quotationSlice';
import { useReactToPrint } from 'react-to-print';
import QuotationTemplate from './QuotationTemplate';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  Accepted: { label: 'Accepted', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  Draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  Sent: { label: 'Sent', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  Converted: { label: 'Converted', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  Expired: { label: 'Expired', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
};

const QuotationViewDrawer = ({ quotation, businessInfo, onClose, onUpdated }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((s) => s.quotation || {});

  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: quotation?.quotationNumber || 'Estimate',
  });

  const handleConvert = async () => {
    try {
      await dispatch(convertQuotationToInvoice(quotation._id)).unwrap();
      toast.success('Successfully converted to Bill!');
      if (onUpdated) onUpdated();
      navigate('/billing/history');
    } catch (err) {
      toast.error(err || 'Failed to convert quotation');
    }
  };

  if (!quotation) return null;

  const cfg = statusConfig[quotation.status] || statusConfig.Draft;

  const date = quotation.createdAt
    ? new Date(quotation.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estimate</p>
              <h2 className="text-base font-black text-gray-900">{quotation.quotationNumber}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
              title="Print Estimate"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Meta Info */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500">Customer</p>
                </div>
                <p className="text-sm font-bold text-gray-900 truncate" title={quotation.customerName}>{quotation.customerName}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={14} className="text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500">Date</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{date}</p>
              </div>
            </div>

            {/* Status Section */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Estimate Status</p>
              <div className="flex items-center justify-between bg-white border border-gray-200 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${cfg.bg} ${cfg.text} border border-transparent`}>
                    <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">{cfg.label}</span>
                  </div>
                </div>
                
                {quotation.status !== 'Converted' && (
                  <button 
                    onClick={handleConvert}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    Convert to Bill <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Items List */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Item Details</p>
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-500">Item</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-center">Qty</th>
                      <th className="px-4 py-3 font-semibold text-gray-500 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {quotation.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                          <p className="text-xs text-gray-400">₹{(item.price || 0).toLocaleString('en-IN')}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          ₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="bg-gray-50/50 p-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>Subtotal</span>
                    <span>₹{(quotation.subtotal || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {quotation.gstAmount > 0 && (
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>GST</span>
                      <span>+₹{(quotation.gstAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {quotation.discount > 0 && (
                    <div className="flex justify-between text-xs font-medium text-green-600">
                      <span>Discount</span>
                      <span>−₹{(quotation.discount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Estimated Total</span>
                    <span className="text-lg font-black text-primary">₹{(quotation.total || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {quotation.notes && (
              <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1">Notes</p>
                <p className="text-sm text-yellow-800 whitespace-pre-wrap">{quotation.notes}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Hidden print container */}
      <div style={{ display: 'none' }}>
        <QuotationTemplate
          ref={printRef}
          quotation={quotation}
          business={businessInfo}
        />
      </div>
    </>
  );
};

export default QuotationViewDrawer;
