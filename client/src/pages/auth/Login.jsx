import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../redux/authSlice';
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userInfo, isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) {
      navigate('/dashboard');
    }
  }, [navigate, userInfo]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(login({ emailOrMobile, password }));
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-soft p-10">
      <Toaster position="top-right" />
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="bg-primary text-white p-1.5 rounded-lg">
          <ShoppingBag size={20} />
        </div>
        <span className="text-xl font-bold text-gray-900">VyaparPro</span>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back 👋</h1>
        <p className="text-gray-500 text-sm">Login to continue to your account</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email or Mobile Number</label>
          <input
            type="text"
            value={emailOrMobile}
            onChange={(e) => setEmailOrMobile(e.target.value)}
            placeholder="user@example.com or 9876543210"
            className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link to="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot Password?</Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-soft mt-6 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-primary hover:bg-opacity-90'}`}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link to="/auth/register" className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
};

export default Login;
