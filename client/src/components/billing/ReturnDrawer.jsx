import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { X, RotateCcw, Minus, Plus, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function ReturnDrawer({ invoice, onClose, onSuccess }) {
  // Build initial return qty map (max = available qty not yet returned)
  const getAvailableQty = (item) => {
    const alreadyReturned = (invoice.returnedItems || [])
      .filter((r) => r.itemName === item.name)
      .reduce((s, r) => s + r.quantity, 0);
    return item.quantity - alreadyReturned;
  };

  const initialItems = invoice.items
    .map((item) => ({ ...item, returnQty: 0, available: getAvailableQty(item) }))
    .filter((item) => item.available > 0);

  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

  const updateQty = (idx, delta) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const newQty = Math.max(0, Math.min(item.available, item.returnQty + delta));
        return { ...item, returnQty: newQty };
      })
    );
  };

  const refundTotal = items.reduce((s, i) => s + i.returnQty * i.price, 0);
  const hasItems = items.some((i) => i.returnQty > 0);

  const handleSubmit = async () => {
    if (!hasItems) return toast.error('Select at least one item to return');
    const returnItems = items
      .filter((i) => i.returnQty > 0)
      .map((i) => ({ name: i.name, productId: i.product, quantity: i.returnQty }));

    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/invoices/${invoice._id}/return`,
        { items: returnItems },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Return processed! Refund: ₹${data.refundTotal?.toLocaleString('en-IN')}`);
      onSuccess(data.invoice);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
              <RotateCcw size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Process Return</h2>
              <p className="text-xs text-gray-400">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
            <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Returned stock will be automatically added back to inventory.
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Available to return: <span className="font-bold text-gray-600">{item.available}</span> &nbsp;|&nbsp; ₹{item.price}/unit
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(i, -1)}
                      disabled={item.returnQty === 0}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 disabled:opacity-40 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className={`w-8 text-center text-sm font-bold ${item.returnQty > 0 ? 'text-primary' : 'text-gray-400'}`}>
                      {item.returnQty}
                    </span>
                    <button
                      onClick={() => updateQty(i, +1)}
                      disabled={item.returnQty >= item.available}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-300 disabled:opacity-40 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                {item.returnQty > 0 && (
                  <p className="text-xs text-primary font-bold mt-2 text-right">
                    Refund: ₹{(item.returnQty * item.price).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Refund</p>
            <p className={`text-xl font-black ${hasItems ? 'text-red-500' : 'text-gray-300'}`}>
              ₹{refundTotal.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !hasItems}
              className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RotateCcw size={14} /> {loading ? 'Processing…' : 'Process Return'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
