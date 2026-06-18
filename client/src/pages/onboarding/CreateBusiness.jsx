import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { UploadCloud } from 'lucide-react';
import { updateProfile } from '../../redux/authSlice';
import toast from 'react-hot-toast';

const CreateBusiness = () => {
  const [shopName, setShopName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userInfo, isLoading, error } = useSelector((state) => state.auth);

  // If user already has a business name set, redirect to dashboard or success page
  useEffect(() => {
    if (userInfo?.businessName) {
      navigate('/onboarding/success');
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) {
      return toast.error('Shop Name is required');
    }

    try {
      const resultAction = await dispatch(updateProfile({
        businessName: shopName,
        gstNumber,
        businessAddress: address,
      }));
      if (updateProfile.fulfilled.match(resultAction)) {
        toast.success('Business created successfully!');
        navigate('/onboarding/success');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create business');
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-soft p-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Your Shop</h1>
        <p className="text-gray-500 text-sm">Let's set up your shop details</p>
      </div>

      <form onSubmit={handleContinue} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Shop Name</label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="Shree Ram Electronics"
            className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Shop Type</label>
          <select
            className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm bg-white"
            required
          >
            <option>Electronics Shop</option>
            <option>Grocery Store</option>
            <option>Clothing Store</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">GST Number (Optional)</label>
          <input
            type="text"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            placeholder="22AAAAA0000A1Z5"
            className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm uppercase"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Address (Optional)</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Shop No. 12, Main Market, Anytown, Maharashtra 411001"
            rows="2"
            className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Upload Logo (Optional)</label>
          <button type="button" className="w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl py-4 hover:bg-gray-50 hover:border-primary transition-colors text-primary">
            <UploadCloud size={24} className="mb-2" />
            <span className="text-xs font-medium">Upload Logo</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-soft mt-6 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90'}`}
        >
          {isLoading ? 'Creating...' : 'Continue'}
        </button>
      </form>
    </div>
  );
};

export default CreateBusiness;
