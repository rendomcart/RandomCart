import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import * as orderApi from '../api/order.api';
import * as paymentApi from '../api/payment.api';
import * as userApi from '../api/user.api';
import { toast } from 'react-hot-toast';

const formatImgUrl = (url) => {
  if (!url) return '';
  const urlStr = typeof url === 'object' ? url.url : url;
  if (!urlStr) return '';
  if (typeof urlStr === 'string' && urlStr.startsWith('http')) return urlStr;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${urlStr}`;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, cartTotal, cartItemsCount, clearCart, getLivePrice } = useContext(CartContext);
  
  const buyNowItem = location.state?.buyNowItem;
  const isBuyNow = !!buyNowItem;
  const checkoutItems = isBuyNow ? [buyNowItem] : (cart?.items || []);
  
  const getCheckoutPrice = (item) => {
    if (isBuyNow) return item.price;
    return getLivePrice ? getLivePrice(item) : item.price;
  };
  
  const checkoutItemsCount = checkoutItems.reduce((acc, item) => acc + item.quantity, 0);
  const checkoutTotal = checkoutItems.reduce((acc, item) => acc + (getCheckoutPrice(item) * item.quantity), 0);
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '', address: '', city: '', state: '', postalCode: '', phone: '', country: 'India'
  });
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '', address: '', city: '', state: '', postalCode: '', phone: '', country: 'India'
  });
  
  const [deliveryType, setDeliveryType] = useState('Standard');
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');
  const [loading, setLoading] = useState(false);

  const discount = 0;
  const baseShippingPrice = 0; // Free base delivery
  const deliveryCharge = deliveryType === 'Express' ? 20 : 0;
  const shippingPrice = baseShippingPrice + deliveryCharge;
  const totalPrice = checkoutTotal - discount + shippingPrice;

  // Load Razorpay Script & Addresses
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await userApi.getProfile();
        if (data.success && data.data.addresses) {
          setSavedAddresses(data.data.addresses);
          const defAddr = data.data.addresses.find(a => a.isDefault);
          if (defAddr) {
            setSelectedAddressId(defAddr._id);
            setShippingAddress(defAddr);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    
    const handleOrderUpdated = () => {};

    socket.on('order_status_updated', handleOrderUpdated);
    socket.on('order_delivered', handleOrderUpdated);

    return () => {
      socket.off('order_status_updated', handleOrderUpdated);
      socket.off('order_delivered', handleOrderUpdated);
    };
  }, [socket]);

  if (!isBuyNow && (!cart || cartItemsCount === 0)) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <button onClick={() => navigate('/products')} className="text-primary hover:underline">Go Shopping</button>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({ ...shippingAddress, [name]: value });
  };

  const handleAddressSelect = (id) => {
    if (id === 'new') {
      setShowAddressModal(true);
      return;
    }
    setSelectedAddressId(id);
    const addr = savedAddresses.find(a => a._id === id);
    if (addr) setShippingAddress(addr);
  };

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setNewAddress({ ...newAddress, [name]: value });
  };

  const handleSaveModalAddress = async (e) => {
    e.preventDefault();
    try {
      const isFirst = savedAddresses.length === 0;
      const { data } = await userApi.addAddress({ ...newAddress, isDefault: isFirst });
      if (data.success && data.data) {
        setSavedAddresses(data.data);
        // Find the newly added address (usually the last one added)
        const added = data.data[data.data.length - 1];
        if (added) {
          setSelectedAddressId(added._id);
          setShippingAddress(added);
        }
      }
      setShowAddressModal(false);
      setNewAddress({ fullName: '', address: '', city: '', state: '', postalCode: '', phone: '', country: 'India' });
      toast.success('Address saved successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save new address');
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    
    if (!shippingAddress || !shippingAddress.address) {
      toast.error('Please select or add a delivery address before placing your order.');
      return;
    }

    setLoading(true);

    try {
      // 1. Prepare Order Data
      const orderItems = checkoutItems.map(item => ({
        product: item.product._id,
        variantId: item.variantId,
        name: item.product.name,
        color: item.color,
        size: item.size,
        image: item.image,
        price: getCheckoutPrice(item),
        quantity: item.quantity
      }));

      const orderData = {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice: checkoutTotal,
        taxPrice: 0,
        shippingPrice,
        totalPrice,
        deliveryType
      };

      // 2. Save Order to Database (Pending)
      const { data: orderRes } = await orderApi.createOrder(orderData);
      
      if (!orderRes.success) {
        throw new Error('Failed to create order');
      }

      const orderId = orderRes.data._id;

      // 3. Handle Payment
      if (paymentMethod === 'COD') {
        if (!isBuyNow) await clearCart();
        navigate(`/orders/${orderId}`);
      } else {
        // Razorpay flow
        const { data: keyRes } = await paymentApi.getRazorpayKey();
        const { data: rzpOrderRes } = await paymentApi.createRazorpayOrder({ amount: totalPrice, receiptId: orderId });
        
        const options = {
          key: keyRes.key,
          amount: rzpOrderRes.data.amount,
          currency: rzpOrderRes.data.currency,
          name: "RendomCart",
          description: "Purchase from RendomCart",
          order_id: rzpOrderRes.data.id,
          handler: async function (response) {
            try {
              const verifyData = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId
              };
              
              const { data: verifyRes } = await paymentApi.verifyRazorpayPayment(verifyData);
              if (verifyRes.success) {
                if (!isBuyNow) await clearCart();
                navigate(`/orders/${orderId}`);
              }
            } catch (err) {
              console.error(err);
              toast.error("Payment verification failed");
              navigate(`/orders/${orderId}`); // Navigate anyway to show failed/pending status
            }
          },
          prefill: {
            name: shippingAddress.fullName,
            contact: shippingAddress.phone,
          },
          theme: {
            color: "#007BFF" // Primary color
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
           console.error(response.error);
           toast.error("Payment failed");
           navigate(`/orders/${orderId}`);
        });
        rzp.open();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Something went wrong during checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-text-main mb-6">Checkout</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form */}
        <div className="w-full lg:w-2/3">
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="bg-white p-6 rounded shadow-sm">
            
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Shipping Address</h2>
            
            {savedAddresses.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Select Delivery Address</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedAddresses.map(addr => (
                    <div 
                      key={addr._id} 
                      onClick={() => handleAddressSelect(addr._id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${selectedAddressId === addr._id ? 'border-primary bg-blue-50 shadow-sm ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-text-main">{addr.fullName}</span>
                        {addr.isDefault && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded uppercase tracking-wide font-bold">Default</span>}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-1">{addr.address}</p>
                      <p className="text-xs text-gray-600">{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p className="text-xs font-medium text-gray-800 mt-3">Phone: {addr.phone}</p>
                    </div>
                  ))}
                  
                  {/* Add New Address Card */}
                  <div 
                    onClick={() => handleAddressSelect('new')}
                    className={`border border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[120px] ${selectedAddressId === 'new' ? 'border-primary bg-blue-50 text-primary ring-1 ring-primary' : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 border border-current">
                      <span className="text-xl font-bold leading-none">+</span>
                    </div>
                    <span className="text-sm font-medium">Add New Address</span>
                  </div>
                </div>
              </div>
            )}

            {!savedAddresses.length && !showAddressModal && (
              <div className="mb-6 text-center">
                <button type="button" onClick={() => setShowAddressModal(true)} className="bg-primary text-white px-6 py-2 rounded shadow">
                  + Add Delivery Address
                </button>
              </div>
            )}

            <h2 className="text-lg font-bold mb-4 border-b pb-2 mt-6">Delivery Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${deliveryType === 'Standard' ? 'border-primary bg-blue-50 ring-1 ring-primary' : 'hover:border-gray-300'}`}>
                <div className="flex items-center space-x-3">
                  <input type="radio" name="deliveryType" value="Standard" checked={deliveryType === 'Standard'} onChange={(e) => setDeliveryType(e.target.value)} className="text-primary focus:ring-primary" />
                  <div className="flex-1">
                    <div className="font-bold">Standard Delivery</div>
                    <div className="text-sm text-gray-500">Estimated delivery in 7 days</div>
                  </div>
                  <div className="font-medium text-green-600">Free</div>
                </div>
              </label>
              
              <label className={`border rounded-lg p-4 cursor-pointer transition-colors ${deliveryType === 'Express' ? 'border-primary bg-blue-50 ring-1 ring-primary' : 'hover:border-gray-300'}`}>
                <div className="flex items-center space-x-3">
                  <input type="radio" name="deliveryType" value="Express" checked={deliveryType === 'Express'} onChange={(e) => setDeliveryType(e.target.value)} className="text-primary focus:ring-primary" />
                  <div className="flex-1">
                    <div className="font-bold">Express Delivery</div>
                    <div className="text-sm text-gray-500">Estimated delivery in 2-3 days</div>
                  </div>
                  <div className="font-medium">₹20</div>
                </div>
              </label>
            </div>

            <h2 className="text-lg font-bold mb-4 border-b pb-2 mt-6">Payment Method</h2>
            <div className="space-y-2 mb-6">
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="Razorpay" 
                  checked={paymentMethod === 'Razorpay'} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span>Credit Card / UPI / NetBanking (Razorpay)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="COD" 
                  checked={paymentMethod === 'COD'} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span>Cash on Delivery</span>
              </label>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded shadow-sm">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Order Summary</h2>
            <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-2">
              {checkoutItems.map((item, index) => (
                <div key={index} className="flex gap-3 text-sm border-b pb-4 last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
                    {item.image ? (
                      <img src={formatImgUrl(item.image)} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-gray-400 flex items-center justify-center h-full">No Img</span>
                    )}
                  </div>
                  <div className="flex-1 pr-2 flex flex-col justify-center">
                    <p className="line-clamp-2 font-medium mb-1 text-text-main leading-tight">{item.product.name}</p>
                    <div className="text-xs text-gray-500 flex gap-2">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <p className="text-gray-500 text-xs mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="flex flex-col justify-center items-end">
                    <span className="font-bold text-text-main">₹{getCheckoutPrice(item) * item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Items Total ({checkoutItemsCount})</span>
                <span className="font-medium">₹{checkoutTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">{deliveryType === 'Standard' ? 'Free' : '₹20'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Order Total</span>
                <span>₹{totalPrice}</span>
              </div>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={loading}
              className="w-full bg-accent text-white py-3 rounded font-medium shadow-sm hover:bg-opacity-90 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : `Place Order (₹${totalPrice})`}
            </button>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Address</h2>
            <form onSubmit={handleSaveModalAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input required type="text" name="fullName" value={newAddress.fullName} onChange={handleModalInputChange} className="w-full border p-2 rounded focus:border-primary outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Address *</label>
                  <input required type="text" name="address" value={newAddress.address} onChange={handleModalInputChange} className="w-full border p-2 rounded focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input required type="text" name="city" value={newAddress.city} onChange={handleModalInputChange} className="w-full border p-2 rounded focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <input required type="text" name="state" value={newAddress.state} onChange={handleModalInputChange} className="w-full border p-2 rounded focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code *</label>
                  <input required type="text" name="postalCode" value={newAddress.postalCode} onChange={handleModalInputChange} className="w-full border p-2 rounded focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input required type="text" name="phone" value={newAddress.phone} onChange={handleModalInputChange} className="w-full border p-2 rounded focus:border-primary outline-none" />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setShowAddressModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded shadow-sm hover:bg-opacity-90 font-medium">Save Address</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
