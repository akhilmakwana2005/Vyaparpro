import { useState, useEffect, useRef } from 'react';
import {
  Search, LayoutGrid, Plus, User, Sparkles, Trash2, Package, Printer, Pause
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts } from '../../redux/productSlice';
import { getCustomers } from '../../redux/customerSlice';
import { createInvoice, askAIBilling } from '../../redux/billingSlice';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import InvoiceTemplate from '../../components/billing/InvoiceTemplate';
import BarcodeScannerModal from '../../components/billing/BarcodeScannerModal';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BillingPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const { products = [] } = useSelector((state) => state.product || {});
  const { customers = [] } = useSelector((state) => state.customer || {});
  const { isLoading = false } = useSelector((state) => state.billing || {});
  const { userInfo } = useSelector((state) => state.auth || {});

  const businessInfo = {
    name: userInfo?.businessName || 'VyaparPro',
    address: userInfo?.businessAddress || '123 Business Street, Tech City',
    phone: userInfo?.mobile || '',
    gst: userInfo?.gstNumber || ''
  };

  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerNameFallback, setCustomerNameFallback] = useState('Walk-in Customer');
  const [pointsRedeemed, setPointsRedeemed] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Auto-select customer if navigated from CustomerDetails
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
    documentTitle: lastInvoice?.invoiceNumber || 'Invoice',
    onAfterPrint: () => setLastInvoice(null)
  });

  useEffect(() => {
    if (lastInvoice && lastInvoice.status === 'Paid') {
      const timer = setTimeout(() => {
        handlePrint();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [lastInvoice, handlePrint]);

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
    if (!product || (product.stock || 0) <= 0) {
      toast.error(`${product?.name || 'Product'} is out of stock!`);
      return;
    }

    setCart(prev => {
      const ex = prev.find(i => i._id === product._id);
      if (ex) {
        if (ex.quantity >= product.stock) {
          toast.error(`Cannot add more. Only ${product.stock} left in stock.`);
          return prev;
        }
        return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1, price: product.sellingPrice || 0 }];
    });
  };

  const updateQty = (id, newQty) => {
    setCart(prev => {
      return prev.map(i => {
        if (i._id === id) {
          if (newQty > i.stock) {
            toast.error(`Only ${i.stock} units available.`);
            return { ...i, quantity: i.stock };
          }
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
  
  // Calculate reward points logic
  const selectedCustomerObj = customers.find(c => c._id === selectedCustomerId);
  const availablePoints = selectedCustomerObj?.rewardPoints || 0;
  
  // Auto-correct points redeemed if user unchecks or doesn't have enough
  const actualPointsRedeemed = usePoints ? Math.min(availablePoints, subtotal + gst - disc) : 0;
  
  const total = subtotal + gst - disc - actualPointsRedeemed;
  const pointsEarned = Math.floor(total / 100);

  const handleCheckout = async (status = 'Paid') => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }

    const selectedCustomerObj = customers.find(c => c._id === selectedCustomerId);
    const finalCustomerName = selectedCustomerObj ? selectedCustomerObj.name : customerNameFallback;

    const invoiceData = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
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
      status,
      rewardPointsEarned: pointsEarned,
      rewardPointsRedeemed: actualPointsRedeemed,
    };

    try {
      const created = await dispatch(createInvoice(invoiceData)).unwrap();
      toast.success(status === 'Hold' ? 'Bill put on hold!' : 'Invoice generated successfully!');

      if (status === 'Paid') {
        setLastInvoice(created);
      }

      setCart([]);
      setDiscount('');
      setSelectedCustomerId('');
      setCustomerNameFallback('Walk-in Customer');
      setUsePoints(false);
      dispatch(getProducts());
      dispatch(getCustomers());
    } catch (err) {
      toast.error(err || 'Failed to create invoice');
    }
  };

  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await dispatch(askAIBilling(aiPrompt)).unwrap();
      
      if (response.matchedCustomer) {
        setSelectedCustomerId(response.matchedCustomer._id);
        toast.success(`Customer selected: ${response.matchedCustomer.name}`);
      }

      if (response.cartItems && response.cartItems.length > 0) {
        const newCartItems = response.cartItems.map(ci => ({
          ...ci.product,
          quantity: ci.quantity,
          price: ci.product.sellingPrice
        }));
        
        setCart(prev => {
          const merged = [...prev];
          newCartItems.forEach(newItem => {
            const ex = merged.find(i => i._id === newItem._id);
            if (ex) {
              ex.quantity += newItem.quantity;
              if (ex.quantity > ex.stock) ex.quantity = ex.stock;
            } else {
              merged.push(newItem);
            }
          });
          return merged;
        });

        const addedCount = response.cartItems.length;
        const outOfStockCount = response.cartItems.filter(ci => ci.isOutOfStock).length;
        
        if (addedCount > 0) toast.success(`Added ${addedCount} products via AI`);
        if (outOfStockCount > 0) toast.error(`${outOfStockCount} requested products were out of stock`);
      }

      if (response.discount) {
        // Assume discount is percentage, convert to fixed amount based on subtotal of newly added
        // For simplicity, just show a message or apply to discount field directly
        // Wait, discount field is flat amount.
        toast.success(`AI suggested ${response.discount}% discount. Please apply manually.`);
      }

      setIsAiModalOpen(false);
      setAiPrompt('');
    } catch (error) {
      toast.error(error || 'Failed to process AI request');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleScanSuccess = (decodedText) => {
    const found = products.find(p => p.sku === decodedText || p._id === decodedText);
    if (found) {
      addToCart(found);
    } else {
      toast.error(`No product found with barcode: ${decodedText}`);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-6rem)] w-full max-w-[1400px] mx-auto bg-gray-50/50 p-2">

      {/* ── LEFT PANEL (Products List) ── */}
      <div className="flex-1 flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

        {/* Search Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
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
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="w-11 h-11 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-colors"
            title="Scan Barcode using Camera"
          >
            <div className="relative">
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping opacity-75"></span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 7v10"/><path d="M12 7v10"/><path d="M16 7v10"/></svg>
            </div>
          </button>
          <button 
            onClick={() => navigate('/billing/history')}
            className="flex items-center gap-2 px-4 h-11 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 font-semibold text-sm hover:bg-indigo-100 transition-colors whitespace-nowrap"
          >
            History
          </button>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col divide-y divide-gray-50/80">
            {filtered.map(product => {
              const inCart = cart.find(i => i._id === product._id);
              const isOutOfStock = product.stock <= 0;
              return (
                <div key={product._id} className={`flex items-center p-4 transition-colors hover:bg-gray-50 ${isOutOfStock ? 'opacity-60' : ''}`}>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mr-4 overflow-hidden border border-gray-200">
                    {product.image ? (
                      <img src={`https://vyaparpro-o6hq.onrender.com${product.image}`} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" onError={(e) => e.target.style.display = 'none'} />
                    ) : (
                      <Package size={22} className="text-gray-400" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-[15px] mb-0.5 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-gray-400 font-semibold mb-0.5">₹ {(product.sellingPrice || 0).toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-gray-400 font-medium">Stock: {product.stock}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-indigo-600 bg-white shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-colors ml-4 disabled:opacity-50"
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

      {/* ── RIGHT PANEL (Bill Summary) ── */}
      <div className="w-full lg:w-[450px] xl:w-[500px] flex-shrink-0 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">

        {/* Summary Header */}
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-[17px] mb-4">Bill Summary</h2>
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
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400 font-medium">
                    {selectedCustomerId
                      ? (customers.find(c => c._id === selectedCustomerId)?.mobile || '')
                      : 'Walk-in'}
                  </span>
                  {selectedCustomerId && availablePoints > 0 && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">
                      ★ {availablePoints} pts
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsAiModalOpen(!isAiModalOpen)}
                className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-colors ${isAiModalOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                title="Ask AI Assistant"
              >
                <Sparkles size={16} />
              </button>
              
              {isAiModalOpen && (
                <div className="absolute right-0 top-12 w-80 bg-white shadow-xl border border-gray-100 rounded-2xl p-4 z-50 animate-slide-in-right">
                  <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-500" /> AI Billing Assistant
                  </h3>
                  <p className="text-[11px] text-gray-500 mb-3">
                    Type what you want to bill. For example: <br/><i>"Add 2 laptop for John"</i>
                  </p>
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none h-24 mb-3"
                  />
                  <button 
                    onClick={handleAskAI}
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAiLoading ? 'Processing...' : 'Generate Bill'}
                  </button>
                </div>
              )}
            </div>
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
          
          {selectedCustomerId && availablePoints > 0 && (
            <div className="flex justify-between items-center text-[13px] mb-3">
              <label className="text-yellow-600 font-bold flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={usePoints} 
                  onChange={(e) => setUsePoints(e.target.checked)}
                  className="accent-yellow-500"
                />
                Redeem {availablePoints} pts
              </label>
              <span className="font-bold text-yellow-600">- ₹ {actualPointsRedeemed.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="flex justify-between text-[13px] mb-5 pb-5 border-b border-dashed border-gray-200">
            <span className="text-gray-500 font-semibold">Tax (18%)</span>
            <span className="font-bold text-gray-900">₹ {gst.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between items-end mb-6">
            <div>
              <span className="font-bold text-lg text-gray-900 block">Total</span>
              {selectedCustomerId && (
                <span className="text-[10px] text-gray-400 font-medium">Earns <b className="text-indigo-500">{pointsEarned}</b> reward pts</span>
              )}
            </div>
            <span className="font-black text-xl text-gray-900">₹ {total.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleCheckout('Hold')}
              disabled={isLoading || cart.length === 0}
              className="flex-1 py-3.5 border border-gray-200 rounded-xl font-bold text-indigo-600 bg-white hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 text-[14px]">
              Hold Bill
            </button>
            <button
              onClick={() => handleCheckout('Paid')}
              disabled={isLoading || cart.length === 0}
              className="flex-[1.5] py-3.5 bg-blue-700 rounded-xl font-bold text-white hover:bg-blue-800 transition-colors shadow-md disabled:opacity-50 text-[14px] flex items-center justify-center gap-2">
              Save Bill <span className="font-medium bg-blue-600/50 px-2 py-0.5 rounded-lg text-xs ml-1">₹ {total.toLocaleString('en-IN')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Print Area */}
      <div className="hidden">
        <InvoiceTemplate ref={printRef} invoiceData={lastInvoice} businessInfo={businessInfo} />
      </div>

      <BarcodeScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />
    </div>
  );
}
