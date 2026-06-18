import { useState, useEffect, useRef } from 'react';
import {
  Search, LayoutGrid, Plus, User, Sparkles, Trash2, Package, Printer, Pause, FileText
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts } from '../../redux/productSlice';
import { getCustomers } from '../../redux/customerSlice';
import { createQuotation } from '../../redux/quotationSlice';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import QuotationTemplate from '../../components/billing/QuotationTemplate';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CreateQuotation() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const { products = [] } = useSelector((state) => state.product || {});
  const { customers = [] } = useSelector((state) => state.customer || {});
  const { isLoading = false } = useSelector((state) => state.quotation || {});
  const { userInfo } = useSelector((state) => state.auth || {});

  const businessInfo = {
    businessName: userInfo?.businessName || 'VyaparPro',
    businessAddress: userInfo?.businessAddress || '123 Business Street, Tech City',
    mobile: userInfo?.mobile || '',
    gstNumber: userInfo?.gstNumber || ''
  };

  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerNameFallback, setCustomerNameFallback] = useState('Walk-in Customer');
  const [lastQuotation, setLastQuotation] = useState(null);

  useEffect(() => {
    const preSelected = location.state?.preSelectedCustomer;
    if (preSelected && customers.length > 0) {
      const match = customers.find(c => c._id === preSelected._id);
      if (match) setSelectedCustomerId(match._id);
    }
  }, [location.state, customers]);

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: lastQuotation?.quotationNumber || 'Estimate',
    onAfterPrint: () => {
      setLastQuotation(null);
      navigate('/quotations');
    }
  });

  useEffect(() => {
    if (lastQuotation) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lastQuotation, handlePrint]);

  useEffect(() => {
    dispatch(getProducts());
    dispatch(getCustomers());
  }, [dispatch]);

  const filtered = (products || []).filter(p => {
    if (!p) return false;
    const pName = p.name || '';
    const pSku = p.sku || '';
    const searchLower = (search || '').toLowerCase();
    return pName.toLowerCase().includes(searchLower) || pSku.toLowerCase().includes(searchLower);
  });

  const addToCart = (product) => {
    if (!product) return;

    setCart(prev => {
      const ex = prev.find(i => i._id === product._id);
      if (ex) {
        return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1, price: product.sellingPrice || 0 }];
    });
  };

  const updateQty = (id, newQty) => {
    setCart(prev => {
      return prev.map(i => {
        if (i._id === id) {
          if (newQty < 1) return { ...i, quantity: 1 };
          return { ...i, quantity: parseInt(newQty, 10) || 1 };
        }
        return i;
      });
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i._id !== id));
  };

  const subtotal = cart.reduce((a, i) => a + i.price * i.quantity, 0);
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const disc = parseFloat(discount) || 0;
  const total = subtotal + gst - disc;

  const handleSaveQuotation = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    const selectedCustomerObj = customers.find(c => c._id === selectedCustomerId);
    const finalCustomerName = selectedCustomerObj ? selectedCustomerObj.name : customerNameFallback;

    const quotationData = {
      customerName: finalCustomerName,
      customer: selectedCustomerId || undefined,
      items: cart.map(item => ({
        product: item._id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      gstAmount: gst,
      discount: disc,
      total,
      notes
    };

    try {
      const created = await dispatch(createQuotation(quotationData)).unwrap();
      toast.success('Estimate saved successfully!');

      setLastQuotation(created);

      setCart([]);
      setDiscount('');
      setNotes('');
      setSelectedCustomerId('');
      setCustomerNameFallback('Walk-in Customer');
    } catch (err) {
      toast.error(err || 'Failed to create estimate');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-6rem)] w-full max-w-[1400px] mx-auto bg-gray-50/50 p-2">

      {/* ── LEFT PANEL (Products List) ── */}
      <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-primary font-bold px-2 whitespace-nowrap">
            <FileText size={20} />
            New Estimate
          </div>
          <div className="flex-1 flex items-center bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
            <Search size={18} className="text-gray-400 mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name / barcode"
              className="bg-transparent text-sm w-full outline-none text-gray-700 placeholder:text-gray-400 font-medium"
            />
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col divide-y divide-gray-50/80">
            {filtered.map(product => {
              return (
                <div key={product._id} className="flex items-center p-4 transition-colors hover:bg-gray-50">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4 overflow-hidden border border-gray-200">
                    {product.image ? (
                      <img src={`http://localhost:5000${product.image}`} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" onError={(e) => e.target.style.display = 'none'} />
                    ) : (
                      <Package size={22} className="text-gray-400" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-[15px] mb-0.5 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-gray-400 font-semibold mb-0.5">₹ {(product.sellingPrice || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-gray-400 font-medium">Stock: {product.stock} (Estimates do not deduct stock)</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-indigo-600 bg-white shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-colors ml-4"
                  >
                    <Plus size={16} strokeWidth={3} />
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm font-medium">No products found.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Estimate Summary) ── */}
      <div className="w-full lg:w-[450px] xl:w-[500px] flex-shrink-0 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">

        {/* Summary Header */}
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-[17px] mb-4">Estimate Summary</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 text-gray-500">
                <User size={18} />
              </div>
              <div className="flex flex-col">
                <select
                  value={selectedCustomerId}
                  onChange={e => {
                    setSelectedCustomerId(e.target.value);
                    if (e.target.value === '') setCustomerNameFallback('Walk-in Customer');
                  }}
                  className="bg-transparent text-sm font-bold text-gray-900 outline-none cursor-pointer p-0 m-0 border-none appearance-none"
                >
                  <option value="">Walk-in Customer</option>
                  {(customers || []).map(c => (
                    <option key={c._id} value={c._id}>{c?.name}</option>
                  ))}
                </select>
                <span className="text-xs text-gray-400 mt-0.5 font-medium">
                  {selectedCustomerId
                    ? (customers.find(c => c._id === selectedCustomerId)?.mobile || '')
                    : 'Walk-in'}
                </span>
              </div>
            </div>
            <button className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50">
              <Sparkles size={16} />
            </button>
          </div>
        </div>

        {/* Cart Items Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-white sticky top-0 border-b border-gray-100 z-10">
              <tr>
                <th className="text-left font-semibold text-gray-600 py-3 px-5">Item</th>
                <th className="text-right font-semibold text-gray-600 py-3 px-2 w-16">Qty</th>
                <th className="text-right font-semibold text-gray-600 py-3 px-2 w-20">Price</th>
                <th className="text-right font-semibold text-gray-600 py-3 px-5 w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item._id} className="border-b border-gray-50 group hover:bg-gray-50/50">
                  <td className="py-4 px-5 text-gray-900 font-bold text-[13px]">{item.name}</td>
                  <td className="py-4 px-2">
                    <div className="flex items-center justify-end">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQty(item._id, e.target.value)}
                        className="w-10 text-center border border-gray-200 rounded-md text-[13px] py-1 outline-none font-semibold text-gray-700 bg-white"
                        min="1"
                      />
                    </div>
                  </td>
                  <td className="py-4 px-2 text-right text-gray-500 font-semibold text-[13px]">
                    {item.price.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-bold text-gray-900 text-[13px]">{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      <Trash2
                        size={15}
                        className="text-gray-300 cursor-pointer hover:text-red-500 transition-colors"
                        onClick={() => removeFromCart(item._id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {cart.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-400 text-sm font-medium">Cart is empty</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals & Actions */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex justify-between text-[13px] mb-3">
            <span className="text-gray-500 font-semibold">Subtotal</span>
            <span className="font-bold text-gray-900">₹ {subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between items-center text-[13px] mb-3">
            <span className="text-gray-500 font-semibold">Discount</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              className="w-20 text-right font-bold text-gray-900 outline-none bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-between text-[13px] mb-3">
            <span className="text-gray-500 font-semibold">Tax (18%)</span>
            <span className="font-bold text-gray-900">₹ {gst.toLocaleString('en-IN')}</span>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes or terms for the estimate..."
              className="w-full text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-between items-center mb-6 pt-3 border-t border-dashed border-gray-200">
            <span className="font-bold text-lg text-gray-900">Total</span>
            <span className="font-black text-xl text-gray-900">₹ {total.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveQuotation}
              disabled={isLoading || cart.length === 0}
              className="w-full py-3.5 bg-green-600 rounded-xl font-bold text-white hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 text-[14px] flex items-center justify-center gap-2">
              Save Estimate <span className="font-medium bg-green-500/50 px-2 py-0.5 rounded-lg text-xs ml-1">₹ {total.toLocaleString('en-IN')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Print Area */}
      <div className="hidden">
        <QuotationTemplate ref={printRef} quotation={lastQuotation} business={businessInfo} />
      </div>
    </div>
  );
}
