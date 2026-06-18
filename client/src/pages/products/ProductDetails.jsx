import { ArrowLeft, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductDetails = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ProductDetails</h1>
          <p className="text-sm text-slate-500">This module is currently under development.</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
         <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
            <Clock className="w-10 h-10" />
         </div>
         <h2 className="text-2xl font-bold text-slate-800 mb-3">Coming Soon</h2>
         <p className="text-slate-500 max-w-md">The ProductDetails feature is part of our upcoming release. We are working hard to build a great experience for you!</p>
         <button onClick={() => navigate(-1)} className="mt-8 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Go Back
         </button>
      </div>
    </div>
  );
};

export default ProductDetails;
