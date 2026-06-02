import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as orderApi from '../api/order.api';
import * as adminApi from '../api/admin.api';
import { toast } from 'react-hot-toast';
import DeliveryTracker from '../components/order/DeliveryTracker';
import { useSocket } from '../context/SocketContext';
import ConfirmModal from '../components/ConfirmModal';

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
  const [regeneratingInvoice, setRegeneratingInvoice] = useState(false);
  
  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const { socket } = useSocket();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  useEffect(() => {
    fetchOrder();

    if (!socket) return;

    const handleOrderUpdate = (data) => {
      if (data.orderId === id) {
        fetchOrder();
      }
    };

    socket.on('order_status_updated', handleOrderUpdate);
    socket.on('order_approved', handleOrderUpdate);
    socket.on('order_rejected', handleOrderUpdate);

    return () => {
      socket.off('order_status_updated', handleOrderUpdate);
      socket.off('order_approved', handleOrderUpdate);
      socket.off('order_rejected', handleOrderUpdate);
    };
  }, [id, socket]);

  const fetchOrder = async () => {
    try {
      const { data } = await orderApi.getOrderById(id);
      if (data.success) setOrder(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const response = await adminApi.downloadInvoice(order._id);
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error('Failed to download invoice.');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const executeRegenerateInvoice = async () => {
    try {
      setRegeneratingInvoice(true);
      const { data } = await adminApi.regenerateInvoice(order._id);
      if (data.success) {
        setOrder({ ...order, invoiceNumber: data.invoiceNumber });
        toast.success('Invoice regenerated successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to regenerate invoice');
    } finally {
      setRegeneratingInvoice(false);
    }
  };

  const handleRegenerateInvoice = () => {
    setConfirmModal({ isOpen: true });
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const { data } = await orderApi.updateOrderStatus(order._id, { status: newStatus });
      if (data.success) {
        setOrder({ ...order, orderStatus: newStatus });
        toast.success(`Order marked as ${newStatus}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Error updating order status');
    }
  };

  const handleRejectOrder = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    
    try {
      setRejecting(true);
      const { data } = await adminApi.rejectOrder(order._id, rejectionReason);
      if (data.success) {
        setOrder({ ...order, orderStatus: 'Rejected', rejectionReason, rejectionDate: new Date() });
        setIsRejectModalOpen(false);
        setRejectionReason('');
        toast.success("Order rejected successfully.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject order');
    } finally {
      setRejecting(false);
    }
  };

  const getRemainingTime = (createdAt) => {
    const createdTime = new Date(createdAt).getTime();
    const deadline = createdTime + 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    if (now >= deadline) return 'Overdue';
    
    const remainingHours = Math.floor((deadline - now) / (1000 * 60 * 60));
    const remainingMinutes = Math.floor(((deadline - now) % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${remainingHours}h ${remainingMinutes}m`;
  };

  if (loading) return <div>Loading order...</div>;
  if (!order) return <div>Order not found</div>;

  const flowStatuses = ['Pending Approval', 'Overdue Review', 'Approved', 'Processing', 'Shipped', 'Delivered'];
  const currentIdx = flowStatuses.indexOf(order?.orderStatus);
  const isBackwards = (status) => {
    const idx = flowStatuses.indexOf(status);
    return idx !== -1 && currentIdx !== -1 && idx < currentIdx;
  };
  
  const isPendingReview = order.orderStatus === 'Pending Approval' || order.orderStatus === 'Overdue Review';
  const remainingTime = getRemainingTime(order.createdAt);
  const isOverdue = order.orderStatus === 'Overdue Review' || remainingTime === 'Overdue';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-red-600">Reject Order</h2>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this order. This will be visible to the customer.</p>
            <form onSubmit={handleRejectOrder}>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border rounded p-3 mb-4 focus:outline-none focus:border-red-500"
                rows="4"
                placeholder="E.g., Out of stock, Suspected fraud, Delivery address unserviceable..."
                required
              ></textarea>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={rejecting || !rejectionReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-text-main">Order Details</h1>
        <Link to="/orders" className="text-primary hover:underline">← Back to Orders</Link>
      </div>

      <div className="bg-white p-6 rounded shadow-sm mb-6">
        
        {/* Header Alert for Pending/Overdue */}
        {isPendingReview && (
          <div className={`p-4 mb-6 rounded border flex justify-between items-center ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
            <div>
              <h3 className={`font-bold ${isOverdue ? 'text-red-800' : 'text-orange-800'}`}>
                {isOverdue ? 'Action Required: Overdue' : 'Action Required: Pending Approval'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">This order requires admin approval within 24 hours.</p>
            </div>
            <div className={`text-xl font-mono font-bold ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
              {remainingTime === 'Overdue' ? 'OVERDUE' : `${remainingTime} left`}
            </div>
          </div>
        )}

        {/* Header Alert for Rejected */}
        {order.orderStatus === 'Rejected' && (
          <div className="p-4 mb-6 rounded border bg-red-50 border-red-200 text-red-800">
            <h3 className="font-bold mb-1">Order Rejected</h3>
            <p className="text-sm font-medium mb-1">Reason: <span className="font-normal text-gray-700">{order.rejectionReason}</span></p>
            <p className="text-xs text-red-600">Rejected on {new Date(order.rejectionDate || order.updatedAt).toLocaleString()}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-b pb-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500 block mb-1">Order ID</span>
            <span className="font-mono font-medium">{order._id}</span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Date</span>
            <span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Customer</span>
            <span className="font-medium">{order.user?.name || order.shippingAddress.fullName}</span>
            <span className="text-gray-500 block text-xs">{order.user?.email}</span>
          </div>
          <div>
            <span className="text-gray-500 block mb-1">Current Status</span>
            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
              order.orderStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
              ['Cancelled', 'Rejected'].includes(order.orderStatus) ? 'bg-red-100 text-red-800' :
              order.orderStatus === 'Overdue Review' ? 'bg-red-100 text-red-800' :
              order.orderStatus === 'Pending Approval' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {order.orderStatus}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-6">
          <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          
          {isPendingReview && (
            <>
              <button onClick={() => handleStatusChange('Approved')} className="bg-green-600 text-white px-6 py-2 rounded text-sm font-bold shadow hover:bg-green-700 transition-colors">
                ✓ Approve Order
              </button>
              <button onClick={() => setIsRejectModalOpen(true)} className="bg-red-500 text-white px-6 py-2 rounded text-sm font-bold shadow hover:bg-red-600 transition-colors">
                ✗ Reject Order
              </button>
            </>
          )}

          {order.orderStatus === 'Approved' && (
            <button onClick={() => handleStatusChange('Processing')} className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-blue-600">
              Mark as Processing
            </button>
          )}
          {order.orderStatus === 'Processing' && (
            <button onClick={() => handleStatusChange('Shipped')} className="bg-purple-500 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-purple-600">
              Mark as Shipped
            </button>
          )}
          {order.orderStatus === 'Shipped' && (
            <button onClick={() => handleStatusChange('Delivered')} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-green-700">
              Mark as Delivered
            </button>
          )}

          {order.orderStatus === 'Delivered' && (
            <div className="flex items-center gap-2 w-full mt-2">
              <button 
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice}
                className="bg-accent text-white px-4 py-2 rounded text-sm font-bold shadow hover:bg-opacity-90 disabled:bg-gray-400"
              >
                {downloadingInvoice ? 'Opening...' : 'View Invoice'}
              </button>
              <button 
                onClick={handleRegenerateInvoice}
                disabled={regeneratingInvoice}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {regeneratingInvoice ? 'Regenerating...' : 'Regenerate Invoice Number'}
              </button>
            </div>
          )}
          </div>
          
          {/* Manual override for edge cases */}
          {!['Delivered', 'Cancelled', 'Returned', 'Rejected', 'Pending Approval', 'Overdue Review'].includes(order.orderStatus) && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-sm text-gray-500">Override:</span>
              <select 
                value={order.orderStatus} 
                onChange={(e) => handleStatusChange(e.target.value)}
                className="border p-2 rounded text-sm bg-background outline-none focus:border-primary"
              >
                <option value="Approved" disabled={isBackwards("Approved")}>Approved</option>
                <option value="Processing" disabled={isBackwards("Processing")}>Processing</option>
                <option value="Shipped" disabled={isBackwards("Shipped")}>Shipped</option>
                <option value="Delivered" disabled={isBackwards("Delivered")}>Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
          )}
        </div>

        <div className="mb-8">
          <DeliveryTracker order={order} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <h3 className="font-bold mb-2">Shipping Address</h3>
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-2">Payment Info</h3>
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
              <p><span className="font-medium">Method:</span> {order.paymentMethod}</p>
              <p><span className="font-medium">Status:</span> {order.paymentInfo.status}</p>
              {order.paymentInfo.razorpayPaymentId && (
                <p className="text-xs mt-1 text-gray-500 truncate">Txn ID: {order.paymentInfo.razorpayPaymentId}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow-sm">
        <h3 className="font-bold mb-4">Order Items ({order.orderItems.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm mb-6 min-w-[600px]">
          <thead className="bg-background text-text-main">
            <tr>
              <th className="p-2">Product</th>
              <th className="p-2">Price</th>
              <th className="p-2">Qty</th>
              <th className="p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.orderItems.map((item, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                      {item.image && <img src={formatImgUrl(item.image)} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="p-2">₹{item.price}</td>
                <td className="p-2">{item.quantity}</td>
                <td className="p-2 text-right font-medium">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        
        <div className="flex justify-end border-t pt-4">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items Total</span>
              <span>₹{order.itemsPrice}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping ({order.deliveryType})</span>
              <span>{order.shippingPrice === 0 ? 'Free' : `₹${order.shippingPrice}`}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Order Total</span>
              <span>₹{order.totalPrice}</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        message="Are you sure you want to regenerate the invoice number? This will invalidate the previous invoice number."
        onConfirm={executeRegenerateInvoice}
        onCancel={() => setConfirmModal({ isOpen: false })}
      />
    </div>
  );
};

export default OrderDetailPage;
