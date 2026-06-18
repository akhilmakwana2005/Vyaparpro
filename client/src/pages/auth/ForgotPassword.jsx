import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: enter mobile, 2: enter OTP, 3: new password

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 3) setStep(step + 1);
    else navigate('/auth/login');
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-soft p-10">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="bg-primary text-white p-1.5 rounded-lg">
          <ShoppingBag size={20} />
        </div>
        <span className="text-xl font-bold text-gray-900">VyaparPro</span>
      </div>

      <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/auth/login')} className="flex items-center gap-2 text-gray-500 text-sm mb-6 hover:text-gray-700">
        <ArrowLeft size={16} /> Back
      </button>

      {step === 1 && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-2xl">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-500 text-sm">Enter your mobile number to receive an OTP</p>
          </div>
          <form onSubmit={handleNext} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="flex">
                <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+91</span>
                <input type="tel" placeholder="98765 43210" className="flex-1 block w-full rounded-none rounded-r-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary text-sm" required />
              </div>
            </div>
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition-colors shadow-soft">Send OTP</button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📱</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Enter OTP</h1>
            <p className="text-gray-500 text-sm">6-digit code sent to +91 98765 43210</p>
          </div>
          <form onSubmit={handleNext} className="space-y-5">
            <div className="flex gap-3 justify-center">
              {[1,2,3,4,5,6].map(i => (
                <input key={i} type="text" maxLength={1} className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl outline-none focus:border-primary" />
              ))}
            </div>
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition-colors shadow-soft">Verify OTP</button>
            <p className="text-center text-sm text-gray-500">Didn't receive? <span className="text-primary font-medium cursor-pointer hover:underline">Resend</span></p>
          </form>
        </>
      )}

      {step === 3 && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔑</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">New Password</h1>
            <p className="text-gray-500 text-sm">Set your new account password</p>
          </div>
          <form onSubmit={handleNext} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" placeholder="••••••••" className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" placeholder="••••••••" className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary text-sm" required />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-opacity-90 transition-colors shadow-soft">Reset Password</button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm">
        <Link to="/auth/login" className="font-medium text-primary hover:underline">Back to Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
