import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createProduct, clearProductError } from '../../redux/productSlice';
import toast from 'react-hot-toast';

const categories = ['Earbuds', 'Power Bank', 'Speaker', 'Television', 'Charger', 'Accessories', 'Mobile', 'Laptop', 'Camera', 'Other'];
const gstRates = ['0%', '5%', '12%', '18%', '28%'];

const AddProduct = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isLoading, error } = useSelector((state) => state.product);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sku: '',
    sellingPrice: '',
    purchasePrice: '',
    stock: '',
    minStockAlert: '',
    gstRate: '18%',
    hsnCode: '',
    description: '',
  });

  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearProductError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert string inputs to numbers where necessary
    const productData = {
      ...formData,
      sellingPrice: Number(formData.sellingPrice),
      purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : 0,
      stock: Number(formData.stock),
      minStockAlert: formData.minStockAlert ? Number(formData.minStockAlert) : 0,
      image: previewImage || 'https://via.placeholder.com/400x400.png?text=Product', // Placeholder if no image
    };

    const result = await dispatch(createProduct(productData));
    if (createProduct.fulfilled.match(result)) {
      toast.success('Product added successfully!');
      navigate('/products');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/products')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image Upload */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Product Image</h3>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary hover:bg-blue-50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('imageUpload').click()}
            >
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="w-full h-40 object-contain" />
              ) : (
                <>
                  <Upload size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                </>
              )}
              <input id="imageUpload" type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files[0]) setPreviewImage(URL.createObjectURL(e.target.files[0])); }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">GST Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">GST Rate</label>
                <select 
                  name="gstRate"
                  value={formData.gstRate}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"
                >
                  {gstRates.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">HSN Code</label>
                <input 
                  type="text" 
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  placeholder="8518" 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl shadow-soft p-8">
          <h3 className="text-sm font-bold text-gray-900 mb-6">Product Details</h3>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. BoAt Airdopes 141" 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary bg-white" 
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SKU / Barcode</label>
                <input 
                  type="text" 
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="SKU-0001" 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price (₹) *</label>
                <input 
                  type="number" 
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  placeholder="1299" 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Price (₹)</label>
                <input 
                  type="number" 
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  placeholder="950" 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stock Quantity *</label>
                <input 
                  type="number" 
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  placeholder="24" 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Minimum Stock Alert</label>
                <input 
                  type="number" 
                  name="minStockAlert"
                  value={formData.minStockAlert}
                  onChange={handleChange}
                  placeholder="5" 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Product description..." 
                  rows={3} 
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => navigate('/products')} 
                className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className={`px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors shadow-soft ${isLoading ? 'bg-indigo-400' : 'bg-primary hover:bg-opacity-90'}`}
              >
                {isLoading ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
