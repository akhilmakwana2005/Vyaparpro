import { useState, useEffect, useMemo } from 'react';
import { Wallet, AlertTriangle, ClipboardX, Download, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts } from '../../redux/productSlice';
import { downloadCSV } from '../../utils/exportCsv';

export default function StockList() {
  const dispatch = useDispatch();
  const { products = [], isLoading } = useSelector((state) => state.product || {});

  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  const totalValue = products.reduce((acc, curr) => acc + ((curr.stock || 0) * (curr.sellingPrice || 0)), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.minStockAlert || 5)).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return ['All Categories', ...Array.from(cats)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'All Categories') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleExport = () => {
    const data = filteredProducts.map(p => ({
      'Product Name': p.name,
      'SKU': p.sku || 'N/A',
      'Category': p.category,
      'Current Stock': p.stock,
      'Min Alert Level': p.minStockAlert || 5,
      'Status': p.stock <= 0 ? 'Out of Stock' : (p.stock <= (p.minStockAlert || 5) ? 'Low Stock' : 'In Stock'),
      'Unit Price': p.sellingPrice,
      'Total Value': (p.stock * p.sellingPrice)
    }));
    downloadCSV(data, 'inventory_stock_valuation.csv');
  };

  return (
    <div className="space-y-6 pb-10">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Stock Management</h2>
          <p className="text-sm text-gray-500 mt-1">Track inventory valuation and restock alerts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors bg-white">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Total Stock Value */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1">Total Stock Value</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Retail</span>
              <span className="text-gray-400">Value of all current stock</span>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1">Low Stock Items</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{lowStockCount} Products</h3>
            <p className="text-xs font-bold text-red-500 mt-1">Action Required</p>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0">
            <ClipboardX size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1">Out of Stock</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{outOfStockCount} Units</h3>
            <p className="text-xs text-gray-400 mt-1">Need immediate restock</p>
          </div>
        </div>

      </div>

      {/* ── Table Section ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Filters Bar */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between md:items-center">
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <select
                value={activeCategory}
                onChange={e => { setActiveCategory(e.target.value); setPage(1); }}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 outline-none focus:border-primary cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-gray-100">
              <th className="text-left py-4 px-6 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product</th>
              <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Current Stock</th>
              <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Unit Value</th>
              <th className="text-left py-4 px-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="py-10 text-center text-sm text-gray-500">Loading stock data...</td>
              </tr>
            ) : paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-10 text-center text-sm text-gray-500">No products found.</td>
              </tr>
            ) : (
              paginatedProducts.map((item, idx) => {
                const isOutOfStock = item.stock <= 0;
                const minStock = item.minStockAlert || 5;
                const isLowStock = item.stock > 0 && item.stock <= minStock;
                const status = isOutOfStock ? 'Out of Stock' : (isLowStock ? 'Low Stock' : 'In Stock');
                const statusBg = isOutOfStock ? 'bg-gray-100 text-gray-600' : (isLowStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700');

                return (
                  <tr key={item._id} className={`hover:bg-gray-50 transition-colors ${idx !== paginatedProducts.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    
                    {/* Product */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
                          {item.image ? (
                            <img src={item.image.includes('http') ? item.image : `http://localhost:5000${item.image}`} alt={item.name} className="object-cover w-full h-full" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                          ) : null}
                          <span className="text-gray-400 text-xs text-center leading-tight font-bold" style={{ display: item.image ? 'none' : 'block' }}>{item.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-[14px] truncate max-w-[200px]" title={item.name}>{item.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 font-medium truncate max-w-[200px]" title={item.category}>{item.category}</p>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-4 px-4 text-[13px] font-semibold text-gray-600 truncate max-w-[100px]">
                      {item.sku || '-'}
                    </td>

                    {/* Current Stock */}
                    <td className="py-4 px-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-[15px] font-bold ${isLowStock || isOutOfStock ? 'text-red-500' : 'text-gray-900'}`}>
                          {item.stock}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                          Min: {minStock}
                        </span>
                      </div>
                    </td>

                    {/* Unit Value */}
                    <td className="py-4 px-4 text-[13px] font-bold text-gray-900">
                      ₹ {item.sellingPrice.toLocaleString('en-IN')}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold ${statusBg}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
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
}
