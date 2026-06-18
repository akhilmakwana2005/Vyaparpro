import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { createCustomer, clearCustomerError } from '../../redux/customerSlice';
import toast from 'react-hot-toast';

const AddCustomer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.customer);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    gstNumber: '',
    openingBalance: '',
    address: '',
    notes: '',
  });

  const [previewImage, setPreviewImage] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCustomerError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const customerData = {
      ...formData,
      openingBalance: formData.openingBalance ? Number(formData.openingBalance) : 0,
      mobile: `+91 ${formData.mobile}`, // prepend the country code
      image: previewImage,
    };

    const result = await dispatch(createCustomer(customerData));
    if (createCustomer.fulfilled.match(result)) {
      toast.success('Customer added successfully!');
      navigate('/customers');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/customers')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl shadow-soft p-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div 
                className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 text-gray-400 cursor-pointer overflow-hidden hover:border-primary hover:text-primary transition-colors"
                onClick={() => document.getElementById('customerImage').click()}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload size={20} className="mb-1" />
                    <span className="text-[10px] font-medium">Upload</span>
                  </>
                )}
              </div>
              <input 
                id="customerImage" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Amit Kumar" 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Number *</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">+91</span>
                <input 
                  type="tel" 
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="98765 43210" 
                  className="flex-1 border border-gray-200 rounded-none rounded-r-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
                  required 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email (Optional)</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="amit@email.com" 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">GST Number (Optional)</label>
              <input 
                type="text" 
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="22AAAAA0000A1Z5" 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary uppercase" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Opening Due (₹)</label>
              <input 
                type="number" 
                name="openingBalance"
                value={formData.openingBalance}
                onChange={handleChange}
                placeholder="0" 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary" 
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <textarea 
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Customer address..." 
                rows={3} 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
              ></textarea>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes..." 
                rows={2} 
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => navigate('/customers')} 
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className={`px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors shadow-soft ${isLoading ? 'bg-indigo-400' : 'bg-primary hover:bg-opacity-90'}`}
            >
              {isLoading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;
