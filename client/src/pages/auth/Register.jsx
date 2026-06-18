import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../redux/authSlice';
import toast, { Toaster } from 'react-hot-toast';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userInfo, isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate('/onboarding/business');
    }
  }, [navigate, userInfo]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRegister = (e) => {
    e.preventDefault();
    if (!name || !email || !mobile || !password) {
      return toast.error("All fields are required");
    }
    dispatch(register({ name, email, mobile, password }));
  };

  return (
    <div className="max-w-4xl w-full bg-white rounded-2xl shadow-soft flex overflow-hidden">
      <Toaster position="top-right" />
      {/* Left Side Illustration Placeholder */}
      <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-blue-50 p-10 relative">
        <div className="absolute top-8 left-8">
          <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full shadow-sm">
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="bg-white p-8 rounded-full shadow-lg mb-8">
          <Store size={80} className="text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">VyaparPro</h2>
        <p className="text-gray-500 text-center text-sm">
          Manage your business, billing, and inventory seamlessly in one place.
        </p>
      </div>

      {/* Right Side Form */}
      <div className="w-full md:w-1/2 p-10 relative">
        <div className="md:hidden absolute top-6 left-6">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="max-w-sm mx-auto mt-8 md:mt-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-500 text-sm">Start your journey with VyaparPro</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rakesh Kumar"
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rakesh@example.com"
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="98765 43210"
                  className="flex-1 block w-full rounded-none rounded-r-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                required
              />
            </div>

            <div className="flex items-start mt-2">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 mt-0.5 text-primary border-gray-300 rounded focus:ring-primary"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-xs text-gray-700">
                I agree to the <a href="#" className="text-primary hover:underline">Terms & Conditions</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-soft mt-4 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90'}`}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-medium text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
