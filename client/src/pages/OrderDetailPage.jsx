import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as orderApi from '../api/order.api';
import { useSocket } from '../context/SocketContext';
import DeliveryTracker from '../components/order/DeliveryTracker';
import { toast } from 'react-hot-toast';

const formatImgUrl = (url) => {
  if (!url) return '';
  if (typeof url === 'string' && url.startsWith('http')) return url;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`;
};

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const response = await orderApi.downloadInvoice(order._id);
      
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(response.data);
        newWindow.document.close();
      } else {
        toast.error('Please allow popups to view the invoice.');
      }
    } catch (error) {
      toast.error('Failed to download invoice.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const { data } = await orderApi.getOrderById(id);
      if (data.success) {
        setOrder(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    socket.on('order_status_updated', fetchOrder);
    socket.on('order_delivered', fetchOrder);

    return () => {
      socket.off('order_status_updated', fetchOrder);
      socket.off('order_delivered', fetchOrder);
    };
  }, [socket, id]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading order details...</div>;
  if (!order) return <div className="text-center py-20 text-red-500">Order not found</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Order Details</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
            <p className="text-sm text-gray-500 break-all">Order # {order._id}</p>
            {order.orderStatus === 'Delivered' && (
              <button 
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="text-xs bg-primary text-white px-3 py-1 rounded font-bold hover:bg-opacity-90 disabled:bg-gray-400 whitespace-nowrap"
              >
                {downloadingInvoice ? 'Opening...' : 'View Invoice'}
              </button>
            )}
          </div>
        </div>
        <Link to="/orders" className="text-primary hover:underline font-medium whitespace-nowrap flex-shrink-0">← Back to Orders</Link>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-bold mb-4">Track Order</h2>
        <DeliveryTracker order={order} />
      </div>

      {order.orderStatus === 'Rejected' && (
        <div className="mb-10 bg-red-50 p-6 rounded border border-red-200">
          <h2 className="text-lg font-bold text-red-800 mb-2">Order Rejected</h2>
          <p className="text-sm text-gray-700 mb-2"><span className="font-medium">Reason:</span> {order.rejectionReason}</p>
          <p className="text-xs text-red-600">Rejected on {new Date(order.rejectionDate || order.updatedAt).toLocaleString()}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold border-b pb-2 mb-3">Shipping Address</h3>
          <div className="text-sm text-gray-700 leading-relaxed">
            <p className="font-medium text-black">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.address}</p>
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
            <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>
        <div>
          <h3 className="font-bold border-b pb-2 mb-3">Payment Information</h3>
          <div className="text-sm text-gray-700 leading-relaxed">
            <p><span className="font-medium text-black">Method:</span> {order.paymentMethod}</p>
            <p><span className="font-medium text-black">Status:</span> 
              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${order.paymentInfo.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                {order.paymentInfo.status}
              </span>
            </p>
            {order.paymentInfo.razorpayPaymentId && (
              <p className="mt-2 text-xs text-gray-500 truncate">Transaction ID: {order.paymentInfo.razorpayPaymentId}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-bold border-b pb-2 mb-4">Order Items</h3>
        <div className="space-y-4">
          {order.orderItems.map((item, index) => (
            <div key={index} className="flex gap-4 items-center p-2 hover:bg-gray-50 rounded">
              <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={formatImgUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-gray-400 flex items-center justify-center w-full h-full">No Img</span>
                )}
              </div>
              <div className="flex-grow">
                <Link to={`/products/${item.product}`} className="font-medium text-accent hover:underline line-clamp-1">{item.name}</Link>
                <div className="text-xs text-gray-500 flex gap-2 mt-1">
                  {item.color && <span>Color: {item.color}</span>}
                  {item.size && <span>Size: {item.size}</span>}
                </div>
                <div className="text-sm text-gray-500 mt-2 flex justify-between items-center">
                  <div>
                    <span>Qty: {item.quantity}</span>
                    <span className="font-bold text-black ml-4">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 border-t pt-4 flex justify-end">
        <div className="w-full md:w-1/2 lg:w-1/3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{order.itemsPrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping ({order.deliveryType})</span>
            <span>{order.shippingPrice === 0 ? 'Free' : `₹${order.shippingPrice}`}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>Total</span>
            <span>₹{order.totalPrice}</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OrderDetailPage;
