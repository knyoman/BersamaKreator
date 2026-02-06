import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCreditCard, 
  faWallet, 
  faBuildingColumns,
  faQrcode,
  faArrowLeft,
  faSpinner,
  faLock,
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import { createOrder } from '../services/api';

const PaymentPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!state?.orderData) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state?.orderData) return null;

  const { orderData, influencer } = state;
  const totalPrice = orderData.total_price;
  const platformFee = totalPrice * 0.05; // 5% fee example
  const finalTotal = totalPrice + platformFee;

  const paymentMethods = [
    {
      id: 'bca_va',
      name: 'BCA Virtual Account',
      icon: faBuildingColumns,
      description: 'Automatic verification',
      color: 'bg-blue-600'
    },
    {
      id: 'mandiri_va',
      name: 'Mandiri Virtual Account',
      icon: faBuildingColumns,
      description: 'Automatic verification',
      color: 'bg-yellow-600'
    },
    {
      id: 'gopay',
      name: 'GoPay',
      icon: faWallet,
      description: 'Scan QR to pay',
      color: 'bg-green-600'
    },
    {
      id: 'ovo',
      name: 'OVO',
      icon: faWallet,
      description: 'Instant payment',
      color: 'bg-purple-600'
    },
    {
      id: 'qris',
      name: 'QRIS',
      icon: faQrcode,
      description: 'Universal QR Code',
      color: 'bg-gray-800'
    }
  ];

  const handlePayment = async () => {
    if (!selectedMethod) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Prepare final order data with payment method
      const finalOrderData = {
        ...orderData,
        payment_method: selectedMethod,
        payment_status: 'paid', // Simulating successful payment
        order_status: 'pending' // Ready for influencer to review
      };

      // 2. Create order in database
      const { data, error: apiError } = await createOrder(finalOrderData);

      if (apiError) throw apiError;

      // 3. Navigate to success page
      navigate('/payment/success', { 
        state: { 
          orderId: data.id,
          method: selectedMethod,
          amount: finalTotal
        } 
      });

    } catch (err) {
      console.error('Payment failed:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Back to Order Details
        </button>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content - Payment Methods */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faCreditCard} className="mr-3 text-primary-600" />
                  Select Payment Method
                </h2>
                <p className="text-gray-500 text-sm mt-1">Choose your preferred way to pay</p>
              </div>
              
              <div className="p-6 space-y-4">
                {paymentMethods.map((method) => (
                  <label 
                    key={method.id}
                    className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedMethod === method.id 
                        ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value={method.id}
                      checked={selectedMethod === method.id}
                      onChange={() => setSelectedMethod(method.id)}
                      className="sr-only"
                    />
                    
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${method.color} mr-4`}>
                      <FontAwesomeIcon icon={method.icon} className="text-xl" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-bold text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>

                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedMethod === method.id ? 'border-primary-600' : 'border-gray-300'
                    }`}>
                      {selectedMethod === method.id && (
                        <div className="w-3 h-3 rounded-full bg-primary-600" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

             {/* Security Note */}
            <div className="bg-green-50 rounded-xl p-4 flex items-start gap-3">
              <FontAwesomeIcon icon={faShieldAlt} className="text-green-600 mt-1" />
              <div>
                <h4 className="font-bold text-green-800 text-sm">100% Secure Payment</h4>
                <p className="text-green-700 text-xs mt-1">
                  Your payment is processed securely. Funds will be held in escrow until the influencer accepts your order.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-4 mb-6">
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Campaign</p>
                  <p className="font-medium text-gray-900 line-clamp-2">{orderData.campaign_name}</p>
                </div>
                
                <div className="pb-4 border-b border-gray-100">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Influencer</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                       {influencer?.profile_image ? (
                         <img src={influencer.profile_image} className="w-full h-full object-cover" />
                       ) : (
                         <span className="flex items-center justify-center h-full font-bold text-gray-500">{influencer?.name?.[0]}</span>
                       )}
                    </div>
                    <span className="text-sm font-medium">{influencer?.name}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Platform Fee (5%)</span>
                    <span>{formatPrice(platformFee)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200 mt-2 flex justify-between font-bold text-lg text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <button 
                onClick={handlePayment}
                disabled={!selectedMethod || loading}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 transition-all ${
                  !selectedMethod || loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-primary-600 text-white hover:bg-primary-700 hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faLock} className="mr-2" />
                    Pay Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
