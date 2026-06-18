import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react';

const Success = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-soft p-10 text-center relative overflow-hidden">
      {/* Success Icon */}
      <div className="flex justify-center mb-6 relative">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center relative z-10">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        {/* Simple CSS confetti dots */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 opacity-50">
          <div className="absolute top-2 left-6 w-2 h-2 rounded-full bg-blue-400"></div>
          <div className="absolute top-6 right-8 w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="absolute bottom-4 left-10 w-2 h-2 rounded-full bg-red-400"></div>
          <div className="absolute bottom-8 right-6 w-2 h-2 rounded-full bg-green-400"></div>
          <div className="absolute top-1/2 left-2 w-1.5 h-1.5 rounded-full bg-purple-400"></div>
          <div className="absolute top-1/3 right-2 w-2 h-2 rounded-full bg-pink-400"></div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Shop is Ready!</h1>
      <p className="text-gray-500 text-sm mb-8">Let's complete a few quick steps.</p>

      {/* Checklist */}
      <div className="text-left space-y-4 mb-8">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-500" />
          <span className="text-sm font-medium text-gray-900">Account Created</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-500" />
          <span className="text-sm font-medium text-gray-900">Shop Created</span>
        </div>
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => navigate('/products')}>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
            </div>
            <span className="text-sm font-bold text-primary">Add Your First Product</span>
          </div>
          <ChevronRight size={18} className="text-primary" />
        </div>
        <div className="flex items-center gap-3 p-3">
          <Circle size={20} className="text-gray-300" />
          <span className="text-sm font-medium text-gray-400">Create First Bill</span>
        </div>
      </div>

      <button
        onClick={() => navigate('/products')}
        className="w-full bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-opacity-90 transition-colors shadow-soft"
      >
        Add Product
      </button>

      <button
        onClick={() => navigate('/dashboard')}
        className="mt-4 text-sm font-medium text-primary hover:underline"
      >
        Skip for now
      </button>
    </div>
  );
};

export default Success;
