import { useRef, useState } from 'react';
import { X, Printer, Download, CheckCircle, Clock, Pause, User, Calendar, Hash, Package, RotateCcw, AlertCircle, MessageCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateInvoice } from '../../redux/billingSlice';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from './InvoiceTemplate';
import ReturnDrawer from './ReturnDrawer';
import toast from 'react-hot-toast';

const statusConfig = {
  Paid:           { label: 'Paid',           bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  Pending:        { label: 'Pending',        bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  Hold:           { label: 'Hold',           bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  Returned:       { label: 'Returned',       bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  'Partial Return': { label: 'Partial Return', bg: 'bg-rose-100', text: 'text-rose-700',   dot: 'bg-rose-500'   },
};

const InvoiceViewDrawer = ({ invoice: initialInvoice, businessInfo, onClose, onUpdated }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((s) => s.billing || {});

  const [invoice, setInvoice] = useState(initialInvoice);
  const [status, setStatus] = useState(invoice?.status || 'Paid');
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice?.invoiceNumber || 'Invoice',
  });

  const handleStatusSave = async () => {
    if (status === invoice.status) { setIsChangingStatus(false); return; }
    try {
      const updated = await dispatch(updateInvoice({ id: invoice._id, status })).unwrap();
      setInvoice(updated);
      toast.success(`Status updated to ${status}`);
      setIsChangingStatus(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error(err || 'Failed to update status');
    }
  };

  const handleReturnSuccess = (updatedInvoice) => {
    setInvoice(updatedInvoice);
    if (onUpdated) onUpdated();
  };

  const handleWhatsAppShare = () => {
    let phone = '';
    
    // Try to get phone from populated customer object or invoice contact
    if (invoice.customerContact) {
      phone = invoice.customerContact;
    } else if (invoice.customer && invoice.customer.mobile) {
      phone = invoice.customer.mobile;
    }
    
    // Format the number for India (91) if it exists
    if (phone) {
      phone = String(phone).replace(/\D/g, ''); // remove non-digits
      if (phone.length === 10) {
        phone = `91${phone}`;
      }
    }

    const billAmount = (invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const business = businessInfo?.businessName || 'Our Shop';
    const billDate = new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN');
    
    // Create the message text
    const text = `Hello ${invoice.customerName},\n\nThank you for shopping at *${business}*! 🙏\n\n*Your Bill Details:*\n🧾 Invoice No: ${invoice.invoiceNumber}\n📅 Date: ${billDate}\n💰 Total Amount: ₹${billAmount}\n📦 Items: ${invoice.items?.length || 0}\n\nWe look forward to serving you again!`;
    
    const encodedText = encodeURIComponent(text);
    const url = phone ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
    
    // Create a temporary link and click it to ensure it opens reliably
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!invoice) return null;

  const cfg = statusConfig[invoice.status] || statusConfig.Paid;

  const date = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const canReturn = invoice.status === 'Paid' || invoice.status === 'Partial Return';
  const totalReturned = (invoice.returnedItems || []).reduce((s, r) => s + r.refundAmount, 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Hash size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice</p>
              <h2 className="text-base font-black text-gray-900">{invoice.invoiceNumber}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
              title="Print Invoice"
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
          <div className="px-6 py-5 grid grid-cols-2 gap-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                <User size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
                <p className="text-sm font-bold text-gray-900">{invoice.customerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                <p className="text-sm font-bold text-gray-900">{date}</p>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Payment Status</p>
            {isChangingStatus ? (
              <div className="flex items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:border-primary bg-white"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Hold">Hold</option>
                </select>
                <button
                  onClick={handleStatusSave}
                  disabled={isLoading}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-opacity-90 disabled:opacity-50"
                >
                  {isLoading ? '...' : 'Save'}
                </button>
                <button
                  onClick={() => { setStatus(invoice.status); setIsChangingStatus(false); }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {invoice.status}
                </span>
                {(invoice.status === 'Paid' || invoice.status === 'Pending' || invoice.status === 'Hold') && (
                  <button
                    onClick={() => setIsChangingStatus(true)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="px-6 pt-5 pb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Package size={12} /> Items ({invoice.items?.length || 0})
            </p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item</th>
                    <th className="text-center py-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Qty</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</th>
                    <th className="text-right py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 text-xs">{item.name}</p>
                        {item.sku && <p className="text-[10px] text-gray-400">SKU: {item.sku}</p>}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-gray-700 text-xs">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-xs font-medium text-gray-600">
                        ₹ {(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-bold text-gray-900">
                        ₹ {((item.price || 0) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="px-6 py-5">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Subtotal</span>
                <span className="font-bold text-gray-800">₹ {(invoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {(invoice.gstAmount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">GST</span>
                  <span className="font-bold text-gray-800">₹ {(invoice.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {(invoice.discount || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Discount</span>
                  <span className="font-bold text-green-600">− ₹ {(invoice.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between pt-2.5 border-t border-gray-200">
                <span className="font-black text-gray-900">Total</span>
                <span className="font-black text-primary text-lg">₹ {(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Returned Items Block */}
          {invoice.returnedItems && invoice.returnedItems.length > 0 && (
            <div className="px-6 pb-5">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={14} className="text-red-500" />
                  <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Credit Note — Returned Items</p>
                </div>
                <div className="space-y-2">
                  {invoice.returnedItems.map((r, i) => (
                    <div key={i} className="flex justify-between items-center text-xs bg-white rounded-lg px-3 py-2 border border-red-100">
                      <div>
                        <span className="font-semibold text-gray-800">{r.itemName}</span>
                        <span className="text-gray-400 ml-2">× {r.quantity}</span>
                      </div>
                      <span className="font-bold text-red-500">−₹{(r.refundAmount || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-red-200">
                  <span className="text-xs font-bold text-red-600">Total Refunded</span>
                  <span className="text-sm font-black text-red-600">₹{totalReturned.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Printer size={16} /> Print
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-600 border border-green-200 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors"
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
          {canReturn && (
            <button
              onClick={() => setShowReturn(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
            >
              <RotateCcw size={15} /> Return
            </button>
          )}
        </div>
      </div>

      {/* Hidden print template */}
      <div className="hidden print:block">
        <InvoiceTemplate ref={printRef} invoice={invoice} business={businessInfo} />
      </div>
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <InvoiceTemplate ref={printRef} invoice={invoice} business={businessInfo} />
      </div>

      {/* Return Drawer */}
      {showReturn && (
        <ReturnDrawer
          invoice={invoice}
          onClose={() => setShowReturn(false)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </>
  );
};

export default InvoiceViewDrawer;
