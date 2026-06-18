import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { createPurchaseOrder } from '../../redux/purchaseOrderSlice';
import { getProducts } from '../../redux/productSlice';
import { getSuppliers } from '../../redux/supplierSlice';
import { X, Plus, Trash2, ShoppingCart, Search } from 'lucide-react';

const generatePONumber = () => {
  const ts = Date.now().toString().slice(-6);
  return `PO-${ts}`;
};

export default function CreatePurchaseOrder({ onClose }) {
  const dispatch = useDispatch();
  const { products = [] } = useSelector((s) => s.product || {});
  const { suppliers = [] } = useSelector((s) => s.supplier || {});

  const [form, setForm] = useState({
    poNumber: generatePONumber(),
    supplier: '',
    supplierName: '',
    supplierContact: '',
    expectedDate: '',
    notes: '',
  });
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(getProducts());
    dispatch(getSuppliers());
  }, [dispatch]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const addProduct = (product) => {
    const existing = items.find((i) => i.product === product._id);
    if (existing) {
      setItems((prev) =>
        prev.map((i) => (i.product === product._id ? { ...i, quantity: i.quantity + 1 } : i))
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          product: product._id,
          name: product.name,
          sku: product.sku || '',
          quantity: 1,
          purchasePrice: product.purchasePrice || 0,
        },
      ]);
    }
    setSearch('');
    setShowSearch(false);
  };

  const updateItem = (idx, field, val) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: Number(val) } : item)));
  };

  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const totalAmount = items.reduce((s, i) => s + (i.quantity || 0) * (i.purchasePrice || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierName.trim()) return toast.error('Supplier name is required');
    if (items.length === 0) return toast.error('Add at least one item');

    setLoading(true);
    try {
      await dispatch(
        createPurchaseOrder({ ...form, items, totalAmount })
      ).unwrap();
      toast.success('Purchase order created!');
      onClose();
    } catch (err) {
      toast.error(err || 'Failed to create PO');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="w-full max-w-xl h-full bg-white flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">New Purchase Order</h2>
              <p className="text-xs text-gray-400">{form.poNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Supplier Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Supplier Name *</label>
                <select
                  value={form.supplier}
                  onChange={(e) => {
                    const selected = suppliers.find(s => s._id === e.target.value);
                    if (selected) {
                      setForm({ 
                        ...form, 
                        supplier: selected._id,
                        supplierName: selected.name,
                        supplierContact: selected.mobile
                      });
                    } else {
                      setForm({ ...form, supplier: '', supplierName: '', supplierContact: '' });
                    }
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Contact / Phone</label>
                <input
                  type="text"
                  value={form.supplierContact}
                  onChange={(e) => setForm({ ...form, supplierContact: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Expected Delivery</label>
                <input
                  type="date"
                  value={form.expectedDate}
                  onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">PO Number</label>
                <input
                  type="text"
                  value={form.poNumber}
                  onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>

            {/* Product Search */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Add Products</label>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Search products by name or SKU…"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                {showSearch && search && (
                  <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-gray-400">No products found</p>
                    ) : (
                      filteredProducts.map((p) => (
                        <button
                          type="button"
                          key={p._id}
                          onMouseDown={() => addProduct(p)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                            {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                          </div>
                          <span className="text-xs text-gray-500">Stock: {p.stock}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            {items.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">Order Items</p>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr className="text-xs font-bold text-gray-500">
                        <th className="px-4 py-2.5 text-left">Product</th>
                        <th className="px-4 py-2.5 text-center w-20">Qty</th>
                        <th className="px-4 py-2.5 text-center w-28">Price (₹)</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map((item, i) => (
                        <tr key={i} className="bg-white">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                            {item.sku && <p className="text-xs text-gray-400">{item.sku}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              value={item.purchasePrice}
                              onChange={(e) => updateItem(i, 'purchasePrice', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900 text-sm">
                            ₹{(item.quantity * item.purchasePrice).toLocaleString('en-IN')}
                          </td>
                          <td className="pr-3">
                            <button
                              type="button"
                              onClick={() => removeItem(i)}
                              className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Notes (optional)</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Any special instructions…"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Amount</p>
              <p className="text-xl font-black text-primary">₹{totalAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                <Plus size={15} /> {loading ? 'Creating…' : 'Create PO'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
