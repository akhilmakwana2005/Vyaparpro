import { useEffect, useMemo } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getProducts } from '../../redux/productSlice';

const LowStock = () => {
  const dispatch = useDispatch();
  const { products = [], isLoading } = useSelector((state) => state.product || {});

  useEffect(() => {
    dispatch(getProducts());
  }, [dispatch]);

  const lowStockItems = useMemo(() => {
    return products.filter(p => p.stock <= (p.minStockAlert || 5));
  }, [products]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h2>

      <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 text-orange-700 px-5 py-4 rounded-2xl">
        <AlertTriangle size={20} />
        <div>
          <p className="text-sm font-bold">Stock Alert: {lowStockItems.length} products need attention!</p>
          <p className="text-xs mt-0.5">Please reorder these products to avoid stock-out situation.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Products Requiring Reorder</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-5 text-left">Product</th>
                <th className="py-4 px-5 text-left">SKU</th>
                <th className="py-4 px-5 text-left">Current Stock</th>
                <th className="py-4 px-5 text-left">Min Required</th>
                <th className="py-4 px-5 text-left">Shortage</th>
                <th className="py-4 px-5 text-left">Status</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-sm text-gray-500">Loading stock data...</td>
                </tr>
              ) : lowStockItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-sm text-gray-500">No low stock items found! All good!</td>
                </tr>
              ) : (
                lowStockItems.map(item => {
                  const minStock = item.minStockAlert || 5;
                  const shortage = minStock - item.stock;

                  return (
                    <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center text-red-400 overflow-hidden">
                            {item.image ? (
                               <img src={`http://localhost:5000${item.image}`} alt={item.name} className="object-cover w-full h-full" onError={(e) => { e.target.src = 'https://via.placeholder.com/64?text=N/A' }} />
                            ) : (
                               <Package size={16} />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 truncate max-w-[200px]" title={item.name}>{item.name}</p>
                            <p className="text-xs text-gray-400 truncate max-w-[200px]" title={item.category}>{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-gray-500 truncate max-w-[100px]" title={item.sku}>{item.sku || '-'}</td>
                      <td className="py-4 px-5">
                        <span className={`font-bold ${item.stock <= 0 ? 'text-red-600' : 'text-orange-500'}`}>{item.stock}</span>
                      </td>
                      <td className="py-4 px-5 text-gray-500">{minStock}</td>
                      <td className="py-4 px-5 font-bold text-red-500">{shortage > 0 ? shortage : 0} units</td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${item.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {item.stock <= 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button className="text-xs font-bold text-primary hover:underline px-3 py-1.5 bg-blue-50 rounded-lg">Reorder</button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LowStock;
