import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faReceipt, faArrowRight } from '@fortawesome/free-solid-svg-icons';

const PaymentSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.orderId) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state?.orderId) return null;

  const { amount, method } = state;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden text-center p-8 border border-gray-100 relative">
         {/* Background Decoration */}
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50 to-transparent"></div>

         <div className="relative z-10">
           {/* Success Icon Animation */}
           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-slow">
             <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
               <FontAwesomeIcon icon={faCheck} className="text-3xl text-white" />
             </div>
           </div>

           <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
           <p className="text-gray-500 mb-8">Your order has been placed and is now pending influencer approval.</p>

           {/* Receipt Card */}
           <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
             <div className="flex items-center justify-center text-gray-400 mb-4">
               <FontAwesomeIcon icon={faReceipt} className="text-xl" />
             </div>
             <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="font-bold text-gray-900">{formatPrice(amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="font-medium text-gray-900 capitalize">{method?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono text-xs text-gray-900">{state.orderId.split('-')[0]}...</span>
                </div>
             </div>
           </div>

           {/* Actions */}
           <div className="space-y-3">
             <Link 
               to="/dashboard" 
               className="btn btn-primary w-full py-4 flex items-center justify-center shadow-lg shadow-primary-500/20"
             >
               Go to Dashboard
               <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
             </Link>
             <Link 
               to="/" 
               className="block py-3 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
             >
               Back to Home
             </Link>
           </div>
         </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
