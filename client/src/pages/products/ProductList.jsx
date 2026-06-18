import { useState, useEffect } from 'react';
import { Search, Plus, Download, Edit2, Trash2, PackageOpen, ChevronLeft, ChevronRight, ChevronDown, Printer, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts, deleteProduct } from '../../redux/productSlice';
import toast from 'react-hot-toast';
import { downloadCSV } from '../../utils/exportCsv';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';
import BarcodePrinter from '../../components/products/BarcodePrinter';

const statusColor = {
  'In Stock': 'bg-green-100 text-green-700',
  'Low Stock': 'bg-orange-100 text-orange-700',
  'Out of Stock': 'bg-red-100 text-red-700',
};

const ProductList = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { products, isLoading } = useSelector((state) => state.product);
  const { userInfo } = useSelector((state) => state.auth);

  const [printProduct, setPrintProduct] = useState(null);
  const [printQuantity, setPrintQuantity] = useState(1);
  const printRef = useRef(null);

  const executePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Barcodes_${printProduct?.sku || 'Product'}`,
    onAfterPrint: () => {
      setPrintProduct(null);
      setPrintQuantity(1);
    }
  });

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const result = await dispatch(deleteProduct(id));
      if (deleteProduct.fulfilled.match(result)) {
        toast.success('Product deleted successfully');
      } else {
        toast.error('Failed to delete product');
      }
    }
  };

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedProducts = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleExport = () => {
    const data = filtered.map(p => ({
      'Product Name': p.name,
      'SKU': p.sku || 'N/A',
      'Category': p.category,
      'Price': p.sellingPrice,
      'Stock': p.stock,
      'Status': p.stock <= 0 ? 'Out of Stock' : (p.stock <= (p.minStockAlert || 5) ? 'Low Stock' : 'In Stock')
    }));
    downloadCSV(data, 'product_list.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download size={16} /> Export List
          </button>
          <Link to="/products/add" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-opacity-90 transition-colors shadow-soft">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl flex-1 w-full sm:max-w-sm">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, category, or SKU..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-gray-500">Loading products...</div>
        ) : paginatedProducts.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <PackageOpen size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-500 text-sm max-w-sm">You haven't added any products yet, or none match your search.</p>
            <Link to="/products/add" className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90">
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="text-[11px] font-bold text-gray-500 border-b border-gray-100 bg-gray-50 tracking-wider uppercase">
                <th className="py-4 px-5 text-left">Product Name</th>
                <th className="py-4 px-5 text-left">Category</th>
                <th className="py-4 px-5 text-left">Price</th>
                <th className="py-4 px-5 text-left">Stock</th>
                <th className="py-4 px-5 text-left">Status</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => {
                let status = 'In Stock';
                if (product.stock <= 0) status = 'Out of Stock';
                else if (product.stock <= (product.minStockAlert || 5)) status = 'Low Stock';

                return (
                  <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center font-bold text-gray-400 text-xs border border-gray-200">
                          {product.image ? (
                            <img src={product.image.includes('http') ? product.image : `http://localhost:5000${product.image}`} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                          ) : null}
                          <span style={{ display: product.image ? 'none' : 'block' }}>{product.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block">{product.name}</span>
                          <span className="text-xs text-gray-400">SKU: {product.sku || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-gray-500 font-medium">{product.category}</td>
                    <td className="py-4 px-5 font-bold text-gray-900">₹ {product.sellingPrice.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-5 text-gray-700 font-medium">{product.stock}</td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusColor[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        {product.sku && (
                          <button onClick={() => setPrintProduct(product)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Print Barcodes"><Printer size={15} /></button>
                        )}
                        <button onClick={() => navigate(`/products/edit/${product._id}`)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Edit"><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(product._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-5 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-gray-100">
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

      {/* Barcode Print Modal */}
      {printProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full relative">
            <button onClick={() => setPrintProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Print Barcodes</h3>
            <p className="text-sm text-gray-500 mb-6">{printProduct.name} (SKU: {printProduct.sku})</p>
            
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-600 mb-2">Number of Labels to Print</label>
              <input 
                type="number" 
                value={printQuantity} 
                onChange={(e) => setPrintQuantity(e.target.value)} 
                min="1" 
                max="100"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPrintProduct(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={executePrint} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
                <Printer size={16} /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print container */}
      <div style={{ display: 'none' }}>
        {printProduct && (
          <BarcodePrinter 
            ref={printRef} 
            product={printProduct} 
            quantity={Number(printQuantity) || 0} 
            businessName={userInfo?.businessName || 'VyaparPro'}
          />
        )}
      </div>

    </div>
  );
};

export default ProductList;
