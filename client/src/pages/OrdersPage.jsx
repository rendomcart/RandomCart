import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as orderApi from '../api/order.api';
import { useSocket } from '../context/SocketContext';
import * as reviewApi from '../api/review.api';
import { toast } from 'react-hot-toast';
import ReviewModal from '../components/product/ReviewModal';
import DeliveryTracker from '../components/order/DeliveryTracker';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState(null);
  const [reviewOrderId, setReviewOrderId] = useState(null);

  const openReviewModal = (orderId, productId) => {
    setReviewOrderId(orderId);
    setReviewProductId(productId);
    setReviewModalOpen(true);
  };

  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  const handleDownloadInvoice = async (orderId) => {
    try {
      setDownloadingInvoiceId(orderId);
      const response = await orderApi.downloadInvoice(orderId);
      
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(response.data);
        newWindow.document.close();
      } else {
        toast.error('Please allow popups to view the invoice.');
      }
    } catch (error) {
      toast.error('Failed to download invoice. Please try again later.');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const fetchData = async () => {
    try {
      const [ordersRes, reviewsRes] = await Promise.all([
        orderApi.getMyOrders(),
        reviewApi.getMyReviews()
      ]);
      
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      }
      if (reviewsRes.data.success) {
        setUserReviews(reviewsRes.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    socket.on('order_status_updated', fetchData);
    socket.on('order_delivered', fetchData);

    return () => {
      socket.off('order_status_updated', fetchData);
      socket.off('order_delivered', fetchData);
    };
  }, [socket]);

  // Helper to check if a product in a specific order is already reviewed
  const isProductReviewed = (orderId, productId) => {
    return userReviews.some(
      (review) => 
        review.orderId?._id === orderId && 
        review.product?._id === productId
    );
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading your orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded shadow-sm max-w-2xl mx-auto mt-8">
        <h2 className="text-2xl font-bold text-text-main mb-2">No Orders Yet</h2>
        <p className="text-gray-500 mb-6">You haven't placed any orders.</p>
        <Link to="/products" className="bg-primary text-white px-6 py-3 rounded font-medium shadow hover:bg-opacity-90">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-text-main mb-6">My Orders</h1>
      
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order._id} className="bg-white border rounded shadow-sm overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex flex-wrap justify-between text-sm text-gray-600">
              <div className="flex gap-6">
                <div>
                  <span className="block font-medium">ORDER PLACED</span>
                  <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="block font-medium">TOTAL</span>
                  <span>₹{order.totalPrice}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="block font-medium">ORDER # {order._id}</span>
                <div className="flex flex-col items-end gap-1 mt-1">
                  <Link to={`/orders/${order._id}`} className="text-accent hover:underline">View Order Details</Link>
                  {order.orderStatus === 'Delivered' && (
                    <button 
                      onClick={() => handleDownloadInvoice(order._id)}
                      disabled={downloadingInvoiceId === order._id}
                      className="text-xs text-primary font-bold hover:underline disabled:text-gray-400"
                    >
                      {downloadingInvoiceId === order._id ? 'Opening...' : 'View Invoice'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-lg mb-1">
                  Status: <span className={
                    order.orderStatus === 'Delivered' ? 'text-green-600' :
                    order.orderStatus === 'Cancelled' ? 'text-red-500' :
                    order.orderStatus === 'Rejected' ? 'text-red-600' :
                    ['Pending Approval', 'Overdue Review'].includes(order.orderStatus) ? 'text-orange-500' :
                    'text-blue-500'
                  }>{['Pending Approval', 'Overdue Review'].includes(order.orderStatus) ? 'Pending Approval' : order.orderStatus}</span>
                </h3>
                <p className="text-sm text-gray-500">{order.orderItems.length} item(s)</p>
              </div>
              
              <div className="flex-1 w-full mt-4 md:mt-0 md:px-4">
                <DeliveryTracker order={order} />
              </div>
              
              <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[300px]">
                {order.orderItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded border overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.image ? (
                        <img src={formatImgUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">img</span>
                      )}
                    </div>
                    <Link to={`/products/${item.product}`} className="text-sm font-medium hover:underline flex-grow line-clamp-1" title={item.name}>
                      {item.name}
                    </Link>
                    {order.orderStatus === 'Delivered' && !isProductReviewed(order._id, item.product) && (
                      <button 
                        onClick={() => openReviewModal(order._id, item.product)}
                        className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm whitespace-nowrap"
                      >
                        Write Review
                      </button>
                    )}
                    {order.orderStatus === 'Delivered' && isProductReviewed(order._id, item.product) && (
                      <span className="text-xs font-medium text-green-600 px-2 py-1 bg-green-50 rounded border border-green-200 whitespace-nowrap">
                        ✓ Reviewed
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ReviewModal 
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        orderId={reviewOrderId}
        productId={reviewProductId}
        onSuccess={async () => {
          // Re-fetch reviews to update the UI button states
          try {
            const { data } = await reviewApi.getMyReviews();
            if (data.success) setUserReviews(data.data);
          } catch (e) {}
          toast.success("Review submitted successfully! You can see it in 'My Reviews'.");
        }}
      />
    </div>
  );
};

export default OrdersPage;
